from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
import torch
import os
import numpy as np
from peft import PeftModel
from transformers import CLIPProcessor, CLIPModel
import faiss
from PIL import Image
from scipy.spatial import distance
import pillow_heif  # <-- Add HEIC/HEIF support

# --- Model and Data Loading ---

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
clip_model_name = "openai/clip-vit-base-patch32"
clip_processor = CLIPProcessor.from_pretrained(clip_model_name)
clip_model = CLIPModel.from_pretrained(
    clip_model_name, cache_dir="./.cache", trust_remote_code=True, use_safetensors=True
).to(DEVICE)
lora_model = PeftModel.from_pretrained(clip_model, "clip-lora-flickr30k").to(DEVICE)

def load_image_embeddings_from_chunks(chunk_dir="./image_chunks_lora"):
    import glob, pickle
    text_data, image_paths = [], []
    metadata_files = sorted(glob.glob(os.path.join(chunk_dir, "metadata_chunk_*.pkl")))
    for meta_file in metadata_files:
        with open(meta_file, "rb") as f:
            meta = pickle.load(f)
            text_data.extend(meta["texts"])
            image_paths.extend(meta["paths"])
    embedding_files = sorted(glob.glob(os.path.join(chunk_dir, "embeddings_chunk_*.npy")))
    all_embeddings = [np.load(emb_file) for emb_file in embedding_files]
    image_embeddings = np.concatenate(all_embeddings, axis=0).astype("float32")
    return image_embeddings, text_data, image_paths

lora_image_embeddings, lora_text_data, lora_image_paths = load_image_embeddings_from_chunks("./image_chunks_lora")

def build_or_load_faiss_index(embeddings, index_path=None, normalize=True):
    if index_path and os.path.exists(index_path):
        return faiss.read_index(index_path)
    if normalize:
        faiss.normalize_L2(embeddings)
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)
    if index_path:
        faiss.write_index(index, index_path)
    return index

index_dir = "./faiss_index/"
lora_index_file = os.path.join(index_dir, "lora.index")
if not os.path.exists(index_dir):
    os.makedirs(index_dir)
lora_index = build_or_load_faiss_index(lora_image_embeddings, lora_index_file, normalize=True)

image_save_dir = "./flickr30k-test-images/"
full_lora_image_paths = [os.path.join(image_save_dir, os.path.basename(p)) for p in lora_image_paths]

def make_image_url(local_path):
    filename = os.path.basename(local_path)
    return f"/images/{filename}"

# --- OOD Metric Setup (run once at startup) ---
train_embs = np.array(lora_image_embeddings)
mean = train_embs.mean(axis=0)
cov = np.cov(train_embs, rowvar=False)
inv_cov = np.linalg.inv(cov + 1e-6 * np.eye(cov.shape[0]))

def mahalanobis_score(query_emb, mean, inv_cov):
    return float(distance.mahalanobis(query_emb, mean, inv_cov))

# --- FastAPI App Setup ---

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve images as static files
app.mount("/images", StaticFiles(directory="./flickr30k-test-images"), name="images")

# --- API Models ---

class TextQuery(BaseModel):
    query: str
    top_k: int = 5

# --- Retrieval Functions ---

def retrieve_images_by_text_return_indices(
    text_query, index, image_paths, text_data, clip_model, top_k=5
):
    inputs = clip_processor(text=[text_query], return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        text_emb = clip_model.get_text_features(**inputs)
    text_emb = text_emb.cpu().numpy().astype("float32")
    faiss.normalize_L2(text_emb)
    scores, indices = index.search(text_emb, top_k * 5)
    valid_indices = []
    for idx in indices[0]:
        if idx < len(text_data) and idx < len(image_paths) and os.path.exists(image_paths[idx]):
            valid_indices.append(idx)
            if len(valid_indices) >= top_k:
                break
    return [valid_indices]

def retrieve_similar_images(image: Image.Image, model, index, text_data, image_paths, top_k=5):
    inputs = clip_processor(images=image, return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        query_emb = model.get_image_features(**inputs)
    query_emb = query_emb.cpu().numpy().astype("float32")
    faiss.normalize_L2(query_emb)
    scores, indices = index.search(query_emb, top_k * 5)
    valid_indices = []
    for idx in indices[0]:
        if idx < len(text_data) and idx < len(image_paths) and os.path.exists(image_paths[idx]):
            valid_indices.append(idx)
            if len(valid_indices) >= top_k:
                break
    return [valid_indices], query_emb

def load_image_with_heic_support(img_bytes):
    from io import BytesIO
    try:
        img = Image.open(BytesIO(img_bytes)).convert("RGB")
    except Exception:
        # Try HEIC/HEIF
        heif_file = pillow_heif.read_heif(BytesIO(img_bytes))
        img = Image.frombytes(
            heif_file.mode,
            heif_file.size,
            heif_file.data,
            "raw"
        ).convert("RGB")
    return img

# --- API Endpoints ---

@app.post("/search_by_text")
def search_by_text(data: TextQuery):
    indices = retrieve_images_by_text_return_indices(
        data.query, lora_index, full_lora_image_paths, lora_text_data, lora_model, top_k=data.top_k
    )
    # Get the embedding for the query
    inputs = clip_processor(text=[data.query], return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        query_emb = lora_model.get_text_features(**inputs)
    query_emb = query_emb.cpu().numpy().astype("float32")[0]
    ood_score = mahalanobis_score(query_emb, mean, inv_cov)

    results = []
    for i, idx in enumerate(indices[0]):
        img_emb = lora_image_embeddings[idx]
        img_ood_score = mahalanobis_score(img_emb, mean, inv_cov)
        results.append({
            "rank": i+1,
            "caption": lora_text_data[idx],
            "path": make_image_url(full_lora_image_paths[idx]),
            "ood_score": img_ood_score
        })
    return {"results": results, "query_ood_score": ood_score}

@app.post("/search_by_image")
async def search_by_image(image: UploadFile = File(...)):
    img_bytes = await image.read()
    img = load_image_with_heic_support(img_bytes)
    indices, query_emb = retrieve_similar_images(
        img, lora_model, lora_index, lora_text_data, full_lora_image_paths, top_k=5
    )
    ood_score = mahalanobis_score(query_emb[0], mean, inv_cov)
    results = []
    for i, idx in enumerate(indices[0]):
        img_emb = lora_image_embeddings[idx]
        img_ood_score = mahalanobis_score(img_emb, mean, inv_cov)
        results.append({
            "rank": i+1,
            "caption": lora_text_data[idx],
            "path": make_image_url(full_lora_image_paths[idx]),
            "ood_score": img_ood_score
        })
    return {"results": results, "query_ood_score": ood_score}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
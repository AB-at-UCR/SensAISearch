from peft import PeftModel
from transformers import CLIPProcessor, CLIPModel
import torch
import os

# Set device
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load CLIP processor and base model
clip_model_name = "openai/clip-vit-base-patch32"
clip_processor = CLIPProcessor.from_pretrained(clip_model_name)
clip_model = CLIPModel.from_pretrained(clip_model_name, cache_dir="./.cache", trust_remote_code=True, use_safetensors=True).to(DEVICE)

# Load LoRA-adapted model
lora_model = PeftModel.from_pretrained(clip_model, "clip-lora-flickr30k").to(DEVICE)

# Example: Retrieve images by text using LoRA model
query = "A birthday cake with candles"
top_k = 5

# Load embeddings, paths, and text data for LoRA model
lora_dir = "./image_chunks_lora"
def load_image_embeddings_from_chunks(chunk_dir="./image_chunks"):
    import glob, pickle, numpy as np
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

lora_image_embeddings, lora_text_data, lora_image_paths = load_image_embeddings_from_chunks(lora_dir)

# Build or load FAISS index for LoRA embeddings
import faiss
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
lora_index = build_or_load_faiss_index(lora_image_embeddings, lora_index_file, normalize=True)

# Prepare full image paths if needed
image_save_dir = "./flickr30k-test-images/"
full_lora_image_paths = [os.path.join(image_save_dir, os.path.basename(p)) for p in lora_image_paths]

# Retrieval function
def retrieve_images_by_text_return_indices(text_query, index, image_paths, text_data, clip_model, top_k=5):
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

# Retrieve and print results
indices = retrieve_images_by_text_return_indices(query, lora_index, full_lora_image_paths, lora_text_data, lora_model, top_k=top_k)
for rank, idx in enumerate(indices[0]):
    print(f"Rank {rank+1}:")
    print(f"   Caption: {lora_text_data[idx]}")
    print(f"   Path   : {full_lora_image_paths[idx]}")
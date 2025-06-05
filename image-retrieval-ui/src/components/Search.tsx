import React, { useState } from 'react';

const backendUrl = 'http://localhost:8001';

const Search: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageMatches, setImageMatches] = useState<any[]>([]);
  const [textQuery, setTextQuery] = useState('');
  const [textMatches, setTextMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Handle image upload and match retrieval
  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const res = await fetch(`${backendUrl}/search_by_image`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setImageMatches(data.results || []);
    } catch (err) {
      alert('Image search failed.');
    }
    setLoading(false);
  };

  // Handle text search
  const handleTextSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/search_by_text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textQuery }),
      });
      const data = await res.json();
      setTextMatches(data.results || []);
    } catch (err) {
      alert('Text search failed.');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Search by Image</h2>
      <form onSubmit={handleImageUpload}>
        <input
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files?.[0] || null)}
        />
        <button type="submit" disabled={loading}>Upload & Search</button>
      </form>
      <div>
        {imageMatches.map((match, idx) => (
          <div key={idx}>
            {match.path && <img src={backendUrl + match.path} alt="" style={{maxWidth: 200}} />}
            <div>Rank: {match.rank}</div>
            <div>Caption: {match.caption}</div>
          </div>
        ))}
      </div>

      <hr />

      <h2>Search by Text</h2>
      <form onSubmit={handleTextSearch}>
        <input
          type="text"
          value={textQuery}
          onChange={e => setTextQuery(e.target.value)}
          placeholder="Enter your query..."
        />
        <button type="submit" disabled={loading}>Search</button>
      </form>
      <div>
        {textMatches.map((match, idx) => (
          <div key={idx}>
            {match.path && <img src={backendUrl + match.path} alt="" style={{maxWidth: 200}} />}
            <div>Rank: {match.rank}</div>
            <div>Caption: {match.caption}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;
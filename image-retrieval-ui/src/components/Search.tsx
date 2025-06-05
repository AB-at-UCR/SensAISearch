import React, { useState } from 'react';

const backendUrl = 'http://localhost:8001';

// Helper to map OOD score to a green-red color (lower = greener, higher = redder)
function oodColor(score: number, min: number, max: number) {
  // Flip: low OOD = green, high OOD = red
  const norm = 1 - Math.max(0, Math.min(1, (score - min) / (max - min)));
  const r = Math.round(255 * (1 - norm));
  const g = Math.round(180 * norm + 75 * (1 - norm));
  return `rgba(${r},${g},120,0.15)`;
}

const Search: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageMatches, setImageMatches] = useState<any[]>([]);
  const [textQuery, setTextQuery] = useState('');
  const [textMatches, setTextMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageOod, setImageOod] = useState<number | null>(null);
  const [textOod, setTextOod] = useState<number | null>(null);

  // For demo, set min/max OOD for color mapping (adjust as needed)
  const OOD_MIN = 0;
  const OOD_MAX = 20;

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
      setImageOod(data.query_ood_score ?? null);
    } catch (err) {
      alert('Image search failed.');
    }
    setLoading(false);
  };

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
      setTextOod(data.query_ood_score ?? null);
    } catch (err) {
      alert('Text search failed.');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="sensei-card">
        <h2>Search by Image</h2>
        <form onSubmit={handleImageUpload}>
          <input
            type="file"
            accept="image/*"
            onChange={e => setImageFile(e.target.files?.[0] || null)}
          />
          <button className="sensei-btn" type="submit" disabled={loading}>Upload & Search</button>
        </form>
        {imageOod !== null && (
          <div style={{margin: '1em 0'}}>
            <strong>Query OOD Score:</strong> {imageOod.toFixed(2)}
          </div>
        )}
        <div>
          {imageMatches.map((match, idx) => (
            <div
              key={idx}
              className="result"
              style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                marginBottom: '1em',
                padding: '1em'
              }}
            >
              {match.path && (
                <img
                  src={backendUrl + match.path}
                  alt=""
                  style={{ maxWidth: 400, maxHeight: 400, borderRadius: 12, marginBottom: '0.5em' }}
                />
              )}
              <div>Rank: {match.rank}</div>
              <div>Caption: {match.caption}</div>
              <div>
                <strong>OOD Score:</strong> {match.ood_score.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sensei-card">
        <h2>Search by Text</h2>
        <form onSubmit={handleTextSearch}>
          <input
            type="text"
            value={textQuery}
            onChange={e => setTextQuery(e.target.value)}
            placeholder="Enter your query..."
          />
          <button className="sensei-btn" type="submit" disabled={loading}>Search</button>
        </form>
        {textOod !== null && (
          <div style={{margin: '1em 0'}}>
            <strong>Query OOD Score:</strong> {textOod.toFixed(2)}
          </div>
        )}
        <div>
          {textMatches.map((match, idx) => (
            <div
              key={idx}
              className="result"
              style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                marginBottom: '1em',
                padding: '1em'
              }}
            >
              {match.path && (
                <img
                  src={backendUrl + match.path}
                  alt=""
                  style={{ maxWidth: 400, maxHeight: 400, borderRadius: 12, marginBottom: '0.5em' }}
                />
              )}
              <div>Rank: {match.rank}</div>
              <div>Caption: {match.caption}</div>
              <div>
                <strong>OOD Score:</strong> {match.ood_score.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Search;
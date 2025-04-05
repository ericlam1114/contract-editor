'use client';

import { useState, useEffect } from 'react';

export default function ClauseSearch({ onInsert }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const preloadVectorStore = async () => {
      try {
        const response = await fetch('/api/vector', {
          method: 'POST'
        });
        
        if (!response.ok) {
          throw new Error('Failed to preload vector store');
        }
      } catch (error) {
        console.error('Failed to preload vector store:', error);
      }
    };
    
    preloadVectorStore();
  }, []);
  
  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/vector?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">🔍 Search Clause Library</h2>
      <div className="flex gap-2 mb-2">
        <input
          className="border px-3 py-2 text-sm rounded w-full"
          placeholder="e.g. termination, confidentiality..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white text-sm px-3 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((text, i) => (
            <div
              key={i}
              className="border rounded p-3 bg-gray-50 hover:bg-gray-100"
            >
              <p className="text-sm mb-2">{text}</p>
              <button
                onClick={() => onInsert(text)}
                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
              >
                Insert
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

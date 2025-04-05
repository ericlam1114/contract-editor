'use client';
import { useState } from 'react';

export default function ClauseTools({ text, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const handleRewrite = async () => {
    setLoading(true);
    const res = await fetch('/api/clauses/rewrite', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    if (data.result) onUpdate(data.result);
    setLoading(false);
  };

  const handleSummarize = async () => {
    setLoading(true);
    const res = await fetch('/api/clauses/summarize', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    if (data.result) alert(data.result);
    setLoading(false);
  };

  return (
    <div className="mt-2 flex gap-2">
      <button
        onClick={handleRewrite}
        disabled={loading}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? 'Rewriting...' : 'Rewrite'}
      </button>
      <button
        onClick={handleSummarize}
        disabled={loading}
        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        {loading ? 'Summarizing...' : 'Summarize'}
      </button>
    </div>
  );
}

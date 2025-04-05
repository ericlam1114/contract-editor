'use client';

import { useState } from 'react';
import openai from '@/lib/openai';

export default function ClauseTools({ text, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const handleRewrite = async () => {
    setLoading(true);
    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a legal assistant. Rewrite clauses to be clearer and more professional.',
        },
        {
          role: 'user',
          content: `Rewrite this clause:\n\n"${text}"`,
        },
      ],
    });

    const newClause = res.choices[0]?.message?.content?.trim();
    if (newClause) onUpdate(newClause);
    setLoading(false);
  };

  const handleSummarize = async () => {
    setLoading(true);
    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a legal assistant. Summarize contract clauses in plain English.',
        },
        {
          role: 'user',
          content: `Summarize this clause:\n\n"${text}"`,
        },
      ],
    });

    const summary = res.choices[0]?.message?.content?.trim();
    if (summary) alert(summary);
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

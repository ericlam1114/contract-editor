'use client';

import { libraryClauses } from '@/lib/clauseData';

export default function ClauseLibrary({ onInsert }) {
    
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">📚 Clause Library</h2>
      <div className="grid gap-3">
        {libraryClauses.map((clause) => (
          <div
            key={clause.id}
            className="border rounded p-3 bg-gray-50 hover:bg-gray-100 transition"
          >
            <p className="text-sm mb-2">{clause.text}</p>
            <button
              onClick={() => onInsert(clause.text)}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              Insert Clause
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

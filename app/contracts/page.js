'use client';

import { useState } from 'react';
import Editor from '@/components/Editor';
import ClauseTools from '@/components/ClauseTools';

const initialClauses = [
  {
    id: 1,
    text: 'The Recipient agrees to keep all confidential information in strict confidence and not to disclose it to any third party.',
  },
  {
    id: 2,
    text: 'This Agreement shall be governed by the laws of the State of California.',
  },
];

export default function ContractsPage() {
  const [clauses, setClauses] = useState(initialClauses);
  const [selectedClauseId, setSelectedClauseId] = useState(null);

  const updateClause = (id, newText) => {
    setClauses(prev =>
      prev.map(c => (c.id === id ? { ...c, text: newText } : c))
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold mb-4">📝 Contract Editor</h1>
      {clauses.map(clause => (
        <div
          key={clause.id}
          className={`rounded-lg border p-4 transition ${
            selectedClauseId === clause.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}
          onClick={() => setSelectedClauseId(clause.id)}
        >
          <Editor
            text={clause.text}
            onChange={newText => updateClause(clause.id, newText)}
          />
          {selectedClauseId === clause.id && (
            <ClauseTools
              text={clause.text}
              onUpdate={newText => updateClause(clause.id, newText)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

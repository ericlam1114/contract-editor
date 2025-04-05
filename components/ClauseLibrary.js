'use client';

export const libraryClauses = [
  {
    id: 1,
    category: 'Confidentiality',
    text: 'The Recipient shall not disclose any confidential information without prior written consent.',
  },
  {
    id: 2,
    category: 'Termination',
    text: 'Either party may terminate this Agreement with 30 days written notice.',
  },
  {
    id: 3,
    category: 'Governing Law',
    text: 'This Agreement shall be governed by the laws of the State of New York.',
  },
];

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

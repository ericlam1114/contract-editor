"use client";

import { useEffect, useState } from "react";
import Editor from "@/components/Editor";
import ClauseTools from "@/components/ClauseTools";
import ClauseLibrary from "@/components/ClauseLibrary";
import ClauseSearch from "@/components/ClauseSearch";

const STORAGE_KEY = "my-contract-clauses";

export default function ContractsPage() {
  const [clauses, setClauses] = useState([]);
  const [selectedClauseId, setSelectedClauseId] = useState(null);

  // ✅ Load saved clauses on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setClauses(JSON.parse(saved));
    } else {
      // Load defaults if nothing saved yet
      setClauses([
        {
          id: 1,
          text: "The Recipient agrees to keep all confidential information in strict confidence and not to disclose it to any third party.",
        },
        {
          id: 2,
          text: "This Agreement shall be governed by the laws of the State of California.",
        },
      ]);
    }
  }, []);

  // ✅ Save clauses on every change
  useEffect(() => {
    if (clauses.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clauses));
    }
  }, [clauses]);

  const updateClause = (id, newText) => {
    setClauses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, text: newText } : c))
    );
  };

  const addNewClause = () => {
    const newId = Date.now();
    const newClause = { id: newId, text: "" };
    setClauses((prev) => [...prev, newClause]);
    setSelectedClauseId(newId);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold mb-4">📝 Contract Editor</h1>

      {clauses.map((clause) => (
        <div
          key={clause.id}
          className={`rounded-lg border p-4 transition ${
            selectedClauseId === clause.id
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200"
          }`}
          onClick={() => setSelectedClauseId(clause.id)}
        >
          <Editor
            text={clause.text}
            onChange={(newText) => updateClause(clause.id, newText)}
          />
          {selectedClauseId === clause.id && (
            <ClauseTools
              text={clause.text}
              onUpdate={(newText) => updateClause(clause.id, newText)}
            />
          )}
        </div>
      ))}

      <button
        onClick={addNewClause}
        className="mt-4 px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
      >
        + Add New Clause
      </button>
      <ClauseSearch
        onInsert={(text) => {
          const newId = Date.now();
          setClauses((prev) => [...prev, { id: newId, text }]);
          setSelectedClauseId(newId);
        }}
      />

      <ClauseLibrary
        onInsert={(clauseText) => {
          const newId = Date.now();
          const newClause = { id: newId, text: clauseText };
          setClauses((prev) => [...prev, newClause]);
          setSelectedClauseId(newId);
        }}
      />
    </div>
  );
}

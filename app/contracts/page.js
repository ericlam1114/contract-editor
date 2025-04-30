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
      // Add selected: false to loaded clauses if it doesn't exist
      const loadedClauses = JSON.parse(saved).map(c => ({ ...c, selected: c.selected ?? false }));
      setClauses(loadedClauses);
    } else {
      // Load defaults if nothing saved yet -> Now starts empty
      setClauses([]); // Set to empty array instead of default clauses
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
    const newClause = { id: newId, text: "", selected: false }; // Add selected property
    setClauses((prev) => [...prev, newClause]);
    setSelectedClauseId(newId);
  };

  // ✅ Handler to toggle checkbox selection
  const handleCheckboxChange = (id) => {
    setClauses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  // ✅ Handler to delete selected clauses
  const deleteSelectedClauses = () => {
    setClauses((prev) => prev.filter((c) => !c.selected));
    setSelectedClauseId(null); // Clear selection after deleting
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold mb-4">📝 Contract Editor</h1>

      {clauses.length > 0 && ( // Add button only if clauses exist
        <button
          onClick={deleteSelectedClauses}
          className="mb-4 px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          disabled={!clauses.some(c => c.selected)} // Disable if no clauses are selected
        >
          Delete Selected
        </button>
      )}

      {clauses.map((clause) => (
        <div
          key={clause.id}
          className={`rounded-lg border p-4 transition flex items-start space-x-3 ${
            selectedClauseId === clause.id
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200"
          }`}
          // Removed onClick={() => setSelectedClauseId(clause.id)} to prevent conflict with checkbox
        >
          {/* ✅ Checkbox for selection */}
          <input
             type="checkbox"
             checked={clause.selected}
             onChange={() => handleCheckboxChange(clause.id)}
             className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
             onClick={(e) => e.stopPropagation()} // Prevent outer div click when clicking checkbox
          />
          <div className="flex-1" onClick={() => setSelectedClauseId(clause.id)}> {/* Make inner div clickable */}
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
          setClauses((prev) => [...prev, { id: newId, text, selected: false }]); // Add selected prop
          setSelectedClauseId(newId);
        }}
      />

      <ClauseLibrary
        onInsert={(clauseText) => {
          const newId = Date.now();
          const newClause = { id: newId, text: clauseText, selected: false }; // Add selected prop
          setClauses((prev) => [...prev, newClause]);
          setSelectedClauseId(newId);
        }}
      />
    </div>
  );
}

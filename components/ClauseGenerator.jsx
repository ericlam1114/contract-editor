'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

/**
 * Component for generating new clauses based on instructions.
 * @param {object} props
 * @param {function} props.onClauseGenerated - Callback function when a clause is successfully generated, receives the text.
 */
export default function ClauseGenerator({ onClauseGenerated }) {
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/clauses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instruction }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.generatedClause) {
        throw new Error('Invalid response structure from generate API.');
      }
      
      // Pass the generated clause text up to the parent
      onClauseGenerated(data.generatedClause);
      setInstruction(''); // Clear input on success

    } catch (err) {
      console.error("Clause generation request failed:", err);
      setError(err.message || 'Failed to generate clause. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
      <h3 className="text-lg font-medium">Generate Clause</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g., Generate a confidentiality clause"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !instruction.trim()}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            'Generate & Add Clause'
          )}
        </Button>
      </form>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
} 
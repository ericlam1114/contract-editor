'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui setup
import { Input } from "@/components/ui/input";   // Assuming shadcn/ui setup
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For errors
import { Loader2 } from "lucide-react"; // Loading spinner

/**
 * Component for inputting AI edit instructions and triggering the patch API.
 * @param {object} props
 * @param {function} props.onPatchReceived - Callback function when edits are successfully fetched.
 * @param {string} props.fullText - The full text of the document to be edited.
 */
export default function AIEditInput({ onPatchReceived, fullText }) {
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!instruction.trim() || !fullText) {
       setError('Cannot generate edits without document text.');
       return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/patch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          instruction,
          fullText
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.edits) {
        if (Array.isArray(data.edits) && data.edits.length === 0) {
           console.log('AI returned no edits for this instruction.');
           onPatchReceived([]);
        } else {
           throw new Error('Invalid response structure from patch API.');
        }
      } else {
        onPatchReceived(data.edits);
      }
      
      setInstruction('');

    } catch (err) {
      console.error("Patch request failed:", err);
      setError(err.message || 'Failed to get edits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
      <h3 className="text-lg font-medium">AI Edit Instruction</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g., Change the governing law to Delaware"
          disabled={isLoading || !fullText}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !instruction.trim() || !fullText}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...</>
          ) : (
            'Generate Edits'
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
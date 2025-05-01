'use client';

import React from 'react';
// Dynamically import ReactDiffViewer to avoid SSR issues if necessary
import dynamic from 'next/dynamic';
const ReactDiffViewer = dynamic(() => import('react-diff-viewer'), { ssr: false });

import { Button } from "@/components/ui/button";

/**
 * Displays proposed index-based edits using a diff view and provides accept/reject actions.
 * @param {object} props
 * @param {Array<{startIndex: number, endIndex: number, newText: string}>} props.pendingEdits - Array of index-based edits.
 * @param {string} props.fullDocumentText - The current full text of the document.
 * @param {function} props.onAccept - Callback function when 'Accept' is clicked.
 * @param {function} props.onReject - Callback function when 'Reject' is clicked.
 */
export default function DiffViewer({ pendingEdits, fullDocumentText, onAccept, onReject }) {
  if (!pendingEdits || pendingEdits.length === 0 || !fullDocumentText) {
    return null; // Don't render if no edits or no document text
  }

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-amber-50 border-amber-200">
      <h3 className="text-lg font-medium text-amber-800">Proposed AI Edits</h3>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2"> {/* Scrollable area for diffs */}
        {pendingEdits.map((edit, index) => {
          // Extract the original text segment based on indices
          let originalSegment = '';
          try {
             // Ensure indices are valid before slicing
             if (edit.startIndex >= 0 && 
                 edit.endIndex >= edit.startIndex && 
                 edit.endIndex <= fullDocumentText.length) {
                   originalSegment = fullDocumentText.substring(edit.startIndex, edit.endIndex);
             } else {
                 console.warn("Invalid indices for edit:", edit); 
                 originalSegment = `[Error: Invalid range ${edit.startIndex}-${edit.endIndex}]`;
             }
          } catch (e) {
            console.error("Error extracting original segment:", e, edit);
            originalSegment = "[Error extracting text]";
          }
          
          const newText = edit.newText;

          return (
            <div key={index} className="border rounded-md overflow-hidden bg-white">
              <div className="p-2 bg-slate-100 text-sm font-mono text-slate-700">
                 Change at Index Range: [{edit.startIndex} - {edit.endIndex}]
              </div>
              <ReactDiffViewer
                oldValue={originalSegment} // Show original segment
                newValue={newText}         // Show proposed new text
                splitView={true}          // Side-by-side view often clearer
                hideLineNumbers={true}
                useDarkTheme={false}
                // Add titles for clarity
                leftTitle="Original Text Segment"
                rightTitle="Proposed New Text"
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-amber-200">
        <Button variant="outline" onClick={onReject}>Reject All</Button> {/* Clarify applies to all */}
        <Button variant="default" onClick={onAccept} className="bg-amber-600 hover:bg-amber-700">
          Accept All Edits {/* Clarify applies to all */}
        </Button>
      </div>
    </div>
  );
} 
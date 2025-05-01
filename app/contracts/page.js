"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Editor from "@/components/Editor";
import ClauseTools from "@/components/ClauseTools";
import ClauseLibrary from "@/components/ClauseLibrary";
import ClauseSearch from "@/components/ClauseSearch";
import AIEditInput from "@/components/AIEditInput";
import DiffViewer from "@/components/DiffViewer";
import TemplateUploader from "@/components/TemplateUploader";
import ClauseGenerator from "@/components/ClauseGenerator";
import TemplateSelector from "@/components/TemplateSelector";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPA_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPA_ANON;

// Create Supabase client only if credentials are available
let supabase = null;
try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase client initialized successfully");
  } else {
    console.warn("Supabase credentials missing. Some features may not work.");
  }
} catch (error) {
  console.error("Failed to initialize Supabase client:", error);
}

// Remove localStorage persistence for now, as structure changed
// const STORAGE_KEY = "my-contract-clauses";

export default function ContractsPage() {
  // State for clauses with indices
  const [clauses, setClauses] = useState([]); 
  // State for the full document text
  const [fullDocumentText, setFullDocumentText] = useState('');
  // State for selected clause (based on indices)
  const [selectedClause, setSelectedClause] = useState(null); // Stores the selected { id, text, startIndex, endIndex }
  const [pendingEdits, setPendingEdits] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Add saving state
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  const debounceTimeoutRef = useRef(null); // Ref for debounce timer
  const editorRef = useRef(null); // Ref for the textarea
  const [cursorPosition, setCursorPosition] = useState(0); // State for cursor position

  // Remove useEffect hooks related to localStorage persistence
  // useEffect(() => { ... });
  // useEffect(() => { ... });

  // --- Load Template (Implemented) ---
  const loadTemplate = useCallback(async (templateId) => {
     if (!templateId || !supabase) return;
     
     console.log(`Loading template ${templateId}...`);
     setIsLoading(true);
     setFullDocumentText(''); 
     setClauses([]);
     setSelectedClause(null);
     setCurrentTemplateId(templateId); 
     
     try {
        const [templateRes, clausesRes] = await Promise.all([
          supabase.from('templates').select('full_text').eq('id', templateId).single(),
          supabase.from('clauses').select('id, text, start_index, end_index').eq('template_id', templateId).order('start_index')
        ]);

        const { data: templateData, error: templateError } = templateRes;
        const { data: clausesData, error: clausesError } = clausesRes;

        if (templateError) throw new Error(`Failed to load template text: ${templateError.message}`);
        if (clausesError) throw new Error(`Failed to load clauses: ${clausesError.message}`);
        if (!templateData) throw new Error('Template not found.');

        setFullDocumentText(templateData.full_text || '');
        
        const processedClauses = (clausesData || []).map(c => ({
            id: String(c.id), 
            text: c.text,
            startIndex: c.start_index,
            endIndex: c.end_index,
            selected: false
        }));
        setClauses(processedClauses);
        console.log(`Template ${templateId} loaded successfully.`);

     } catch (error) {
        console.error('Error loading template:', error);
        alert(`Failed to load template: ${error.message}`);
        setFullDocumentText('');
        setClauses([]);
        setCurrentTemplateId(null);
     } finally {
        setIsLoading(false);
     }
   }, []); 

  // --- Save Function --- 
  const saveDocument = useCallback(async (textToSave) => {
    if (!currentTemplateId || !supabase || isSaving) return;

    console.log(`Saving template ${currentTemplateId}...`);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/templates/${currentTemplateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullText: textToSave }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save template (status: ${response.status})`);
      }
      console.log(`Template ${currentTemplateId} saved successfully.`);
    } catch (error) {
      console.error("Error saving template:", error);
      alert(`Error saving document: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [currentTemplateId, isSaving]);

  // --- Debounced Save --- <--- Define Before Dependent Functions
  const saveDebounced = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      if (clauses.length > 0) {
        const reconstructedText = clauses.map(c => c.text).join('\n\n');
        saveDocument(reconstructedText);
      } else {
         saveDocument(''); 
      }
    }, 1500);
  }, [clauses, saveDocument]);

  // --- Upload Success Handler (Uses loadTemplate) ---
  const handleUploadSuccess = useCallback((result) => {
    console.log('Upload successful:', result);
    if (result.templateId) {
      loadTemplate(result.templateId);
    } else {
      console.error('Upload response missing templateId');
      alert('Upload succeeded, but failed to get template ID to load it.');
    }
  }, [loadTemplate]);

  // --- Core Handlers (Need Adaptation for Full Text) ---

  // TODO: Adapt updateClause to modify fullDocumentText based on indices
  const updateClause = (id, newText) => {
    console.log("updateClause needs rework for full text editing.", id, newText);
    // This logic needs complete overhaul for single editor
    setPendingEdits(null);
  };

  // TODO: Adapt addNewClause or replace with different interaction
  const addNewClause = () => {
     console.log("addNewClause needs rework for full text editing.");
    // This logic needs complete overhaul
  };

  // Remove checkbox/delete logic for now
  // const handleCheckboxChange = (id) => { ... };
  // const deleteSelectedClauses = () => { ... };

  // --- Template Selection Handler ---
  const handleTemplateSelected = useCallback((templateId) => {
     console.log("Template selected:", templateId);
     // Call the existing loadTemplate function
     loadTemplate(templateId);
  }, [loadTemplate]); // Depend on loadTemplate

  // --- Clause Update Handler --- 
  const handlePatchReceived = (edits) => {
    console.log('Received index-based edits:', edits);
    if (Array.isArray(edits)) {
      setPendingEdits(edits);
    } else {
      console.error("Invalid edits received, expected an array:", edits);
      setPendingEdits(null);
    }
  };

  // Apply patch needs to work on fullDocumentText again, but use verification
  const applyPatch = useCallback(() => {
    if (!pendingEdits || pendingEdits.length === 0) {
        // ... no change needed here ...
        return;
    }
    console.log('Applying verified index-based patch to full text:', pendingEdits);
    let updatedText = fullDocumentText;
    let changesApplied = 0;
    const errors = [];
    const sortedEdits = [...pendingEdits].sort((a, b) => b.startIndex - a.startIndex);

    try {
        for (const edit of sortedEdits) {
            const { startIndex, endIndex, newText, originalTextSnippet } = edit;
            if (!originalTextSnippet) {
                errors.push(`Edit skipped: Missing originalTextSnippet (Indices: ${startIndex}-${endIndex})`); continue; 
            }
            if (startIndex < 0 || endIndex < startIndex || endIndex > updatedText.length) {
                errors.push(`Edit skipped: Invalid indices (Indices: ${startIndex}-${endIndex})`); continue; 
            }
            const actualOriginalText = updatedText.substring(startIndex, endIndex);
            if (actualOriginalText.startsWith(originalTextSnippet)) {
                updatedText = updatedText.substring(0, startIndex) + newText + updatedText.substring(endIndex);
                changesApplied++;
                console.log(`Applied edit at [${startIndex}-${endIndex}]`);
            } else {
                errors.push(`Edit skipped: Verification failed at index ${startIndex}.`); 
                console.warn("Verification failed for edit:", { edit, expectedSnippet: originalTextSnippet, foundText: actualOriginalText });
            }
        }
        if (changesApplied > 0) {
            setFullDocumentText(updatedText);
            console.log(`${changesApplied} verified edit(s) applied.`);
            setClauses([]); // Indices are invalid
            setSelectedClause(null);
            saveDocument(updatedText); // Use direct save, not debounced
        } else {
            console.log("No edits applied after verification.");
        }
        if (errors.length > 0) {
            alert(`Some edits could not be applied accurately:\n- ${errors.join('\n- ')}`);
        }
    } catch (error) {
        console.error("Error applying patch:", error);
        alert('An unexpected error occurred while applying edits.');
    } finally {
        setPendingEdits(null);
    }
  }, [pendingEdits, fullDocumentText, clauses, saveDocument]); // Keep clauses for now if needed elsewhere 

  const rejectPatch = () => {
    console.log('Rejecting patch');
    setPendingEdits(null);
  };

  // --- Clause Generation Handler ---
  const handleClauseGenerated = useCallback((generatedClauseText) => {
    if (!generatedClauseText) return;
    
    const currentPos = cursorPosition; // Use the tracked cursor position
    const textToInsert = (currentPos > 0 ? "\n\n" : "") + generatedClauseText + "\n\n"; // Add spacing
    
    const newFullText = 
       fullDocumentText.substring(0, currentPos) + 
       textToInsert + 
       fullDocumentText.substring(currentPos);
       
    setFullDocumentText(newFullText);
    console.log(`Generated clause inserted at index ${currentPos}.`);
    
    // Update cursor position state to be after the inserted text
    const newCursorPos = currentPos + textToInsert.length;
    setCursorPosition(newCursorPos);
    // Programmatically set the textarea cursor (optional, might need useEffect)
    // if (editorRef.current) {
    //   editorRef.current.focus();
    //   editorRef.current.setSelectionRange(newCursorPos, newCursorPos);
    // }
    
    setClauses([]); 
    setSelectedClause(null);
    saveDocument(newFullText); // Save directly

  }, [fullDocumentText, saveDocument, cursorPosition]); // Add cursorPosition dependency

  // Editor change handler saves debounced
  const handleEditorChange = useCallback((newText) => {
    setFullDocumentText(newText);
    saveDebounced();
    if (clauses.length > 0 || selectedClause) {
      setClauses([]);
      setSelectedClause(null);
      console.warn("Clauses cleared due to manual edit.");
    }
    // Update cursor position on change as well
    if (editorRef.current) {
      setCursorPosition(editorRef.current.selectionStart);
    }
  }, [saveDebounced, clauses, selectedClause]);

  const handleEditorSelect = useCallback(() => {
    // Update cursor position state when selection changes (includes clicks)
    if (editorRef.current) {
      setCursorPosition(editorRef.current.selectionStart);
      // console.log("Cursor/Selection Start:", editorRef.current.selectionStart);
    }
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // --- Add Clause / Insertion Handlers --- 
  // const handleAddBlock = useCallback((index) => { /* ... */ }, [clauses, saveDebounced]);

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-2xl font-semibold">Contract Editor</h1>

        {isLoading && (
          <div className="text-center py-6">
            {/* Loading indicator */}
          </div>
        )}

        {pendingEdits && (
          <DiffViewer
            pendingEdits={pendingEdits} 
            fullDocumentText={fullDocumentText} // Pass the full text
            onAccept={applyPatch}
            onReject={rejectPatch}
          />
        )}

        {/* SINGLE EDITOR - Add ref and onSelect */} 
        <div className="rounded-lg border border-gray-200 p-4 bg-white">
            {/* Replace Editor component with direct textarea to attach ref */} 
            <textarea
                ref={editorRef} // Attach ref
                className="w-full h-[70vh] p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" // Example styling, adjust height
                value={fullDocumentText}
                onChange={e => handleEditorChange(e.target.value)} // Use existing handler
                onSelect={handleEditorSelect} // Track selection changes
                onClick={handleEditorSelect} // Also track clicks
            />
        </div>

        {/* Placeholder if no text */} 
        {(fullDocumentText === '' && !isLoading && !pendingEdits) && (
          <div className="text-center text-gray-500 py-10 border-2 border-dashed rounded-lg">
            <p>Load a template or upload a document to start editing.</p>
          </div>
        )}
      </div>

      <div className="lg:col-span-1 space-y-6 lg:pt-12">
        <TemplateSelector 
           onTemplateSelected={handleTemplateSelected} 
           currentTemplateId={currentTemplateId} 
        />
        
        <TemplateUploader 
          onUploadSuccess={handleUploadSuccess} 
        />
        
        <AIEditInput 
          onPatchReceived={handlePatchReceived}
          fullText={fullDocumentText} 
        />
        
        <ClauseGenerator onClauseGenerated={handleClauseGenerated} />
        
        <ClauseSearch 
          onInsert={(text) => {
            console.log("ClauseSearch insert needs rework for full text editor.")
            // append text to fullDocumentText? Insert at cursor? Needs defining.
          }}
        />
        <ClauseLibrary
          onInsert={(clauseText) => {
            console.log("ClauseLibrary insert needs rework for full text editor.")
            // append text? Insert at cursor? Needs defining.
          }}
        />
      </div>
    </div>
  );
}

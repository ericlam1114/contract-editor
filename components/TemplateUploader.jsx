'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress"; // Optional: For upload progress
import { Loader2, UploadCloud, FileText, CheckCircle, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/**
 * Component for uploading contract templates.
 * @param {object} props
 * @param {function} [props.onUploadSuccess] - Optional callback on successful upload, receives { templateId, clauseCount, fileName }.
 */
export default function TemplateUploader({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isReference, setIsReference] = useState(false);
  // const [uploadProgress, setUploadProgress] = useState(0); // State for progress if using XHR
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic validation (can be expanded)
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload a PDF, DOCX, or TXT file.');
        setSelectedFile(null);
        setUploadResult(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setUploadResult(null);
    // setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('is_reference', isReference.toString());

    try {
      // Note: fetch doesn't easily support progress tracking for uploads.
      // For progress, you'd typically use XMLHttpRequest.
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || `HTTP error! status: ${response.status}`);
      }
      
      setUploadResult({ success: true, ...data });
      if (onUploadSuccess) {
        onUploadSuccess(data); // Pass result to parent
      }
      // Clear selection after successful upload
      setSelectedFile(null);
      setIsReference(false);
      if(fileInputRef.current) fileInputRef.current.value = ''; 

    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message || 'Failed to upload file. Please try again.');
      setUploadResult({ success: false, fileName: selectedFile.name });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
      <h3 className="text-lg font-medium">Upload Template</h3>
      <div className="space-y-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={isLoading}
        />
        {selectedFile && !isLoading && (
          <div className="text-sm text-gray-600 flex items-center space-x-2">
            <FileText size={16} />
            <span>Selected: {selectedFile.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
           id="isReferenceCheckbox" 
           checked={isReference}
           onCheckedChange={setIsReference}
           disabled={isLoading || !selectedFile}
        />
        <Label 
           htmlFor="isReferenceCheckbox" 
           className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
           Upload as reference material (for AI styling)
        </Label>
      </div>

      {/* Optional Progress Bar 
      {isLoading && (
        <Progress value={uploadProgress} className="w-full" />
      )} 
      */} 

      <Button 
        onClick={handleUpload} 
        disabled={!selectedFile || isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
        ) : (
          <><UploadCloud className="mr-2 h-4 w-4" /> Upload & Process</>
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" /> 
          <AlertTitle>Upload Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploadResult && uploadResult.success && (
         <Alert variant="success"> {/* Custom success variant or use default */} 
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Upload Successful</AlertTitle>
          <AlertDescription>
            Processed \"{uploadResult.fileName}\". Found {uploadResult.clauseCount} clauses. Template ID: {uploadResult.templateId}
          </AlertDescription>
        </Alert>
      )}
       {uploadResult && !uploadResult.success && !error && ( // Handle cases where error state was cleared but result marks failure
         <Alert variant="destructive">
          <XCircle className="h-4 w-4" /> 
          <AlertTitle>Upload Failed</AlertTitle>
          <AlertDescription>
            Could not process \"{uploadResult.fileName}\". Please check the file or try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 
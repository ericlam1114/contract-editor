'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming shadcn/ui setup
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

/**
 * Dropdown component to select a previously uploaded template.
 * @param {object} props
 * @param {function} props.onTemplateSelected - Callback function when a template is selected, receives templateId.
 * @param {string|null} props.currentTemplateId - The ID of the currently loaded template (to set default value).
 */
export default function TemplateSelector({ onTemplateSelected, currentTemplateId }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/templates');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch templates: ${response.status}`);
        }
        let data = await response.json();
        // Filter out reference templates for the dropdown
        const editableTemplates = (data || []).filter(template => !template.is_reference);
        setTemplates(editableTemplates);
      } catch (err) {
        console.error("Error fetching templates:", err);
        setError(err.message || "Could not load template list.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []); // Fetch on component mount

  const handleValueChange = (value) => {
    // The value from SelectItem will be the templateId (string)
    if (value) {
      onTemplateSelected(value);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
      <h3 className="text-lg font-medium">Load Existing Template</h3>
      {isLoading && (
        <div className="flex items-center text-sm text-muted-foreground">
           <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading templates...
        </div>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error Loading</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!isLoading && !error && (
        <Select 
          onValueChange={handleValueChange} 
          value={currentTemplateId || ""} // Set current value if available
          disabled={templates.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a template to load..." />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem 
                key={template.id} 
                value={template.id}
                disabled={template.is_reference} 
              >
                {template.name} {template.is_reference ? '[Reference]' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
} 
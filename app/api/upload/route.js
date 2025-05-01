import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
// import pdf from 'pdf-parse'; // Temporarily comment out pdf-parse import
import { createClient } from '@supabase/supabase-js';
import Snowflake from 'snowflake-id';
import OpenAI from 'openai';

// Initialize Supabase client (SERVICE KEY is used for server-side operations)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Key environment variables');
  // Optionally throw an error or handle appropriately for production
  // For development, returning an error response might be better than crashing
  // Consider returning a specific error response here if needed in production
}

// Initialize Supabase client only if credentials are valid
let supabase = null;
try {
  if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Server-side Supabase client initialized.");
  } else {
    // Log the warning but allow the function to proceed if possible,
    // though subsequent Supabase calls will likely fail.
    console.warn("Server-side Supabase credentials missing or incomplete.");
  }
} catch (error) {
  console.error("Failed to initialize server-side Supabase client:", error);
  // Handle initialization error appropriately
}

// Initialize OpenAI Client
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.error('Missing OpenAI API Key environment variable');
  // Handle missing key
}
const openai = new OpenAI({ apiKey: openaiApiKey });

// Initialize Snowflake ID generator (adjust options if needed, e.g., machineId)
const snowflake = new Snowflake();

// Constants
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSION = 1536;
const BATCH_SIZE = 96; // OpenAI batch limit might vary, 96 is safe

// Helper function to generate embeddings in batches
async function generateEmbeddingsBatch(texts) {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSION, // Explicitly request dimension
    });
    // Ensure the response structure is as expected and data exists
    if (!response || !response.data || response.data.length !== texts.length) {
       throw new Error('Unexpected embedding response structure or length mismatch');
    }
    // Return only the embedding vectors
    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Error generating embeddings batch:', error);
    // Decide how to handle batch failure: throw, return nulls, etc.
    // For now, re-throw to let the main handler catch it.
    throw error;
  }
}

export async function POST(req) {
  try {
    // Check if Supabase is initialized before proceeding
    if (!supabase) {
      console.error("Upload API: Supabase client not available.");
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    // Read the is_reference flag (convert string back to boolean)
    const isReference = formData.get('is_reference') === 'true'; 

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let rawText = '';
    let fileName = file.name || 'Untitled Document';

    // Parse based on file type
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // .docx
      const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
      rawText = value;
    // } else if (file.type === 'application/pdf') { // Temporarily comment out PDF block
    //   const data = await pdf(fileBuffer);
    //   rawText = data.text;
    } else if (file.type === 'text/plain') { // .txt
      rawText = fileBuffer.toString('utf-8');
    } else {
      // Temporarily block PDF uploads while testing
      if (file.type === 'application/pdf') {
           return NextResponse.json({ error: 'PDF processing temporarily disabled for testing.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    if (!rawText) {
      return NextResponse.json({ error: 'Could not extract text from file' }, { status: 400 });
    }

    // --- Clause Splitting with Index Calculation ---
    let clausesData = []; // Will store { text, startIndex, endIndex }
    const numberedHeadingRegex = /^\d+(?:\.\d+)*\s+/gm; 
    const blankLineRegex = /\n{2,}/;
    let currentPosition = 0;

    // Helper to find next non-whitespace character index
    const findNextNonWhitespace = (text, startIndex) => {
        for (let i = startIndex; i < text.length; i++) {
            if (!/\s/.test(text[i])) {
                return i;
            }
        }
        return text.length; // Return end if only whitespace left
    };

    // Option 1: Split by numbered headings
    if (numberedHeadingRegex.test(rawText)) {
        let lastIndex = 0;
        const sections = rawText.split(/(?=^\d+(?:\.\d+)*\s+)/gm).filter(Boolean);

        sections.forEach(section => {
            const sectionStartIndex = rawText.indexOf(section, lastIndex);
            if (sectionStartIndex === -1) return; // Should not happen

            // Further split by blank lines if necessary
            const subSections = section.split(blankLineRegex).filter(Boolean);
            let currentSubSectionIndex = sectionStartIndex;

            subSections.forEach(subSectionText => {
                const trimmedText = subSectionText.trim();
                if (!trimmedText) return;
                
                // Find the actual start/end in the original section text to get correct indices
                const subStartIndexInRaw = rawText.indexOf(trimmedText, currentSubSectionIndex);
                if (subStartIndexInRaw !== -1) {
                    const subEndIndexInRaw = subStartIndexInRaw + trimmedText.length;
                    clausesData.push({
                        text: trimmedText,
                        startIndex: subStartIndexInRaw,
                        endIndex: subEndIndexInRaw,
                    });
                    currentSubSectionIndex = subEndIndexInRaw; // Update search start for next sub-section
                }
            });
            lastIndex = sectionStartIndex + section.length;
        });
    } 
    // Option 2: Split by blank lines
    else {
        const chunks = rawText.split(blankLineRegex);
        chunks.forEach(chunk => {
            const trimmedText = chunk.trim();
            if (trimmedText) {
                // Find the start index in the original text from the current position
                const startIndex = rawText.indexOf(trimmedText, currentPosition);
                if (startIndex !== -1) {
                    const endIndex = startIndex + trimmedText.length;
                    clausesData.push({ text: trimmedText, startIndex, endIndex });
                    currentPosition = endIndex; // Update position for next search
                }
            }
        });
    }

    if (clausesData.length === 0) {
      if (rawText.trim()) {
        clausesData = [{ text: rawText.trim(), startIndex: 0, endIndex: rawText.trim().length }];
      } else {
         return NextResponse.json({ error: 'No clauses found after parsing and splitting' }, { status: 400 });
      }
    }

    // --- Supabase Interaction with Embeddings ---
    console.log(`Attempting to insert template \"${fileName}\" (Reference: ${isReference})`);
    
    // 1. Insert Template (including fullText and is_reference)
    const { data: templateData, error: templateError } = await supabase
      .from('templates')
      .insert({ 
        name: fileName, 
        full_text: rawText, 
        is_reference: isReference // Use the flag from form data
      })
      .select('id')
      .single();

    if (templateError) {
      console.error('Supabase template insert error:', templateError);
      return NextResponse.json({ 
        error: 'Failed to create template record', 
        details: templateError.message,
        code: templateError.code,
        fullError: JSON.stringify(templateError)
      }, { status: 500 });
    }

    const templateId = templateData.id;

    // 2. Prepare Clause Data & Generate Embeddings in Batches
    const clausesToInsert = [];
    // Extract just the texts for batch embedding
    const clauseTexts = clausesData.map(c => c.text);

    for (let i = 0; i < clauseTexts.length; i += BATCH_SIZE) {
      const batchTexts = clauseTexts.slice(i, i + BATCH_SIZE);
      console.log(`Generating embeddings for batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
      const embeddings = await generateEmbeddingsBatch(batchTexts);
      console.log(`Embeddings generated for batch ${Math.floor(i / BATCH_SIZE) + 1}.`);

      // Map back to original clausesData structure for this batch
      const batchClausesData = clausesData.slice(i, i + BATCH_SIZE);

      const batchClauses = batchClausesData.map((clauseInfo, index) => ({
        id: snowflake.generate(),
        template_id: templateId,
        text: clauseInfo.text,
        start_index: clauseInfo.startIndex, // Add start index
        end_index: clauseInfo.endIndex,     // Add end index
        embedding: embeddings[index], 
      }));
      clausesToInsert.push(...batchClauses);
    }

    // 3. Insert Clauses
    const { error: clausesError } = await supabase
      .from('clauses')
      .insert(clausesToInsert);

    if (clausesError) {
      console.error('Supabase clauses insert error:', clausesError);
      await supabase.from('templates').delete().match({ id: templateId }); // Cleanup
      return NextResponse.json({ error: 'Failed to insert clauses', details: clausesError.message }, { status: 500 });
    }

    const clauseCount = clausesToInsert.length;

    // --- Return Response (including rawText and clausesData) ---
    return NextResponse.json({
      message: 'File processed, embedded, and stored successfully',
      templateId,
      clauseCount,
      fileName,
      // We don't need to return fullText/clauses here anymore if loadTemplate handles it
      // fullText: rawText, 
      // clauses: clausesData 
    });

  } catch (error) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: 'Failed to process file', details: error.message }, { status: 500 });
  }
} 
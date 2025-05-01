import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client (ANON KEY is safe for client-side/read operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPA_URL; // Use public URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPA_ANON;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase Public URL or Anon Key environment variables');
  // Handle missing keys, maybe throw an error or return default
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize OpenAI Client (Needed for query embedding)
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.error('Missing OpenAI API Key environment variable for retrieval');
  // Handle missing key
}
const openai = new OpenAI({ apiKey: openaiApiKey });

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSION = 1536;

/**
 * Finds the top K clauses similar to the query text using pgvector.
 * @param {string} query - The text to search for similar clauses.
 * @param {string} [templateId] - Optional template ID to filter clauses.
 * @param {number} [k=6] - The number of clauses to return.
 * @param {boolean} [isReferenceFilter=null] - Optional: true to find only reference clauses, false for non-reference, null for all.
 * @returns {Promise<Array<{id: number, text: string, similarity: number}>>} - Array of matching clauses.
 */
export async function findSimilarClauses(query, templateId = null, k = 6, isReferenceFilter = null) {
  if (!query) {
    console.warn('findSimilarClauses called with empty query.');
    return [];
  }

  try {
    // 1. Generate embedding for the query text
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
      dimensions: EMBEDDING_DIMENSION,
    });

    const queryEmbedding = embeddingResponse?.data?.[0]?.embedding;

    if (!queryEmbedding) {
      throw new Error('Failed to generate query embedding.');
    }

    // 2. Call the Supabase RPC function to find matches
    const rpcParams = {
      query_embedding: queryEmbedding,
      match_count: k,
      template_filter_id: templateId,
      is_reference_filter: isReferenceFilter
    };

    console.log('Calling match_clauses with params:', { 
        match_count: k, 
        template_filter_id: templateId,
        is_reference_filter: isReferenceFilter
    });

    const { data, error } = await supabase.rpc('match_clauses', rpcParams);

    if (error) {
      console.error('Supabase RPC match_clauses error:', error);
      throw error; // Re-throw to be handled by the caller
    }

    console.log('Match clauses response:', data);
    return data || []; // Return data or empty array if null/undefined

  } catch (error) {
    console.error('Error in findSimilarClauses:', error);
    return []; // Return empty array on error
  }
} 
import { OpenAIEmbeddingFunction } from "chromadb";
import { libraryClauses } from './clauseData';

// Check for the environment variable
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.error("OPENAI_API_KEY environment variable is not set!");
}

// Create a simple in-memory vector store for development
class InMemoryVectorStore {
  constructor() {
    this.documents = [];
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    console.log("Initializing in-memory vector store");
    this.initialized = true;
    return true;
  }

  async addDocument(id, text, metadata = {}) {
    console.log(`Adding document ${id} to in-memory store`);
    this.documents.push({
      id,
      text,
      metadata
    });
  }

  async search(query, limit = 3) {
    console.log(`Searching for: "${query}"`);
    // Very simple search - just check if the query words are in the text
    // This is just a mock/placeholder for the real vector search
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const results = this.documents
      .map(doc => {
        const text = doc.text.toLowerCase();
        // Count how many query words are in the document
        const matchCount = queryWords.filter(word => text.includes(word)).length;
        return { doc, matchCount };
      })
      .filter(item => item.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, limit)
      .map(item => item.doc.text);
    
    return results;
  }
}

// Create the in-memory store instance
const vectorStore = new InMemoryVectorStore();

export async function initVectorStore() {
  return await vectorStore.initialize();
}

export async function addClauseToVector(id, text) {
  try {
    await vectorStore.addDocument(id, text, { type: "library" });
    console.log(`Successfully added clause ${id}`);
  } catch (error) {
    console.error(`Error adding clause ${id} to vector store:`, error);
    throw error;
  }
}

export async function searchClauses(query, topK = 3) {
  try {
    if (!vectorStore.initialized) {
      await initVectorStore();
    }
    
    console.log(`Searching for clauses matching: "${query}"`);
    const results = await vectorStore.search(query, topK);
    
    return results;
  } catch (error) {
    console.error("Error searching clauses:", error);
    return [];
  }
}

export async function preloadLibraryIntoVector() {
  try {
    console.log("Starting preload of vector store...");
    await initVectorStore();
    
    // Use the imported clauseData directly instead of dynamic import
    console.log(`Preloading ${libraryClauses.length} clauses into vector store`);
    
    // Process each clause
    for (const clause of libraryClauses) {
      console.log(`Processing clause: ${clause.id}`);
      await addClauseToVector(clause.id.toString(), clause.text);
    }
    
    console.log("Preload complete");
    return true;
  } catch (error) {
    console.error("Error in preloadLibraryIntoVector:", error);
    throw error;
  }
}

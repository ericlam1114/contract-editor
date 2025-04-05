'use server';

import { ChromaClient } from "chromadb";
import OpenAI from "openai";
import { libraryClauses } from "@/components/ClauseLibrary.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const chroma = new ChromaClient();

let collection;

export async function initVectorStore() {
  collection = await chroma.getOrCreateCollection({ name: "clause-library" });
}

// Generate embedding using OpenAI API
export async function embedText(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

// Insert a clause
export async function addClauseToVector(id, text) {
  const embedding = await embedText(text);
  await collection.add({
    ids: [id],
    embeddings: [embedding],
    documents: [text],
    metadatas: [{ type: "library" }],
  });
}

// Search top-k clauses
export async function searchClauses(query, topK = 3) {
  const queryEmbedding = await embedText(query);
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });
  return results.documents[0]; // list of top-matching clause texts
}


export async function preloadLibraryIntoVector() {
  await initVectorStore();
  for (const clause of libraryClauses) {
    await addClauseToVector(clause.id.toString(), clause.text);
  }
}

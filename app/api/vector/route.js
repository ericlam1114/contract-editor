import { NextResponse } from 'next/server';
import { initVectorStore, searchClauses, preloadLibraryIntoVector } from '@/lib/vector';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }
    
    await initVectorStore();
    const results = await searchClauses(query);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Vector search error:', error);
    return NextResponse.json({ error: 'Failed to search vector store' }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('Starting preload of vector store...');
    await initVectorStore();
    console.log('Vector store initialized, preloading clauses...');
    await preloadLibraryIntoVector();
    console.log('Vector store preloaded successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Preload error:', error);
    return NextResponse.json({ 
      error: 'Failed to preload vector store', 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 
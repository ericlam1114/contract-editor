import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { findSimilarClauses } from '@/lib/retrieval'; // Import the updated retrieval helper

// Initialize OpenAI Client
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  throw new Error('Missing OpenAI API Key environment variable');
}
const openai = new OpenAI({ apiKey: openaiApiKey });

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are an AI legal assistant drafting contract clauses.
Generate a clause based *only* on the user's request, ensuring the style, tone, and structure closely match the provided examples from the organization's existing documents.
Output *only* the generated clause text, with no introductory phrases, explanations, or markdown formatting.`;

export async function POST(req) {
  try {
    const { instruction } = await req.json();

    if (!instruction) {
      return NextResponse.json({ error: 'Instruction is required' }, { status: 400 });
    }

    console.log(`Generate clause request received: instruction="${instruction}"`);

    // --- Clause Retrieval (Using the updated helper, filtering for reference) ---
    // Find top 3-5 relevant clauses marked as reference material
    const referenceClauses = await findSimilarClauses(
        instruction, 
        null, // No specific template ID filter
        5,    // Get top 5 examples
        true  // Filter for is_reference = true
    );

    let context = 'No relevant reference examples found.';
    if (referenceClauses && referenceClauses.length > 0) {
      console.log('Reference clauses found:', referenceClauses.map(c => ({ id: c.id, similarity: c.similarity, text: c.text.substring(0, 70) + '...' })));
      context = referenceClauses
        .map((c, i) => `Example ${i + 1}:\n${c.text}`)
        .join('\n\n---\n\n');
    } else {
      console.log('No reference clauses found for instruction:', instruction);
      // Proceed without examples, the AI will use its general knowledge
    }

    // --- OpenAI Call --- 
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Request: "${instruction}"\n\nExisting Examples:\n${context}`,
      },
    ];

    console.log('Calling OpenAI for clause generation...');
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1', // Or gpt-4o
      messages: messages,
      temperature: 0.5, // Allow a bit more creativity than patching
      max_tokens: 500, // Limit output length reasonably
    });
    const endTime = Date.now();
    console.log(`OpenAI generation call took ${endTime - startTime}ms`);

    const generatedText = response.choices[0]?.message?.content?.trim();

    if (!generatedText) {
       console.error('OpenAI did not return generated text.', response);
       return NextResponse.json({ error: 'AI failed to generate clause text' }, { status: 500 });
    }

    console.log('Generated clause text:', generatedText);

    // --- Return Response --- 
    return NextResponse.json({ generatedClause: generatedText }, { status: 200 });

  } catch (error) {
    console.error('Generate Clause API Error:', error);
    const errorMessage = error.message || 'An unexpected error occurred';
    return NextResponse.json({ error: 'Failed to process generate clause request', details: errorMessage }, { status: 500 });
  }
} 
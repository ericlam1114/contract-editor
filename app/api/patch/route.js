import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod'; // Import Zod
import zodToJsonSchema from 'zod-to-json-schema';

// Initialize OpenAI Client
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  throw new Error('Missing OpenAI API Key environment variable'); // Throw error if missing crucial key
}
const openai = new OpenAI({ apiKey: openaiApiKey });

// Configure for Edge runtime
export const runtime = 'edge';

// --- Define the NEW Zod schema for Target/Replacement --- 
const EditSchema = z.object({
  targetText: z.string().describe("The exact original text segment to find and replace (e.g., '[TENANT EMAIL]', 'the lease term shall commence'). Be precise."),
  newText: z.string().describe("The new text to replace the targetText with."),
  // Optional: Add context hint later if needed for ambiguity
  // contextHint: z.string().optional().describe("Optional text immediately preceding or following the targetText to help locate it if ambiguous.")
});

const PatchSchema = z.object({
  edits: z.array(EditSchema).describe("An array of edits. Each edit specifies the exact targetText to replace and the newText.")
});

// --- Generate JSON schema from Zod schema for OpenAI function --- 
const patchJSONSchema = zodToJsonSchema(PatchSchema, "patchDocument");

// --- Update System Prompt --- 
const SYSTEM_PROMPT = `You are an AI legal assistant specializing in precise contract modification.
Your task is to modify a contract document based *only* on the user\'s explicit instruction.
Analyze the user\'s instruction and the provided full contract text very carefully.
Identify the *most relevant* specific section(s) or placeholder(s) (like \'[TENANT EMAIL]\', \'[START DATE]\', etc.) in the document that need modification to fulfill the instruction. Pay close attention to context (e.g., distinguish between \'Landlord\' and \'Tenant\' details).
Generate a patch object containing the necessary edits using the \`patchDocument\` function.
For each edit, provide:
1. The **exact** original text segment that needs to be replaced (\`targetText\`). Be precise and include the full segment (e.g., \'[TENANT EMAIL]\', not just \'TENANT EMAIL\').
2. The \`newText\` to replace the \`targetText\` with.
Ensure the \`targetText\` exists in the original document.
Ensure the generated patch adheres to the required JSON schema.
Only edit the most relevant part(s) of the text. Do not make unrelated changes.
If the instruction is ambiguous or cannot be reasonably applied, call the function with an empty edits array.`;

export async function POST(req) {
  try {
    const { instruction, fullText } = await req.json();

    if (!instruction || !fullText) {
      return NextResponse.json({ error: 'Instruction and fullText are required' }, { status: 400 });
    }

    console.log(`Patch request received: instruction="${instruction}", text length=${fullText.length}`);

    // --- OpenAI Call --- 
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Instruction: "${instruction}"\n\nDocument Text:\n\`\`\`\n${fullText}\n\`\`\``,
      },
    ];

    console.log('Calling OpenAI to identify targets...');
    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1', 
      messages: messages,
      tools: [{
         type: 'function',
         function: {
           name: 'patchDocument',
           description: 'Identifies text segments to replace and provides the new text.',
           // Use the updated schema definition for parameters
           parameters: patchJSONSchema.definitions.patchDocument 
         }
      }], 
      tool_choice: { type: 'function', function: { name: 'patchDocument' } },
      temperature: 0.1, // Even lower temp might help focus
    });
    const endTime = Date.now();
    console.log(`OpenAI call took ${endTime - startTime}ms`);

    const message = response.choices[0]?.message;
    if (!message?.tool_calls || message.tool_calls.length === 0) {
      console.error('OpenAI did not call the required function.', message);
      return NextResponse.json({ error: 'AI failed to identify edits' }, { status: 500 });
    }

    const functionArgs = message.tool_calls[0]?.function?.arguments;
    if (!functionArgs) {
      console.error('OpenAI function call arguments are missing.', message);
      return NextResponse.json({ error: 'AI failed to provide edit arguments' }, { status: 500 });
    }

    // --- Response Validation (using targetText/newText schema) --- 
    let parsedArgs;
    try {
      parsedArgs = JSON.parse(functionArgs);
    } catch (e) {
      console.error('Failed to parse OpenAI function arguments JSON:', e, functionArgs);
      return NextResponse.json({ error: 'AI returned invalid JSON format' }, { status: 500 });
    }

    const validationResult = PatchSchema.safeParse(parsedArgs);
    if (!validationResult.success) {
      console.error('OpenAI response failed Zod validation:', validationResult.error.errors);
      return NextResponse.json({ error: 'AI returned invalid edit structure', details: validationResult.error.flatten() }, { status: 500 });
    }

    const aiSuggestedEdits = validationResult.data.edits;
    if (aiSuggestedEdits.length === 0) {
      console.log('AI returned empty edits array.');
      return NextResponse.json({ edits: [] }, { status: 200 }); // Return empty array if AI suggests no edits
    }

    console.log('AI suggested edits:', aiSuggestedEdits);

    // --- Server-Side Verification and Index Calculation --- 
    const verifiedIndexBasedEdits = [];
    const errors = [];
    
    for (const suggestedEdit of aiSuggestedEdits) {
        const { targetText, newText } = suggestedEdit;
        
        if (!targetText || targetText.trim() === '') {
            console.warn('AI suggested an edit with empty targetText, skipping:', suggestedEdit);
            errors.push('AI suggested an empty target to replace.');
            continue;
        }

        // Simple search for the first occurrence (can be enhanced later)
        const startIndex = fullText.indexOf(targetText);

        if (startIndex === -1) {
            // Target text not found in the document
            console.warn(`Target text not found in document: "${targetText.substring(0, 50)}..."`, suggestedEdit);
            errors.push(`Could not find the text "${targetText.substring(0, 30)}..." in the document.`);
            continue; // Skip this edit
        }

        // Future enhancement: Handle multiple occurrences if necessary (e.g., using contextHint)
        
        const endIndex = startIndex + targetText.length;

        // Add the verified, index-based edit to the list
        verifiedIndexBasedEdits.push({
            startIndex: startIndex,
            endIndex: endIndex,
            newText: newText,
            originalTextSnippet: targetText // Use the found target as the snippet for client verification
        });
    }

    console.log('Verified index-based edits to return:', verifiedIndexBasedEdits);
    if (errors.length > 0) {
        console.warn('Errors during server-side verification:', errors);
        // Decide if we should return partial edits or an error if verification fails
        // For now, returning only successfully verified edits
    }

    // --- Return Response (Verified Index-Based Edits) --- 
    return NextResponse.json({ edits: verifiedIndexBasedEdits }, { status: 200 });

  } catch (error) {
    console.error('Patch API Error:', error);
    const errorMessage = error.message || 'An unexpected error occurred';
    return NextResponse.json({ error: 'Failed to process patch request', details: errorMessage }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (SERVICE KEY for server-side operations)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_KEY;

let supabase = null;
try {
  if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  } else {
    console.warn("Update API: Server-side Supabase credentials missing or incomplete.");
  }
} catch (error) {
  console.error("Update API: Failed to initialize server-side Supabase client:", error);
}

// Handler for PUT request to update the full_text of a template
export async function PUT(req, { params }) {
  const { templateId } = params; // Extract templateId from the URL path
  
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  if (!templateId) {
    return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
  }

  try {
    const { fullText } = await req.json();

    if (typeof fullText !== 'string') { // Basic validation
      return NextResponse.json({ error: 'Invalid fullText provided' }, { status: 400 });
    }

    console.log(`Updating template ${templateId} with new text (length: ${fullText.length})`);

    const { data, error } = await supabase
      .from('templates')
      .update({ full_text: fullText })
      .eq('id', templateId)
      .select('id'); // Optionally select something to confirm success
    
    if (error) {
      console.error(`Supabase update error for template ${templateId}:`, error);
      return NextResponse.json({ error: 'Failed to update template', details: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
        console.warn(`Template with ID ${templateId} not found for update.`);
        return NextResponse.json({ error: `Template not found` }, { status: 404 });
    }

    console.log(`Successfully updated template ${templateId}`);
    return NextResponse.json({ message: 'Template updated successfully', templateId: data[0].id }, { status: 200 });

  } catch (error) {
    console.error(`Error processing PUT request for template ${templateId}:`, error);
    return NextResponse.json({ error: 'Failed to process update request', details: error.message }, { status: 500 });
  }
} 
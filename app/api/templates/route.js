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
    console.warn("List Templates API: Server-side Supabase credentials missing.");
  }
} catch (error) {
  console.error("List Templates API: Failed to initialize Supabase client:", error);
}

// Handler for GET request to list all templates
export async function GET(req) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    console.log("Fetching list of templates...");

    const { data, error } = await supabase
      .from('templates')
      .select('id, name, created_at, is_reference') // Select necessary fields
      .order('created_at', { ascending: false }); // Order by creation date, newest first
      
    if (error) {
      console.error('Supabase error fetching templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates', details: error.message }, { status: 500 });
    }

    console.log(`Successfully fetched ${data?.length || 0} templates.`);
    return NextResponse.json(data || [], { status: 200 }); // Return data or empty array

  } catch (error) {
    console.error('Error processing GET request for templates:', error);
    return NextResponse.json({ error: 'Failed to process list templates request', details: error.message }, { status: 500 });
  }
} 
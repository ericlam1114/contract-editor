This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

# Cursor for Contracts

A Next.js application for contract management, analysis, and AI-assisted editing.

## Setup Instructions

### 1. Environment Configuration

1. Rename `.exampleenv` to `.env.local` in the root directory
2. Fill in the required API keys and credentials as follows:

```bash
# OpenAI API Keys
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key
OPENAI_API_KEY=your_openai_key

# ChromaDB (optional - only required if using local vector database)
CHROMA_API_URL=http://localhost:8000

# Supabase Credentials
NEXT_PUBLIC_SUPA_URL=your_supabase_url
NEXT_PUBLIC_SUPA_ANON=your_supabase_anon_key
SUPABASE_URL=${NEXT_PUBLIC_SUPA_URL}
SUPABASE_KEY=your_supabase_service_key

# OpenAI Fine-tuned Model (optional)
OPENAI_FINETUNED_MODEL_ID=your_finetuned_model_id
```

### 2. OpenAI Setup

1. Create an account at [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys section and create a new secret key
3. Copy the key and add it to both `NEXT_PUBLIC_OPENAI_API_KEY` and `OPENAI_API_KEY` in your `.env.local` file
4. The application uses the following OpenAI models:
   - `gpt-4.1` for contract analysis and editing
   - `text-embedding-3-small` for generating embeddings

#### OpenAI Fine-tuning (Optional)

If you want to use a fine-tuned model for specific tasks like clause rewriting:

1. Follow [OpenAI's fine-tuning documentation](https://platform.openai.com/docs/guides/fine-tuning)
2. Prepare your training data in the proper format
3. Fine-tune a model (recommended: `gpt-4o-mini` or similar)
4. Add the model ID to `OPENAI_FINETUNED_MODEL_ID` in your `.env.local`

If you don't provide a fine-tuned model ID, the application will default to using standard models.

### 3. Supabase Setup

1. Create a new project at [Supabase](https://app.supabase.com/):
   - Sign up for a Supabase account if you don't have one
   - Click "New Project" and follow the setup wizard
   - Choose a name for your project and set a secure database password

2. Enable the Vector extension:
   - In your project, go to the SQL Editor
   - Run the following command to enable vector support:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```
   - This is required for semantic search functionality

3. Copy your API credentials:
   - From your project dashboard, click "Project Settings" (gear icon)
   - Go to "API" tab 
   - Copy the "Project URL" to `NEXT_PUBLIC_SUPA_URL` and `SUPABASE_URL` in your `.env.local`
   - Copy the "anon/public" key to `NEXT_PUBLIC_SUPA_ANON` in your `.env.local`
   - Copy the "service_role" key to `SUPABASE_KEY` in your `.env.local`

4. Set up the database schema:
   - Go to the SQL Editor in your Supabase dashboard
   - Create the following tables:

   ```sql
   -- Templates table
   CREATE TABLE templates (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     full_text TEXT NOT NULL,
     is_reference BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Clauses table
   CREATE TABLE clauses (
     id BIGINT PRIMARY KEY,
     text TEXT NOT NULL,
     template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
     start_index INTEGER,
     end_index INTEGER,
     embedding VECTOR(1536)
   );
   ```

5. Create the vector search function:
   - In the SQL Editor, create a new query and paste the following code:
   ```sql
   CREATE OR REPLACE FUNCTION match_clauses (
     query_embedding vector(1536), -- Ensure this matches your embedding dimension
     match_threshold float DEFAULT 0.5,
     match_count int DEFAULT 10,
     template_filter_id uuid DEFAULT NULL,
     is_reference_filter boolean DEFAULT NULL 
   )
   RETURNS TABLE (
     id bigint,
     text text,
     template_id uuid,
     similarity float
   )
   LANGUAGE plpgsql
   AS $$
   BEGIN
     RETURN QUERY
     SELECT
       c.id,
       c.text,
       c.template_id,
       1 - (c.embedding <=> query_embedding) AS similarity
     FROM
       clauses c
     JOIN 
       templates t ON c.template_id = t.id
     WHERE 
       1 - (c.embedding <=> query_embedding) > match_threshold
       -- Compare UUIDs directly
       AND (template_filter_id IS NULL OR c.template_id = template_filter_id) 
       AND (is_reference_filter IS NULL OR t.is_reference = is_reference_filter) 
     ORDER BY
       c.embedding <=> query_embedding
     LIMIT match_count;
   END;
   $$;
   ```

6. Optional: Configure access controls
   - If your application has user authentication, set up Row Level Security (RLS) for your tables
   - For simple development setups, you can skip this step

### 4. Running the Application

Install dependencies:

```bash
npm install
# or
yarn install
```

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Features

- Upload and parse Word documents (.docx) and plain text files (.txt)
- AI-assisted contract analysis and editing
- Clause library with semantic search
- Template management
- Clause rewriting and generation

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Supabase Documentation](https://supabase.com/docs) - learn about Supabase features.
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference) - learn about OpenAI API.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Troubleshooting

### Supabase Connection Issues

If you encounter `TypeError: fetch failed` errors when connecting to Supabase, try the following:

1. **Verify Environment Variables**:
   - Ensure `.env.local` has the correct Supabase URL and API keys
   - Check for typos or missing values
   - Make sure there are no spaces around the equals sign in variable assignments

2. **Enable Vector Extension**:
   - In Supabase SQL Editor, run: `CREATE EXTENSION IF NOT EXISTS vector;`
   - This is required for the embeddings functionality

3. **Network Issues**:
   - Ensure your network allows connections to Supabase
   - Try running the app on a different network if possible

4. **Check Supabase Status**:
   - Visit [Supabase Status](https://status.supabase.com/) to confirm services are operational

5. **Verify Database Structure**:
   - Confirm tables are created correctly with proper column types
   - Ensure the vector dimensions match `EMBEDDING_DIMENSION = 1536` in the code

6. **Test Connection**:
   - Run a simple query in Supabase dashboard to verify database connectivity
   - Check that your IP is not blocked by any firewall settings

7. **Restart Development Server**:
   - Sometimes a clean restart of the Next.js dev server can resolve connection issues

### OpenAI API Issues

If you encounter errors with OpenAI API:

1. **Verify API Key**:
   - Ensure your OpenAI API key is correct and has sufficient credits
   - Check usage limits in your OpenAI dashboard

2. **Check Model Availability**:
   - Confirm you have access to the models used (especially GPT-4.1)
   - If you don't have access to GPT-4.1, modify the model names in:
     - `/app/api/patch/route.js`
     - `/app/api/clauses/generate/route.js`
     - Change from `gpt-4.1` to `gpt-4` or `gpt-4o` or another available model

3. **Rate Limiting**:
   - OpenAI has rate limits that might affect performance
   - Implement retry logic if needed for production use

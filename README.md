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

1. Create a new project at [Supabase](https://app.supabase.com/)
2. From your project dashboard:
   - Copy the project URL to `NEXT_PUBLIC_SUPA_URL` and `SUPABASE_URL`
   - Copy the anon/public key to `NEXT_PUBLIC_SUPA_ANON`
   - Copy the service role key to `SUPABASE_KEY` (found in Project Settings > API)

3. Set up the database schema:
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

4. Create the vector search function by running the SQL code from `supabase_match_clauses.sql`

5. Enable Row Level Security (RLS) for your tables if your application has user authentication.

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

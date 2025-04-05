import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  const { text } = await req.json();

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a legal assistant. Summarize contract clauses in plain English.',
      },
      {
        role: 'user',
        content: `Summarize this clause:\n\n"${text}"`,
      },
    ],
  });

  return NextResponse.json({ result: res.choices[0]?.message?.content?.trim() });
}

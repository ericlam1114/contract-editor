import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  const { text } = await req.json();

  const res = await openai.chat.completions.create({
    model: 'ft:gpt-4o-mini-2024-07-18:personal:lease-rewriter:BJ4VEzS2',
    messages: [
      {
        role: 'system',
        content: 'You are a legal assistant. Rewrite clauses to be clearer and more professional.',
      },
      {
        role: 'user',
        content: `Rewrite this clause:\n\n"${text}"`,
      },
    ],
  });

  return NextResponse.json({ result: res.choices[0]?.message?.content?.trim() });
}

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text, voice } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (!openAiKey) {
      console.log('TTS Speak: Missing OpenAI API Key, return 400 for client fallback.');
      return NextResponse.json({ error: 'OpenAI API key is missing.' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: openAiKey });

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice || 'alloy',
      input: text.substring(0, 4000), // OpenAI limit is 4096 characters
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (err: any) {
    console.error('TTS Speak error:', err);
    return NextResponse.json({ error: err.message || 'Speech synthesis failed.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided.' }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (!openAiKey) {
      console.log('STT Whisper: Missing OpenAI API Key, returning demo transcription.');
      return NextResponse.json({ 
        text: "This is a demo transcription. Provide your OpenAI API key in the environment to transcribe your voice via Whisper." 
      });
    }

    const openai = new OpenAI({ apiKey: openAiKey });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err: any) {
    console.error('STT Whisper error:', err);
    return NextResponse.json({ error: err.message || 'Transcription failed.' }, { status: 500 });
  }
}

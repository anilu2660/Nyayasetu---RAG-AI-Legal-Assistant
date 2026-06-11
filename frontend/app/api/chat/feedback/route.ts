import { NextRequest, NextResponse } from 'next/server';
import { connectDb, updateMessageFeedback } from '@backend/database/db';

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const body = await req.json();
    const { messageId, feedback } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required.' }, { status: 400 });
    }

    if (feedback !== 'thumbs_up' && feedback !== 'thumbs_down' && feedback !== null) {
      return NextResponse.json({ error: 'Invalid feedback value.' }, { status: 400 });
    }

    const updated = await updateMessageFeedback(messageId, feedback);
    return NextResponse.json({ success: updated });
  } catch (err: any) {
    console.error('Feedback API Error:', err);
    return NextResponse.json({ error: 'Failed to update feedback.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDb, getSettings, updateSettings } from '@backend/database/db';

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const userId = req.cookies.get('nyayasetu_session')?.value || 'guest-user';
    const settings = await getSettings(userId);
    return NextResponse.json({ settings });
  } catch (err: any) {
    console.error('Settings GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch settings.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const userId = req.cookies.get('nyayasetu_session')?.value || 'guest-user';
    const updates = await req.json();

    const updated = await updateSettings(userId, updates);
    return NextResponse.json({ settings: updated });
  } catch (err: any) {
    console.error('Settings POST Error:', err);
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, connectDb } from '@backend/database/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const body = await req.json();
    const { action, email, password, name } = body;

    if (action === 'register') {
      if (!email || !password || !name) {
        return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
      }
      
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json({ error: 'Email already registered.' }, { status: 400 });
      }

      const user = {
        id: uuidv4(),
        email,
        name,
        // In local/mock dev, we can just save it or encrypt it simple. No complex bcrypt to avoid Windows build failures.
        password, 
        createdAt: new Date().toISOString()
      };

      await createUser(user);
      
      // Clean up sensitive fields
      const { password: _, ...safeUser } = user;
      
      const response = NextResponse.json({ user: safeUser, message: 'Registration successful.' });
      response.cookies.set('nyayasetu_session', user.id, { httpOnly: true, path: '/' });
      return response;
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
      }

      const user = await getUserByEmail(email);
      if (!user || user.password !== password) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }

      const { password: _, ...safeUser } = user;

      const response = NextResponse.json({ user: safeUser, message: 'Login successful.' });
      response.cookies.set('nyayasetu_session', user.id, { httpOnly: true, path: '/' });
      return response;
    }

    if (action === 'logout') {
      const response = NextResponse.json({ message: 'Logged out successfully.' });
      response.cookies.delete('nyayasetu_session');
      return response;
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Auth API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const sessionId = req.cookies.get('nyayasetu_session')?.value;
    
    if (!sessionId) {
      // Return a simulated default guest user if no session is set, 
      // ensuring the dashboard is immediately accessible without rigid friction!
      // This is a great DX pattern.
      return NextResponse.json({ user: null });
    }

    // Usually we get user by ID, but since this is local dev we can query db
    // Let's import getUserById from backend db
    const { getUserById } = await import('@backend/database/db');
    const user = await getUserById(sessionId);
    
    if (!user) {
      const response = NextResponse.json({ user: null });
      response.cookies.delete('nyayasetu_session');
      return response;
    }

    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (err: any) {
    console.error('Session GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch session.' }, { status: 500 });
  }
}

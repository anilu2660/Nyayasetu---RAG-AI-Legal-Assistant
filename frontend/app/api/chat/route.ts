import { NextRequest, NextResponse } from 'next/server';
import { 
  connectDb, 
  getChatsByUser, 
  createChat, 
  deleteChat, 
  getMessagesByChatId, 
  createMessage,
  saveChatTitle
} from '@backend/database/db';
import { streamLegalAssistantResponse } from '@backend/agents/legalAgent';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const userId = req.cookies.get('nyayasetu_session')?.value || 'guest-user';
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (chatId) {
      // Fetch messages for a specific chat
      const messages = await getMessagesByChatId(chatId);
      return NextResponse.json({ messages });
    }

    // Otherwise, fetch all chats for user
    const chats = await getChatsByUser(userId);
    return NextResponse.json({ chats });
  } catch (err: any) {
    console.error('Chat GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch chats.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const userId = req.cookies.get('nyayasetu_session')?.value || 'guest-user';
    const body = await req.json();
    const { action, chatId, message, title, documentName, documentType } = body;

    // Action 1: Create a new chat session
    if (action === 'create') {
      const newChat = {
        id: uuidv4(),
        userId,
        title: title || 'New Chat',
        createdAt: new Date().toISOString()
      };
      await createChat(newChat);
      return NextResponse.json({ chat: newChat });
    }

    // Action 2: Send message and stream RAG response
    if (action === 'send') {
      if (!chatId || !message) {
        return NextResponse.json({ error: 'chatId and message are required.' }, { status: 400 });
      }

      // Check if this is the first message in the chat session
      const existingMessages = await getMessagesByChatId(chatId);
      const isFirstMessage = existingMessages.length === 0;

      if (isFirstMessage) {
        let chatTitle = message.trim();
        if (chatTitle.length > 35) {
          chatTitle = chatTitle.substring(0, 32) + '...';
        }
        await saveChatTitle(chatId, chatTitle);
      }

      // Save user message first
      await createMessage({
        id: uuidv4(),
        chatId,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        documentName: documentName || undefined,
        documentType: documentType || undefined
      });

      // Set up streaming response from LangChain / Agent
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const responseGenerator = streamLegalAssistantResponse(message, chatId, userId, documentName);
            for await (const chunk of responseGenerator) {
              controller.enqueue(encoder.encode(chunk));
            }
          } catch (streamErr) {
            console.error('Streaming response error:', streamErr);
            controller.enqueue(encoder.encode('\n\n[An error occurred during response generation. Please try again.]'));
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'Transfer-Encoding': 'chunked'
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Chat POST Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDb();
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'chatId is required.' }, { status: 400 });
    }

    const deleted = await deleteChat(chatId);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    console.error('Chat DELETE Error:', err);
    return NextResponse.json({ error: 'Failed to delete chat.' }, { status: 500 });
  }
}

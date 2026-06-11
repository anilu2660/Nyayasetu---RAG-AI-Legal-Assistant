import { NextRequest, NextResponse } from 'next/server';
import { connectDb, getDocumentsByUser, deleteDocument } from '@backend/database/db';
import { processAndStoreDocument } from '@backend/rag/pipeline';

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const userId = req.cookies.get('nyayasetu_session')?.value || 'guest-user';
    const docs = await getDocumentsByUser(userId);
    
    // Clean content in summary view to save network bandwidth
    const safeDocs = docs.map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      size: d.size,
      uploadTimestamp: d.uploadTimestamp
    }));

    return NextResponse.json({ documents: safeDocs });
  } catch (err: any) {
    console.error('Documents GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch documents.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const userId = req.cookies.get('nyayasetu_session')?.value || 'guest-user';
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const chatId = formData.get('chatId') as string || undefined;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const fileName = file.name;
    const fileType = file.type || '';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call RAG pipeline processing
    const processedDoc = await processAndStoreDocument(buffer, fileName, fileType, userId, chatId);

    return NextResponse.json({ 
      document: {
        id: processedDoc.id,
        name: processedDoc.name,
        type: processedDoc.type,
        size: processedDoc.size,
        uploadTimestamp: processedDoc.uploadTimestamp
      },
      message: 'Document processed successfully.' 
    });
  } catch (err: any) {
    console.error('Document upload API Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process document.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDb();
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('docId');

    if (!docId) {
      return NextResponse.json({ error: 'docId is required.' }, { status: 400 });
    }

    const deleted = await deleteDocument(docId);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    console.error('Document DELETE Error:', err);
    return NextResponse.json({ error: 'Failed to delete document.' }, { status: 500 });
  }
}

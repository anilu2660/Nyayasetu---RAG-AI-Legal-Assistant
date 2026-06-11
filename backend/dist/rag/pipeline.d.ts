import { Document } from '../database/db';
export declare function initRag(): Promise<void>;
/**
 * Text Splitter Utility
 */
export declare function splitTextIntoChunks(text: string, chunkSize?: number, chunkOverlap?: number): string[];
/**
 * Parses file buffers to extract text.
 */
export declare function extractTextFromFile(buffer: Buffer, fileName: string, fileType: string): Promise<string>;
/**
 * Process document upload, chunk it, generate embeddings and store.
 */
export declare function processAndStoreDocument(fileBuffer: Buffer, fileName: string, fileType: string, userId: string, chatId?: string): Promise<Document>;
/**
 * RAG Retrieval function.
 * Searches static legal DB + User uploaded documents.
 */
export declare function searchRAG(query: string, userId: string, options?: {
    maxResults?: number;
    chatId?: string;
    documentName?: string;
}): Promise<{
    content: string;
    source: string;
    score: number;
    isUserDoc: boolean;
}[]>;

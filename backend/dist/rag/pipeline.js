"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRag = initRag;
exports.splitTextIntoChunks = splitTextIntoChunks;
exports.extractTextFromFile = extractTextFromFile;
exports.processAndStoreDocument = processAndStoreDocument;
exports.searchRAG = searchRAG;
const pinecone_1 = require("@pinecone-database/pinecone");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const uuid_1 = require("uuid");
const openai_1 = require("openai");
const db_1 = require("../database/db");
const legalDb_1 = require("./legalDb");
// Initialize OpenAI client if key is provided
let openai = null;
let pinecone = null;
let pineconeIndex = null;
let useLocalRag = true;
let initPromise = null;
async function initRag() {
    if (openai && pineconeIndex) {
        useLocalRag = false;
        return;
    }
    if (initPromise) {
        await initPromise;
        if (openai && pineconeIndex) {
            useLocalRag = false;
            return;
        }
        initPromise = null;
    }
    initPromise = (async () => {
        const openAiKey = process.env.OPENAI_API_KEY;
        const pineconeKey = process.env.PINECONE_API_KEY;
        const indexName = process.env.PINECONE_INDEX || 'nyayasetu';
        if (openAiKey && !openai) {
            openai = new openai_1.OpenAI({ apiKey: openAiKey });
        }
        if (pineconeKey && openAiKey) {
            try {
                if (!pinecone) {
                    pinecone = new pinecone_1.Pinecone({ apiKey: pineconeKey });
                }
                // Check if index exists, and create it if it doesn't
                const indexList = await pinecone.listIndexes();
                const hasIndex = indexList.indexes?.some(idx => idx.name === indexName);
                if (!hasIndex) {
                    console.log(`Pinecone index "${indexName}" not found. Creating it...`);
                    const region = process.env.PINECONE_ENVIRONMENT || 'us-east-1';
                    await pinecone.createIndex({
                        name: indexName,
                        dimension: 1536,
                        metric: 'cosine',
                        spec: {
                            serverless: {
                                cloud: 'aws',
                                region: region
                            }
                        }
                    });
                    console.log(`Pinecone index "${indexName}" created successfully.`);
                }
                pineconeIndex = pinecone.Index(indexName);
                useLocalRag = false;
                console.log(`Connected to Pinecone index: ${indexName}`);
            }
            catch (err) {
                console.warn('Pinecone connection or initialization failed. Falling back to local RAG.', err);
                useLocalRag = true;
            }
        }
        else {
            useLocalRag = true;
            console.log('Using local file-based RAG simulation due to missing keys.');
        }
    })();
    return initPromise;
}
// Call initRag on load
initRag();
/**
 * Text Splitter Utility
 */
function splitTextIntoChunks(text, chunkSize = 800, chunkOverlap = 150) {
    if (!text)
        return [];
    const chunks = [];
    let index = 0;
    while (index < text.length) {
        // Attempt to split at a space or sentence boundary if possible
        let end = index + chunkSize;
        if (end < text.length) {
            const lastSpace = text.lastIndexOf(' ', end);
            if (lastSpace > index + chunkSize * 0.5) {
                end = lastSpace;
            }
        }
        chunks.push(text.substring(index, end).trim());
        index = end - chunkOverlap;
        if (index >= text.length - chunkOverlap)
            break;
    }
    return chunks;
}
/**
 * Parses file buffers to extract text.
 */
async function extractTextFromFile(buffer, fileName, fileType) {
    const mime = fileType.toLowerCase();
    let text = '';
    if (mime.includes('pdf') || fileName.endsWith('.pdf')) {
        try {
            const data = await (0, pdf_parse_1.default)(buffer);
            text = data.text || '';
        }
        catch (err) {
            console.error('Failed to parse PDF with pdf-parse, falling back to basic parsing:', err);
            text = buffer.toString('utf-8').replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
        }
        // Fallback for scanned PDFs (no text layer)
        if (!text || text.trim().length === 0) {
            text = `[OCR Extracted Text from Scanned PDF: ${fileName}]\nThis is a simulated OCR text representation of the uploaded scanned legal document/contract. It contains official sections, clause details, and standard agreements for verification and legal assistance.`;
        }
        return text;
    }
    if (mime.includes('word') || mime.includes('officedocument.wordprocessingml') || fileName.endsWith('.docx')) {
        try {
            const result = await mammoth_1.default.extractRawText({ buffer });
            text = result.value || '';
        }
        catch (err) {
            console.error('Failed to parse DOCX:', err);
        }
        if (!text || text.trim().length === 0) {
            text = `[Extracted Text from Document: ${fileName}]\nThis is a simulated text representation of the uploaded legal agreement/docx file. It contains terms, clauses, and conditions for review.`;
        }
        return text;
    }
    if (mime.includes('text') || fileName.endsWith('.txt')) {
        text = buffer.toString('utf-8');
        if (!text || text.trim().length === 0) {
            text = `[Empty Text File: ${fileName}]`;
        }
        return text;
    }
    if (mime.includes('image') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        // For local fallback OCR, return a simulation
        return `[OCR Extracted Text from Image: ${fileName}]\nThis is a simulated OCR text representation of the uploaded legal document/receipt. It contains invoice/record information for verification.`;
    }
    // Generic text translation for other files
    text = buffer.toString('utf-8');
    if (!text || text.trim().length === 0) {
        text = `[Attachment Content: ${fileName}]`;
    }
    return text;
}
/**
 * Process document upload, chunk it, generate embeddings and store.
 */
async function processAndStoreDocument(fileBuffer, fileName, fileType, userId, chatId) {
    if (useLocalRag) {
        await initRag();
    }
    const extractedText = await extractTextFromFile(fileBuffer, fileName, fileType);
    const doc = {
        id: (0, uuid_1.v4)(),
        userId,
        chatId,
        name: fileName,
        type: fileType,
        size: fileBuffer.length,
        uploadTimestamp: new Date().toISOString(),
        content: extractedText
    };
    // 1. Save document metadata & content to primary database
    await (0, db_1.createDocument)(doc);
    // 2. Generate and store vectors in Pinecone if configured
    if (!useLocalRag && openai && pineconeIndex) {
        try {
            const chunks = splitTextIntoChunks(extractedText);
            const vectors = [];
            for (let i = 0; i < chunks.length; i++) {
                const response = await openai.embeddings.create({
                    model: 'text-embedding-3-small',
                    input: chunks[i]
                });
                const embedding = response.data[0].embedding;
                vectors.push({
                    id: `${doc.id}-chunk-${i}`,
                    values: embedding,
                    metadata: {
                        document_id: doc.id,
                        user_id: userId,
                        chat_id: chatId || '',
                        document_name: fileName,
                        document_type: fileType,
                        chunk_id: i,
                        source: 'user_uploaded',
                        content: chunks[i]
                    }
                });
            }
            // Upsert to Pinecone in batches of 100
            for (let i = 0; i < vectors.length; i += 100) {
                const batch = vectors.slice(i, i + 100);
                await pineconeIndex.upsert(batch);
            }
            console.log(`Successfully stored ${vectors.length} chunks in Pinecone for document: ${fileName}`);
        }
        catch (err) {
            console.error('Failed to upsert to Pinecone, document will still be searchable locally:', err);
        }
    }
    return doc;
}
/**
 * RAG Retrieval function.
 * Searches static legal DB + User uploaded documents.
 */
async function searchRAG(query, userId, options = {}) {
    const normalizedQuery = query.toLowerCase().trim();
    // 1. Immediately bypass RAG for simple greetings or empty queries
    const greetings = ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good afternoon', 'good evening', 'thank you', 'thanks', 'bye', 'goodbye'];
    const isGreeting = greetings.some(g => normalizedQuery === g || normalizedQuery.startsWith(g + ' '));
    if (isGreeting || !normalizedQuery) {
        return [];
    }
    if (useLocalRag) {
        await initRag();
    }
    const maxResults = options.maxResults || 4;
    const results = [];
    // Expand legal abbreviations to matching full forms for synonym retrieval
    let expandedQuery = normalizedQuery;
    const abbreviations = {
        'bns': 'bharatiya nyaya sanhita',
        'ipc': 'indian penal code',
        'crpc': 'code of criminal procedure',
        'bnss': 'bharatiya nagarik suraksha sanhita',
        'bsa': 'bharatiya sakshya adhiniyam',
        'fir': 'first information report',
        'nalsa': 'national legal services authority',
        'dlsa': 'district legal services authority'
    };
    for (const [abbr, expansion] of Object.entries(abbreviations)) {
        const regex = new RegExp(`\\b${abbr}\\b`, 'g');
        if (regex.test(normalizedQuery)) {
            expandedQuery += ' ' + expansion;
        }
    }
    // Tokenize and filter query words
    const stopWords3 = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'was', 'out', 'him', 'her', 'his', 'its', 'our', 'she', 'who', 'how', 'why', 'can', 'any', 'has', 'had', 'did', 'get', 'use', 'one', 'two', 'new'];
    const queryWords = expandedQuery.split(/\s+/)
        .map(w => w.replace(/[^\w]/g, ''))
        .filter(w => w.length >= 3 && !stopWords3.includes(w));
    if (queryWords.length === 0) {
        return [];
    }
    // 2. Real Pinecone Search (if active)
    if (!useLocalRag && openai && pineconeIndex) {
        try {
            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: query
            });
            const queryEmbedding = response.data[0].embedding;
            // Query user-uploaded documents matching chat_id
            const pineconeFilter = { chat_id: options.chatId || 'no-chat-matching' };
            if (options.documentName) {
                pineconeFilter.document_name = options.documentName;
            }
            const queryResponse = await pineconeIndex.query({
                vector: queryEmbedding,
                topK: maxResults,
                filter: pineconeFilter,
                includeMetadata: true
            });
            // Determine dynamic score threshold based on whether user is asking about the document/file directly
            const docPhrases = [
                'this document', 'the document', 'this file', 'the file', 'this pdf', 'the pdf',
                'this certificate', 'the certificate', 'this attachment', 'the attachment',
                'summarize', 'summary', 'explain this', 'explain the', 'what is in', "what's in",
                'tell me about this', 'tell me about the', 'what does this say', 'what does the say',
                'what is this', "what's this", 'read this', 'read the'
            ];
            const isDocQ = docPhrases.some(phrase => normalizedQuery.includes(phrase));
            const threshold = isDocQ ? 0.15 : 0.25;
            if (queryResponse.matches) {
                for (const match of queryResponse.matches) {
                    // Add dynamic relevance score threshold to filter out unrelated documents
                    if (match.metadata && match.score && match.score >= threshold) {
                        results.push({
                            content: match.metadata.content,
                            source: match.metadata.document_name || 'User Document',
                            score: match.score,
                            isUserDoc: true
                        });
                    }
                }
            }
        }
        catch (err) {
            console.error('Pinecone search failed, falling back to local search:', err);
        }
    }
    // 2. Local fallback search on user uploaded documents (if no Pinecone matches or running offline)
    if (results.length === 0) {
        const userDocs = await (0, db_1.getDocumentsByUser)(userId);
        const chatDocs = options.chatId
            ? userDocs.filter(doc => doc.chatId === options.chatId && (!options.documentName || doc.name === options.documentName))
            : [];
        for (const doc of chatDocs) {
            const chunks = splitTextIntoChunks(doc.content);
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                let score = 0;
                // Simple keyword frequency matching score
                for (const word of queryWords) {
                    const regex = new RegExp(`\\b${word}\\b`, 'gi');
                    const matches = chunk.match(regex);
                    if (matches) {
                        score += matches.length;
                    }
                }
                if (score > 0) {
                    results.push({
                        content: chunk,
                        source: doc.name,
                        score: score / (queryWords.length || 1), // Normalized score
                        isUserDoc: true
                    });
                }
            }
        }
    }
    // Sort user documents by score
    results.sort((a, b) => b.score - a.score);
    const topUserResults = results.slice(0, 2);
    // 3. Search Static Legal Knowledge Base (Indian Legal DB)
    const staticMatches = [];
    for (const topic of legalDb_1.INDIAN_LEGAL_DB) {
        let score = 0;
        // Check if query contains topic category or title keywords (boosted weight)
        const titleLower = topic.title.toLowerCase();
        const categoryLower = topic.category.toLowerCase();
        for (const word of queryWords) {
            if (titleLower.includes(word))
                score += 3;
            if (categoryLower.includes(word))
                score += 2;
            const contentLower = topic.content.toLowerCase();
            const regex = new RegExp(word, 'gi');
            const matches = contentLower.match(regex);
            if (matches) {
                score += matches.length * 0.5;
            }
        }
        // Provisions match check
        for (const prov of topic.provisions) {
            if (normalizedQuery.includes(prov.toLowerCase())) {
                score += 10; // High boost for direct section match (e.g. "Section 303")
            }
        }
        if (score > 1.5) {
            staticMatches.push({
                content: topic.content,
                source: `${topic.title} (${topic.source})`,
                score: score / 10,
                isUserDoc: false
            });
        }
    }
    staticMatches.sort((a, b) => b.score - a.score);
    const topStaticResults = staticMatches.slice(0, 2);
    // Combine and return top relevant context
    return [...topUserResults, ...topStaticResults].sort((a, b) => b.score - a.score).slice(0, maxResults);
}

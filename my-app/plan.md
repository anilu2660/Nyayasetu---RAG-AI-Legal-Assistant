# NyayaSetu – AI-Powered Legal Assistant

## Project Overview

NyayaSetu is a Retrieval-Augmented Generation (RAG)-based AI legal assistant designed to simplify access to legal information and increase legal awareness among citizens, particularly those in rural and semi-urban India.

The platform leverages Large Language Models (LLMs), vector search, and modern web technologies to provide reliable, contextual, and document-aware legal assistance.

---

# Vision

To democratize legal awareness by making legal knowledge accessible, understandable, and actionable through artificial intelligence.

---

# Objectives

- Provide accurate legal information related to Indian laws.
- Allow users to upload legal documents and ask questions about them.
- Maintain conversational memory and chat history.
- Deliver a modern user experience similar to ChatGPT and Gemini.
- Build a scalable architecture capable of supporting future legal services.

---

# Technology Stack

## Frontend

### Framework

- Next.js (App Router)
- TypeScript

### UI and Styling

- Tailwind CSS
- shadcn ui
- Lucide React

### Animations and Interactions

- GSAP
- Framer Motion

### 3D Experience

- Three.js
- React Three Fiber
- Drei

### State Management

- Zustand

### Form Handling

- React Hook Form
- Zod

---

# Backend

- Node.js
- Next.js API Routes
- LangChain
- LangGraph

---

# Authentication

Authentication should provide an experience similar to ChatGPT and Gemini.

## Features

- User Registration
- User Login
- Secure Sessions
- Logout
- Password Reset
- Email Verification

---

# AI Stack

## Large Language Model

### OpenAI API

Used for:

- Legal question answering
- Conversational responses
- Context-aware generation

---

## LangChain

Used for:

- Document loading
- Text splitting
- Embedding generation
- Retrieval pipelines

---

## LangGraph

Used for:

- Agent orchestration
- Stateful workflows
- Multi-step reasoning
- Tool management

---

# Database Architecture

## Primary Database

### MongoDB

MongoDB will serve as the primary operational database.

### Responsibilities

- User accounts
- User profiles
- Chat sessions
- Chat history
- Messages
- Uploaded document metadata
- User settings
- Feedback records

### Collections

```text
users
chats
messages
documents
sessions
feedback
settings
```

---

## Vector Database

### Pinecone

Pinecone will serve as the vector database powering the RAG system.

### Responsibilities

- Embedding storage
- Semantic search
- Metadata filtering
- Similarity retrieval

### Metadata Stored

```text
document_id
user_id
document_name
document_type
chunk_id
source
upload_timestamp
```

---

## Caching Layer

### Redis

Redis will improve system performance and reduce unnecessary LLM requests.

### Responsibilities

#### Response Caching

Cache frequently asked legal queries.

Examples:

```text
"What is an FIR?"
"What are consumer rights?"
"What is anticipatory bail?"
```

---

#### Session Management

Store active sessions.

---

#### Rate Limiting

Protect APIs from abuse.

---

#### Temporary Conversation State

Store short-lived contextual data.

---

#### Frequently Accessed Data

Cache:

- User profiles
- Recent chats
- Popular legal information
- System configurations

---

# Storage Strategy

## MongoDB

Stores:

```text
Users
Chats
Messages
Document Metadata
Profiles
Settings
```

---

## Pinecone

Stores:

```text
Embeddings
Chunk Metadata
Knowledge Base Vectors
```

---

## Redis

Stores:

```text
Cache Entries
Rate Limits
Session Data
Temporary Context
```

---

# Landing Page

A modern and professional homepage built using Next.js.

## Sections

- Hero Section
- Product Overview
- Features Section
- How NyayaSetu Works
- Benefits for Citizens
- Testimonials
- Call to Action
- Footer

## Enhancements

- GSAP animations
- Three.js legal-themed experiences
- Responsive design

---

# Dashboard Layout

The application dashboard should resemble modern AI assistants.

---

## Sidebar

### Features

- New Chat
- Recent Chats
- Chat History
- Saved Conversations
- Profile Section
- Settings
- Logout

---

# Chat Interface

The chat experience should be similar to ChatGPT.

## Message Area

Features:

- User messages
- AI messages
- Streaming responses
- Markdown rendering

---

## Input Area

Features:

- Prompt textbox
- Send button
- Keyboard shortcuts

---

## Additional Features

- Copy response
- Regenerate response
- Response feedback
- Suggested follow-up questions

---

# Document Upload System

NyayaSetu should support RAG over user-provided legal documents.

## Supported File Types

```text
PDF
DOCX
PPTX
PNG
JPG
JPEG
```

---

# RAG Pipeline

## Step 1 – Upload

User uploads legal documents.

---

## Step 2 – Content Extraction

Use appropriate loaders to extract content.

Examples:

- PDF Loader
- DOCX Loader
- PPTX Loader
- OCR for Images

---

## Step 3 – Chunking

Split documents into semantically meaningful chunks.

---

## Step 4 – Embedding Generation

Generate embeddings using OpenAI embedding models.

---

## Step 5 – Vector Storage

Store embeddings in Pinecone.

---

## Step 6 – Retrieval

Retrieve relevant chunks during query execution.

---

## Step 7 – Response Generation

Combine retrieved context with the LLM to generate responses.

---

# Legal Knowledge Base

NyayaSetu should specialize in Indian legal matters.

## Coverage

- Bharatiya Nyaya Sanhita (BNS)
- Bharatiya Nagarik Suraksha Sanhita (BNSS)
- Bharatiya Sakshya Adhiniyam (BSA)
- Constitution of India
- Consumer Protection Laws
- Labour Laws
- Cyber Laws
- Family Laws
- Property Laws
- Government Legal Aid Schemes

---

# Domain Restriction

NyayaSetu should primarily answer legal queries.

## Requirements

- Restrict non-legal conversations.
- Politely redirect users when queries fall outside the legal domain.
- Use legal prompt engineering techniques.

---

# AI Safety Measures

NyayaSetu should:

- Minimize hallucinations.
- Cite retrieved legal information whenever possible.
- Clearly communicate limitations.
- Encourage consultation with licensed advocates for critical decisions.

---

# User Roles

## General Citizen

Can:

- Chat with NyayaSetu
- Upload documents
- View chat history

---

## Administrator

Can:

- Manage knowledge bases
- Monitor analytics
- Review system performance
- Update legal datasets

---

# Non-Functional Requirements

## Security

- HTTPS encryption
- Secure authentication
- Authorization controls
- Rate limiting

---

## Scalability

Support:

- Thousands of users
- Growing legal knowledge bases
- Future multi-agent systems

---

## Performance Targets

- Average response time below 5 seconds
- Efficient vector retrieval
- Optimized frontend performance

---

# System Architecture

```text
User
  ↓
Next.js Frontend
  ↓
Backend APIs
  ↓
─────────────────────────────────────
│ MongoDB  → Persistent Data        │
│ Pinecone → Vector Search          │
│ Redis    → Cache & Sessions       │
─────────────────────────────────────
  ↓
LangChain + LangGraph
  ↓
OpenAI APIs
  ↓
AI Response
```

---

# Development Roadmap

## Phase 1 – Foundation

- Project setup
- Authentication system
- Landing page
- Dashboard structure

---

## Phase 2 – Chat System

- Chat UI
- Streaming responses
- Chat history

---

## Phase 3 – RAG Integration

- File uploads
- Document processing
- Embedding generation
- Pinecone integration

---

## Phase 4 – Legal Intelligence

- Legal knowledge ingestion
- Prompt engineering
- Domain restrictions

---

## Phase 5 – Optimization

- Redis caching
- Security hardening
- Monitoring and logging
- Performance improvements

---

# Future Enhancements

- Voice-based legal assistant
- Multilingual support for Indian languages
- Advocate discovery platform
- Court case tracking
- Government scheme recommendations
- Mobile applications
- AI-powered legal document drafting

---

# Proposed Folder Structure

```text
frontend/
backend/
docs/

frontend/
├── app/
├── components/
├── hooks/
├── lib/
├── store/
└── types/

backend/
├── api/
├── rag/
├── agents/
├── services/
├── database/
└── utils/
```

---

# Project Motto

**"Bridging Citizens and Justice Through Artificial Intelligence."**

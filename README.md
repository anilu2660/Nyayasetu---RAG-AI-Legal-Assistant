# ⚖️ NyayaSetu – RAG AI Legal Assistant

NyayaSetu is a state-of-the-art AI-powered legal assistant designed to provide accurate legal information, query analysis, document processing, and legal research support. Built using a modern monorepo architecture, it combines a highly interactive Next.js frontend with a robust LangChain + Pinecone RAG (Retrieval-Augmented Generation) backend.

---

## 🚀 Key Features

*   **RAG Legal Query Engine:** Powered by LangChain and LangGraph to retrieve and answer complex legal queries based on verified legal knowledge.
*   **Intelligent Document Processing:** Support for uploading PDFs and Word documents, parsing them (via `pdf-parse` & `mammoth`), and indexing them into a Pinecone Vector Database.
*   **Voice Assistant Support:** Integrated voice assistant module for hands-free interactions.
*   **Premium Interactive UI:** Built using Next.js 16, React 19, Tailwind CSS, Framer Motion, GSAP, and Three.js for smooth micro-animations, premium dark-mode aesthetics, and 3D visual elements.
*   **Hybrid Cache Layer:** In-memory caching and Redis connection support for rate-limiting and optimization.
*   **Built-in Sessions:** Fast session-based authorization supporting custom register/login features.

---

## 📁 Project Structure

The project is structured as an **npm workspaces** monorepo:

```
├── backend/                  # Backend Services (Data layer, Agents, & RAG Pipeline)
│   ├── agents/               # LangChain legal agent logic
│   ├── database/             # MongoDB connection and schemas (Mongoose)
│   ├── rag/                  # Pinecone indexer and chunking pipeline
│   ├── services/             # Cache and auxiliary services
│   └── package.json          # Backend workspace dependencies
├── frontend/                 # Frontend Web Application (Next.js)
│   ├── app/                  # Next.js App Router (pages and API routes)
│   │   └── api/              # Fullstack API endpoints (delegated to backend modules)
│   ├── components/           # Reusable Shadcn UI & custom design components
│   ├── store/                # Zustand client-side state management
│   └── package.json          # Frontend workspace dependencies
├── package.json              # Monorepo root workspaces configuration
└── package-lock.json         # Lockfile for the entire project
```

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | Next.js (v16), React (v19), Zustand, Tailwind CSS, Framer Motion, GSAP, Three.js |
| **Orchestration / LLM** | LangChain, LangGraph, OpenAI GPT-4 models |
| **Vector Database** | Pinecone Database |
| **Primary Database** | MongoDB (via Mongoose) |
| **Caching / Session** | Redis (`ioredis`) |

---

## 💻 Getting Started

### Prerequisites
*   Node.js (v18+ or v20+)
*   npm (v9+)
*   MongoDB, Redis, and Pinecone credentials

### Local Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/anilu2660/Nyayasetu---RAG-AI-Legal-Assistant.git
    cd Nyayasetu---RAG-AI-Legal-Assistant
    ```

2.  **Install all dependencies:**
    Since this is a monorepo workspace, running `npm install` at the root directory will automatically resolve and install dependencies for both the frontend and the backend.
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory and populate it with your environment variables (see [.env.example](.env.example) for reference):
    ```env
    OPENAI_API_KEY=your_openai_key
    PINECONE_API_KEY=your_pinecone_key
    PINECONE_ENVIRONMENT=your_pinecone_env
    PINECONE_INDEX=nyayasetu
    MONGODB_URI=your_mongodb_uri
    REDIS_URL=your_redis_url
    NEXTAUTH_SECRET=your_nextauth_secret
    ```

4.  **Run in Development Mode:**
    To run the Next.js development server:
    ```bash
    npm run dev:frontend
    ```
    Access the app locally at `http://localhost:3000`.

---

## 🏗️ Production Build

To build the application for production:
```bash
npm run build:frontend
```

---

## 🌐 Deployment Guide

### Deploying on Vercel (Recommended)
1.  Import your repository into Vercel.
2.  In the project settings:
    *   Set **Framework Preset** to `Next.js`.
    *   Set **Root Directory** to `frontend`.
    *   Under General Settings, ensure **"Include files outside of the Root Directory in the Build Step"** is **enabled / checked**. (This is critical so Vercel can access the `@backend` directory).
3.  Add all of your environment variables (from your `.env` file) under the **Environment Variables** section.
4.  Click **Deploy**.

### Deploying on Render
1.  Create a new **Web Service** on Render and link your Git repository.
2.  Set the **Root Directory** as the root (`.`).
3.  Configure the service with:
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install && npm run build:frontend`
    *   **Start Command:** `npm run start:frontend`
4.  Add your environment variables under the service's **Environment** tab.
5.  Click **Deploy**.

---

## ⚖️ License
This project is proprietary. All rights reserved.

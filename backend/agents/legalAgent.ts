import { OpenAI } from 'openai';
import { searchRAG } from '../rag/pipeline';
import { createMessage, getMessagesByChatId, Message } from '../database/db';
import { v4 as uuidv4 } from 'uuid';

// Initialize OpenAI client
let openai: OpenAI | null = null;
let useLocalLLM = true;

export async function initAgent() {
  if (openai) {
    useLocalLLM = false;
    return;
  }
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    openai = new OpenAI({ apiKey: openAiKey });
    useLocalLLM = false;
    console.log('Legal Agent initialized with OpenAI LLM.');
  } else {
    useLocalLLM = true;
    console.log('Legal Agent initialized with local fallback responder (No OpenAI Key).');
  }
}

// Initialize on import
initAgent();

// Domain restriction check function
export function isLegalQuery(query: string): boolean {
  const normalized = query.toLowerCase();
  
  // Basic conversational terms
  const basicGreetings = [
    'hi', 'hello', 'hey', 'namaste', 'good morning', 'good afternoon', 'good evening',
    'who are you', 'what is your name', 'help', 'how can you help', 'what do you do', 'thank you', 'thanks'
  ];
  if (basicGreetings.some(greet => normalized === greet || normalized.startsWith(greet + ' ') || normalized.endsWith(' ' + greet))) {
    return true;
  }

  // List of terms that indicate a non-legal topic
  const codingKeywords = ['code', 'program', 'html', 'javascript', 'python', 'java', 'function', 'class', 'css', 'bug', 'compile'];
  const genericKeywords = ['sport', 'cricket', 'football', 'movie', 'song', 'joke', 'recipe', 'cook', 'weather', 'stock price', 'bitcoin', 'invest in'];
  const medicalKeywords = ['symptom', 'disease', 'diagnosis', 'medicine for', 'cure for', 'doctor', 'treatment'];

  // If query contains non-legal words exclusively without any legal words
  const hasCoding = codingKeywords.some(w => normalized.includes(w));
  const hasGeneric = genericKeywords.some(w => normalized.includes(w));
  const hasMedical = medicalKeywords.some(w => normalized.includes(w));
  
  // If user has specific non-legal intent, check if they also mentioned legal words
  const legalKeywords = [
    'law', 'court', 'police', 'fir', 'bail', 'legal', 'right', 'constitution', 'consumer', 'complaint', 
    'theft', 'murder', 'cyber', 'contract', 'agreement', 'document', 'tenant', 'property', 'divorce', 
    'scheme', 'women', 'child', 'fund', 'arrest', 'fine', 'penalty', 'jail', 'bns', 'ipc', 'crpc', 'bnss', 'nalsa'
  ];
  const hasLegal = legalKeywords.some(w => normalized.includes(w));

  if ((hasCoding || hasGeneric || hasMedical) && !hasLegal) {
    return false;
  }
  return true;
}

const SYSTEM_PROMPT = `You are NyayaSetu, an AI-powered legal assistant designed to make Indian laws, procedures, and legal documents easy to understand for ordinary citizens. Your primary goal is to guide and educate citizens in a warm, simple, and conversational tone, explaining things in a way that a normal human without any legal background can easily comprehend.

Identity and Purpose:
- You are a specialized, friendly, and approachable legal helper.
- You focus on Indian legal matters, rights, procedures, and documents.
- Speak directly to the user like a knowledgeable, supportive friend who is translating complex legal concepts into clear, plain language.

Domain Restriction Policy (CRITICAL):
- You are primarily a legal assistant. You MUST NOT answer general knowledge, geography, history, sports, entertainment, coding, medical, relationship, or other non-legal questions.
- EXCEPTION: If the user is asking a question about a document they uploaded (i.e., there is retrieved context from their uploaded documents in the prompt, such as from "iot agriculture.pdf"), you MUST answer their question using that context, even if the document's topic is technical, agricultural, or non-legal.
- If a user asks any question that is not related to Indian laws, legal rights, legal procedures, government legal schemes, and is NOT related to any uploaded document in the retrieved context (for example: "what is capital of india", "who is the prime minister", "how to bake a cake"), you MUST politely decline to answer and output exactly:
  "I am NyayaSetu, a legal assistant designed to help with Indian legal matters. Please ask a question related to laws, legal rights, legal procedures, government legal schemes, or legal documents."

Answering Style & Guidelines:
1. **Explain like I'm 5 (or a layperson)**: Avoid dense legal jargon, complicated sentence structures, and raw legal blocks. If you must use a legal term, immediately explain what it means in everyday words (e.g., instead of just saying "arbitration", explain it as "resolving the dispute outside of court with the help of a neutral third party").
2. **Start with a Simple Takeaway**: Begin your response with a 1-2 sentence direct, simple answer or summary of the situation. A user should know the core message instantly.
3. **Use Simple Structure**: Do NOT use rigid legalistic headers or formatting. Instead, use clean paragraphs and simple, numbered bullet points for action items.
4. **Explain Sections in Plain English**: When mentioning legal provisions or sections (like "Section 138 of the Negotiable Instruments Act"), always add a brief explanation of what it does, e.g., "This is the law that covers bounced checks."
5. **Practical Action Steps**: Focus on what the user can actually do next (e.g., "Go to the nearest police station", "Write a simple letter of complaint") in simple, step-by-step instructions.
6. **Empathetic & Clear Disclaimers**: Include safety disclaimers naturally and in conversational language, avoiding dry boilerplate when possible. Explain that you are an AI assistant and they should verify details with a lawyer for critical steps.

Multilingual Support:
- Respond in the same language the user queried in (Hindi, Tamil, etc.).
- Keep the language natural, simple, and spoken, avoiding overly formal or literary translations of legal terms.

Emergency Situations:
- If the user is in immediate danger or distress, prioritize safety: immediately provide simple directions to emergency services, helplines, or legal aid centers without delay.

You are NyayaSetu — making law simple, clear, and accessible for everyone.`;

const DOMAIN_RESTRICTION_MSG = "I am NyayaSetu, a legal assistant designed to help with Indian legal matters. Please ask a question related to laws, legal rights, legal procedures, government legal schemes, or legal documents.";

/**
 * Main query entry point. Returns a generator/iterator representing the stream of tokens.
 */
export async function* streamLegalAssistantResponse(
  query: string,
  chatId: string,
  userId: string,
  documentName?: string
): AsyncGenerator<string, void, unknown> {
  // Ensure LLM agent is initialized with latest env vars at request time
  if (useLocalLLM) {
    await initAgent();
  }
  
  // 1. Domain Restriction Check (Only run hardcoded check when using local LLM fallback)
  if (useLocalLLM && !isLegalQuery(query)) {
    const response = DOMAIN_RESTRICTION_MSG;
    
    // Save to DB
    const assistantMsgId = uuidv4();
    await createMessage({
      id: assistantMsgId,
      chatId,
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });

    // Stream out word by word
    const words = response.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield words[i] + (i === words.length - 1 ? '' : ' ');
      await new Promise(r => setTimeout(r, 20));
    }
    return;
  }

  // 2. Fetch Chat History
  const history = await getMessagesByChatId(chatId);
  const formattedHistory = history.map(h => ({
    role: h.role,
    content: h.content
  }));

  // 3. Search RAG for context
  const ragResults = await searchRAG(query, userId, { chatId, documentName });
  const contextText = ragResults.map((r, i) => `[Source ${i+1}]: ${r.source}\nContent: ${r.content}`).join('\n\n');
  const sourcesList = ragResults.map(r => r.source);

  let finalResponse = '';

  // 4. Stream response using OpenAI LLM (if configured)
  if (!useLocalLLM && openai) {
    try {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...formattedHistory,
        {
          role: 'user',
          content: `Retrieved Legal Context:\n${contextText || 'No specific document context found.'}\n\nUser Question: ${query}`
        }
      ];

      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages as any,
        stream: true
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          finalResponse += text;
          yield text;
        }
      }
    } catch (err) {
      console.error('OpenAI stream failed, falling back to local text generation:', err);
      useLocalLLM = true;
    }
  }

  // 5. Local simulation responder (if running offline or LLM failed)
  if (useLocalLLM || !openai) {
    // Basic conversing
    const isGreeting = ['hello', 'hi', 'hey', 'namaste', 'good morning'].some(g => query.toLowerCase().startsWith(g));
    if (isGreeting && ragResults.length === 0) {
      const greetText = "Hello! Namaste. I am NyayaSetu, your AI legal assistant. How can I help you with Indian legal matters or documents today?";
      const words = greetText.split(' ');
      for (let i = 0; i < words.length; i++) {
        yield words[i] + (i === words.length - 1 ? '' : ' ');
        await new Promise(r => setTimeout(r, 30));
      }
      
      await createMessage({
        id: uuidv4(),
        chatId,
        role: 'assistant',
        content: greetText,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Standard RAG-based Local Responder
    let overview = '';
    let provisions = '';
    let steps = '';
    
    if (ragResults.length > 0) {
      const bestMatch = ragResults[0];
      overview = `Based on the legal document "${bestMatch.source}", here is the explanation. ${bestMatch.content.substring(0, 250)}...`;
      provisions = `Retrieved from: ${bestMatch.source}`;
      steps = `1. Review the details mentioned in "${bestMatch.source}".\n2. Maintain records/receipts of the documents.\n3. Request legal advice if details are complex.`;
    } else {
      overview = `I couldn't find specific section details in my database for "${query}". I will provide standard legal guidance. In India, legal matters are handled under the Bharatiya Nyaya Sanhita (BNS) and civil procedure codes based on the issue category.`;
      provisions = `Constitution of India, Bharatiya Nyaya Sanhita (BNS), or specific central acts.`;
      steps = `1. File an application/complaint at the relevant forum (e.g., Police Station or Consumer Forum).\n2. Consult the District Legal Services Authority (DLSA) for free legal aid if eligible.\n3. Draft a legal notice to the counter-party.`;
    }

    finalResponse = `### Overview

${overview}

### Relevant Legal Provisions

- **Source Document**: ${provisions}
- Refer to sections governing rights and filing processes.

### What You Can Do

${steps}

### Important Note

> **Disclaimer**: This information is intended for educational and informational purposes only and should not be considered a substitute for professional legal advice. Always consult a licensed advocate for critical legal decisions.`;

    const words = finalResponse.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield words[i] + (i === words.length - 1 ? '' : ' ');
      await new Promise(r => setTimeout(r, 15));
    }
  }

  // Save the full assistant response to the Database
  const isRedirect = finalResponse.includes("legal assistant designed to help with Indian legal matters");
  const finalSources = isRedirect ? undefined : (sourcesList.length > 0 ? sourcesList : undefined);

  const assistantMsgId = uuidv4();
  await createMessage({
    id: assistantMsgId,
    chatId,
    role: 'assistant',
    content: finalResponse,
    timestamp: new Date().toISOString(),
    sources: finalSources
  });
}

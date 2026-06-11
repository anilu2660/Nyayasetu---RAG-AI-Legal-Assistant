import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  feedback?: 'thumbs_up' | 'thumbs_down' | null;
  sources?: string[];
  documentName?: string;
  documentType?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadTimestamp: string;
}

interface AppState {
  // Authentication & Settings
  user: User | null;
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  
  // Navigation & Layout
  isSidebarOpen: boolean;
  isSettingsOpen: boolean;
  
  // Chats & Messages
  chats: Chat[];
  activeChatId: string | null;
  messages: Message[];
  isLoadingResponse: boolean;
  
  // RAG Documents
  documents: Document[];

  // Actions
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setLanguage: (lang: string) => void;
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSettings: () => void;
  setSettingsOpen: (open: boolean) => void;
  
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  deleteChatStore: (chatId: string) => void;
  setActiveChatId: (id: string | null) => void;
  
  setMessages: (messages: Message[]) => void;
  addMessage: (msg: Message) => void;
  updateMessageFeedbackStore: (messageId: string, feedback: 'thumbs_up' | 'thumbs_down' | null) => void;
  setLoadingResponse: (loading: boolean) => void;
  
  setDocuments: (docs: Document[]) => void;
  addDocumentStore: (doc: Document) => void;
  deleteDocumentStore: (docId: string) => void;
}

export const useStore = create<AppState>((set) => ({
  // Default values
  user: null,
  theme: 'dark',
  fontSize: 'medium',
  language: 'en',
  
  isSidebarOpen: true,
  isSettingsOpen: false,
  
  chats: [],
  activeChatId: null,
  messages: [],
  isLoadingResponse: false,
  
  documents: [],

  // Action implementations
  setUser: (user) => set({ user }),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement;
      if (theme === 'dark') {
        html.classList.add('dark');
        html.classList.remove('light');
      } else {
        html.classList.add('light');
        html.classList.remove('dark');
      }
    }
    set({ theme });
  },
  setFontSize: (fontSize) => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement;
      html.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
      html.classList.add(`text-size-${fontSize}`);
    }
    set({ fontSize });
  },
  setLanguage: (language) => set({ language }),
  
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  
  setChats: (chats) => set({ chats }),
  addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),
  deleteChatStore: (chatId) => set((state) => {
    const updatedChats = state.chats.filter(c => c.id !== chatId);
    const nextActive = state.activeChatId === chatId
      ? (updatedChats.length > 0 ? updatedChats[0].id : null)
      : state.activeChatId;
    return {
      chats: updatedChats,
      activeChatId: nextActive
    };
  }),
  setActiveChatId: (id) => set({ activeChatId: id }),
  
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  updateMessageFeedbackStore: (messageId, feedback) => set((state) => ({
    messages: state.messages.map(m => m.id === messageId ? { ...m, feedback } : m)
  })),
  setLoadingResponse: (loading) => set({ isLoadingResponse: loading }),
  
  setDocuments: (documents) => set({ documents }),
  addDocumentStore: (doc) => set((state) => ({ documents: [doc, ...state.documents] })),
  deleteDocumentStore: (docId) => set((state) => ({
    documents: state.documents.filter(d => d.id !== docId)
  }))
}));

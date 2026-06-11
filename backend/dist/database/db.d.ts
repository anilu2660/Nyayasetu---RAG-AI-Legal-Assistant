export interface User {
    id: string;
    email: string;
    password?: string;
    name: string;
    createdAt: string;
}
export interface Chat {
    id: string;
    userId: string;
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
    userId: string;
    chatId?: string;
    name: string;
    type: string;
    size: number;
    uploadTimestamp: string;
    content: string;
}
export interface Settings {
    userId: string;
    theme: 'light' | 'dark';
    fontSize: 'small' | 'medium' | 'large';
    language: string;
}
export declare function connectDb(): Promise<void>;
export declare function createUser(user: User): Promise<User>;
export declare function getUserByEmail(email: string): Promise<User | null>;
export declare function getUserById(id: string): Promise<User | null>;
export declare function createChat(chat: Chat): Promise<Chat>;
export declare function getChatsByUser(userId: string): Promise<Chat[]>;
export declare function getChatById(id: string): Promise<Chat | null>;
export declare function deleteChat(id: string): Promise<boolean>;
export declare function saveChatTitle(id: string, title: string): Promise<boolean>;
export declare function createMessage(msg: Message): Promise<Message>;
export declare function getMessagesByChatId(chatId: string): Promise<Message[]>;
export declare function updateMessageFeedback(messageId: string, feedback: 'thumbs_up' | 'thumbs_down' | null): Promise<boolean>;
export declare function createDocument(doc: Document): Promise<Document>;
export declare function getDocumentsByUser(userId: string): Promise<Document[]>;
export declare function getDocumentById(id: string): Promise<Document | null>;
export declare function deleteDocument(id: string): Promise<boolean>;
export declare function getSettings(userId: string): Promise<Settings>;
export declare function updateSettings(userId: string, updates: Partial<Settings>): Promise<Settings>;

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Interface Definitions
export interface User {
  id: string;
  email: string;
  password?: string; // Hashed password
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
  chatId?: string; // Scoped to a specific chat session
  name: string;
  type: string;
  size: number;
  uploadTimestamp: string;
  content: string; // Extracted text
}

export interface Settings {
  userId: string;
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  language: string;
}

// ----------------------------------------------------
// File-Based Fallback Database Configuration
// ----------------------------------------------------
const DATA_DIR = path.join(process.cwd(), '..', 'backend', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface LocalDbSchema {
  users: User[];
  chats: Chat[];
  messages: Message[];
  documents: Document[];
  settings: Settings[];
}

function initializeLocalDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const defaultData: LocalDbSchema = {
      users: [],
      chats: [],
      messages: [],
      documents: [],
      settings: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

function readLocalDb(): LocalDbSchema {
  initializeLocalDb();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read local DB file. Resetting.', err);
    const defaultData: LocalDbSchema = {
      users: [],
      chats: [],
      messages: [],
      documents: [],
      settings: []
    };
    return defaultData;
  }
}

function writeLocalDb(data: LocalDbSchema) {
  initializeLocalDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ----------------------------------------------------
// MongoDB Schema Definitions
// ----------------------------------------------------
const MongoUserSchema = new mongoose.Schema<User>({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  name: { type: String, required: true },
  createdAt: { type: String, required: true }
});

const MongoChatSchema = new mongoose.Schema<Chat>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  title: { type: String, required: true },
  createdAt: { type: String, required: true }
});

const MongoMessageSchema = new mongoose.Schema<Message>({
  id: { type: String, required: true, unique: true },
  chatId: { type: String, required: true },
  role: { type: String, required: true, enum: ['user', 'assistant'] },
  content: { type: String, required: true },
  timestamp: { type: String, required: true },
  feedback: { type: String, default: null },
  sources: [{ type: String }],
  documentName: { type: String },
  documentType: { type: String }
});

const MongoDocumentSchema = new mongoose.Schema<Document>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  chatId: { type: String }, // Scoped to a specific chat session
  name: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  uploadTimestamp: { type: String, required: true },
  content: { type: String, required: true }
});

const MongoSettingsSchema = new mongoose.Schema<Settings>({
  userId: { type: String, required: true, unique: true },
  theme: { type: String, required: true, default: 'dark' },
  fontSize: { type: String, required: true, default: 'medium' },
  language: { type: String, required: true, default: 'en' }
});

let UserModel: mongoose.Model<User>;
let ChatModel: mongoose.Model<Chat>;
let MessageModel: mongoose.Model<Message>;
let DocumentModel: mongoose.Model<Document>;
let SettingsModel: mongoose.Model<Settings>;

try {
  UserModel = mongoose.model<User>('User') || mongoose.model<User>('User', MongoUserSchema);
  ChatModel = mongoose.model<Chat>('Chat') || mongoose.model<Chat>('Chat', MongoChatSchema);
  MessageModel = mongoose.model<Message>('Message') || mongoose.model<Message>('Message', MongoMessageSchema);
  DocumentModel = mongoose.model<Document>('Document') || mongoose.model<Document>('Document', MongoDocumentSchema);
  SettingsModel = mongoose.model<Settings>('Settings') || mongoose.model<Settings>('Settings', MongoSettingsSchema);
} catch {
  UserModel = mongoose.model<User>('User', MongoUserSchema);
  ChatModel = mongoose.model<Chat>('Chat', MongoChatSchema);
  MessageModel = mongoose.model<Message>('Message', MongoMessageSchema);
  DocumentModel = mongoose.model<Document>('Document', MongoDocumentSchema);
  SettingsModel = mongoose.model<Settings>('Settings', MongoSettingsSchema);
}

// ----------------------------------------------------
// Unified DB Connection & API
// ----------------------------------------------------
let isMongoConnected = false;

export async function connectDb() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri);
        isMongoConnected = true;
        console.log('Connected to MongoDB database.');
      } else if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
        isMongoConnected = true;
      }
      return;
    } catch (err) {
      console.error('Failed to connect to MongoDB, falling back to local file DB.', err);
      isMongoConnected = false;
    }
  } else {
    isMongoConnected = false;
  }
  
  // Initialize local DB
  initializeLocalDb();
  console.log('Connected to local JSON file-based database.');
}

// Database Methods

// --- User Operations ---
export async function createUser(user: User): Promise<User> {
  await connectDb();
  if (isMongoConnected) {
    const mongoUser = new UserModel(user);
    await mongoUser.save();
    return user;
  } else {
    const db = readLocalDb();
    db.users.push(user);
    writeLocalDb(db);
    return user;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  await connectDb();
  if (isMongoConnected) {
    return await UserModel.findOne({ email }).lean();
  } else {
    const db = readLocalDb();
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  await connectDb();
  if (isMongoConnected) {
    return await UserModel.findOne({ id }).lean();
  } else {
    const db = readLocalDb();
    return db.users.find(u => u.id === id) || null;
  }
}

// --- Chat Operations ---
export async function createChat(chat: Chat): Promise<Chat> {
  await connectDb();
  if (isMongoConnected) {
    const mongoChat = new ChatModel(chat);
    await mongoChat.save();
    return chat;
  } else {
    const db = readLocalDb();
    db.chats.push(chat);
    writeLocalDb(db);
    return chat;
  }
}

export async function getChatsByUser(userId: string): Promise<Chat[]> {
  await connectDb();
  if (isMongoConnected) {
    return await ChatModel.find({ userId }).sort({ createdAt: -1 }).lean();
  } else {
    const db = readLocalDb();
    return db.chats.filter(c => c.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export async function getChatById(id: string): Promise<Chat | null> {
  await connectDb();
  if (isMongoConnected) {
    return await ChatModel.findOne({ id }).lean();
  } else {
    const db = readLocalDb();
    return db.chats.find(c => c.id === id) || null;
  }
}

export async function deleteChat(id: string): Promise<boolean> {
  await connectDb();
  if (isMongoConnected) {
    const res = await ChatModel.deleteOne({ id });
    await MessageModel.deleteMany({ chatId: id });
    return res.deletedCount > 0;
  } else {
    const db = readLocalDb();
    const chatIndex = db.chats.findIndex(c => c.id === id);
    if (chatIndex > -1) {
      db.chats.splice(chatIndex, 1);
      db.messages = db.messages.filter(m => m.chatId !== id);
      writeLocalDb(db);
      return true;
    }
    return false;
  }
}

export async function saveChatTitle(id: string, title: string): Promise<boolean> {
  await connectDb();
  if (isMongoConnected) {
    const res = await ChatModel.updateOne({ id }, { title });
    return res.modifiedCount > 0;
  } else {
    const db = readLocalDb();
    const chat = db.chats.find(c => c.id === id);
    if (chat) {
      chat.title = title;
      writeLocalDb(db);
      return true;
    }
    return false;
  }
}

// --- Message Operations ---
export async function createMessage(msg: Message): Promise<Message> {
  await connectDb();
  if (isMongoConnected) {
    const mongoMsg = new MessageModel(msg);
    await mongoMsg.save();
    return msg;
  } else {
    const db = readLocalDb();
    db.messages.push(msg);
    writeLocalDb(db);
    return msg;
  }
}

export async function getMessagesByChatId(chatId: string): Promise<Message[]> {
  await connectDb();
  if (isMongoConnected) {
    return await MessageModel.find({ chatId }).sort({ timestamp: 1 }).lean();
  } else {
    const db = readLocalDb();
    return db.messages.filter(m => m.chatId === chatId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
}

export async function updateMessageFeedback(messageId: string, feedback: 'thumbs_up' | 'thumbs_down' | null): Promise<boolean> {
  await connectDb();
  if (isMongoConnected) {
    const res = await MessageModel.updateOne({ id: messageId }, { feedback });
    return res.modifiedCount > 0;
  } else {
    const db = readLocalDb();
    const msg = db.messages.find(m => m.id === messageId);
    if (msg) {
      msg.feedback = feedback;
      writeLocalDb(db);
      return true;
    }
    return false;
  }
}

// --- Document Operations ---
export async function createDocument(doc: Document): Promise<Document> {
  await connectDb();
  if (isMongoConnected) {
    const mongoDoc = new DocumentModel(doc);
    await mongoDoc.save();
    return doc;
  } else {
    const db = readLocalDb();
    db.documents.push(doc);
    writeLocalDb(db);
    return doc;
  }
}

export async function getDocumentsByUser(userId: string): Promise<Document[]> {
  await connectDb();
  if (isMongoConnected) {
    return await DocumentModel.find({ userId }).sort({ uploadTimestamp: -1 }).lean();
  } else {
    const db = readLocalDb();
    return db.documents.filter(d => d.userId === userId).sort((a, b) => b.uploadTimestamp.localeCompare(a.uploadTimestamp));
  }
}

export async function getDocumentById(id: string): Promise<Document | null> {
  await connectDb();
  if (isMongoConnected) {
    return await DocumentModel.findOne({ id }).lean();
  } else {
    const db = readLocalDb();
    return db.documents.find(d => d.id === id) || null;
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  await connectDb();
  if (isMongoConnected) {
    const res = await DocumentModel.deleteOne({ id });
    return res.deletedCount > 0;
  } else {
    const db = readLocalDb();
    const docIndex = db.documents.findIndex(d => d.id === id);
    if (docIndex > -1) {
      db.documents.splice(docIndex, 1);
      writeLocalDb(db);
      return true;
    }
    return false;
  }
}

// --- Settings Operations ---
export async function getSettings(userId: string): Promise<Settings> {
  await connectDb();
  const defaultSettings: Settings = {
    userId,
    theme: 'dark',
    fontSize: 'medium',
    language: 'en'
  };

  if (isMongoConnected) {
    const settings = await SettingsModel.findOne({ userId }).lean();
    if (settings) return settings;
    const mongoSettings = new SettingsModel(defaultSettings);
    await mongoSettings.save();
    return defaultSettings;
  } else {
    const db = readLocalDb();
    let settings = db.settings.find(s => s.userId === userId);
    if (!settings) {
      settings = defaultSettings;
      db.settings.push(settings);
      writeLocalDb(db);
    }
    return settings;
  }
}

export async function updateSettings(userId: string, updates: Partial<Settings>): Promise<Settings> {
  await connectDb();
  if (isMongoConnected) {
    const settings = await SettingsModel.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    ).lean();
    return settings as Settings;
  } else {
    const db = readLocalDb();
    let index = db.settings.findIndex(s => s.userId === userId);
    if (index === -1) {
      const newSettings: Settings = {
        userId,
        theme: 'dark',
        fontSize: 'medium',
        language: 'en',
        ...updates
      };
      db.settings.push(newSettings);
      writeLocalDb(db);
      return newSettings;
    } else {
      db.settings[index] = { ...db.settings[index], ...updates };
      writeLocalDb(db);
      return db.settings[index];
    }
  }
}

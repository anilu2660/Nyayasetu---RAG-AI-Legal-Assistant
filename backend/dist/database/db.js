"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = connectDb;
exports.createUser = createUser;
exports.getUserByEmail = getUserByEmail;
exports.getUserById = getUserById;
exports.createChat = createChat;
exports.getChatsByUser = getChatsByUser;
exports.getChatById = getChatById;
exports.deleteChat = deleteChat;
exports.saveChatTitle = saveChatTitle;
exports.createMessage = createMessage;
exports.getMessagesByChatId = getMessagesByChatId;
exports.updateMessageFeedback = updateMessageFeedback;
exports.createDocument = createDocument;
exports.getDocumentsByUser = getDocumentsByUser;
exports.getDocumentById = getDocumentById;
exports.deleteDocument = deleteDocument;
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
// ----------------------------------------------------
// File-Based Fallback Database Configuration
// ----------------------------------------------------
const DATA_DIR = path_1.default.join(process.cwd(), '..', 'backend', 'data');
const DB_FILE = path_1.default.join(DATA_DIR, 'db.json');
function initializeLocalDb() {
    if (!fs_1.default.existsSync(DATA_DIR)) {
        fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs_1.default.existsSync(DB_FILE)) {
        const defaultData = {
            users: [],
            chats: [],
            messages: [],
            documents: [],
            settings: []
        };
        fs_1.default.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
}
function readLocalDb() {
    initializeLocalDb();
    try {
        const data = fs_1.default.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(data);
    }
    catch (err) {
        console.error('Failed to read local DB file. Resetting.', err);
        const defaultData = {
            users: [],
            chats: [],
            messages: [],
            documents: [],
            settings: []
        };
        return defaultData;
    }
}
function writeLocalDb(data) {
    initializeLocalDb();
    fs_1.default.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
// ----------------------------------------------------
// MongoDB Schema Definitions
// ----------------------------------------------------
const MongoUserSchema = new mongoose_1.default.Schema({
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    name: { type: String, required: true },
    createdAt: { type: String, required: true }
});
const MongoChatSchema = new mongoose_1.default.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    title: { type: String, required: true },
    createdAt: { type: String, required: true }
});
const MongoMessageSchema = new mongoose_1.default.Schema({
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
const MongoDocumentSchema = new mongoose_1.default.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    chatId: { type: String }, // Scoped to a specific chat session
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    uploadTimestamp: { type: String, required: true },
    content: { type: String, required: true }
});
const MongoSettingsSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true, unique: true },
    theme: { type: String, required: true, default: 'dark' },
    fontSize: { type: String, required: true, default: 'medium' },
    language: { type: String, required: true, default: 'en' }
});
let UserModel;
let ChatModel;
let MessageModel;
let DocumentModel;
let SettingsModel;
try {
    UserModel = mongoose_1.default.model('User') || mongoose_1.default.model('User', MongoUserSchema);
    ChatModel = mongoose_1.default.model('Chat') || mongoose_1.default.model('Chat', MongoChatSchema);
    MessageModel = mongoose_1.default.model('Message') || mongoose_1.default.model('Message', MongoMessageSchema);
    DocumentModel = mongoose_1.default.model('Document') || mongoose_1.default.model('Document', MongoDocumentSchema);
    SettingsModel = mongoose_1.default.model('Settings') || mongoose_1.default.model('Settings', MongoSettingsSchema);
}
catch {
    UserModel = mongoose_1.default.model('User', MongoUserSchema);
    ChatModel = mongoose_1.default.model('Chat', MongoChatSchema);
    MessageModel = mongoose_1.default.model('Message', MongoMessageSchema);
    DocumentModel = mongoose_1.default.model('Document', MongoDocumentSchema);
    SettingsModel = mongoose_1.default.model('Settings', MongoSettingsSchema);
}
// ----------------------------------------------------
// Unified DB Connection & API
// ----------------------------------------------------
let isMongoConnected = false;
async function connectDb() {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
        try {
            if (mongoose_1.default.connection.readyState === 0) {
                await mongoose_1.default.connect(mongoUri);
                isMongoConnected = true;
                console.log('Connected to MongoDB database.');
            }
            else if (mongoose_1.default.connection.readyState === 1 || mongoose_1.default.connection.readyState === 2) {
                isMongoConnected = true;
            }
            return;
        }
        catch (err) {
            console.error('Failed to connect to MongoDB, falling back to local file DB.', err);
            isMongoConnected = false;
        }
    }
    else {
        isMongoConnected = false;
    }
    // Initialize local DB
    initializeLocalDb();
    console.log('Connected to local JSON file-based database.');
}
// Database Methods
// --- User Operations ---
async function createUser(user) {
    await connectDb();
    if (isMongoConnected) {
        const mongoUser = new UserModel(user);
        await mongoUser.save();
        return user;
    }
    else {
        const db = readLocalDb();
        db.users.push(user);
        writeLocalDb(db);
        return user;
    }
}
async function getUserByEmail(email) {
    await connectDb();
    if (isMongoConnected) {
        return await UserModel.findOne({ email }).lean();
    }
    else {
        const db = readLocalDb();
        return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
}
async function getUserById(id) {
    await connectDb();
    if (isMongoConnected) {
        return await UserModel.findOne({ id }).lean();
    }
    else {
        const db = readLocalDb();
        return db.users.find(u => u.id === id) || null;
    }
}
// --- Chat Operations ---
async function createChat(chat) {
    await connectDb();
    if (isMongoConnected) {
        const mongoChat = new ChatModel(chat);
        await mongoChat.save();
        return chat;
    }
    else {
        const db = readLocalDb();
        db.chats.push(chat);
        writeLocalDb(db);
        return chat;
    }
}
async function getChatsByUser(userId) {
    await connectDb();
    if (isMongoConnected) {
        return await ChatModel.find({ userId }).sort({ createdAt: -1 }).lean();
    }
    else {
        const db = readLocalDb();
        return db.chats.filter(c => c.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
}
async function getChatById(id) {
    await connectDb();
    if (isMongoConnected) {
        return await ChatModel.findOne({ id }).lean();
    }
    else {
        const db = readLocalDb();
        return db.chats.find(c => c.id === id) || null;
    }
}
async function deleteChat(id) {
    await connectDb();
    if (isMongoConnected) {
        const res = await ChatModel.deleteOne({ id });
        await MessageModel.deleteMany({ chatId: id });
        return res.deletedCount > 0;
    }
    else {
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
async function saveChatTitle(id, title) {
    await connectDb();
    if (isMongoConnected) {
        const res = await ChatModel.updateOne({ id }, { title });
        return res.modifiedCount > 0;
    }
    else {
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
async function createMessage(msg) {
    await connectDb();
    if (isMongoConnected) {
        const mongoMsg = new MessageModel(msg);
        await mongoMsg.save();
        return msg;
    }
    else {
        const db = readLocalDb();
        db.messages.push(msg);
        writeLocalDb(db);
        return msg;
    }
}
async function getMessagesByChatId(chatId) {
    await connectDb();
    if (isMongoConnected) {
        return await MessageModel.find({ chatId }).sort({ timestamp: 1 }).lean();
    }
    else {
        const db = readLocalDb();
        return db.messages.filter(m => m.chatId === chatId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }
}
async function updateMessageFeedback(messageId, feedback) {
    await connectDb();
    if (isMongoConnected) {
        const res = await MessageModel.updateOne({ id: messageId }, { feedback });
        return res.modifiedCount > 0;
    }
    else {
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
async function createDocument(doc) {
    await connectDb();
    if (isMongoConnected) {
        const mongoDoc = new DocumentModel(doc);
        await mongoDoc.save();
        return doc;
    }
    else {
        const db = readLocalDb();
        db.documents.push(doc);
        writeLocalDb(db);
        return doc;
    }
}
async function getDocumentsByUser(userId) {
    await connectDb();
    if (isMongoConnected) {
        return await DocumentModel.find({ userId }).sort({ uploadTimestamp: -1 }).lean();
    }
    else {
        const db = readLocalDb();
        return db.documents.filter(d => d.userId === userId).sort((a, b) => b.uploadTimestamp.localeCompare(a.uploadTimestamp));
    }
}
async function getDocumentById(id) {
    await connectDb();
    if (isMongoConnected) {
        return await DocumentModel.findOne({ id }).lean();
    }
    else {
        const db = readLocalDb();
        return db.documents.find(d => d.id === id) || null;
    }
}
async function deleteDocument(id) {
    await connectDb();
    if (isMongoConnected) {
        const res = await DocumentModel.deleteOne({ id });
        return res.deletedCount > 0;
    }
    else {
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
async function getSettings(userId) {
    await connectDb();
    const defaultSettings = {
        userId,
        theme: 'dark',
        fontSize: 'medium',
        language: 'en'
    };
    if (isMongoConnected) {
        const settings = await SettingsModel.findOne({ userId }).lean();
        if (settings)
            return settings;
        const mongoSettings = new SettingsModel(defaultSettings);
        await mongoSettings.save();
        return defaultSettings;
    }
    else {
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
async function updateSettings(userId, updates) {
    await connectDb();
    if (isMongoConnected) {
        const settings = await SettingsModel.findOneAndUpdate({ userId }, { $set: updates }, { new: true, upsert: true }).lean();
        return settings;
    }
    else {
        const db = readLocalDb();
        let index = db.settings.findIndex(s => s.userId === userId);
        if (index === -1) {
            const newSettings = {
                userId,
                theme: 'dark',
                fontSize: 'medium',
                language: 'en',
                ...updates
            };
            db.settings.push(newSettings);
            writeLocalDb(db);
            return newSettings;
        }
        else {
            db.settings[index] = { ...db.settings[index], ...updates };
            writeLocalDb(db);
            return db.settings[index];
        }
    }
}

import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'db.json');

const defaultData = {
  conversations: [],
  actions: [],
  preferences: {},
  profileFacts: [], // Persistent user facts extracted from chat history
};

let db;

async function getDb() {
  if (!db) {
    db = await JSONFilePreset(DB_PATH, defaultData);
  }
  return db;
}

/**
 * Add a message to a conversation session.
 * Creates a new session if sessionId doesn't exist.
 */
export async function addMessage(sessionId, role, content) {
  const database = await getDb();
  let session = database.data.conversations.find((c) => c.id === sessionId);

  if (!session) {
    session = {
      id: sessionId || uuidv4(),
      messages: [],
      createdAt: new Date().toISOString(),
    };
    database.data.conversations.push(session);
  }

  session.messages.push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });

  await database.write();
  return session;
}

/**
 * Get the most recent N messages across all conversations (for Gemini context).
 */
export async function getRecentMessages(n = 10) {
  const database = await getDb();
  const allMessages = database.data.conversations
    .flatMap((c) => c.messages)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, n)
    .reverse();
  return allMessages;
}

/**
 * Log an agent action.
 */
export async function logAction(type, description, outcome = 'SUCCESS') {
  const database = await getDb();
  const action = {
    id: uuidv4(),
    type,
    description,
    timestamp: new Date().toISOString(),
    outcome,
  };
  database.data.actions.push(action);
  await database.write();
  return action;
}

/**
 * Get recent actions.
 */
export async function getActions(limit = 50) {
  const database = await getDb();
  return database.data.actions.slice(-limit);
}

/**
 * Get all conversations, sorted by date (newest first).
 */
export async function getConversations() {
  const database = await getDb();
  return [...database.data.conversations].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

/**
 * Get a single conversation session by ID.
 */
export async function getConversation(sessionId) {
  const database = await getDb();
  return database.data.conversations.find((c) => c.id === sessionId) || null;
}

/**
 * Clear all conversation history (keep preferences and actions).
 */
export async function clearHistory() {
  const database = await getDb();
  database.data.conversations = [];
  database.data.profileFacts = []; // Clear facts on clean reset
  await database.write();
}

/**
 * Save a preference.
 */
export async function setPreference(key, value) {
  const database = await getDb();
  database.data.preferences[key] = value;
  await database.write();
}

/**
 * Get a preference.
 */
export async function getPreference(key) {
  const database = await getDb();
  return database.data.preferences[key];
}

/**
 * Get all saved user profile facts (JARVIS brain memory).
 */
export async function getProfileFacts() {
  const database = await getDb();
  if (!database.data.profileFacts) {
    database.data.profileFacts = [];
  }
  return database.data.profileFacts;
}

/**
 * Add a new user profile fact, ensuring duplicates are avoided.
 */
export async function addProfileFact(fact) {
  const database = await getDb();
  if (!database.data.profileFacts) {
    database.data.profileFacts = [];
  }

  const normalized = fact.trim();
  if (normalized && !database.data.profileFacts.includes(normalized)) {
    database.data.profileFacts.push(normalized);
    await database.write();
    return true;
  }
  return false;
}

/**
 * Clear all saved user profile facts.
 */
export async function clearProfileFacts() {
  const database = await getDb();
  database.data.profileFacts = [];
  await database.write();
}

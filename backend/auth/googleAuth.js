import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.join(__dirname, '..', 'memory', 'tokens.json');

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export function getRedirectUri(req) {
  // If explicitly set in env and is a valid external URL (or in dev mode)
  if (process.env.GOOGLE_REDIRECT_URI) {
    const isLocalhostEnv = process.env.GOOGLE_REDIRECT_URI.includes('localhost');
    if (!isLocalhostEnv || process.env.NODE_ENV !== 'production') {
      return process.env.GOOGLE_REDIRECT_URI;
    }
  }

  // Dynamically extract domain from Express request headers if available
  if (req) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.get('host');
    return `${protocol}://${host}/oauth2callback`;
  }

  // Fallback to Render environment variable if set
  if (process.env.RENDER_EXTERNAL_URL) {
    return `${process.env.RENDER_EXTERNAL_URL}/oauth2callback`;
  }

  return 'http://localhost:5000/oauth2callback';
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  getRedirectUri()
);

// Auto-refresh tokens when they expire
oauth2Client.on('tokens', async (tokens) => {
  try {
    const existing = await loadTokens();
    const updated = { ...existing, ...tokens };
    await saveTokens(updated);
  } catch (err) {
    console.error('Failed to persist refreshed tokens:', err.message);
  }
});

let demoActive = false;

export function enableDemo(active) {
  demoActive = active;
}

export function isDemo() {
  return demoActive;
}

export function getAuthUrl(req) {
  const redirectUri = getRedirectUri(req);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    redirect_uri: redirectUri,
  });
}

export async function handleCallback(code, req) {
  const redirectUri = getRedirectUri(req);
  const { tokens } = await oauth2Client.getToken({
    code,
    redirect_uri: redirectUri,
  });
  oauth2Client.setCredentials(tokens);
  await saveTokens(tokens);
  return tokens;
}

export function getClient() {
  return oauth2Client;
}

export function isAuthenticated() {
  if (demoActive) return true;
  const creds = oauth2Client.credentials;
  return !!(creds && (creds.access_token || creds.refresh_token));
}

export async function getUserInfo() {
  if (demoActive) {
    return {
      email: 'tony.stark@starkindustries.com',
      name: 'Tony Stark',
      picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    };
  }
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return {
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}

export async function saveTokens(tokens) {
  const dir = path.dirname(TOKENS_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

export async function loadTokens() {
  try {
    const data = await fs.readFile(TOKENS_PATH, 'utf-8');
    const tokens = JSON.parse(data);
    if (tokens && (tokens.access_token || tokens.refresh_token)) {
      oauth2Client.setCredentials(tokens);
      return tokens;
    }
  } catch (err) {
    // No saved tokens — that's fine
  }
  return null;
}

export async function logout() {
  oauth2Client.credentials = {};
  try {
    await fs.unlink(TOKENS_PATH);
  } catch {
    // File may not exist
  }
}

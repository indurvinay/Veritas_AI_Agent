import { google } from 'googleapis';
import { getClient } from '../auth/googleAuth.js';
import { classifyEmailMessage } from '../utils/spamDetector.js';

function getGmail() {
  return google.gmail({ version: 'v1', auth: getClient() });
}

/**
 * Decode base64url-encoded email body.
 */
function decodeBody(data) {
  if (!data) return '';
  return Buffer.from(data, 'base64url').toString('utf-8');
}

/**
 * Extract header value from message headers array.
 */
function getHeader(headers, name) {
  const header = headers?.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

/**
 * Extract the text body from a message's payload (handles multipart).
 */
function extractBody(payload) {
  if (!payload) return '';

  // Simple body
  if (payload.body?.data) {
    return decodeBody(payload.body.data);
  }

  // Multipart — look for text/plain first, then text/html
  if (payload.parts) {
    // Try text/plain first
    const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
    if (textPart?.body?.data) return decodeBody(textPart.body.data);

    // Try text/html
    const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html');
    if (htmlPart?.body?.data) return decodeBody(htmlPart.body.data);

    // Nested multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }
  }

  return '';
}

/**
 * Parse a Gmail message into a clean object.
 */
function parseMessage(msg) {
  const headers = msg.payload?.headers || [];
  return {
    id: msg.id,
    threadId: msg.threadId,
    subject: getHeader(headers, 'Subject'),
    from: getHeader(headers, 'From'),
    to: getHeader(headers, 'To'),
    date: getHeader(headers, 'Date'),
    snippet: msg.snippet,
    body: extractBody(msg.payload),
    labelIds: msg.labelIds || [],
  };
}

/**
 * Fetch emails with classification.
 */
export async function fetchEmails(maxResults = 50) {
  const gmail = getGmail();
  const { data } = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    labelIds: ['INBOX'],
  });

  if (!data.messages || data.messages.length === 0) return [];

  const emails = await Promise.all(
    data.messages.map(async (m) => {
      const { data: msg } = await gmail.users.messages.get({
        userId: 'me',
        id: m.id,
        format: 'full',
      });
      return parseMessage(msg);
    })
  );

  // Classify each email through the spam detector (bypassing AI for bulk fetches to conserve quota)
  const classified = await Promise.all(
    emails.map(async (email) => {
      const classification = await classifyEmailMessage(email, false);
      return { ...email, ...classification };
    })
  );

  return classified;
}

/**
 * Get a single email by ID.
 */
export async function getEmailById(id) {
  const gmail = getGmail();
  const { data: msg } = await gmail.users.messages.get({
    userId: 'me',
    id,
    format: 'full',
  });
  const email = parseMessage(msg);
  const classification = await classifyEmailMessage(email);
  return { ...email, ...classification };
}

/**
 * Send a new email.
 */
export async function sendEmail(to, subject, body) {
  const gmail = getGmail();
  const rawMessage = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    body,
  ].join('\r\n');

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const { data } = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage },
  });
  return data;
}

/**
 * Reply to an email in the same thread.
 */
export async function replyToEmail(messageId, threadId, body) {
  const gmail = getGmail();

  // Get the original message for reply headers
  const { data: original } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'metadata',
    metadataHeaders: ['Subject', 'From', 'Message-ID'],
  });

  const headers = original.payload?.headers || [];
  const origFrom = getHeader(headers, 'From');
  const origSubject = getHeader(headers, 'Subject');
  const origMsgId = getHeader(headers, 'Message-ID');

  const rawMessage = [
    `To: ${origFrom}`,
    `Subject: Re: ${origSubject}`,
    `In-Reply-To: ${origMsgId}`,
    `References: ${origMsgId}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    body,
  ].join('\r\n');

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const { data } = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage, threadId },
  });
  return data;
}

/**
 * Trash an email.
 */
export async function trashEmail(id) {
  const gmail = getGmail();
  await gmail.users.messages.trash({ userId: 'me', id });
  return { success: true };
}

/**
 * Modify email labels.
 */
export async function modifyLabels(id, addLabels = [], removeLabels = []) {
  const gmail = getGmail();
  const { data } = await gmail.users.messages.modify({
    userId: 'me',
    id,
    requestBody: { addLabelIds: addLabels, removeLabelIds: removeLabels },
  });
  return data;
}

/**
 * Get unread email count.
 */
export async function getUnreadCount() {
  const gmail = getGmail();
  const { data } = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
    maxResults: 1,
  });
  return data.resultSizeEstimate || 0;
}

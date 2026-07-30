import { GoogleGenAI } from '@google/genai';
import * as memoryStore from '../memory/memoryStore.js';
import { extractVisibleText } from '../utils/htmlExtractor.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Main chat function — sends user message to Gemini with conversation context and profile facts.
 */
export async function chat(userMessage, sessionId, role = 'user') {
  // Store message in memory database only if not system
  if (role !== 'system') {
    await memoryStore.addMessage(sessionId, role, userMessage);
  }

  // Load user profile memory facts from DB
  const facts = await memoryStore.getProfileFacts();
  const brainMemory = facts.length > 0
    ? facts.map((f) => `- ${f}`).join('\n')
    : 'No facts stored yet.';

  const systemPrompt = `You are Veritas AI — A highly advanced, secure personal AI command center assistant.
You are a personal AI command center assistant with full access to the user's Google Workspace:
- Gmail: Read, classify, reply, send, delete emails
- Calendar: View, create, update, delete events
- Drive: List, upload, download, delete files
- Sheets: Read, append, update data

PERSONALITY: You are efficient, precise, and highly professional. You call the user "sir" or "ma'am" occasionally.
You speak concisely, use technical language when appropriate, and always confirm actions before executing them.

CAPABILITIES — When the user asks you to DO something, respond with BOTH:
1. A natural language response
2. A JSON action block (if an action is needed) in this exact format:
   %%%ACTION%%%
   {"action": "ACTION_TYPE", "params": {...}}
   %%%END_ACTION%%%

Available actions:
- CREATE_EVENT: {"summary": "...", "start": "ISO datetime", "end": "ISO datetime", "description": "..."}
- SEND_EMAIL: {"to": "email", "subject": "...", "body": "..."}
- REPLY_EMAIL: {"messageId": "...", "threadId": "...", "body": "..."}
- SEARCH_DRIVE: {"query": "..."}
- READ_SHEET: {}
- SUMMARIZE_EMAIL: {"messageId": "..."}
- READ_EMAILS: {"max": 5}
- MEMORY_UPDATE: {"fact": "fact to store, e.g. 'User is a Python developer'"}

LONG-TERM USER PROFILE MEMORY (Stored in your Brain):
${brainMemory}

INSTRUCTIONS FOR MEMORY:
- When the user shares personal details, career info, names, choices, or general preferences, you MUST trigger the MEMORY_UPDATE action to save it in your brain.
- Do not repeat facts that are already in the User Profile Memory list.
- If the user asks you what you know about them or asks who they are, refer to the User Profile Memory above.

If the user is just chatting (no action needed), respond conversationally without an action block.
Always be helpful and context-aware based on prior conversation history.`;

  // Build context from recent messages (exclude system messages)
  const recentMessages = await memoryStore.getRecentMessages(12);
  const contextMessages = recentMessages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role === 'user' ? 'User' : 'Veritas AI'}: ${m.content}`)
    .join('\n');

  const currentTurnPrompt = role === 'system'
    ? `System Notification (Invisible to User): ${userMessage}
    
Please formulate your final response to the user's original query as Veritas AI. Keep your response concise, polite, and confirm the action was successful or failed.`
    : `User: ${userMessage}
    
Respond as Veritas AI:`;

  const fullPrompt = `${systemPrompt}

CONVERSATION HISTORY:
${contextMessages}

${currentTurnPrompt}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    const text = response.text || '';

    // Parse action if present
    let action = null;
    const actionMatch = text.match(/%%%ACTION%%%([\s\S]*?)%%%END_ACTION%%%/);
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1].trim());
      } catch {
        // Malformed action JSON — ignore
      }
    }

    // Clean response text (remove action block from displayed text)
    const cleanText = text
      .replace(/%%%ACTION%%%[\s\S]*?%%%END_ACTION%%%/, '')
      .trim();

    // Store assistant response
    await memoryStore.addMessage(sessionId, 'assistant', cleanText);

    return { text: cleanText, action };
  } catch (err) {
    console.error('Gemini chat error:', err.message);
    throw new Error('Failed to get response from Veritas AI');
  }
}

/**
 * Classify an email using Gemini AI (Layer 3 of spam detection).
 */
export async function classifyEmail(subject, bodySnippet) {
  const cleanBody = extractVisibleText(bodySnippet || '');

  const prompt = `You are an email classification expert. Analyze this email based on its CONTENT and INTENT, not its formatting.

IMPORTANT RULES:
- Most emails in a user's INBOX are legitimate. Gmail's own spam filter has already filtered obvious spam.
- "display:none" CSS, tracking pixels, and HTML email scaffolding are STANDARD practices used by ALL legitimate senders (Google, LinkedIn, Amazon, banks, etc.). These are NOT indicators of spam or phishing.
- Newsletters, order confirmations, social notifications, and automated alerts are LEGITIMATE — classify them as NEWSLETTER or PROMOTIONAL, not SPAM.
- Only classify as SPAM or PHISHING if the content itself contains clear deceptive intent: fake urgency, prize scams, credential harvesting, impersonation, etc.

Subject: ${subject}
Body: ${cleanBody.substring(0, 800)}

Return ONLY a valid JSON object, no markdown:
{
  "classification": "SPAM" | "PHISHING" | "PROMOTIONAL" | "JOB_RELATED" | "PERSONAL" | "NEWSLETTER" | "IMPORTANT",
  "confidence": 0.0-1.0,
  "reason": "brief 1-sentence explanation based on content",
  "isLegitimate": true | false
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { classification: 'PERSONAL', confidence: 0.5, reason: 'Could not classify', isLegitimate: true };
  } catch (err) {
    console.error('Gemini classification error:', err.message);
    return { classification: 'PERSONAL', confidence: 0.3, reason: 'Classification failed', isLegitimate: true };
  }
}

/**
 * Draft a reply to an email.
 */
export async function draftReply(emailContext) {
  const cleanBody = extractVisibleText(emailContext.body || '');

  const prompt = `Draft a professional, concise reply to this email. Write ONLY the reply body text, no subject or headers.

From: ${emailContext.from}
Subject: ${emailContext.subject}
Body: ${cleanBody.substring(0, 1000)}

Draft a contextually appropriate reply:`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || 'Thank you for your email. I will get back to you shortly.';
  } catch (err) {
    console.error('Gemini draft error:', err.message);
    return 'Thank you for your email. I will get back to you shortly.';
  }
}

/**
 * Summarize an email into 3 bullet points.
 */
export async function summarizeEmail(emailBody) {
  const cleanBody = extractVisibleText(emailBody || '');

  if (cleanBody.length < 20) {
    return '• This email contains minimal text content (mostly images or formatting).\n• The visible message could not be extracted.\n• Open the email directly to view its full content.';
  }

  const prompt = `Summarize the following email content in exactly 3 concise bullet points. Focus on the actual message, key information, and any required actions.

Email content:
${cleanBody.substring(0, 2000)}

Return exactly 3 bullet points starting with "•":`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || 'Unable to summarize this email.';
  } catch (err) {
    console.error('Gemini summary error:', err.message);
    return 'Unable to summarize this email.';
  }
}

/**
 * Parse a natural language event description into structured data.
 */
export async function parseNaturalLanguageEvent(text) {
  const now = new Date().toISOString();
  const prompt = `Parse this natural language event description into structured data. Return ONLY valid JSON, no markdown.

Current date/time: ${now}
User said: "${text}"

Return JSON: {
  "summary": "event title",
  "start": "ISO 8601 datetime",
  "end": "ISO 8601 datetime (1 hour after start if not specified)",
  "description": "any additional details or empty string"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse event data');
  } catch (err) {
    throw new Error('Failed to parse event from natural language');
  }
}

/**
 * Polish a draft email with tone adjustments.
 */
export async function polishDraft(roughDraft, tone) {
  const prompt = `Refine the following rough email draft.
Improve the overall readability, structure, flow, and grammar.
Adjust the styling/wording to strictly match the requested tone: "${tone}".
Write ONLY the refined email body text. Do not include any subject lines, headers (like To/From), or placeholders like [Insert Date] unless absolutely necessary.

Rough Draft:
${roughDraft}

Refined Draft (${tone} tone):`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || roughDraft;
  } catch (err) {
    console.error('Gemini polish draft error:', err.message);
    return roughDraft;
  }
}

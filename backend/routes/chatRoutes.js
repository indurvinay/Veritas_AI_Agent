import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as geminiAgent from '../agents/geminiAgent.js';
import * as calendarAgent from '../agents/calendarAgent.js';
import * as gmailAgent from '../agents/gmailAgent.js';
import * as driveAgent from '../agents/driveAgent.js';
import * as sheetsAgent from '../agents/sheetsAgent.js';
import * as memoryStore from '../memory/memoryStore.js';
import { isDemo } from '../auth/googleAuth.js';
import { addMockEvent, mockEmails, mockSheetData, appendMockRow, mockFiles } from '../utils/mockStore.js';

const router = Router();

/**
 * Execute a detected action from Gemini's response.
 */
async function executeAction(action) {
  if (!action || !action.action) return null;

  const demo = isDemo();
  try {
    switch (action.action) {
      case 'CREATE_EVENT': {
        const { summary, start, end, description } = action.params;
        let event;
        if (demo) {
          event = addMockEvent({ summary, start, end, description });
          await memoryStore.logAction('CREATE_EVENT', `Demo: Created: "${summary}"`);
        } else {
          event = await calendarAgent.createEvent(summary, start, end, description);
          await memoryStore.logAction('CREATE_EVENT', `Created: "${summary}"`);
        }
        return { type: 'CREATE_EVENT', result: event, message: `✅ Event "${summary}" created successfully.` };
      }

      case 'SEND_EMAIL': {
        const { to, subject, body } = action.params;
        if (demo) {
          const newMail = {
            id: `mock-email-${Date.now()}`,
            threadId: `thread-${Date.now()}`,
            subject,
            from: 'tony.stark@starkindustries.com',
            to,
            date: new Date().toUTCString(),
            snippet: body.substring(0, 100),
            body,
            labelIds: ['SENT'],
            tag: 'REAL',
            tagColor: '#00FF88',
            tagEmoji: '🟢',
            classification: 'IMPORTANT',
            confidence: 1.0,
          };
          mockEmails.unshift(newMail);
          await memoryStore.logAction('SEND_EMAIL', `Demo: Sent to ${to}: "${subject}"`);
          return { type: 'SEND_EMAIL', result: newMail, message: `✉️ Email sent to ${to}.` };
        } else {
          const result = await gmailAgent.sendEmail(to, subject, body);
          await memoryStore.logAction('SEND_EMAIL', `Sent to ${to}: "${subject}"`);
          return { type: 'SEND_EMAIL', result, message: `✉️ Email sent to ${to}.` };
        }
      }

      case 'REPLY_EMAIL': {
        const { messageId, threadId, body } = action.params;
        if (demo) {
          const original = mockEmails.find((e) => e.id === messageId) || mockEmails[0];
          const replyMail = {
            id: `mock-email-${Date.now()}`,
            threadId: original.threadId,
            subject: `Re: ${original.subject}`,
            from: 'tony.stark@starkindustries.com',
            to: original.from,
            date: new Date().toUTCString(),
            snippet: body.substring(0, 100),
            body,
            labelIds: ['SENT'],
            tag: 'REAL',
            tagColor: '#00FF88',
            tagEmoji: '🟢',
            classification: 'PERSONAL',
            confidence: 1.0,
          };
          mockEmails.unshift(replyMail);
          await memoryStore.logAction('REPLY_EMAIL', `Demo: Replied to thread ${threadId}`);
          return { type: 'REPLY_EMAIL', result: replyMail, message: `✉️ Reply sent successfully.` };
        } else {
          const result = await gmailAgent.replyToEmail(messageId, threadId, body);
          await memoryStore.logAction('REPLY_EMAIL', `Replied to thread ${threadId}`);
          return { type: 'REPLY_EMAIL', result, message: `✉️ Reply sent successfully.` };
        }
      }

      case 'SEARCH_DRIVE': {
        const { query } = action.params;
        if (demo) {
          const files = mockFiles.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
          return { type: 'SEARCH_DRIVE', result: files, message: `📁 Found ${files.length} files matching "${query}".` };
        } else {
          const files = await driveAgent.searchFiles(query);
          return { type: 'SEARCH_DRIVE', result: files, message: `📁 Found ${files.length} files matching "${query}".` };
        }
      }

      case 'READ_SHEET': {
        if (demo) {
          return { type: 'READ_SHEET', result: mockSheetData, message: `📊 Sheet loaded: ${mockSheetData.rows.length} rows.` };
        } else {
          const data = await sheetsAgent.readSheet();
          return { type: 'READ_SHEET', result: data, message: `📊 Sheet loaded: ${data.totalRows} rows.` };
        }
      }

      case 'SUMMARIZE_EMAIL': {
        const { messageId } = action.params;
        let email;
        if (demo) {
          email = mockEmails.find((e) => e.id === messageId) || mockEmails[0];
        } else {
          email = await gmailAgent.getEmailById(messageId);
        }
        const summary = await geminiAgent.summarizeEmail(email.body);
        return { type: 'SUMMARIZE_EMAIL', result: { summary, subject: email.subject }, message: `📋 Email summarized.` };
      }
      case 'READ_EMAILS': {
        const max = action.params?.max || 5;
        let emails;
        if (demo) {
          emails = mockEmails.slice(0, max);
        } else {
          emails = await gmailAgent.fetchEmails(max);
        }
        return { 
          type: 'READ_EMAILS', 
          result: emails, 
          message: `✉️ Loaded recent emails.` 
        };
      }
      case 'MEMORY_UPDATE': {
        const { fact } = action.params;
        const added = await memoryStore.addProfileFact(fact);
        return { 
          type: 'MEMORY_UPDATE', 
          result: { fact, added }, 
          message: added ? `🧠 Memorized: "${fact}"` : `🧠 Already remembered: "${fact}"` 
        };
      }

      default:
        return { type: 'UNKNOWN', message: `Unknown action: ${action.action}` };
    }
  } catch (err) {
    await memoryStore.logAction(action.action, err.message, 'FAILED');
    return { type: action.action, error: err.message, message: `❌ Action failed: ${err.message}` };
  }
}

// POST /api/chat/message — Send a message to Veritas AI
router.post('/message', async (req, res) => {
  const { message, sessionId = uuidv4() } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }

  try {
    let { text, action } = await geminiAgent.chat(message, sessionId);

    let actionResult = null;
    if (action) {
      actionResult = await executeAction(action);

      if (actionResult) {
        const isSuccess = !actionResult.error;
        const systemUpdateMessage = `[SYSTEM TOOL OUTPUT for ${action.action}]:
${isSuccess ? JSON.stringify(actionResult.result || actionResult.message) : `ERROR: ${actionResult.error}`}

User Query was: "${message}"
Execution status: ${isSuccess ? 'SUCCESS' : 'FAILED'}

Please generate a conversational response to the user as Veritas AI confirming the action outcome.`;

        const secondTurn = await geminiAgent.chat(systemUpdateMessage, sessionId, 'system');
        text = secondTurn.text;
      }
    }

    res.json({
      response: text,
      sessionId,
      action: actionResult,
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'I apologize, sir. I encountered an error processing your request.' });
  }
});

// GET /api/chat/history — Get all conversation sessions
router.get('/history', async (req, res) => {
  const conversations = await memoryStore.getConversations();
  res.json({ conversations });
});

// GET /api/chat/history/:sessionId — Get a single session
router.get('/history/:sessionId', async (req, res) => {
  const conversation = await memoryStore.getConversation(req.params.sessionId);
  if (!conversation) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(conversation);
});

// DELETE /api/chat/history — Clear all history
router.delete('/history', async (req, res) => {
  await memoryStore.clearHistory();
  res.json({ success: true, message: 'History cleared' });
});

// GET /api/chat/actions — Get agent action log
router.get('/actions', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const actions = await memoryStore.getActions(limit);
  res.json({ actions });
});

export default router;

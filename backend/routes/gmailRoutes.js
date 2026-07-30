import { Router } from 'express';
import * as gmailAgent from '../agents/gmailAgent.js';
import * as geminiAgent from '../agents/geminiAgent.js';
import * as memoryStore from '../memory/memoryStore.js';
import { isDemo } from '../auth/googleAuth.js';
import { mockEmails, trashMockEmail } from '../utils/mockStore.js';

const router = Router();

// GET /api/gmail/emails — Fetch and classify all emails
router.get('/emails', async (req, res) => {
  try {
    if (isDemo()) {
      return res.json({ emails: mockEmails, count: mockEmails.length });
    }
    const maxResults = parseInt(req.query.max) || 50;
    const emails = await gmailAgent.fetchEmails(maxResults);
    res.json({ emails, count: emails.length });
  } catch (err) {
    console.error('Gmail fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch emails', details: err.message });
  }
});

// GET /api/gmail/emails/:id — Get single email details
router.get('/emails/:id', async (req, res) => {
  try {
    if (isDemo()) {
      const email = mockEmails.find((e) => e.id === req.params.id);
      return email ? res.json(email) : res.status(404).json({ error: 'Email not found' });
    }
    const email = await gmailAgent.getEmailById(req.params.id);
    res.json(email);
  } catch (err) {
    console.error('Gmail get email error:', err.message);
    res.status(500).json({ error: 'Failed to get email', details: err.message });
  }
});

// POST /api/gmail/send — Send a new email
router.post('/send', async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }
    if (isDemo()) {
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
      await memoryStore.logAction('SEND_EMAIL', `Demo: Sent email to ${to}: "${subject}"`);
      return res.json({ success: true, messageId: newMail.id });
    }
    const result = await gmailAgent.sendEmail(to, subject, body);
    await memoryStore.logAction('SEND_EMAIL', `Sent email to ${to}: "${subject}"`);
    res.json({ success: true, messageId: result.id });
  } catch (err) {
    console.error('Gmail send error:', err.message);
    res.status(500).json({ error: 'Failed to send email', details: err.message });
  }
});

// POST /api/gmail/reply/:id — Reply to an email
router.post('/reply/:id', async (req, res) => {
  try {
    let { body } = req.body;
    const { id } = req.params;

    let original;
    if (isDemo()) {
      original = mockEmails.find((e) => e.id === id);
      if (!original) return res.status(404).json({ error: 'Email not found' });
    } else {
      original = await gmailAgent.getEmailById(id);
    }

    // If no body provided, auto-draft with Gemini
    if (!body) {
      body = await geminiAgent.draftReply({
        from: original.from,
        subject: original.subject,
        body: original.body,
      });
    }

    if (isDemo()) {
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
      await memoryStore.logAction('REPLY_EMAIL', `Demo: Replied to "${original.subject}" from ${original.from}`);
      return res.json({ success: true, messageId: replyMail.id, draftedBody: body });
    }

    const result = await gmailAgent.replyToEmail(id, original.threadId, body);
    await memoryStore.logAction('REPLY_EMAIL', `Replied to "${original.subject}" from ${original.from}`);
    res.json({ success: true, messageId: result.id, draftedBody: body });
  } catch (err) {
    console.error('Gmail reply error:', err.message);
    res.status(500).json({ error: 'Failed to reply', details: err.message });
  }
});

// DELETE /api/gmail/emails/:id — Trash an email
router.delete('/emails/:id', async (req, res) => {
  try {
    if (isDemo()) {
      trashMockEmail(req.params.id);
      await memoryStore.logAction('TRASH_EMAIL', `Demo: Trashed email ${req.params.id}`);
      return res.json({ success: true });
    }
    await gmailAgent.trashEmail(req.params.id);
    await memoryStore.logAction('TRASH_EMAIL', `Trashed email ${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Gmail trash error:', err.message);
    res.status(500).json({ error: 'Failed to trash email', details: err.message });
  }
});

// POST /api/gmail/emails/:id/label — Modify labels
router.post('/emails/:id/label', async (req, res) => {
  try {
    if (isDemo()) {
      return res.json({ success: true });
    }
    const { add = [], remove = [] } = req.body;
    const result = await gmailAgent.modifyLabels(req.params.id, add, remove);
    res.json(result);
  } catch (err) {
    console.error('Gmail label error:', err.message);
    res.status(500).json({ error: 'Failed to modify labels', details: err.message });
  }
});

// POST /api/gmail/emails/:id/summarize — Summarize with Gemini
router.post('/emails/:id/summarize', async (req, res) => {
  try {
    let email;
    if (isDemo()) {
      email = mockEmails.find((e) => e.id === req.params.id);
    } else {
      email = await gmailAgent.getEmailById(req.params.id);
    }
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    const summary = await geminiAgent.summarizeEmail(email.body);
    res.json({ summary, subject: email.subject });
  } catch (err) {
    console.error('Gmail summarize error:', err.message);
    res.status(500).json({ error: 'Failed to summarize email', details: err.message });
  }
});

// GET /api/gmail/unread — Get unread count
router.get('/unread', async (req, res) => {
  try {
    if (isDemo()) {
      const count = mockEmails.filter((e) => e.labelIds.includes('UNREAD')).length;
      return res.json({ unreadCount: count });
    }
    const count = await gmailAgent.getUnreadCount();
    res.json({ unreadCount: count });
  } catch (err) {
    console.error('Gmail unread error:', err.message);
    res.status(500).json({ error: 'Failed to get unread count', details: err.message });
  }
});

// POST /api/gmail/compose-draft — Refine/polish a rough draft with tone adjustments
router.post('/compose-draft', async (req, res) => {
  const { roughDraft, tone } = req.body;
  if (!roughDraft || !tone) {
    return res.status(400).json({ error: 'Missing roughDraft or tone' });
  }
  try {
    const polished = await geminiAgent.polishDraft(roughDraft, tone);
    res.json({ success: true, polishedDraft: polished });
  } catch (err) {
    console.error('Gmail draft compose error:', err.message);
    res.status(500).json({ error: 'Failed to polish draft', details: err.message });
  }
});

export default router;

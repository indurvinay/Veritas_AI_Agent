import { Router } from 'express';
import * as gmailAgent from '../agents/gmailAgent.js';
import * as driveAgent from '../agents/driveAgent.js';
import * as calendarAgent from '../agents/calendarAgent.js';
import { isDemo } from '../auth/googleAuth.js';
import { mockEmails, mockFiles, mockEvents } from '../utils/mockStore.js';

const router = Router();

// GET /api/search — Global search across Gmail, Drive, and Calendar
router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Missing search query parameter: q' });
  }

  const query = q.trim().toLowerCase();

  try {
    if (isDemo()) {
      // Mock Search
      const emails = mockEmails.filter(
        (e) =>
          (e.subject || '').toLowerCase().includes(query) ||
          (e.snippet || '').toLowerCase().includes(query) ||
          (e.body || '').toLowerCase().includes(query)
      );

      const files = mockFiles.filter(
        (f) =>
          (f.name || '').toLowerCase().includes(query)
      );

      const events = mockEvents.filter(
        (ev) =>
          (ev.summary || '').toLowerCase().includes(query) ||
          (ev.description || '').toLowerCase().includes(query)
      );

      return res.json({
        success: true,
        results: {
          emails: emails.slice(0, 5),
          files: files.slice(0, 5),
          events: events.slice(0, 5),
        },
        counts: {
          emails: emails.length,
          files: files.length,
          events: events.length,
        },
      });
    }

    // Real API Search (using Promise.allSettled for maximum stability)
    const [emailsResult, filesResult, eventsResult] = await Promise.allSettled([
      // Gmail search: List last 30 emails and search locally (standard Gmail API queries are slow; local filter is fast)
      gmailAgent.fetchEmails(30).then((emails) =>
        emails.filter(
          (e) =>
            (e.subject || '').toLowerCase().includes(query) ||
            (e.snippet || '').toLowerCase().includes(query) ||
            (e.body || '').toLowerCase().includes(query)
        )
      ),
      // Drive search: call Google Drive query
      driveAgent.searchFiles(query),
      // Calendar search: List upcoming 30 events and search locally
      calendarAgent.getUpcomingEvents(30).then((events) =>
        events.filter(
          (ev) =>
            (ev.summary || '').toLowerCase().includes(query) ||
            (ev.description || '').toLowerCase().includes(query)
        )
      ),
    ]);

    const emails = emailsResult.status === 'fulfilled' ? emailsResult.value : [];
    const files = filesResult.status === 'fulfilled' ? filesResult.value : [];
    const events = eventsResult.status === 'fulfilled' ? eventsResult.value : [];

    res.json({
      success: true,
      results: {
        emails: emails.slice(0, 5),
        files: files.slice(0, 5),
        events: events.slice(0, 5),
      },
      counts: {
        emails: emails.length,
        files: files.length,
        events: events.length,
      },
    });
  } catch (err) {
    console.error('Global search error:', err.message);
    res.status(500).json({ error: 'Global search failed', details: err.message });
  }
});

export default router;

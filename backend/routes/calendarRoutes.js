import { Router } from 'express';
import * as calendarAgent from '../agents/calendarAgent.js';
import * as memoryStore from '../memory/memoryStore.js';
import { isDemo } from '../auth/googleAuth.js';
import { mockEvents, addMockEvent, deleteMockEvent, updateMockEvent } from '../utils/mockStore.js';

const router = Router();

// GET /api/calendar/events — List upcoming events
router.get('/events', async (req, res) => {
  try {
    if (isDemo()) {
      const date = req.query.date;
      if (date) {
        const filtered = mockEvents.filter((e) => e.start?.startsWith(date));
        return res.json({ events: filtered, count: filtered.length });
      }
      return res.json({ events: mockEvents, count: mockEvents.length });
    }

    const maxResults = parseInt(req.query.max) || 20;
    const date = req.query.date;

    let events;
    if (date) {
      events = await calendarAgent.getEventsForDate(date);
    } else {
      events = await calendarAgent.getUpcomingEvents(maxResults);
    }
    res.json({ events, count: events.length });
  } catch (err) {
    console.error('Calendar fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch events', details: err.message });
  }
});

// POST /api/calendar/events — Create a new event
router.post('/events', async (req, res) => {
  try {
    const { summary, start, end, description } = req.body;
    if (!summary || !start || !end) {
      return res.status(400).json({ error: 'Missing required fields: summary, start, end' });
    }
    if (isDemo()) {
      const event = addMockEvent({ summary, start, end, description });
      await memoryStore.logAction('CREATE_EVENT', `Demo: Created event: "${summary}"`);
      return res.json({ success: true, event });
    }
    const event = await calendarAgent.createEvent(summary, start, end, description);
    await memoryStore.logAction('CREATE_EVENT', `Created event: "${summary}"`);
    res.json({ success: true, event });
  } catch (err) {
    console.error('Calendar create error:', err.message);
    res.status(500).json({ error: 'Failed to create event', details: err.message });
  }
});

// PUT /api/calendar/events/:id — Update an event
router.put('/events/:id', async (req, res) => {
  try {
    if (isDemo()) {
      const event = updateMockEvent(req.params.id, req.body);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      await memoryStore.logAction('UPDATE_EVENT', `Demo: Updated event: "${event.summary}"`);
      return res.json({ success: true, event });
    }
    const event = await calendarAgent.updateEvent(req.params.id, req.body);
    await memoryStore.logAction('UPDATE_EVENT', `Updated event: "${event.summary}"`);
    res.json({ success: true, event });
  } catch (err) {
    console.error('Calendar update error:', err.message);
    res.status(500).json({ error: 'Failed to update event', details: err.message });
  }
});

// DELETE /api/calendar/events/:id — Delete an event
router.delete('/events/:id', async (req, res) => {
  try {
    if (isDemo()) {
      deleteMockEvent(req.params.id);
      await memoryStore.logAction('DELETE_EVENT', `Demo: Deleted event ${req.params.id}`);
      return res.json({ success: true });
    }
    await calendarAgent.deleteEvent(req.params.id);
    await memoryStore.logAction('DELETE_EVENT', `Deleted event ${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Calendar delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete event', details: err.message });
  }
});

export default router;

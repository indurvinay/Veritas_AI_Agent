import { google } from 'googleapis';
import { getClient } from '../auth/googleAuth.js';

function getCalendar() {
  return google.calendar({ version: 'v3', auth: getClient() });
}

/**
 * Get upcoming calendar events.
 */
export async function getUpcomingEvents(maxResults = 20) {
  const calendar = getCalendar();
  const { data } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return (data.items || []).map((event) => ({
    id: event.id,
    summary: event.summary || '(No title)',
    description: event.description || '',
    start: event.start?.dateTime || event.start?.date,
    end: event.end?.dateTime || event.end?.date,
    location: event.location || '',
    htmlLink: event.htmlLink,
    status: event.status,
    created: event.created,
  }));
}

/**
 * Create a new calendar event.
 */
export async function createEvent(summary, startDateTime, endDateTime, description = '') {
  const calendar = getCalendar();
  const event = {
    summary,
    description,
    start: { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    end: { dateTime: endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  };

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return {
    id: data.id,
    summary: data.summary,
    start: data.start?.dateTime || data.start?.date,
    end: data.end?.dateTime || data.end?.date,
    htmlLink: data.htmlLink,
  };
}

/**
 * Update an existing calendar event.
 */
export async function updateEvent(eventId, updates) {
  const calendar = getCalendar();
  const eventUpdate = {};

  if (updates.summary) eventUpdate.summary = updates.summary;
  if (updates.description) eventUpdate.description = updates.description;
  if (updates.start) {
    eventUpdate.start = {
      dateTime: updates.start,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
  if (updates.end) {
    eventUpdate.end = {
      dateTime: updates.end,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  const { data } = await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: eventUpdate,
  });

  return {
    id: data.id,
    summary: data.summary,
    start: data.start?.dateTime || data.start?.date,
    end: data.end?.dateTime || data.end?.date,
  };
}

/**
 * Delete a calendar event.
 */
export async function deleteEvent(eventId) {
  const calendar = getCalendar();
  await calendar.events.delete({ calendarId: 'primary', eventId });
  return { success: true };
}

/**
 * Get events for a specific date.
 */
export async function getEventsForDate(dateStr) {
  const calendar = getCalendar();
  const startOfDay = new Date(dateStr);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);

  const { data } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (data.items || []).map((event) => ({
    id: event.id,
    summary: event.summary || '(No title)',
    description: event.description || '',
    start: event.start?.dateTime || event.start?.date,
    end: event.end?.dateTime || event.end?.date,
    location: event.location || '',
  }));
}

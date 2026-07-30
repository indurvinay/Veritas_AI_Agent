import { v4 as uuidv4 } from 'uuid';

export let mockEmails = [
  {
    id: 'mock-email-1',
    threadId: 'thread-1',
    subject: 'Arc Reactor Thermal Output Review',
    from: 'pepper.potts@starkindustries.com',
    to: 'tony.stark@starkindustries.com',
    date: new Date(Date.now() - 3600000).toUTCString(), // 1 hr ago
    snippet: 'Hi Tony, we need to finalize the schedule for the new reactor test tomorrow. Pepper.',
    body: `<h3>Hi Tony,</h3>
      <p>I reviewed the thermal outputs for the Mark 85 reactor core. We are seeing a 0.8% variance in the plasma containment field, but the overall output is within safety margins.</p>
      <p>Please review the testing schedule and let me know if you want to push it live tomorrow morning.</p>
      <p>Best,<br>Pepper Potts</p>`,
    labelIds: ['INBOX', 'UNREAD'],
    tag: 'JOB',
    tagColor: '#7B2FFF',
    tagEmoji: '💼',
    classification: 'JOB_RELATED',
    confidence: 0.95,
  },
  {
    id: 'mock-email-2',
    threadId: 'thread-2',
    subject: 'Audi e-tron Service Completed',
    from: 'happy.hogan@starkindustries.com',
    to: 'tony.stark@starkindustries.com',
    date: new Date(Date.now() - 7200000).toUTCString(), // 2 hrs ago
    snippet: 'The e-tron is back in the garage, fully charged. Ready for your drive.',
    body: `<p>Boss,</p>
      <p>Picked up the e-tron from the service center. They updated the drive software and rotated the tires. Charging is back at 100% efficiency.</p>
      <p>Let me know if you need me to bring it around to the workshop.</p>
      <p>Happy</p>`,
    labelIds: ['INBOX'],
    tag: 'REAL',
    tagColor: '#00FF88',
    tagEmoji: '🟢',
    classification: 'PERSONAL',
    confidence: 0.9,
  },
  {
    id: 'mock-email-3',
    threadId: 'thread-3',
    subject: 'Avengers Initiative Briefing - Confidential',
    from: 'nick.fury@shield.gov',
    to: 'tony.stark@starkindustries.com',
    date: new Date(Date.now() - 86400000).toUTCString(), // 1 day ago
    snippet: 'We have some developments on the Tesseract research. Need your eyes.',
    body: `<p>Stark,</p>
      <p>S.H.I.E.L.D. research teams have completed the initial energy signature scan of the Tesseract. The pattern matches the energy readings from your father's old notes, but with some unexplained fluctuations in the gamma range.</p>
      <p>I need you at the Helicarrier. Secure lines only.</p>
      <p>Fury</p>`,
    labelIds: ['INBOX'],
    tag: 'REAL',
    tagColor: '#00FF88',
    tagEmoji: '🟢',
    classification: 'IMPORTANT',
    confidence: 0.88,
  },
  {
    id: 'mock-email-4',
    threadId: 'thread-4',
    subject: 'GET RICH INSTANTLY! No Effort Required!',
    from: 'win.lottery.now@spam-network.net',
    to: 'tony.stark@starkindustries.com',
    date: new Date(Date.now() - 172800000).toUTCString(), // 2 days ago
    snippet: 'CONGRATULATIONS! You have been randomly chosen to claim a cash prize...',
    body: `<p>DEAR WINNER,</p>
      <p>YOUR EMAIL ADDRESS HAS WON $10,000,000.00 USD IN THE ANNUAL INTERNATIONAL GIGA-LOTTERY!</p>
      <p>CLICK HERE TO VERIFY YOUR ACCOUNT AND CLAIM YOUR CASH PRIZE IMMEDIATELY!</p>`,
    labelIds: ['SPAM'],
    tag: 'SPAM',
    tagColor: '#FF3A3A',
    tagEmoji: '🔴',
    classification: 'SPAM',
    confidence: 0.99,
  },
];

export let mockEvents = [
  {
    id: 'mock-event-1',
    summary: 'Stark Arc Reactor Test Run',
    description: 'Test the thermal efficiency of the new palladium core field.',
    start: new Date(Date.now() + 3600000 * 2).toISOString(), // in 2 hours
    end: new Date(Date.now() + 3600000 * 3.5).toISOString(),
    location: 'Stark Lab Workshop',
    status: 'confirmed',
  },
  {
    id: 'mock-event-2',
    summary: 'Quarterly Stark Industries Review',
    description: 'Meeting with Pepper Potts and board of directors.',
    start: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    end: new Date(Date.now() + 86400000 + 3600000 * 2).toISOString(),
    location: 'Conference Room C',
    status: 'confirmed',
  },
  {
    id: 'mock-event-3',
    summary: 'Avengers Briefing',
    description: 'Helicarrier deck 3, briefing on secure channels.',
    start: new Date(Date.now() + 172800000).toISOString(), // in 2 days
    end: new Date(Date.now() + 172800000 + 3600000 * 3).toISOString(),
    location: 'S.H.I.E.L.D. Helicarrier',
    status: 'confirmed',
  },
];

export let mockFiles = [
  {
    id: 'mock-file-1',
    name: 'arc_reactor_schematics_v2.pdf',
    mimeType: 'application/pdf',
    size: '12.4 MB',
    modifiedTime: new Date(Date.now() - 3600000 * 4).toISOString(),
    webViewLink: '#',
  },
  {
    id: 'mock-file-2',
    name: 'mark_85_flight_test_logs.doc',
    mimeType: 'application/msword',
    size: '4.2 MB',
    modifiedTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    webViewLink: '#',
  },
  {
    id: 'mock-file-3',
    name: 'avengers_compound_blueprints.zip',
    mimeType: 'application/zip',
    size: '142.8 MB',
    modifiedTime: new Date(Date.now() - 86400000 * 5).toISOString(),
    webViewLink: '#',
  },
  {
    id: 'mock-file-4',
    name: 'tony_and_pepper_wedding_photo.jpg',
    mimeType: 'image/jpeg',
    size: '5.1 MB',
    modifiedTime: new Date(Date.now() - 86400000 * 15).toISOString(),
    webViewLink: '#',
  },
];

export let mockSheetData = {
  headers: ['Timestamp', 'ActionType', 'Details', 'Outcome'],
  rows: [
    [
      new Date(Date.now() - 3600000 * 5).toISOString(),
      'SYS_DIAGNOSTICS',
      'All thermal subsystems running at nominal values.',
      'SUCCESS',
    ],
    [
      new Date(Date.now() - 3600000 * 4).toISOString(),
      'ARC_CORE_MONITOR',
      'Core temperature stabilized at 12,000K.',
      'SUCCESS',
    ],
    [
      new Date(Date.now() - 3600000 * 3).toISOString(),
      'ARMOR_CALIBRATION',
      'Mark 85 boot thrusters calibrated at 100%.',
      'SUCCESS',
    ],
    [
      new Date(Date.now() - 3600000 * 2).toISOString(),
      'SECURITY_SCAN',
      'Workshop perimeter check: 0 intrusions.',
      'SUCCESS',
    ],
  ],
};

// ─── Mutators ───

export function appendMockRow(values) {
  mockSheetData.rows.push(values);
}

export function updateMockCell(range, value) {
  // Simple mock ranges (e.g. A1, B2)
  const match = range.match(/([A-Z]+)([0-9]+)/);
  if (match) {
    const colStr = match[1];
    const rowIdx = parseInt(match[2], 10) - 1;
    // Map column letter to index
    const colIdx = colStr.charCodeAt(0) - 65;
    if (mockSheetData.rows[rowIdx]) {
      mockSheetData.rows[rowIdx][colIdx] = value;
    }
  }
}

export function clearMockRange(range) {
  // Clear entire rows or cells
  mockSheetData.rows = mockSheetData.rows.slice(0, 3);
}

export function addMockEvent(event) {
  const newEvent = {
    id: `mock-event-${uuidv4()}`,
    summary: event.summary,
    description: event.description || '',
    start: event.start,
    end: event.end,
    location: event.location || 'Stark Workshop',
    status: 'confirmed',
  };
  mockEvents.push(newEvent);
  return newEvent;
}

export function deleteMockEvent(id) {
  mockEvents = mockEvents.filter((e) => e.id !== id);
}

export function updateMockEvent(id, updates) {
  const idx = mockEvents.findIndex((e) => e.id === id);
  if (idx !== -1) {
    mockEvents[idx] = { ...mockEvents[idx], ...updates };
    return mockEvents[idx];
  }
  return null;
}

export function uploadMockFile(name, size, mimeType) {
  const file = {
    id: `mock-file-${uuidv4()}`,
    name,
    mimeType,
    size,
    modifiedTime: new Date().toISOString(),
    webViewLink: '#',
  };
  mockFiles.unshift(file);
  return file;
}

export function deleteMockFile(id) {
  mockFiles = mockFiles.filter((f) => f.id !== id);
}

export function trashMockEmail(id) {
  mockEmails = mockEmails.filter((e) => e.id !== id);
}

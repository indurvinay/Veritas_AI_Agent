import { google } from 'googleapis';
import { getClient } from '../auth/googleAuth.js';

function getSheets() {
  return google.sheets({ version: 'v4', auth: getClient() });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME;

/**
 * Read all data from the configured sheet.
 */
export async function readSheet() {
  const sheets = getSheets();
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_NAME,
  });

  const rows = data.values || [];
  if (rows.length === 0) return { headers: [], rows: [] };

  return {
    headers: rows[0],
    rows: rows.slice(1),
    totalRows: rows.length - 1,
  };
}

/**
 * Append a row of values to the sheet.
 */
export async function appendRow(values) {
  const sheets = getSheets();
  const { data } = await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: SHEET_NAME,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values],
    },
  });

  return {
    updatedRange: data.updates?.updatedRange,
    updatedRows: data.updates?.updatedRows,
  };
}

/**
 * Update a specific cell or range.
 */
export async function updateCell(range, value) {
  const sheets = getSheets();
  const fullRange = `${SHEET_NAME}!${range}`;
  const { data } = await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: fullRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[value]],
    },
  });

  return {
    updatedRange: data.updatedRange,
    updatedCells: data.updatedCells,
  };
}

/**
 * Clear a range of cells.
 */
export async function clearRange(range) {
  const sheets = getSheets();
  const fullRange = `${SHEET_NAME}!${range}`;
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: fullRange,
  });

  return { success: true, clearedRange: fullRange };
}

/**
 * Log an agent activity to the sheet (auto-append a timestamped row).
 */
export async function logActivity(action, details, outcome = 'SUCCESS') {
  const timestamp = new Date().toISOString();
  const values = [timestamp, action, details, outcome];
  return await appendRow(values);
}

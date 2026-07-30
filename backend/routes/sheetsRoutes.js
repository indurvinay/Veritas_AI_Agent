import { Router } from 'express';
import * as sheetsAgent from '../agents/sheetsAgent.js';
import { isDemo } from '../auth/googleAuth.js';
import { mockSheetData, appendMockRow, updateMockCell, clearMockRange } from '../utils/mockStore.js';

const router = Router();

// GET /api/sheets/data — Read sheet data
router.get('/data', async (req, res) => {
  try {
    if (isDemo()) {
      return res.json(mockSheetData);
    }
    const data = await sheetsAgent.readSheet();
    res.json(data);
  } catch (err) {
    console.error('Sheets read error:', err.message);
    res.status(500).json({ error: 'Failed to read sheet', details: err.message });
  }
});

// POST /api/sheets/append — Append a row
router.post('/append', async (req, res) => {
  try {
    const { values } = req.body;
    if (!values || !Array.isArray(values)) {
      return res.status(400).json({ error: 'Missing or invalid values array' });
    }
    if (isDemo()) {
      appendMockRow(values);
      return res.json({ success: true, updatedRange: 'Sheet1!A1', updatedRows: 1 });
    }
    const result = await sheetsAgent.appendRow(values);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Sheets append error:', err.message);
    res.status(500).json({ error: 'Failed to append row', details: err.message });
  }
});

// PUT /api/sheets/update — Update a cell
router.put('/update', async (req, res) => {
  try {
    const { range, value } = req.body;
    if (!range || value === undefined) {
      return res.status(400).json({ error: 'Missing range or value' });
    }
    if (isDemo()) {
      updateMockCell(range, value);
      return res.json({ success: true, updatedRange: range, updatedCells: 1 });
    }
    const result = await sheetsAgent.updateCell(range, value);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Sheets update error:', err.message);
    res.status(500).json({ error: 'Failed to update cell', details: err.message });
  }
});

// DELETE /api/sheets/clear — Clear a range
router.delete('/clear', async (req, res) => {
  try {
    const { range } = req.body;
    if (!range) {
      return res.status(400).json({ error: 'Missing range' });
    }
    if (isDemo()) {
      clearMockRange(range);
      return res.json({ success: true, clearedRange: range });
    }
    const result = await sheetsAgent.clearRange(range);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Sheets clear error:', err.message);
    res.status(500).json({ error: 'Failed to clear range', details: err.message });
  }
});

// GET /api/sheets/activity — Agent activity log from sheet
router.get('/activity', async (req, res) => {
  try {
    if (isDemo()) {
      return res.json({ log: mockSheetData.rows, headers: mockSheetData.headers });
    }
    const data = await sheetsAgent.readSheet();
    res.json({ log: data.rows, headers: data.headers });
  } catch (err) {
    console.error('Sheets activity error:', err.message);
    res.status(500).json({ error: 'Failed to read activity log', details: err.message });
  }
});

export default router;

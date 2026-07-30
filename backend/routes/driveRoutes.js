import { Router } from 'express';
import multer from 'multer';
import * as driveAgent from '../agents/driveAgent.js';
import * as memoryStore from '../memory/memoryStore.js';
import { isDemo } from '../auth/googleAuth.js';
import { mockFiles, uploadMockFile, deleteMockFile } from '../utils/mockStore.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// GET /api/drive/files — List files
router.get('/files', async (req, res) => {
  try {
    if (isDemo()) {
      return res.json({ files: mockFiles, count: mockFiles.length });
    }
    const maxResults = parseInt(req.query.max) || 20;
    const files = await driveAgent.listFiles(maxResults);
    res.json({ files, count: files.length });
  } catch (err) {
    console.error('Drive list error:', err.message);
    res.status(500).json({ error: 'Failed to list files', details: err.message });
  }
});

// POST /api/drive/upload — Upload a file (multipart)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    if (isDemo()) {
      const sizeStr = `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`;
      const result = uploadMockFile(req.file.originalname, sizeStr, req.file.mimetype);
      await memoryStore.logAction('UPLOAD_FILE', `Demo: Uploaded: "${req.file.originalname}"`);
      return res.json({ success: true, file: result });
    }
    const result = await driveAgent.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    await memoryStore.logAction('UPLOAD_FILE', `Uploaded: "${req.file.originalname}"`);
    res.json({ success: true, file: result });
  } catch (err) {
    console.error('Drive upload error:', err.message);
    res.status(500).json({ error: 'Failed to upload file', details: err.message });
  }
});

// GET /api/drive/download/:id — Download a file
router.get('/download/:id', async (req, res) => {
  try {
    if (isDemo()) {
      const file = mockFiles.find((f) => f.id === req.params.id);
      if (!file) return res.status(404).json({ error: 'File not found' });
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      return res.send(`MOCK FILE CONTENT FOR: ${file.name}`);
    }
    const { stream, fileName, mimeType } = await driveAgent.downloadFile(req.params.id);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);
    stream.pipe(res);
  } catch (err) {
    console.error('Drive download error:', err.message);
    res.status(500).json({ error: 'Failed to download file', details: err.message });
  }
});

// DELETE /api/drive/files/:id — Delete a file
router.delete('/files/:id', async (req, res) => {
  try {
    if (isDemo()) {
      deleteMockFile(req.params.id);
      await memoryStore.logAction('DELETE_FILE', `Demo: Deleted file ${req.params.id}`);
      return res.json({ success: true });
    }
    await driveAgent.deleteFile(req.params.id);
    await memoryStore.logAction('DELETE_FILE', `Deleted file ${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Drive delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete file', details: err.message });
  }
});

// GET /api/drive/search — Search files
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Missing search query parameter: q' });
    }
    if (isDemo()) {
      const filtered = mockFiles.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));
      return res.json({ files: filtered, count: filtered.length });
    }
    const files = await driveAgent.searchFiles(q);
    res.json({ files, count: files.length });
  } catch (err) {
    console.error('Drive search error:', err.message);
    res.status(500).json({ error: 'Failed to search files', details: err.message });
  }
});

export default router;

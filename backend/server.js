import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';

import { loadTokens, isAuthenticated } from './auth/googleAuth.js';
import authRoutes from './routes/authRoutes.js';
import gmailRoutes from './routes/gmailRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import driveRoutes from './routes/driveRoutes.js';
import sheetsRoutes from './routes/sheetsRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import { getUnreadCount } from './agents/gmailAgent.js';
import { requireAuth } from './middleware/authMiddleware.js';

const PORT = process.env.PORT || 5000;

// ─── Express App ───
const app = express();
const httpServer = createServer(app);

// ─── Socket.io ───
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─── Middleware ───
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'jarvis-x-fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// ─── Routes ───
app.use(authRoutes);
app.use('/api/gmail', requireAuth, gmailRoutes);
app.use('/api/calendar', requireAuth, calendarRoutes);
app.use('/api/drive', requireAuth, driveRoutes);
app.use('/api/sheets', requireAuth, sheetsRoutes);
app.use('/api/chat', requireAuth, chatRoutes);
app.use('/api/news', requireAuth, newsRoutes);
app.use('/api/search', requireAuth, searchRoutes);

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    name: 'Veritas AI Backend',
    uptime: process.uptime(),
    authenticated: isAuthenticated(),
  });
});

// ─── Serve Frontend in Production ───
const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.use((req, res, next) => {
    if (req.method === 'GET' && req.accepts('html')) {
      res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    } else {
      next();
    }
  });
}

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ─── Socket.io Connection ───
io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`⚡ Client disconnected: ${socket.id}`);
  });
});

// ─── Cron Job: Check for new emails every 5 minutes ───
let lastUnreadCount = 0;
cron.schedule('*/5 * * * *', async () => {
  if (!isAuthenticated()) return;

  try {
    const count = await getUnreadCount();
    if (count > lastUnreadCount) {
      const newCount = count - lastUnreadCount;
      io.emit('new-emails', {
        count: newCount,
        total: count,
        message: `📧 ${newCount} new email${newCount > 1 ? 's' : ''} received`,
      });
      console.log(`📧 ${newCount} new emails detected — notified clients`);
    }
    lastUnreadCount = count;
  } catch (err) {
    console.error('Cron email check failed:', err.message);
  }
});

// ─── Startup ───
async function start() {
  // Try to restore OAuth tokens from disk
  const tokens = await loadTokens();
  if (tokens) {
    console.log('🔑 Restored OAuth tokens from memory');
  } else {
    console.log('🔓 No saved tokens — user needs to authenticate');
  }

  httpServer.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════╗
    ║         Veritas AI Backend Online         ║
    ║───────────────────────────────────────────║
    ║  Server:    http://localhost:${PORT}          ║
    ║  Auth:      http://localhost:${PORT}/auth/google ║
    ║  Status:    http://localhost:${PORT}/auth/status  ║
    ║  Health:    http://localhost:${PORT}/api/health   ║
    ╚═══════════════════════════════════════════╝
    `);
  });
}

start().catch((err) => {
  console.error('Failed to start Veritas AI:', err);
  process.exit(1);
});

import { Router } from 'express';
import {
  getAuthUrl,
  handleCallback,
  isAuthenticated,
  getUserInfo,
  logout,
  enableDemo,
} from '../auth/googleAuth.js';

const router = Router();

/**
 * Determine the destination URL after auth callback or demo login.
 * In production or hosted environment, redirects to process.env.FRONTEND_URL or relative root '/'.
 */
function getFrontendUrl() {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  if (process.env.NODE_ENV === 'production') return '/';
  return 'http://localhost:5173';
}

// Redirect to Google consent screen
router.get('/auth/google', (req, res) => {
  const url = getAuthUrl(req);
  res.redirect(url);
});

// Demo mode login
router.get('/auth/demo', (req, res) => {
  enableDemo(true);
  res.redirect(getFrontendUrl());
});

// OAuth2 callback — exchange code for tokens
router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    // If accessed directly without an authorization code (e.g. page refresh or direct URL), gracefully redirect home
    return res.redirect(getFrontendUrl());
  }
  try {
    await handleCallback(code, req);
    // Redirect to the frontend after successful auth
    res.redirect(getFrontendUrl());
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.redirect(getFrontendUrl());
  }
});

// Check authentication status
router.get('/auth/status', async (req, res) => {
  if (isAuthenticated()) {
    try {
      const user = await getUserInfo();
      return res.json({ authenticated: true, user });
    } catch (err) {
      // Token might be expired and refresh failed
      return res.json({ authenticated: false });
    }
  }
  res.json({ authenticated: false });
});

// Logout
router.get('/auth/logout', async (req, res) => {
  enableDemo(false);
  await logout();
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;


import { isAuthenticated } from '../auth/googleAuth.js';

export function requireAuth(req, res, next) {
  if (!isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized. Please authenticate with Google or use Demo Mode.' });
  }
  next();
}

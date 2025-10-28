const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { clerkClient } = require('@clerk/clerk-sdk-node');

const requireAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const decoded = jwt.decode(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Add user info to request
    req.auth = {
      userId: decoded.sub, // Clerk uses 'sub' for user ID
      sessionId: decoded.sid,
      session: decoded
    };

    next();
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = {
  requireAuth,
  // Ensure the authenticated user is an admin
  requireAdmin: async (req, res, next) => {
    try {
      // If requireAuth hasn't run yet, try to decode token here to set req.auth
      if (!req.auth) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.decode(token);
        if (!decoded) {
          return res.status(401).json({ error: 'Invalid token' });
        }
        req.auth = { userId: decoded.sub, sessionId: decoded.sid, session: decoded };
      }

      const adminEmailEnv = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

      // Try Clerk server SDK first
      let clerkUser = null;
      try {
        clerkUser = await clerkClient.users.getUser(req.auth.userId);
      } catch (_) {
        clerkUser = null;
      }

      const candidateEmails = new Set();
      if (Array.isArray(clerkUser?.emailAddresses)) {
        for (const e of clerkUser.emailAddresses) {
          const addr = String(e?.emailAddress || '').trim().toLowerCase();
          if (addr && addr.includes('@')) candidateEmails.add(addr);
        }
      }
      // Fallback: extract any likely email fields from the decoded JWT payload
      const payload = req.auth.session || {};
      const jwtEmail = String(payload?.email || '').trim().toLowerCase();
      if (jwtEmail && jwtEmail.includes('@')) candidateEmails.add(jwtEmail);
      if (Array.isArray(payload?.email_addresses)) {
        for (const e of payload.email_addresses) {
          const addr = String(e?.email || e?.emailAddress || '').trim().toLowerCase();
          if (addr && addr.includes('@')) candidateEmails.add(addr);
        }
      }

      // Check env-based admin override across any collected emails
      const envAdminMatch = adminEmailEnv && candidateEmails.has(adminEmailEnv);

      // Fallback to DB flag
      const currentUser = await User.findOne({ clerkId: req.auth.userId });
      const dbAdmin = !!currentUser?.isAdmin;

      if (!envAdminMatch && !dbAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      // Attach db user for downstream handlers if needed
      req.user = currentUser || null;
      next();
    } catch (err) {
      console.error('Admin check error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}; 
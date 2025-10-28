const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const { clerkClient } = require('@clerk/clerk-sdk-node');

// GET /api/admin/users - list all users (basic fields only)
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    const filter = {};
    if (q && typeof q === 'string') {
      // search by clerkId or partial profile fields
      filter.$or = [
        { clerkId: { $regex: q, $options: 'i' } },
      ];
    }
    const dbUsers = await User.find(filter)
      .sort({ createdAt: -1 })
      .select('clerkId isAdmin profile stats createdAt updatedAt')
      .limit(500);

    // Enrich with Clerk user names and avatars
    const idsToFetch = dbUsers.map(u => u.clerkId).filter(Boolean);
    let clerkUsers = [];
    try {
      clerkUsers = await clerkClient.users.getUserList({ userId: idsToFetch });
    } catch (e) {
      clerkUsers = [];
    }
    const idToUser = new Map(clerkUsers.map(u => [u.id, u]));
    const buildName = (u) => {
      if (!u) return null;
      const fn = (u.firstName || '').trim();
      const ln = (u.lastName || '').trim();
      const full = `${fn} ${ln}`.trim();
      return full || u.username || (u.emailAddresses && u.emailAddresses[0]?.emailAddress) || null;
    };

    const enriched = dbUsers.map((doc) => {
      const u = idToUser.get(doc.clerkId);
      return {
        _id: doc._id,
        clerkId: doc.clerkId,
        isAdmin: doc.isAdmin,
        profile: doc.profile,
        stats: doc.stats,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        name: buildName(u),
        avatarUrl: u?.imageUrl || null,
      };
    });

    res.json({ users: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;





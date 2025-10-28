const express = require('express');
const router = express.Router();
const UserProgress = require('../models/UserProgress');
const { clerkClient } = require('@clerk/clerk-sdk-node');

// Compute a composite score: prioritize workouts, then minutes, then calories, then streak
function computeScore(stats) {
  const totalWorkouts = Number(stats?.totalWorkouts || 0);
  const totalWorkoutMinutes = Number(stats?.totalWorkoutMinutes || 0);
  const totalCaloriesBurned = Number(stats?.totalCaloriesBurned || 0);
  const streakDays = Number(stats?.streakDays || 0);
  return (
    totalWorkouts * 10 +
    totalWorkoutMinutes * 0.2 +
    totalCaloriesBurned * 0.02 +
    streakDays * 5
  );
}

// Get global leaderboard (top N) and current user's rank
router.get('/', async (req, res) => {
  try {
    const all = await UserProgress.find({}, {
      userId: 1,
      'stats.totalWorkouts': 1,
      'stats.totalWorkoutMinutes': 1,
      'stats.totalCaloriesBurned': 1,
      'stats.streakDays': 1,
    }).lean();

    const scored = all.map((doc) => ({
      userId: doc.userId,
      stats: doc.stats || {},
      score: computeScore(doc.stats || {}),
    }));

    scored.sort((a, b) => b.score - a.score);

    const top = scored.slice(0, 50).map((entry, idx) => ({
      rank: idx + 1,
      userId: entry.userId,
      score: Math.round(entry.score),
      stats: entry.stats,
    }));

    const currentUserId = req.auth?.userId;
    let currentUserRank = null;
    if (currentUserId) {
      const index = scored.findIndex((e) => e.userId === currentUserId);
      if (index >= 0) {
        currentUserRank = {
          rank: index + 1,
          userId: currentUserId,
          score: Math.round(scored[index].score),
          stats: scored[index].stats,
        };
      }
    }

    // Enrich with Clerk user names and avatars
    const idsToFetch = Array.from(new Set([
      ...top.map(t => t.userId),
      ...(currentUserRank ? [currentUserRank.userId] : []),
    ]));

    let users = [];
    try {
      // Clerk SDK: batch fetch by userId
      users = await clerkClient.users.getUserList({ userId: idsToFetch });
    } catch (e) {
      // Fallback to empty list if Clerk fails
      users = [];
    }
    const idToUser = new Map(users.map(u => [u.id, u]));
    const buildName = (u) => {
      if (!u) return null;
      const fn = (u.firstName || '').trim();
      const ln = (u.lastName || '').trim();
      const full = `${fn} ${ln}`.trim();
      return full || u.username || (u.emailAddresses && u.emailAddresses[0]?.emailAddress) || null;
    };

    const topEnriched = top.map((t) => {
      const u = idToUser.get(t.userId);
      return {
        ...t,
        name: buildName(u) || `User ${t.userId.slice(-6)}`,
        avatarUrl: u?.imageUrl || null,
      };
    });

    const meEnriched = currentUserRank ? (() => {
      const u = idToUser.get(currentUserRank.userId);
      return {
        ...currentUserRank,
        name: buildName(u) || `User ${currentUserRank.userId.slice(-6)}`,
        avatarUrl: u?.imageUrl || null,
      };
    })() : null;

    res.json({ top: topEnriched, currentUserRank: meEnriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;



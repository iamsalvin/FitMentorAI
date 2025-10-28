const User = require('../models/User');

const userService = {
  // Get or create user based on Clerk ID
  async getOrCreateUser(clerkId) {
    let user = await User.findOne({ clerkId });
    
    if (!user) {
      user = await User.create({
        clerkId,
        profile: {},
        stats: {
          totalWorkouts: 0,
          totalWorkoutMinutes: 0,
          streakDays: 0,
          caloriesBurned: 0
        }
      });
    }
    
    return user;
  },

  // Update user profile
  async updateProfile(clerkId, profileData) {
    const user = await User.findOneAndUpdate(
      { clerkId },
      { $set: { profile: profileData } },
      { new: true }
    );
    return user;
  },

  // Update user stats
  async updateStats(clerkId, statsUpdate) {
    const user = await User.findOneAndUpdate(
      { clerkId },
      { $inc: statsUpdate },
      { new: true }
    );
    return user;
  },

  // Get user's workout suggestions based on profile
  async getWorkoutSuggestions(clerkId) {
    const user = await User.findOne({ clerkId });
    if (!user) throw new Error('User not found');

    // Basic suggestion logic based on user's profile
    const suggestions = {
      workoutType: user.profile.fitnessGoal,
      duration: user.profile.preferredWorkoutDuration,
      intensity: user.profile.activityLevel,
      exercises: []
    };

    // Add exercise suggestions based on goals
    switch (user.profile.fitnessGoal) {
      case 'weight_loss':
        suggestions.exercises = [
          { type: 'cardio', duration: 20 },
          { type: 'hiit', duration: 15 },
          { type: 'strength', duration: 10 }
        ];
        break;
      case 'muscle_gain':
        suggestions.exercises = [
          { type: 'strength', duration: 30 },
          { type: 'resistance', duration: 10 },
          { type: 'cardio', duration: 5 }
        ];
        break;
      default:
        suggestions.exercises = [
          { type: 'mixed', duration: 15 },
          { type: 'cardio', duration: 15 },
          { type: 'strength', duration: 15 }
        ];
    }

    return suggestions;
  }
};

module.exports = userService; 
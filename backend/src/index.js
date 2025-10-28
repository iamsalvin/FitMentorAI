const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Routes
const workoutRoutes = require('./routes/workout.routes');
const nutritionRoutes = require('./routes/nutrition.routes');
const progressRoutes = require('./routes/progress.routes');
const challengeRoutes = require('./routes/challenge.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const userWorkoutRoutes = require('./routes/userWorkout.routes');
const userRoutes = require('./routes/user.routes');
const aiRoutes = require('./routes/ai.routes');
const adminRoutes = require('./routes/admin.routes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Protected Routes
app.use('/api/workouts', ClerkExpressRequireAuth(), workoutRoutes);
app.use('/api/nutrition', ClerkExpressRequireAuth(), nutritionRoutes);
app.use('/api/progress', ClerkExpressRequireAuth(), progressRoutes);
app.use('/api/challenges', ClerkExpressRequireAuth(), challengeRoutes);
app.use('/api/user-workouts', ClerkExpressRequireAuth(), userWorkoutRoutes);
app.use('/api/leaderboard', ClerkExpressRequireAuth(), leaderboardRoutes);
app.use('/api/user', ClerkExpressRequireAuth(), userRoutes);
app.use('/api/ai', ClerkExpressRequireAuth(), aiRoutes);
app.use('/api/admin', ClerkExpressRequireAuth(), adminRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

// Routes
import workoutRoutes from './routes/workout.routes';
import nutritionRoutes from './routes/nutrition.routes';
import progressRoutes from './routes/progress.routes';
import challengeRoutes from './routes/challenge.routes';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Protected Routes
app.use('/api/workouts', ClerkExpressRequireAuth(), workoutRoutes);
app.use('/api/nutrition', ClerkExpressRequireAuth(), nutritionRoutes);
app.use('/api/progress', ClerkExpressRequireAuth(), progressRoutes);
app.use('/api/challenges', ClerkExpressRequireAuth(), challengeRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
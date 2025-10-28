import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await window.Clerk?.session?.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User API functions
export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: any) => api.put('/user/profile', data),
  getStats: () => api.get('/user/stats'),
  getSuggestions: () => api.get('/user/suggestions'),
};

// API functions
export const workoutApi = {
  getAll: () => api.get('/workouts'),
  getOne: (id: string) => api.get(`/workouts/${id}`),
  create: (data: any) => api.post('/workouts', data),
  update: (id: string, data: any) => api.put(`/workouts/${id}`, data),
  delete: (id: string) => api.delete(`/workouts/${id}`),
  complete: (id: string) => api.post(`/workouts/${id}/complete`),
};

export const nutritionApi = {
  getAll: (startDate?: string, endDate?: string) => 
    api.get('/nutrition', { params: { startDate, endDate } }),
  getDaily: (date: string) => api.get(`/nutrition/daily/${date}`),
  create: (data: any) => api.post('/nutrition', data),
  addMeal: (data: any) => api.post('/nutrition/meal', data),
  update: (id: string, data: any) => api.put(`/nutrition/${id}`, data),
  delete: (id: string) => api.delete(`/nutrition/${id}`),
};

// Progress API functions
export const progressApi = {
  getUserProgress: () => api.get('/progress'),
  updateStats: (stats: any) => api.put('/progress/stats', stats),
  addWorkout: (workout: any) => api.post('/progress/workout', workout),
  updateMeasurements: (measurements: any) => api.put('/progress/measurements', measurements),
  addWeightEntry: (weight: number) => api.post('/progress/weight', { weight }),
  updateGoals: (goals: any) => api.put('/progress/goals', goals),
};

export const challengeApi = {
  getAll: () => api.get('/challenges'),
  getCompleted: () => api.get('/challenges/completed'),
  getOne: (id: string) => api.get(`/challenges/${id}`),
  create: (data: any) => api.post('/challenges', data),
  update: (id: string, data: any) => api.put(`/challenges/${id}`, data),
  updateProgress: (id: string, progress: number) => 
    api.put(`/challenges/${id}/progress`, { progress }),
  delete: (id: string) => api.delete(`/challenges/${id}`),
}; 

// Export the authenticated axios instance for custom calls
export const authedApi = api;

export const userWorkoutApi = {
  getAll: () => api.get('/user-workouts'),
  getOne: (id: string) => api.get(`/user-workouts/${id}`),
  create: (data: any) => api.post('/user-workouts', data),
  delete: (id: string) => api.delete(`/user-workouts/${id}`),
};

export const sessionApi = {
  // Log a completed session from a saved workout plan
  completeFromPlan: (payload: { workoutId: string; dayIndex: number; caloriesBurned?: number; duration?: number }) =>
    api.post('/progress/workout', payload),
};

export const leaderboardApi = {
  get: () => api.get('/leaderboard'),
};

export const chatApi = {
  send: (messages: Array<{ role: 'user' | 'assistant'; content: string }>) =>
    api.post('/ai/chat', { messages }),
};

export const quizApi = {
  getSessionQuiz: (sessionContext: any) => api.post('/ai/session-quiz', { sessionContext }),
  scoreQuiz: (quiz: any, answers: number[]) => api.post('/ai/session-quiz-score', { quiz, answers }),
};

export const coachApi = {
  getDietAdvice: (payload: { profile?: any; nutritionSummary?: any; preferences?: any }) =>
    api.post('/ai/diet-coach', payload),
};

// Admin API functions
export const adminApi = {
  getUsers: (query?: string) => api.get('/admin/users', { params: { q: query } }),
};
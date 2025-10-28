import axios from 'axios';
import { authedApi } from './api';

export interface WorkoutPlanRequest {
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  goal: 'weight_loss' | 'muscle_gain' | 'general_fitness';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  equipment: string[];
}

interface WorkoutPlanResponse {
  result?: {
    goal: string;
    fitness_level: string;
    total_weeks: number;
    schedule: {
      days_per_week: number;
      session_duration: number;
    };
    exercises: Array<{
      day: string;
      exercises: Array<{
        name: string;
        duration: string;
        repetitions: string;
        sets: string;
        equipment: string;
      }>;
    }>;
    seo_title?: string;
    seo_content?: string;
    seo_keywords?: string;
  };
  message?: string;
  error?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const workoutAIService = {
  async generateWorkoutPlan(params: WorkoutPlanRequest): Promise<WorkoutPlanResponse> {
    try {
      const response = await authedApi.post(`/ai/workout-plan`, params);
      return response.data;
    } catch (error: any) {
      console.error('Error generating workout plan:', error.response?.data || error);
      throw new Error(error.response?.data?.error || 'Failed to generate workout plan');
    }
  },
  async analyzeFoodPlate(imageUrl: string) {
    // Fallback for URL-based analysis via Gemini: fetch image and proxy via backend as base64 not necessary; use direct URL in future.
    // Here we send the URL for now (backend expects file upload in /ai/analyze-meal). We'll keep the UI and add an upload UI soon.
    return { message: 'Switch to upload mode on Diet page' };
  }
};
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';
import { progressApi } from '@/services/api';

interface ProgressContextType {
  userProgress: any;
  isLoading: boolean;
  error: string | null;
  refreshProgress: () => Promise<void>;
  updateStats: (stats: any) => Promise<void>;
  addWorkout: (workout: any) => Promise<void>;
  updateMeasurements: (measurements: any) => Promise<void>;
  addWeightEntry: (weight: number) => Promise<void>;
  updateGoals: (goals: any) => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn } = useUser();
  const [userProgress, setUserProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProgress = async () => {
    if (!isSignedIn) return;
    
    try {
      setIsLoading(true);
      const data = await progressApi.getUserProgress();
      setUserProgress(data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch progress data');
      console.error('Error fetching progress:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStats = async (stats: any) => {
    try {
      const response = await progressApi.updateStats(stats);
      setUserProgress(response.data);
    } catch (err) {
      setError('Failed to update stats');
      throw err;
    }
  };

  const addWorkout = async (workout: any) => {
    try {
      const response = await progressApi.addWorkout(workout);
      setUserProgress(response.data);
    } catch (err) {
      setError('Failed to add workout');
      throw err;
    }
  };

  const updateMeasurements = async (measurements: any) => {
    try {
      const response = await progressApi.updateMeasurements(measurements);
      setUserProgress(response.data);
    } catch (err) {
      setError('Failed to update measurements');
      throw err;
    }
  };

  const addWeightEntry = async (weight: number) => {
    try {
      const response = await progressApi.addWeightEntry(weight);
      setUserProgress(response.data);
    } catch (err) {
      setError('Failed to add weight entry');
      throw err;
    }
  };

  const updateGoals = async (goals: any) => {
    try {
      const response = await progressApi.updateGoals(goals);
      setUserProgress(response.data);
    } catch (err) {
      setError('Failed to update goals');
      throw err;
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      refreshProgress();
    }
  }, [isSignedIn]);

  return (
    <ProgressContext.Provider
      value={{
        userProgress,
        isLoading,
        error,
        refreshProgress,
        updateStats,
        addWorkout,
        updateMeasurements,
        addWeightEntry,
        updateGoals,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
} 
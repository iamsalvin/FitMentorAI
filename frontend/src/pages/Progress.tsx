import { useEffect, useMemo, useState, memo } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Award, Calendar, Target } from 'lucide-react';
import { useProgress } from '@/contexts/ProgressContext';
import { challengeApi } from '@/services/api';

type CompletedChallenge = {
  _id: string;
  title: string;
  reward?: string;
  endDate?: string;
};

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ProgressInner = () => {
  const { userProgress, isLoading, error } = useProgress();
  const [completedChallenges, setCompletedChallenges] = useState<CompletedChallenge[]>([]);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadCompleted = async () => {
      try {
        setIsLoadingChallenges(true);
        const res = await challengeApi.getCompleted();
        if (isMounted) {
          setCompletedChallenges(res.data || []);
        }
      } catch (e) {
        if (isMounted) setCompletedChallenges([]);
      } finally {
        if (isMounted) setIsLoadingChallenges(false);
      }
    };
    loadCompleted();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => ({
    totalWorkouts: userProgress?.stats?.totalWorkouts ?? 0,
    totalCaloriesBurned: userProgress?.stats?.totalCaloriesBurned ?? 0,
    streakDays: userProgress?.stats?.streakDays ?? 0,
  }), [userProgress]);

  const achievementsCount = completedChallenges.length;

  const weeklyStats = useMemo(() => {
    const history: Array<{ date: string | Date; caloriesBurned?: number } & any> = userProgress?.workoutHistory ?? [];
    // Build last 7 days buckets
    const now = new Date();
    const last7 = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - idx));
      d.setHours(0, 0, 0, 0);
      return d;
    });
    return last7.map((dayDate) => {
      const label = daysOfWeek[dayDate.getDay()];
      const workoutsForDay = history.filter((w) => {
        const wDate = new Date(w.date);
        const sameDay = wDate.getFullYear() === dayDate.getFullYear() &&
          wDate.getMonth() === dayDate.getMonth() &&
          wDate.getDate() === dayDate.getDate();
        return sameDay;
      });
      const workouts = workoutsForDay.length;
      const calories = workoutsForDay.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
      return { day: label, workouts, calories };
    });
  }, [userProgress]);

  // Goals: map to stored goals
  const goalsCards = useMemo(() => {
    const goals = userProgress?.goals || {};
    // Weight goal progress calculation based on first and last entries
    const weightHistory: Array<{ weight: number; date: string | Date }> = userProgress?.stats?.weightHistory || [];
    const sortedWeights = [...weightHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const startingWeight = sortedWeights[0]?.weight;
    const currentWeight = sortedWeights[sortedWeights.length - 1]?.weight;
    const targetWeight = goals?.targetWeight;

    let weightProgressPercent: number | null = null;
    if (startingWeight !== undefined && currentWeight !== undefined && targetWeight !== undefined && startingWeight !== targetWeight) {
      const totalChangeNeeded = Math.abs(startingWeight - targetWeight);
      const changeSoFar = Math.abs(startingWeight - currentWeight);
      weightProgressPercent = Math.max(0, Math.min(100, Math.round((changeSoFar / totalChangeNeeded) * 100)));
    }

    const cards: Array<{ title: string; current?: number | string; target?: number | string; unit?: string; progress?: number | null; deadline?: string } > = [];

    if (targetWeight !== undefined) {
      cards.push({
        title: 'Target Weight',
        current: currentWeight ?? '—',
        target: targetWeight,
        unit: 'kg',
        progress: weightProgressPercent,
      });
    }
    if (goals?.weeklyWorkouts !== undefined) {
      // Compute completed workouts in last 7 days
      const workoutsIn7 = weeklyStats.reduce((sum, d) => sum + d.workouts, 0);
      const percent = goals.weeklyWorkouts > 0 ? Math.max(0, Math.min(100, Math.round((workoutsIn7 / goals.weeklyWorkouts) * 100))) : 0;
      cards.push({
        title: 'Weekly Workouts',
        current: workoutsIn7,
        target: goals.weeklyWorkouts,
        unit: 'sessions',
        progress: percent,
      });
    }
    if (goals?.dailyCalories !== undefined) {
      // No daily consumption aggregation here; just show goal number
      cards.push({
        title: 'Daily Calories Goal',
        current: undefined,
        target: goals.dailyCalories,
        unit: 'kcal',
        progress: null,
      });
    }
    return cards;
  }, [userProgress, weeklyStats]);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4 text-red-500">{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Progress Tracking
            </h1>
            <p className="text-muted-foreground">
              Monitor your fitness journey and celebrate your achievements.
            </p>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{isLoading ? '—' : stats.totalWorkouts}</div>
                <div className="text-sm text-muted-foreground">Total Workouts</div>
                <div className="text-xs text-accent">This Month</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{isLoading ? '—' : stats.totalCaloriesBurned.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Calories Burned</div>
                <div className="text-xs text-accent">This Month</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{isLoading ? '—' : stats.streakDays}</div>
                <div className="text-sm text-muted-foreground">Current Streak</div>
                <div className="text-xs text-accent">Days</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{isLoadingChallenges ? '—' : achievementsCount}</div>
                <div className="text-sm text-muted-foreground">Achievements</div>
                <div className="text-xs text-accent">Unlocked</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Recent Activity</h2>
                <Card>
                  <CardContent className="p-4">
                    {(!userProgress?.workoutHistory || userProgress.workoutHistory.length === 0) ? (
                      <div className="text-sm text-muted-foreground">No recent workouts.</div>
                    ) : (
                      <div className="space-y-3">
                        {userProgress.workoutHistory
                          .slice()
                          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .slice(0, 5)
                          .map((w: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between border rounded p-3">
                              <div className="text-sm">
                                <div className="font-medium">{new Date(w.date).toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">Duration: {w.duration || '—'} min · Calories: {w.caloriesBurned || '—'}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Weight History */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Weight History</h2>
                <Card>
                  <CardContent className="p-4">
                    {(!userProgress?.stats?.weightHistory || userProgress.stats.weightHistory.length === 0) ? (
                      <div className="text-sm text-muted-foreground">No weight entries logged yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {userProgress.stats.weightHistory
                          .slice()
                          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .slice(0, 5)
                          .map((entry: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between border rounded p-2">
                              <div className="text-sm">{new Date(entry.date).toLocaleDateString()}</div>
                              <div className="text-sm font-semibold">{entry.weight} kg</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Achievements</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isLoadingChallenges && <div className="text-sm text-muted-foreground">Loading achievements...</div>}
                {!isLoadingChallenges && completedChallenges.length === 0 && (
                  <div className="text-sm text-muted-foreground">No achievements yet.</div>
                )}
                {completedChallenges.map((challenge) => (
                  <Card key={challenge._id} className="bg-accent/10 border-accent/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">🏆</div>
                      <h3 className="font-semibold text-foreground mb-1">{challenge.title}</h3>
                      <Badge className="bg-accent text-accent-foreground">
                        {challenge.reward || 'Completed'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Activity Chart removed */}

          {/* Progress Summary */}
          <Card className="mt-8 bg-gradient-hero border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {isLoading ? "You're Making Great Progress!" : `Great job! ${stats.totalWorkouts} workouts logged.`}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                {isLoading ? 'Keep up the excellent work.' : `Current streak: ${stats.streakDays} day(s).`}
              </p>
              
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

const Progress = memo(ProgressInner);
export default Progress;
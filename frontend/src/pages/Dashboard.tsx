import { memo, useMemo } from 'react';
import { useProgress } from '@/contexts/ProgressContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Dumbbell, Flame, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

function DashboardInner() {
  const { userProgress, isLoading, error } = useProgress();

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error loading progress data. Please try again.
      </div>
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = userProgress?.stats || {
    totalWorkouts: 0,
    totalWorkoutMinutes: 0,
    totalCaloriesBurned: 0,
    streakDays: 0
  };

  // Weekly aggregates from workoutHistory
  const { weeklyWorkouts, weeklyMinutes, weeklyCalories, workoutHistory } = useMemo(() => {
    const wh: Array<{ date: string | Date; duration?: number; caloriesBurned?: number }> = userProgress?.workoutHistory || [];
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    const weekly = wh.filter((w) => {
      const d = new Date(w.date as any);
      return d >= weekAgo && d <= now;
    });
    return {
      weeklyWorkouts: weekly.length,
      weeklyMinutes: weekly.reduce((s, w) => s + (Number(w.duration) || 0), 0),
      weeklyCalories: weekly.reduce((s, w) => s + (Number(w.caloriesBurned) || 0), 0),
      workoutHistory: wh,
    };
  }, [userProgress]);

  const weeklyTargetSessions = userProgress?.goals?.weeklyWorkouts || 3;
  const weeklyMinutesTarget = weeklyTargetSessions * 45; // assume 45 min average per session
  const weeklyCaloriesTarget = (userProgress?.goals?.dailyCalories || 2000) * 7;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your training and goals</p>
        </div>
        <div className="hidden md:flex gap-2">
          <Link to="/workout"><Button size="sm">Plan Workout</Button></Link>
          <Link to="/challenges"><Button size="sm" variant="outline">View Challenges</Button></Link>
          <Link to="/saved-workouts"><Button size="sm" variant="outline">Saved Workouts</Button></Link>
        </div>
      </div>

          {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkouts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">sessions completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workout Minutes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkoutMinutes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">minutes of exercise</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calories Burned</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCaloriesBurned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">total calories burned</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak Days</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streakDays}</div>
            <p className="text-xs text-muted-foreground">days in a row</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Goals & This Week */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Goals Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Workouts</span>
                <span>{weeklyWorkouts}/{weeklyTargetSessions} sessions</span>
              </div>
              <Progress value={Math.min(100, (weeklyWorkouts / (weeklyTargetSessions || 1)) * 100)} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Minutes</span>
                <span>{weeklyMinutes}/{weeklyMinutesTarget} min</span>
              </div>
              <Progress value={Math.min(100, (weeklyMinutes / (weeklyMinutesTarget || 1)) * 100)} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Calories</span>
                <span>{weeklyCalories.toLocaleString()} / {weeklyCaloriesTarget.toLocaleString()} kcal</span>
              </div>
              <Progress value={Math.min(100, (weeklyCalories / (weeklyCaloriesTarget || 1)) * 100)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded bg-muted">
                <div className="text-xs text-muted-foreground">Workouts</div>
                <div className="text-xl font-semibold">{weeklyWorkouts}</div>
              </div>
              <div className="p-3 rounded bg-muted">
                <div className="text-xs text-muted-foreground">Minutes</div>
                <div className="text-xl font-semibold">{weeklyMinutes}</div>
              </div>
              <div className="p-3 rounded bg-muted">
                <div className="text-xs text-muted-foreground">Calories</div>
                <div className="text-xl font-semibold">{weeklyCalories.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity removed */}
    </div>
  );
}

const Dashboard = memo(DashboardInner);
export default Dashboard;

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
        ))}
      </div>
            <Card>
              <CardHeader>
          <Skeleton className="h-6 w-32" />
              </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                  </div>
              <Skeleton className="h-2 w-full" />
                  </div>
          ))}
              </CardContent>
            </Card>
    </div>
  );
}
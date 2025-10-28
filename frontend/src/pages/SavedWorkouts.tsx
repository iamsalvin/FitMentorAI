import { useEffect, useMemo, useState, memo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { challengeApi, userWorkoutApi } from '@/services/api';

interface WorkoutPlan {
  _id: string;
  name: string;
  workoutPlan: any;
  createdAt: string;
}

function SavedWorkoutsInner() {
  const { user, isLoaded } = useUser();
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!isLoaded || !user) return;
      try {
        const response = await userWorkoutApi.getAll();
        setWorkouts(response.data);
      } catch (error) {
        console.error('Error fetching workouts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkouts();
  }, [user, isLoaded]);

  // Show all workouts in reverse chronological order; prevent deduping valid plans
  const orderedWorkouts = useMemo(() => {
    return workouts.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [workouts]);

  const deleteWorkout = async (id: string) => {
    if (!confirm('Delete this workout?')) return;
    try {
      await userWorkoutApi.delete(id);
      setWorkouts((prev) => prev.filter((w) => w._id !== id));
    } catch (e) {
      alert('Failed to delete');
    }
  };

  const activateAsChallenge = async (workout: WorkoutPlan) => {
    try {
      // Convert saved workout into a per-user challenge
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 30);
      const totalSessions = Array.isArray((workout as any).workoutPlan?.schedule)
        ? (workout as any).workoutPlan.schedule.length
        : 12; // default
      await challengeApi.create({
        title: workout.name || 'Custom Workout Challenge',
        description: 'Complete your saved workout plan as a 30-day challenge',
        type: 'workout',
        goal: totalSessions,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        reward: 'Custom Plan Finisher',
        linkedWorkoutId: workout._id,
      });
      // No global visibility: backend ties to req.auth.userId only
      // Optionally provide UI feedback
      alert('Challenge activated! Check the Challenges page.');
    } catch (e) {
      console.error('Failed to activate challenge', e);
      alert('Failed to activate challenge');
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Your Saved Workouts</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Saved Workouts</h1>
      {orderedWorkouts.length === 0 ? (
        <p className="text-center text-gray-500">No saved workouts yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orderedWorkouts.map((workout) => (
            <Card key={workout._id} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{workout.name}</CardTitle>
                <p className="text-sm text-gray-500">
                  Created on {new Date(workout.createdAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[360px] w-full rounded-md border p-4">
                  <div className="space-y-6">
                    {/* Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-3 bg-muted rounded">
                        <div className="text-xs text-muted-foreground">Level</div>
                        <div className="font-medium">{workout.workoutPlan?.level || '—'}</div>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <div className="text-xs text-muted-foreground">Frequency</div>
                        <div className="font-medium">{workout.workoutPlan?.workoutDays ? `${workout.workoutPlan.workoutDays} days/week` : '—'}</div>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <div className="text-xs text-muted-foreground">Goal</div>
                        <div className="font-medium">{workout.workoutPlan?.goal || '—'}</div>
                      </div>
                    </div>

                    {/* Schedule (preferred shape) */}
                    {Array.isArray(workout.workoutPlan?.schedule) && workout.workoutPlan.schedule.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold">Weekly Schedule</div>
                        <div className="space-y-3">
                          {workout.workoutPlan.schedule.map((day: any, idx: number) => (
                            <div key={idx} className="border rounded p-3">
                              <div className="font-medium mb-2">{day.day || `Day ${idx + 1}`}</div>
                              {Array.isArray(day.exercises) && day.exercises.length > 0 ? (
                                <ul className="space-y-1">
                                  {day.exercises.map((ex: any, exIdx: number) => (
                                    <li key={exIdx} className="text-sm">
                                      <span className="font-medium">{ex.name || 'Exercise'}</span>
                                      <span className="text-muted-foreground ml-2">
                                        {ex.sets ? `${ex.sets} sets` : ''}
                                        {ex.sets && ex.reps ? ' × ' : ''}
                                        {ex.reps ? `${ex.reps} reps` : ''}
                                        {(!ex.sets && !ex.reps && ex.duration) ? `${ex.duration}` : ''}
                                      </span>
                                      {ex.equipment && (
                                        <span className="block text-xs text-muted-foreground">Equipment: {ex.equipment}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="text-xs text-muted-foreground">No exercises listed.</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fallback: flat exercises array */}
                    {!Array.isArray(workout.workoutPlan?.schedule) && Array.isArray(workout.workoutPlan?.exercises) && (
                      <div className="space-y-2">
                        <div className="text-sm font-semibold">Exercises</div>
                        <ul className="space-y-1">
                          {workout.workoutPlan.exercises.map((ex: any, i: number) => (
                            <li key={i} className="text-sm">
                              <span className="font-medium">{ex.name || 'Exercise'}</span>
                              <span className="text-muted-foreground ml-2">
                                {ex.sets ? `${ex.sets} sets` : ''}
                                {ex.sets && ex.reps ? ' × ' : ''}
                                {ex.reps ? `${ex.reps} reps` : ''}
                                {(!ex.sets && !ex.reps && ex.duration) ? `${ex.duration}` : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Notes */}
                    {Array.isArray(workout.workoutPlan?.notes) && workout.workoutPlan.notes[0] && (
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">Notes</div>
                        <p className="text-sm text-muted-foreground">{workout.workoutPlan.notes[0]}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="mt-4 flex justify-end">
                  <div className="flex gap-2">
                    <Button onClick={() => activateAsChallenge(workout)}>Activate as Challenge</Button>
                    <Button variant="destructive" onClick={() => deleteWorkout(workout._id)}>Delete</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(SavedWorkoutsInner);
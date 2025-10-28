import { useState, useEffect, useRef } from 'react';
import { workoutAIService, WorkoutPlanRequest } from '@/services/workoutAI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { Dumbbell, Clock, Zap } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import axios from 'axios';
import { userWorkoutApi, challengeApi } from '@/services/api';

export default function WorkoutPlanner() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<any>(null);
  const [formData, setFormData] = useState<WorkoutPlanRequest>({
    age: 25,
    gender: 'male',
    weight: 70,
    height: 170,
    goal: 'general_fitness',
    fitnessLevel: 'beginner',
    daysPerWeek: 3,
    equipment: ['dumbbells', 'bodyweight']
  });

  const [workoutPlan, setWorkoutPlan] = useState<any>(null);

  const handleInputChange = (field: keyof WorkoutPlanRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const startProgressBar = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    setProgress(0);
    
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval.current);
          return prev;
        }
        return prev + 0.5; // Slower increment for smoother progress
      });
    }, 200); // Update more frequently for smoother animation
  };

  const generateWorkoutPlan = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Generating your personalized workout plan...');
      setWorkoutPlan(null);
      startProgressBar();

      console.log('Sending request with data:', formData);
      const response = await workoutAIService.generateWorkoutPlan(formData);
      console.log('Received response:', response);

      if (response.result) {
        const plan = {
          level: response.result.fitness_level,
          goal: response.result.goal,
          workoutDays: response.result.schedule.days_per_week,
          schedule: response.result.exercises.map((day: any) => ({
            day: day.day,
            exercises: day.exercises.map((exercise: any) => ({
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.repetitions,
              duration: exercise.duration,
              equipment: exercise.equipment
            }))
          })),
          notes: [response.result.seo_content || '']
        };
        
        setProgress(100);
        setWorkoutPlan(plan);
        toast({
          title: "Success",
          description: "Your personalized workout plan is ready!"
        });
      } else {
        throw new Error('No workout plan received');
      }
    } catch (error: any) {
      console.error('Error generating plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate workout plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const saveWorkout = async (plan: any) => {
    try {
      const response = await userWorkoutApi.create({
        workoutPlan: plan,
        name: `Workout Plan ${new Date().toLocaleDateString()}`,
      });
      toast({ title: 'Saved', description: 'Workout plan saved successfully!' });
      return response.data;
    } catch (error) {
      console.error('Error saving workout:', error);
      toast({ title: 'Save failed', description: 'Failed to save workout plan', variant: 'destructive' });
    }
  };

  const activatePlanAsChallenge = async (plan: any) => {
    try {
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 30);
      const totalSessions = Array.isArray(plan?.schedule) ? plan.schedule.length : 12;
      await challengeApi.create({
        title: `Challenge: ${plan.goal || 'Custom Plan'}`,
        description: 'Complete your generated plan in 30 days',
        type: 'workout',
        goal: totalSessions,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        reward: 'Custom Plan Finisher',
      });
      toast({ title: 'Challenge Activated', description: 'Check Challenges page.' });
    } catch (e: any) {
      console.error('Challenge activation failed', e);
      toast({ title: 'Activation failed', description: e?.message || 'Unable to activate', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    startProgressBar();

    try {
      const response = await workoutAIService.generateWorkoutPlan(formData);
      setWorkoutPlan({
        level: response.result?.fitness_level,
        goal: response.result?.goal,
        workoutDays: response.result?.schedule?.days_per_week,
        schedule: (response.result?.exercises || []).map((day: any) => ({
          day: day.day,
          exercises: (day.exercises || []).map((exercise: any) => ({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.repetitions,
            duration: exercise.duration,
            equipment: exercise.equipment,
          })),
        })),
        notes: [response.result?.seo_content || ''],
      });
      clearInterval(progressInterval.current);
      setProgress(100);
      
      // Save the workout after generation
      if (response.data) {
        await saveWorkout(response.data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate workout plan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Your Workout Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Age</label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <Select
                value={formData.gender}
                onValueChange={(value: 'male' | 'female') => handleInputChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Weight (kg)</label>
              <Input
                type="number"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Height (cm)</label>
              <Input
                type="number"
                value={formData.height}
                onChange={(e) => handleInputChange('height', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fitness Goal</label>
              <Select
                value={formData.goal}
                onValueChange={(value: WorkoutPlanRequest['goal']) => handleInputChange('goal', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight_loss">Weight Loss</SelectItem>
                  <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                  <SelectItem value="general_fitness">General Fitness</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fitness Level</label>
              <Select
                value={formData.fitnessLevel}
                onValueChange={(value: WorkoutPlanRequest['fitnessLevel']) => handleInputChange('fitnessLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Days per Week</label>
              <Input
                type="number"
                min={1}
                max={7}
                value={formData.daysPerWeek}
                onChange={(e) => handleInputChange('daysPerWeek', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Available Equipment</label>
              <Select
                value={formData.equipment[0]}
                onValueChange={(value) => handleInputChange('equipment', [value])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['bodyweight', 'dumbbells', 'barbell', 'kettlebell', 'resistance bands', 'machines', 'pull-up bar'].map((equipment) => (
                    <SelectItem key={equipment} value={equipment}>
                      {equipment.charAt(0).toUpperCase() + equipment.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={generateWorkoutPlan}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{loadingMessage}</span>
              </div>
            ) : (
              "Generate Workout Plan"
            )}
          </Button>

          {isLoading && (
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Progress value={progress} className="w-full" />
                  <p className="text-center text-muted-foreground">{loadingMessage}</p>
                  <p className="text-sm text-center text-muted-foreground">
                    {progress < 100 ? 'Generating your personalized plan...' : 'Plan generated!'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {(!isLoading || progress === 100) && workoutPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Your Personalized Workout Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">{workoutPlan.level}</div>
                    <div className="text-xs text-muted-foreground">Level</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">{workoutPlan.workoutDays} days/week</div>
                    <div className="text-xs text-muted-foreground">Frequency</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <Zap className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">{workoutPlan.goal}</div>
                    <div className="text-xs text-muted-foreground">Goal</div>
                  </div>
                </div>
              </div>

              {/* Workout Schedule */}
              {workoutPlan.schedule && workoutPlan.schedule.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Weekly Schedule</h3>
                  <div className="grid gap-4">
                    {workoutPlan.schedule.map((day: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold">{day.day}</h4>
                            </div>
                          </div>
                          {day.exercises && (
                            <ul className="space-y-2">
                              {day.exercises.map((exercise: any, exIndex: number) => (
                                <li key={exIndex} className="text-sm">
                                  <span className="font-medium">{exercise.name}</span>
                                  <span className="text-muted-foreground ml-2">
                                    {exercise.sets} sets × {exercise.reps}
                                    {exercise.duration && ` (${exercise.duration})`}
                                  </span>
                                  {exercise.equipment && (
                                    <span className="text-xs text-muted-foreground block mt-1">
                                      Equipment: {exercise.equipment}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={() => saveWorkout(workoutPlan)}>Save Plan</Button>
                <Button variant="outline" onClick={() => activatePlanAsChallenge(workoutPlan)}>Activate as Challenge</Button>
              </div>

              {/* Notes and Recommendations */}
              {workoutPlan.notes && workoutPlan.notes.length > 0 && workoutPlan.notes[0] && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Recommendations</h3>
                  <p className="text-sm text-muted-foreground">{workoutPlan.notes[0]}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
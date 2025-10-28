import WorkoutPlanner from '@/components/WorkoutPlanner';

export default function Workout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workout Planner</h1>
        <p className="text-muted-foreground mt-2">
          Get a personalized workout plan based on your goals and preferences
        </p>
      </div>

      <WorkoutPlanner />
    </div>
  );
}
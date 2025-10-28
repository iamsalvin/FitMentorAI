import { useEffect, useMemo, useState } from 'react';
import FoodAnalyzer from '@/components/FoodAnalyzer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { nutritionApi, coachApi, userApi } from '@/services/api';
import { Button } from '@/components/ui/button';

type NutritionLog = {
  _id: string;
  date: string;
  meals: Array<{
    name: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  }>;
  totalCalories: number;
  calorieGoal: number;
};

export default function Diet() {
  const [today, setToday] = useState<NutritionLog | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string>('');
  const [adviceLoading, setAdviceLoading] = useState<boolean>(false);

  const refreshToday = async () => {
    try {
      setLoading(true);
      setError(null);
      const d = new Date();
      const iso = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const res = await nutritionApi.getDaily(iso);
      setToday(res.data);
    } catch (e) {
      setToday(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshToday();
  }, []);

  const getAdvice = async () => {
    try {
      setAdviceLoading(true);
      const profileRes = await userApi.getProfile();
      const payload = {
        profile: profileRes.data?.profile || {},
        nutritionSummary: today ? { date: today.date, totalCalories: today.totalCalories, meals: today.meals } : {},
        preferences: {},
      };
      const res = await coachApi.getDietAdvice(payload);
      setAdvice(res.data?.advice || '');
    } catch (e) {
      setAdvice('Unable to fetch diet advice right now.');
    } finally {
      setAdviceLoading(false);
    }
  };

  const caloriePercent = useMemo(() => {
    if (!today) return 0;
    const goal = today.calorieGoal || 2000;
    return Math.min(100, Math.round((today.totalCalories / goal) * 100));
  }, [today]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl border bg-gradient-hero">
        <div className="p-6">
          <h1 className="text-3xl font-bold">Nutrition Tracking</h1>
          <p className="text-muted-foreground mt-2">Track meals, analyze images, and stay on target.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Analyze a Meal</CardTitle>
            </CardHeader>
            <CardContent>
              <FoodAnalyzer onSaved={refreshToday} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Meals</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : !today || today.meals.length === 0 ? (
                <div className="text-sm text-muted-foreground">No meals logged yet today.</div>
              ) : (
                <div className="space-y-3">
                  {today.meals.map((m, idx) => (
                    <div key={idx} className="p-3 rounded border flex items-center justify-between">
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.protein ?? 0}g protein · {m.carbs ?? 0}g carbs · {m.fats ?? 0}g fats
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{m.mealType}</Badge>
                        <div className="text-sm font-semibold">{m.calories} kcal</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Diet Manager (Personalized Coach)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Get general, non-medical dietary guidance tailored to your profile and recent meals.</p>
              <div className="flex justify-end">
                <Button onClick={getAdvice} disabled={adviceLoading}>{adviceLoading ? 'Generating…' : 'Get Advice'}</Button>
              </div>
              {!!advice && (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {advice.split('\n').map((line, i) => (
                    <p key={i} className="whitespace-pre-wrap text-sm">{line}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Total Calories</div>
                  <div className="text-2xl font-bold">{today?.totalCalories ?? 0} kcal</div>
                </div>
                <div className="text-sm text-muted-foreground">Goal {today?.calorieGoal ?? 2000} kcal</div>
              </div>
              <Progress value={caloriePercent} />
              <div className="text-xs text-muted-foreground">{caloriePercent}% of daily goal</div>
            </CardContent>
          </Card>

          {/* Optional macros overview if today exists */}
          {today && today.meals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Macros Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const totals = today.meals.reduce(
                    (acc, m) => ({
                      protein: acc.protein + (m.protein || 0),
                      carbs: acc.carbs + (m.carbs || 0),
                      fats: acc.fats + (m.fats || 0),
                    }),
                    { protein: 0, carbs: 0, fats: 0 }
                  );
                  return (
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-muted rounded">
                        <div className="text-xs text-muted-foreground">Protein</div>
                        <div className="text-lg font-semibold">{totals.protein} g</div>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <div className="text-xs text-muted-foreground">Carbs</div>
                        <div className="text-lg font-semibold">{totals.carbs} g</div>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <div className="text-xs text-muted-foreground">Fats</div>
                        <div className="text-lg font-semibold">{totals.fats} g</div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
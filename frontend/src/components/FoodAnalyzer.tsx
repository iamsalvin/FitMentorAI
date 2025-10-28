import { useState } from 'react';
import { authedApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { nutritionApi } from '@/services/api';

export default function FoodAnalyzer({ onSaved }: { onSaved?: () => void }) {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const analyzeFoodPlate = async () => {
    if (!file) {
      toast({ title: 'Error', description: 'Please select an image to upload', variant: 'destructive' });
      return;
    }
    try {
      setIsLoading(true);
      const form = new FormData();
      form.append('image', file);
      const res = await authedApi.post(`/ai/analyze-meal`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAnalysis(res.data);
      toast({ title: 'Analysis Complete', description: 'Your food plate has been analyzed!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to analyze food plate. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const saveMeal = async () => {
    if (!analysis) return;
    try {
      const meal = {
        name: 'Analyzed Meal',
        calories: Math.round(analysis.calories || 0),
        protein: Math.round(analysis.protein || 0),
        carbs: Math.round(analysis.carbs || 0),
        fats: Math.round(analysis.fats || 0),
        mealType: 'lunch',
      };
      await nutritionApi.addMeal(meal);
      toast({ title: 'Saved', description: 'Meal added to your nutrition log.' });
      onSaved?.();
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save meal', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analyze Food Plate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Image</label>
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>

          {(imageUrl || file) && (
            <div className="aspect-video relative rounded-lg overflow-hidden">
              <img
                src={file ? URL.createObjectURL(file) : imageUrl}
                alt="Food plate"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          )}

          <Button
            className="w-full"
            onClick={analyzeFoodPlate}
            disabled={isLoading || !file}
          >
            {isLoading ? "Analyzing..." : "Analyze Food Plate"}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Calories and Nutrients */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{analysis.calories || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Calories</div>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{analysis.protein || 'N/A'}g</div>
                  <div className="text-sm text-muted-foreground">Protein</div>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{analysis.carbs || 'N/A'}g</div>
                  <div className="text-sm text-muted-foreground">Carbs</div>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold">{analysis.fats || 'N/A'}g</div>
                  <div className="text-sm text-muted-foreground">Fats</div>
                </div>
              </div>

              {/* Detected Items */}
              {analysis.items && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Detected Items:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    {analysis.items.map((item: any, index: number) => (
                      <li key={index} className="text-muted-foreground">
                        {item.name} ({item.confidence}% confidence)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Recommendations:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    {analysis.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-muted-foreground">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={saveMeal}>Save to Nutrition</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
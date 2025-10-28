import { useEffect, useState, memo } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { userApi } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { challengeApi, leaderboardApi } from '@/services/api';
import { useUser } from '@clerk/clerk-react';
import { Trophy } from 'lucide-react';

function ProfileInner() {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const [rank, setRank] = useState<{ rank: number; score: number } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [u, completed, lb] = await Promise.all([
          userApi.getProfile(),
          challengeApi.getCompleted(),
          leaderboardApi.get(),
        ]);
        setProfile(u.data);
        setAchievements(completed.data || []);
        setRank(lb.data?.currentUserRank ? { rank: lb.data.currentUserRank.rank, score: lb.data.currentUserRank.score } : null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      const res = await userApi.updateProfile(editForm);
      setProfile(res.data);
      alert('Profile saved');
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 space-y-6">
          <div className="relative overflow-hidden rounded-xl border bg-gradient-hero">
            <div className="p-6 flex items-center gap-4">
              <img src={user?.imageUrl} alt="Avatar" className="h-20 w-20 rounded-full border" />
              <div className="min-w-0">
                <h1 className="text-3xl font-bold truncate">{user?.fullName || 'Your Profile'}</h1>
                <div className="mt-1 flex items-center gap-3">
                  {rank ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                      <span className="text-sm font-semibold">#{rank.rank}</span>
                      <span className="text-xs text-muted-foreground">Score {rank.score}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Rank loading…</div>
                  )}
                </div>
              </div>
              <div className="ml-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditForm(profile?.profile || {});
                    setIsEditing(true);
                  }}
                >
                  Edit Details
                </Button>
              </div>
            </div>
          </div>

          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" value={editForm.age || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, age: e.target.value === '' ? '' : Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Input id="gender" value={editForm.gender || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, gender: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input id="height" type="number" value={editForm.height || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, height: e.target.value === '' ? '' : Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" type="number" value={editForm.weight || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, weight: e.target.value === '' ? '' : Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fitnessGoal">Fitness Goal</Label>
                    <Input id="fitnessGoal" value={editForm.fitnessGoal || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, fitnessGoal: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="activityLevel">Activity Level</Label>
                    <Input id="activityLevel" value={editForm.activityLevel || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, activityLevel: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="preferredWorkoutDuration">Preferred Workout Duration (min)</Label>
                  <Input id="preferredWorkoutDuration" type="number" value={editForm.preferredWorkoutDuration || ''} onChange={(e) => setEditForm((p: any) => ({ ...p, preferredWorkoutDuration: e.target.value === '' ? '' : Number(e.target.value) }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                <div className="text-sm text-muted-foreground">No achievements yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {achievements.map((a) => (
                    <div
                      key={a._id}
                      className="p-4 rounded-lg border bg-accent/10 border-accent/20 hover:shadow-glow transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <Trophy className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{a.title}</div>
                            <div className="text-xs text-muted-foreground">Completed {new Date(a.endDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <Badge className="bg-primary text-primary-foreground">{a.reward || 'Completed'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default memo(ProfileInner);



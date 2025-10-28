import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { leaderboardApi } from '@/services/api';
import { useEffect, useMemo, useState } from 'react';

type RankEntry = {
  rank: number;
  userId: string;
  score: number;
  stats: {
    totalWorkouts?: number;
    totalWorkoutMinutes?: number;
    totalCaloriesBurned?: number;
    streakDays?: number;
  };
  name?: string | null;
  avatarUrl?: string | null;
};

export default function Leaderboard() {
  const [top, setTop] = useState<RankEntry[]>([]);
  const [me, setMe] = useState<RankEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const maxScore = Math.max(1, ...top.map((t) => t.score || 0));
  const podium = useMemo(() => top.slice(0, 3), [top]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await leaderboardApi.get();
        setTop(res.data.top || []);
        setMe(res.data.currentUserRank || null);
      } catch (e) {
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Global Leaderboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Rankings based on workouts, minutes, calories and streaks.</p>
          </div>

          {me && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Your Rank</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={me.avatarUrl || undefined} />
                    <AvatarFallback>{(me.name || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{me.name || `User ${me.userId.slice(-6)}`}</div>
                    <div className="text-xs text-muted-foreground">Score: {me.score}</div>
                  </div>
                  <div className="ml-auto text-lg font-semibold">#{me.rank}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Podium */}
          {podium.length > 0 && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Top 3</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {podium.map((e, i) => (
                    <div key={e.userId} className={`p-4 rounded-lg ${e.rank === 1 ? 'bg-gradient-to-b from-yellow-100 to-transparent' : e.rank === 2 ? 'bg-gradient-to-b from-slate-100 to-transparent' : 'bg-gradient-to-b from-amber-50 to-transparent'}`}>
                      <div className="text-2xl font-bold">#{e.rank}</div>
                      <div className="flex justify-center my-2">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={e.avatarUrl || undefined} />
                          <AvatarFallback>{(e.name || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="font-semibold truncate">{e.name || `User ${e.userId.slice(-6)}`}</div>
                      <div className="text-xs text-muted-foreground">Score {e.score}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Top Athletes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : error ? (
                <div className="text-red-500 text-sm">{error}</div>
              ) : top.length === 0 ? (
                <div className="text-sm text-muted-foreground">No entries yet.</div>
              ) : (
                <div className="rounded border divide-y">
                  {top.map((e) => {
                    const pct = Math.round(((e.score || 0) / maxScore) * 100);
                    const medal = e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : null;
                    return (
                      <div key={e.userId} className={`p-3 ${e.rank <= 3 ? 'bg-gradient-to-r from-primary/10 to-accent/10' : ''}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 text-center font-semibold">{medal ? medal : `#${e.rank}`}</div>
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={e.avatarUrl || undefined} />
                              <AvatarFallback>{(e.name || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{e.name || `User ${e.userId.slice(-6)}`}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                Workouts {e.stats.totalWorkouts ?? 0} · Minutes {e.stats.totalWorkoutMinutes ?? 0} · Calories {e.stats.totalCaloriesBurned ?? 0} · Streak {e.stats.streakDays ?? 0}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm whitespace-nowrap">Score: {e.score}</div>
                        </div>
                        <div className="mt-2">
                          <Progress value={pct} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}



import { useEffect, useMemo, useState, memo } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Users, Target, Star, Calendar } from 'lucide-react';
import { challengeApi, quizApi, leaderboardApi } from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { useProgress } from '@/contexts/ProgressContext';

type Challenge = {
  _id: string;
  title: string;
  description: string;
  type: 'workout' | 'nutrition' | 'steps' | 'custom';
  goal: number;
  progress: number;
  startDate: string;
  endDate: string;
  completed: boolean;
  reward?: string;
  linkedWorkoutId?: string;
};

const formatDuration = (start: Date, end: Date) => {
  const ms = end.getTime() - start.getTime();
  const days = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  if (days < 14) return `${days} days`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks > 1 ? 's' : ''}`;
};

const getDifficulty = (goal: number) => {
  if (goal <= 7) return 'Beginner';
  if (goal <= 21) return 'Intermediate';
  return 'Advanced';
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner': return 'bg-accent text-accent-foreground';
    case 'Intermediate': return 'bg-primary text-primary-foreground';
    case 'Advanced': return 'bg-destructive text-destructive-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const ChallengesInner = () => {
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { updateStats, refreshProgress, userProgress } = useProgress();
  const [rank, setRank] = useState<{ rank: number; score: number } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [activeRes, completedRes, lbRes] = await Promise.all([
          challengeApi.getAll(),
          challengeApi.getCompleted(),
          leaderboardApi.get(),
        ]);
        if (!isMounted) return;
        setActiveChallenges(activeRes.data || []);
        setCompletedChallenges(completedRes.data || []);
        const me = lbRes.data?.currentUserRank;
        setRank(me ? { rank: me.rank, score: me.score } : null);
      } catch (e) {
        if (!isMounted) return;
        setError('Failed to load challenges');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const weeklyChallenge = useMemo(() => {
    const now = new Date();
    const weekAhead = new Date();
    weekAhead.setDate(now.getDate() + 7);
    const candidate = activeChallenges.find((c) => new Date(c.endDate) <= weekAhead) || activeChallenges[0];
    if (!candidate) return null;
    const progress = Math.min(100, Math.round((candidate.progress / candidate.goal) * 100));
    const remainingMs = new Date(candidate.endDate).getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
    return {
      title: candidate.title,
      description: candidate.description,
      progressValue: candidate.progress,
      totalValue: candidate.goal,
      unit: candidate.type === 'steps' ? 'steps' : candidate.type === 'nutrition' ? 'kcal' : 'sessions',
      timeLeft: `${remainingDays} days left`,
      progressPercent: progress,
    };
  }, [activeChallenges]);

  const applyLocalUpdate = (updated: Challenge) => {
    setActiveChallenges((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
  };

  // Quiz modal state
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState<{ score: number; total: number } | null>(null);
  const [pendingAction, setPendingAction] = useState<'increment' | 'complete' | null>(null);
  const [targetChallenge, setTargetChallenge] = useState<Challenge | null>(null);
  const [showSolutions, setShowSolutions] = useState(false);

  const openQuiz = async (challenge: Challenge, action: 'increment' | 'complete') => {
    try {
      setQuizOpen(true);
      setQuizLoading(true);
      setQuiz(null);
      setQuizError(null);
      setQuizScore(null);
      setTargetChallenge(challenge);
      setPendingAction(action);
      const quizRes = await quizApi.getSessionQuiz({ title: challenge.title, description: challenge.description });
      const q = quizRes.data;
      // Randomize choices per question while keeping the correct answer mapping
      const randomized = q && Array.isArray(q.questions)
        ? {
            ...q,
            questions: q.questions.map((question: any) => {
              const order = Array.from({ length: (question.choices || []).length }, (_, i) => i).sort(() => Math.random() - 0.5);
              const choices = order.map((i) => question.choices[i]);
              const answerIndex = order.indexOf(question.answerIndex);
              return { q: question.q, choices, answerIndex };
            }),
          }
        : q;
      setQuiz(randomized);
      setAnswers(Array.isArray(randomized?.questions) ? randomized.questions.map(() => -1) : []);
      setShowSolutions(false);
    } catch (e: any) {
      setQuizError('Failed to load quiz. Please try again.');
    } finally {
      setQuizLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (!quiz || !targetChallenge || !pendingAction) return;
    if (answers.some((a) => a === -1)) {
      setQuizError('Please answer all questions.');
      return;
    }
    try {
      setQuizLoading(true);
      setQuizError(null);
      const scoreRes = await quizApi.scoreQuiz(quiz, answers);
      const score = scoreRes.data || { score: 0, total: quiz.questions?.length || 3 };
      setQuizScore(score);
      const passed = (score.score || 0) >= Math.ceil((score.total || 3) * 0.6);
      if (!passed) {
        setQuizError(`You scored ${score.score}/${score.total}. Review the correct answers (highlighted) and try again.`);
        setShowSolutions(true);
        return; // keep modal open to let user retry
      }

      // Perform the pending action
      if (pendingAction === 'increment') {
        const newProgress = Math.min(targetChallenge.goal, (targetChallenge.progress || 0) + 1);
        const res = await challengeApi.updateProgress(targetChallenge._id, newProgress);
        applyLocalUpdate(res.data);
        if (targetChallenge.type === 'workout') {
          await updateStats({ 'stats.totalWorkouts': 1, 'stats.totalWorkoutMinutes': 45, 'stats.totalCaloriesBurned': 300 });
        }
      } else if (pendingAction === 'complete' && !targetChallenge.completed) {
        const remaining = Math.max(0, targetChallenge.goal - (targetChallenge.progress || 0));
        const res = await challengeApi.updateProgress(targetChallenge._id, targetChallenge.goal);
        applyLocalUpdate(res.data);
        if (targetChallenge.type === 'workout' && remaining > 0) {
          await updateStats({ 'stats.totalWorkouts': remaining, 'stats.totalWorkoutMinutes': remaining * 45, 'stats.totalCaloriesBurned': remaining * 300 });
        }
      }

      await refreshProgress();
      // Close modal on success
      setQuizOpen(false);
      setQuiz(null);
      setQuizScore(null);
      setTargetChallenge(null);
      setPendingAction(null);
      setShowSolutions(false);
    } catch (e: any) {
      setQuizError('Failed to submit quiz. Please try again.');
    } finally {
      setQuizLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Fitness Challenges
            </h1>
            <p className="text-muted-foreground">
              Push your limits and earn rewards with community challenges designed to keep you motivated.
            </p>
          </div>

          {/* Active Challenge */}
          <Card className="mb-8 bg-gradient-hero border-primary/20">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-primary" />
                    {loading ? 'Loading…' : (activeChallenges[0]?.title || 'No Active Challenges')}
                  </CardTitle>
                  {!loading && activeChallenges[0] && (
                    <p className="text-muted-foreground mt-2">{activeChallenges[0].description}</p>
                  )}
                </div>
                <Badge className="bg-primary text-primary-foreground">
                  Active
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              {loading || !activeChallenges[0] ? (
                <div className="text-sm text-muted-foreground">No active challenges yet.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-foreground mb-1">
                        {activeChallenges[0].progress}/{activeChallenges[0].goal}
                      </div>
                      <div className="text-sm text-muted-foreground">Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-accent mb-1">
                        {formatDuration(new Date(activeChallenges[0].startDate), new Date(activeChallenges[0].endDate))}
                      </div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-primary mb-1">
                        {activeChallenges[0].reward || '—'}
                      </div>
                      <div className="text-sm text-muted-foreground">Reward</div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-foreground">Progress</span>
                      <span className="text-muted-foreground">
                        {Math.min(100, Math.round((activeChallenges[0].progress / activeChallenges[0].goal) * 100))}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-gradient-primary h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(100, (activeChallenges[0].progress / activeChallenges[0].goal) * 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="w-full" />
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Available Challenges */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-foreground mb-6">Available Challenges</h2>
              <div className="space-y-4">
                {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
                {!loading && activeChallenges.length === 0 && (
                  <div className="text-sm text-muted-foreground">No available challenges.</div>
                )}
                {activeChallenges.map((challenge) => (
                  <Card key={challenge._id} className="hover:shadow-glow transition-all duration-300">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-foreground">{challenge.title}</CardTitle>
                          <p className="text-muted-foreground text-sm mt-2">
                            {challenge.description}
                          </p>
                        </div>
                        <Badge className={getDifficultyColor(getDifficulty(challenge.goal))}>
                          {getDifficulty(challenge.goal)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                          <div className="text-sm font-semibold text-foreground">
                            {formatDuration(new Date(challenge.startDate), new Date(challenge.endDate))}
                          </div>
                          <div className="text-xs text-muted-foreground">Duration</div>
                        </div>
                        <div className="text-center">
                          <Users className="h-5 w-5 text-accent mx-auto mb-1" />
                          <div className="text-sm font-semibold text-foreground">—</div>
                          <div className="text-xs text-muted-foreground">Joined</div>
                        </div>
                        <div className="text-center">
                          <Trophy className="h-5 w-5 text-primary mx-auto mb-1" />
                          <div className="text-xs text-foreground">{challenge.reward}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-muted-foreground">Ends: {new Date(challenge.endDate).toLocaleDateString()}</span>
                        <span className="text-sm text-muted-foreground">{Math.min(100, Math.round((challenge.progress / challenge.goal) * 100))}%</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => openQuiz(challenge, 'increment')}>+1 Progress</Button>
                        <Button variant="outline" onClick={() => openQuiz(challenge, 'complete')} disabled={challenge.completed}>
                          {challenge.completed ? 'Completed' : 'Mark Complete'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Weekly Challenge */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    Weekly Challenge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!weeklyChallenge ? (
                    <div className="text-sm text-muted-foreground">No challenge selected.</div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-foreground mb-2">{weeklyChallenge.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{weeklyChallenge.description}</p>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-foreground">{weeklyChallenge.progressValue} {weeklyChallenge.unit}</span>
                          <span className="text-muted-foreground">{weeklyChallenge.totalValue} {weeklyChallenge.unit}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-gradient-accent h-2 rounded-full transition-all duration-300" style={{ width: `${weeklyChallenge.progressPercent}%` }} />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">{weeklyChallenge.timeLeft}</div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Completed Challenges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-accent" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
                    {!loading && completedChallenges.length === 0 && (
                      <div className="text-sm text-muted-foreground">No recent achievements.</div>
                    )}
                    {!loading && completedChallenges.map((challenge) => (
                      <div key={challenge._id} className="flex items-center justify-between p-2 bg-accent/10 rounded-lg">
                        <div>
                          <div className="text-sm font-semibold text-foreground">{challenge.title}</div>
                          <div className="text-xs text-muted-foreground">{new Date(challenge.endDate).toLocaleDateString()}</div>
                        </div>
                        <Badge className="bg-accent text-accent-foreground text-xs">
                          {challenge.reward || 'Completed'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Challenge Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Challenges Completed</span>
                      <span className="text-foreground font-semibold">{completedChallenges.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Badges Earned</span>
                      <span className="text-foreground font-semibold">{completedChallenges.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Streak</span>
                      <span className="text-foreground font-semibold">{userProgress?.stats?.streakDays ?? 0} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rank</span>
                      <span className="text-primary font-semibold">{rank ? `#${rank.rank}` : '—'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
        <DialogContent className="sm:max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quick Session Quiz</DialogTitle>
          </DialogHeader>
          {quizLoading && <div className="text-sm text-muted-foreground">{quiz ? 'Scoring…' : 'Loading quiz…'}</div>}
          {!quizLoading && quiz && (
            <div className="space-y-4">
              {(quiz.questions || []).map((q: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <div className="font-medium break-words">{idx + 1}. {q.q}</div>
                  <div className="grid grid-cols-1 gap-2">
                    {q.choices?.map((choice: string, cIdx: number) => {
                      let stateClass = '';
                      if (showSolutions) {
                        if (cIdx === q.answerIndex) stateClass = 'border-green-500 bg-green-50 text-green-700';
                        else if (answers[idx] === cIdx) stateClass = 'border-red-500 bg-red-50 text-red-700';
                      } else if (answers[idx] === cIdx) {
                        stateClass = 'bg-primary text-primary-foreground';
                      }
                      return (
                        <button
                          key={cIdx}
                          onClick={() => {
                            setAnswers((arr) => arr.map((v, i) => (i === idx ? cIdx : v)));
                            if (showSolutions) {
                              setShowSolutions(false);
                              setQuizError(null);
                              setQuizScore(null);
                            }
                          }}
                          className={`text-left px-3 py-2 rounded border break-words whitespace-normal ${stateClass}`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {quizError && <div className="text-sm text-red-500">{quizError}</div>}
              {quizScore && (
                <div className="text-sm">Score: {quizScore.score}/{quizScore.total}</div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setQuizOpen(false)} disabled={quizLoading}>Cancel</Button>
                <Button onClick={submitQuiz} disabled={quizLoading || answers.some((a) => a === -1)}>
                  {quizLoading ? 'Submitting…' : 'Submit'}
                </Button>
              </div>
            </div>
          )}
          {!quizLoading && !quiz && !quizError && (
            <div className="text-sm text-muted-foreground">No quiz available.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Challenges = memo(ChallengesInner);
export default Challenges;
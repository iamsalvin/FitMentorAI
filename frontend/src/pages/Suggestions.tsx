import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, Clock, Target, Star, Zap, Calendar } from 'lucide-react';

const Suggestions = () => {
  const personalizedSuggestions = [
    {
      type: "workout",
      title: "Try Upper Body Focus",
      description: "Based on your recent lower body workouts, balance your routine with upper body strength training.",
      impact: "High",
      timeToComplete: "45 min",
      reason: "You've done 3 leg workouts this week",
      actionText: "Schedule Upper Body"
    },
    {
      type: "nutrition",
      title: "Increase Protein Intake",
      description: "Your current protein intake is 20g below your goal. Consider adding a protein shake post-workout.",
      impact: "Medium",
      timeToComplete: "5 min",
      reason: "Goal: 150g, Current: 130g avg",
      actionText: "View Protein Sources"
    },
    {
      type: "recovery",
      title: "Schedule Rest Day",
      description: "You've been consistent for 6 days. A rest day will help prevent burnout and improve performance.",
      impact: "High",
      timeToComplete: "Full day",
      reason: "6 consecutive workout days",
      actionText: "Plan Recovery"
    }
  ];

  const aiInsights = [
    {
      title: "Peak Performance Time",
      insight: "Your workout performance is 23% better between 6-8 PM based on your recent sessions.",
      suggestion: "Schedule high-intensity workouts during evening hours for optimal results.",
      confidence: 87
    },
    {
      title: "Plateau Alert",
      insight: "Your bench press hasn't improved in 3 weeks. Time to switch up your routine.",
      suggestion: "Try incline bench press or increase frequency to break through the plateau.",
      confidence: 92
    },
    {
      title: "Nutrition Pattern",
      insight: "You tend to skip breakfast on workout days, which may affect your performance.",
      suggestion: "Have a light protein-rich breakfast 2 hours before morning workouts.",
      confidence: 78
    }
  ];

  const quickActions = [
    { title: "Adjust Weekly Plan", icon: Calendar, description: "Optimize your workout schedule" },
    { title: "Meal Prep Ideas", icon: Target, description: "Get personalized meal suggestions" },
    { title: "Form Check", icon: TrendingUp, description: "AI analysis of your exercise form" },
    { title: "Recovery Tips", icon: Clock, description: "Improve your rest and recovery" }
  ];

  const trendingWorkouts = [
    {
      name: "12-Minute HIIT Blast",
      popularity: "94% completion rate",
      benefit: "Quick fat burn",
      difficulty: "Intermediate"
    },
    {
      name: "Yoga Flow for Athletes",
      popularity: "Rising 45% this week",
      benefit: "Flexibility & recovery",
      difficulty: "Beginner"
    },
    {
      name: "Functional Strength Circuit",
      popularity: "Top rated this month",
      benefit: "Real-world strength",
      difficulty: "Advanced"
    }
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-destructive text-destructive-foreground';
      case 'Medium': return 'bg-primary text-primary-foreground';
      case 'Low': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'workout': return <Target className="h-5 w-5 text-primary" />;
      case 'nutrition': return <Lightbulb className="h-5 w-5 text-accent" />;
      case 'recovery': return <Clock className="h-5 w-5 text-destructive" />;
      default: return <Star className="h-5 w-5 text-muted-foreground" />;
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
              Smart Suggestions
            </h1>
            <p className="text-muted-foreground">
              AI-powered recommendations to optimize your fitness journey based on your data and goals.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Suggestions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personalized Suggestions */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary" />
                  For You Today
                </h2>
                <div className="space-y-4">
                  {personalizedSuggestions.map((suggestion, index) => (
                    <Card key={index} className="hover:shadow-glow transition-all duration-300">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(suggestion.type)}
                            <div>
                              <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {suggestion.reason}
                              </p>
                            </div>
                          </div>
                          <Badge className={getImpactColor(suggestion.impact)}>
                            {suggestion.impact} Impact
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{suggestion.description}</p>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 inline mr-1" />
                            {suggestion.timeToComplete}
                          </div>
                          <Button className="bg-gradient-primary">
                            {suggestion.actionText}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-accent" />
                  AI Insights
                </h2>
                <div className="space-y-4">
                  {aiInsights.map((insight, index) => (
                    <Card key={index} className="bg-gradient-hero border-accent/20">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-foreground">{insight.title}</h3>
                          <div className="text-sm text-accent font-medium">
                            {insight.confidence}% confidence
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{insight.insight}</p>
                        <p className="text-foreground">{insight.suggestion}</p>
                        
                        <div className="mt-4">
                          <Button variant="outline" size="sm">
                            Learn More
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {quickActions.map((action, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <action.icon className="h-5 w-5 text-primary" />
                        <div>
                          <div className="text-sm font-semibold text-foreground">{action.title}</div>
                          <div className="text-xs text-muted-foreground">{action.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Trending Workouts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-accent" />
                    Trending Workouts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trendingWorkouts.map((workout, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-semibold text-foreground">{workout.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {workout.difficulty}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{workout.popularity}</div>
                        <div className="text-xs text-accent">{workout.benefit}</div>
                        <Button variant="outline" size="sm" className="w-full">
                          Try Now
                        </Button>
                        {index < trendingWorkouts.length - 1 && <hr className="border-border" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Optimization Score */}
              <Card className="bg-gradient-primary text-primary-foreground">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold mb-2">87%</div>
                  <div className="text-sm opacity-90 mb-4">Optimization Score</div>
                  <p className="text-xs opacity-80 mb-4">
                    You're doing great! Following 2 more suggestions could boost your score to 95%.
                  </p>
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                </CardContent>
              </Card>

              {/* Suggestion Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Suggestion Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">Workout suggestions</span>
                      <div className="w-8 h-4 bg-primary rounded-full"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">Nutrition tips</span>
                      <div className="w-8 h-4 bg-primary rounded-full"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">Recovery reminders</span>
                      <div className="w-8 h-4 bg-muted rounded-full"></div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-4">
                      Customize
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Suggestions;
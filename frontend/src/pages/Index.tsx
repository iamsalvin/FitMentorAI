import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import FeatureCard from '@/components/FeatureCard';
import workoutIcon from '@/assets/workout-icon.png';
import dietIcon from '@/assets/diet-icon.png';
import progressIcon from '@/assets/progress-icon.png';
import heroImage from '@/assets/hero-fitness.jpg';

export default function Index() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  return (
    <div className="space-y-16 pb-8">
      {/* Hero Section */}
      <section className="relative h-[500px] -mt-20 mb-16">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Fitness Hero"
            className="w-full h-full object-cover brightness-50"
          />
        </div>
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center space-y-6 p-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Transform Your Fitness Journey
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto">
              Personalized workouts, nutrition tracking, and progress monitoring all in one place
            </p>
              <Button 
                size="lg" 
              onClick={() => navigate(isSignedIn ? '/dashboard' : '/sign-in')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
              {isSignedIn ? 'Go to Dashboard' : 'Get Started'}
              </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
              Everything You Need to Succeed
            </h2>
        <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
            icon={workoutIcon}
            title="Smart Workout Plans"
            description="Get personalized workout plans based on your goals and fitness level"
            onClick={() => navigate('/workout')}
          />
            <FeatureCard
            icon={dietIcon}
              title="Nutrition Tracking"
            description="Track your meals and get insights into your nutrition habits"
            onClick={() => navigate('/diet')}
          />
            <FeatureCard
            icon={progressIcon}
            title="Progress Monitoring"
            description="Track your progress with detailed metrics and visual charts"
            onClick={() => navigate('/progress')}
          />
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Start Your Fitness Journey?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already transformed their lives with our personalized fitness approach
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate(isSignedIn ? '/dashboard' : '/sign-in')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSignedIn ? 'Go to Dashboard' : 'Join Now'}
          </Button>
        </div>
      </section>
    </div>
  );
}

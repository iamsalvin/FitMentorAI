import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import Diet from './pages/Diet';
import Progress from './pages/Progress';
import Challenges from './pages/Challenges';
import Leaderboard from './pages/Leaderboard';
import NotFound from './pages/NotFound';
import SignInPage from './pages/SignIn';
import AdminPage from './pages/Admin';
import Navigation from './components/Navigation';
import { ProgressProvider } from './contexts/ProgressContext';
import SavedWorkouts from './pages/SavedWorkouts';
import Profile from './pages/Profile';
import './App.css';
import { lazy, Suspense } from 'react';
const ChatbotWidget = lazy(() => import('./components/ChatbotWidget'));

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ProgressProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Navigation />
            <main className="container mx-auto px-4 pt-20">
        <Routes>
                {/* Public Routes */}
          <Route path="/" element={<Index />} />
                <Route 
                  path="/sign-in/*" 
                  element={
                    <SignedOut>
                      <SignInPage />
                    </SignedOut>
                  } 
                />

                {/* Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <>
                      <SignedIn>
                        <AdminPage />
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <>
                      <SignedIn>
                        <Dashboard />
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                />
                <Route
                  path="/workout"
                  element={
                    <>
                      <SignedIn>
                        <Workout />
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                />
                <Route
                  path="/diet"
                  element={
                    <>
                      <SignedIn>
                        <Diet />
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                />
                <Route
                  path="/progress"
                  element={
                    <>
                      <SignedIn>
                        <Progress />
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                />
                <Route
                  path="/challenges"
                  element={
                    <>
                      <SignedIn>
                        <Challenges />
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                />
                <Route
                  path="/saved-workouts"
                  element={
                    <SignedIn>
                      <SavedWorkouts />
                    </SignedIn>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <SignedIn>
                      <Profile />
                    </SignedIn>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <SignedIn>
                      <Leaderboard />
                    </SignedIn>
                  }
                />

                {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
            </main>
            <Suspense fallback={null}>
              <ChatbotWidget />
            </Suspense>
          </div>
        </Router>
      </ProgressProvider>
    </ClerkProvider>
);
}

export default App;

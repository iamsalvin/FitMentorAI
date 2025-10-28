import { SignIn } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";

const Login = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground">Welcome to FitMentor</h1>
            <p className="text-muted-foreground mt-2">Sign in to track your fitness journey</p>
          </div>
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-primary hover:bg-primary/90',
                card: 'bg-transparent shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'bg-white text-black border border-input hover:bg-accent',
                formFieldInput: 'bg-background border border-input',
                dividerLine: 'bg-border',
                dividerText: 'text-muted-foreground',
                footerActionLink: 'text-primary hover:text-primary/90'
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login; 
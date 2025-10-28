import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <SignIn 
        routing="path" 
        path="/sign-in" 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white shadow-xl",
            headerTitle: "text-gray-900",
            headerSubtitle: "text-gray-600",
            socialButtonsBlockButton: "text-gray-900 border-gray-200",
            socialButtonsBlockButtonText: "text-gray-900",
            dividerLine: "bg-gray-200",
            dividerText: "text-gray-500",
            formButtonPrimary: "bg-primary hover:bg-primary/90",
            formFieldLabel: "text-gray-900",
            formFieldInput: "bg-white text-gray-900 border-gray-200",
            footerActionLink: "text-primary hover:text-primary/90"
          }
        }}
      />
    </div>
  );
} 
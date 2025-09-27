import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [currentView, setCurrentView] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AetherMind
            </h1>
            <Badge variant="secondary" className="text-xs">
              AI
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Your AI-Powered Research Assistant & Project Manager
          </p>
        </div>

        {/* Auth Forms */}
        {currentView === "login" ? (
          <LoginForm
            onSuccess={onAuthSuccess}
            onSwitchToRegister={() => setCurrentView("register")}
          />
        ) : (
          <RegisterForm
            onSuccess={onAuthSuccess}
            onSwitchToLogin={() => setCurrentView("login")}
          />
        )}

        {/* Features Preview */}
        <Card className="bg-muted/30 border-muted">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3 text-center">What you'll get:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>AI-powered research assistance</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>Advanced writing tools & grammar check</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>Collaborative project management</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>Document analysis & citation generator</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

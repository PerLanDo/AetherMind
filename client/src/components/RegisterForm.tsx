import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

export default function RegisterForm({
  onSuccess,
  onSwitchToLogin,
}: RegisterFormProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const checkPasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score++;
    } else {
      feedback.push("At least 8 characters long");
    }

    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push("Include uppercase letter");
    }

    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push("Include lowercase letter");
    }

    if (/\d/.test(password)) {
      score++;
    } else {
      feedback.push("Include a number");
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score++;
    } else {
      feedback.push("Include special character");
    }

    return {
      score,
      feedback,
      isValid: score >= 3 && password.length >= 8,
    };
  };

  const passwordStrength = checkPasswordStrength(formData.password);
  const passwordsMatch =
    formData.password === formData.confirmPassword &&
    formData.confirmPassword !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (!passwordStrength.isValid) {
      setError("Password does not meet security requirements");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
        credentials: "include",
      });

      if (response.ok) {
        const user = await response.json();
        toast({
          title: "Account created!",
          description: `Welcome to AetherMind, ${user.username}!`,
        });
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      setError("Network error. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const getPasswordStrengthColor = () => {
    if (formData.password === "") return "bg-gray-200";
    if (passwordStrength.score <= 2) return "bg-red-500";
    if (passwordStrength.score <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const isFormValid =
    formData.username.length >= 3 &&
    formData.email.includes("@") &&
    passwordStrength.isValid &&
    passwordsMatch;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Join AetherMind to start your research journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
            {formData.username && formData.username.length < 3 && (
              <p className="text-sm text-muted-foreground">
                Username must be at least 3 characters long
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {passwordStrength.score}/5
                  </span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {passwordStrength.feedback.map((item, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <XCircle className="h-3 w-3 text-red-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {formData.confirmPassword && (
              <div className="flex items-center space-x-2 text-xs">
                {passwordsMatch ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span className="text-red-600">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button
              type="button"
              variant="ghost"
              className="p-0 h-auto font-normal text-primary hover:bg-transparent"
              onClick={onSwitchToLogin}
              disabled={isLoading}
            >
              Sign in
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

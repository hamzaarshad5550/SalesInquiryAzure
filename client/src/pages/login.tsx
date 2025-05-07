import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SiGoogle } from "react-icons/si";

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { googleSignIn } = useAuth();
  const [_, navigate] = useLocation();

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await googleSignIn();
      navigate("/dashboard");
    } catch (error: any) {
      setError(error.message || "Failed to sign in with Google");
      console.error("Google sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            CRM Login
          </CardTitle>
          <CardDescription>
            Sign in to access your CRM dashboard and data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <Button
              id="loginBtn"
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-2"
              disabled={isLoading}
              size="lg"
            >
              <SiGoogle className="h-4 w-4" />
              {isLoading ? "Signing in..." : "Sign in with Google"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <p>Sign in to access your messages, calendar, and CRM data</p>
        </CardFooter>
      </Card>
    </div>
  );
}
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import ChatInterface from "@/components/ChatInterface";
import { Card, CardContent } from "@/components/ui/card";

export default function AITutor() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Handle unauthorized errors at page level
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            AI Tutor Assistant
          </h1>
          <p className="text-muted-foreground">
            Get instant help powered by advanced AI models
          </p>
        </div>

        {/* Chat Interface */}
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <div className="text-6xl text-muted-foreground mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI Tutor Coming Soon</h3>
            <p className="text-muted-foreground">
              Our advanced AI tutor is under development. Get ready for personalized
              learning assistance powered by cutting-edge AI technology!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

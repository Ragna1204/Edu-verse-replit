import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import ChatInterface from "@/components/ChatInterface";

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
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
          <ChatInterface />
        </div>
      </div>
    </Layout>
  );
}

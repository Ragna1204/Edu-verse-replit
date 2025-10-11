import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import AdaptiveQuiz from "@/components/AdaptiveQuiz";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Star, 
  Clock, 
  Target,
  CheckCircle,
  XCircle,
  ArrowLeft
} from "lucide-react";

export default function Quiz() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: quizData, isLoading, error } = useQuery({
    queryKey: ["/api/quizzes", id],
    enabled: !!id && isAuthenticated && !authLoading,
    retry: false,
  });

  // Handle unauthorized errors at page level
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const handleQuizComplete = (result: any) => {
    const { attempt, xpGained, newBadges, levelUp } = result;
    
    // Show completion screen with results
    setLocation(`/quiz/${id}/results`);
    
    // Show celebration toasts
    if (levelUp) {
      toast({
        title: "🎉 Level Up!",
        description: "Congratulations on reaching a new level!",
      });
    }
    
    if (newBadges && newBadges.length > 0) {
      newBadges.forEach((badge: any) => {
        toast({
          title: "🏆 New Badge!",
          description: `You earned the "${badge.name}" badge!`,
        });
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!quizData) {
    return (
      <Layout>
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <div className="text-6xl text-muted-foreground mb-4">🧠</div>
                <h3 className="text-xl font-semibold mb-2">Quiz Not Found</h3>
                <p className="text-muted-foreground mb-6">
                  The quiz you're looking for doesn't exist or has been removed.
                </p>
                <Button onClick={() => setLocation("/courses")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Courses
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  const difficultyColors = {
    beginner: "bg-success/20 text-success",
    intermediate: "bg-accent/20 text-accent",
    advanced: "bg-destructive/20 text-destructive",
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quiz Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h1 className="font-display text-3xl font-bold">Adaptive Quiz</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Challenge yourself with our AI-powered adaptive quiz system that adjusts difficulty based on your performance
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Quiz Interface */}
            <div className="lg:col-span-3">
              <AdaptiveQuiz quizId={id} onComplete={handleQuizComplete} />
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Quiz Info */}
              <Card className="glass-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <Target className="w-5 h-5 text-primary mr-2" />
                    Quiz Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Questions</span>
                      <span className="font-semibold">{quizData.questions?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Time Limit</span>
                      <span className="font-semibold">
                        {quizData.timeLimit ? `${quizData.timeLimit} min` : "No limit"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Passing Score</span>
                      <span className="font-semibold">{quizData.passingScore}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Difficulty</span>
                      <Badge className={`text-xs ${difficultyColors[quizData.difficulty] || 'bg-muted/20 text-muted-foreground'}`}>
                        {quizData.difficulty.charAt(0).toUpperCase() + quizData.difficulty.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="glass-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <Star className="w-5 h-5 text-accent mr-2" />
                    Quiz Tips
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <p>Read each question carefully before selecting your answer</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <p>The difficulty adapts based on your performance</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <p>Review explanations to learn from mistakes</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <p>Take your time - accuracy matters more than speed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scoring */}
              <Card className="glass-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Scoring System</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Correct Answer</span>
                      <span className="font-semibold text-success">+10 XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">High Score (90%+)</span>
                      <span className="font-semibold text-accent">+50 XP Bonus</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Perfect Score</span>
                      <span className="font-semibold text-primary">+100 XP Bonus</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

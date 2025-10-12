import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import ProgressRing from "@/components/ProgressRing";
import Badge from "@/components/Badge";
import ActivityItem from "@/components/ActivityItem";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Trophy, TrendingUp, Play, CheckCircle, Flame, Lightbulb, Bot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ["/api/user/analytics"],
    enabled: isAuthenticated && !isLoading,
    retry: false,
  });

  const { data: userCourses, isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ["/api/user/enrollments"],
    enabled: isAuthenticated && !isLoading,
    retry: false,
  });

  const { data: userBadges, isLoading: badgesLoading, error: badgesError } = useQuery({
    queryKey: ["/api/user/badges"],
    enabled: isAuthenticated && !isLoading,
    retry: false,
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/user/recent-activity"],
    enabled: isAuthenticated && !isLoading,
    retry: false,
  });

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

  // Handle API errors
  useEffect(() => {
    const errors = [analyticsError, coursesError, badgesError].filter(Boolean);
    errors.forEach(error => {
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
    });
  }, [analyticsError, coursesError, badgesError, toast]);

  if (isLoading || analyticsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  const currentCourse = userCourses?.[0];
  const level = user?.level || 1;
  const totalXP = user?.xp || 0;
  const xpToNextLevel = (level * 1000) - totalXP;
  const xpProgress = (totalXP % 1000) / 10;

  const latestAnalytics = analytics?.[0];

  return (
    <Layout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Your Dashboard
            </h1>
            <p className="text-muted-foreground">Track your progress and achievements</p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Progress & Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Overview */}
              <AnalyticsDashboard />

              {/* Current Course Progress */}
              {currentCourse && (
                <>
                <Card className="glass-card transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <BookOpen className="w-5 h-5 text-secondary mr-3" />
                        Current Course
                      </span>
                      <span className="text-sm text-muted-foreground font-normal">
                        {currentCourse.course?.title}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{Math.round(currentCourse.progress)}%</span>
                      </div>
                      <Progress value={currentCourse.progress} className="h-2" />
                    </div>
                    <Button 
                      className="w-full bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" 
                      data-testid="button-continue-course"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Button>
                  </CardContent>
                </Card>
                </>
              )}

              <Card className="glass-card transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 text-accent mr-3" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activityLoading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-start space-x-4 p-3">
                          <Skeleton className="w-5 h-5 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))
                    ) : recentActivity && recentActivity.length > 0 ? (
                      recentActivity.map((activity: any) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Start learning to see your recent activities here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Level & Badges */}
            <div className="space-y-6">
              {/* Level Card */}
              <Card className="glass-card border-accent/20 shadow-lg shadow-accent/10 transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-4xl font-display font-bold">
                    <span>{level}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">
                    Level {level} Scholar
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {xpToNextLevel > 0 ? `${xpToNextLevel} XP to next level` : "Max level reached!"}
                  </p>
                  <div className="w-full bg-border rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-accent to-primary h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${xpProgress}%`}}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">{totalXP} XP</span> total earned
                  </p>
                </CardContent>
              </Card>

              {/* Badges */}
              <Card className="glass-card transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Trophy className="w-5 h-5 text-accent mr-2" />
                      Badges
                    </span>
                    <span className="text-sm text-muted-foreground font-normal">
                      {userBadges?.length || 0}/20
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {userBadges?.slice(0, 6).map((badge: any, index: number) => (
                      <Badge 
                        key={badge.id} 
                        name={badge.name}
                        iconClass={badge.iconClass}
                        color="#4F46E5"
                        earned={true}
                      />
                    ))}
                    {/* Show locked badges */}
                    {Array.from({ length: Math.max(0, 6 - (userBadges?.length || 0)) }).map((_, index) => (
                      <Badge 
                        key={`locked-${index}`}
                        name="Locked"
                        iconClass="fas fa-lock"
                        color="#6B7280"
                        earned={false}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Recommendations */}
              <Card className="glass-card transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="w-5 h-5 text-accent mr-2" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Bot className="w-4 h-4 text-primary mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Start with the basics</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            We recommend starting with our beginner courses to build a strong foundation
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-secondary/10 border border-secondary/30 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-secondary mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Daily Learning Goal</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Set a goal to learn for 30 minutes daily to maintain momentum
                          </p>
                        </div>
                      </div>
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

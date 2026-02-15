import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Play,
  CheckCircle,
  ArrowLeft,
  Trophy,
  Target,
  Video,
  FileText
} from "lucide-react";

export default function Course() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: courseData, isLoading, error } = useQuery({
    queryKey: ["/api/courses", id],
    enabled: !!id && isAuthenticated && !authLoading,
    retry: false,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["/api/my-courses"],
    enabled: isAuthenticated && !authLoading,
    retry: false,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/courses/${id}/enroll`);
    },
    onSuccess: () => {
      toast({
        title: "Enrolled Successfully!",
        description: `You're now enrolled in ${courseData?.title}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/my-courses"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Enrollment Failed",
        description: "Failed to enroll in course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const progressMutation = useMutation({
    mutationFn: async (progress: number) => {
      await apiRequest("PUT", `/api/courses/${id}/progress`, { progress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
    },
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

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <div className="text-6xl text-muted-foreground mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">Course Not Found</h3>
              <p className="text-muted-foreground mb-6">
                The course you're looking for doesn't exist or has been removed.
              </p>
              <Button asChild>
                <Link href="/courses">Back to Courses</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const userEnrollment = enrollment?.find((e: any) => e.courseId === parseInt(id!));
  const isEnrolled = !!userEnrollment;
  const progress = userEnrollment?.progress || 0;

  const categoryColors: Record<string, string> = {
    "programming": "bg-primary/20 text-primary",
    "data-science": "bg-secondary/20 text-secondary",
    "design": "bg-accent/20 text-accent",
    "business": "bg-success/20 text-success",
    "devops": "bg-primary/20 text-primary",
    "blockchain": "bg-accent/20 text-accent",
    "ai-ml": "bg-secondary/20 text-secondary",
  };

  const difficultyColors: Record<string, string> = {
    "beginner": "bg-success/20 text-success",
    "intermediate": "bg-accent/20 text-accent",
    "advanced": "bg-destructive/20 text-destructive",
  };

  return (
    <div className="py-8">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="ghost" asChild data-testid="button-back-to-courses">
              <Link href="/courses">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Course Header */}
              <Card className="glass-card border-primary/20 shadow-lg shadow-primary/10">
                <div 
                  className="h-64 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative overflow-hidden"
                  style={{
                    backgroundImage: courseData.imageUrl ? `url(${courseData.imageUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!courseData.imageUrl && (
                    <div className="text-8xl opacity-50">
                      {courseData.category === 'programming' && '💻'}
                      {courseData.category === 'data-science' && '📊'}
                      {courseData.category === 'design' && '🎨'}
                      {courseData.category === 'business' && '💼'}
                      {courseData.category === 'devops' && '⚙️'}
                      {courseData.category === 'blockchain' && '⛓️'}
                      {courseData.category === 'ai-ml' && '🤖'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                </div>
                
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge className={`${categoryColors[courseData.category] || 'bg-muted/20 text-muted-foreground'}`}>
                      {courseData.category.toUpperCase().replace('-', ' ')}
                    </Badge>
                    <Badge className={`${difficultyColors[courseData.difficulty] || 'bg-muted/20 text-muted-foreground'}`}>
                      {courseData.difficulty.charAt(0).toUpperCase() + courseData.difficulty.slice(1)}
                    </Badge>
                    <div className="flex items-center space-x-1 text-accent">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-semibold">{courseData.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <h1 className="font-display text-3xl font-bold mb-4" data-testid="course-title">
                    {courseData.title}
                  </h1>
                  
                  <p className="text-muted-foreground mb-6">
                    {courseData.description}
                  </p>

                  <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-6">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {courseData.estimatedHours} hours
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {courseData.studentsCount.toLocaleString()} students
                    </span>
                    <span className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      {courseData.modules?.length || 0} modules
                    </span>
                  </div>

                  {isEnrolled && (
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Your Progress</span>
                        <span className="font-semibold">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                    </div>
                  )}

                  <div className="flex gap-3">
                    {isEnrolled ? (
                      <Button 
                        className="bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20"
                        onClick={() => progressMutation.mutate(Math.min(progress + 10, 100))}
                        disabled={progressMutation.isPending}
                        data-testid="button-continue-learning"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {progress >= 100 ? 'Review Course' : 'Continue Learning'}
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => enrollMutation.mutate()}
                        disabled={enrollMutation.isPending}
                        className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        data-testid="button-enroll-course"
                      >
                        {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Course Content */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 text-primary mr-3" />
                    Course Modules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {courseData.modules && courseData.modules.length > 0 ? (
                    <div className="space-y-4">
                      {courseData.modules.map((module: any, index: number) => (
                        <div key={module.id} className="flex items-center space-x-4 p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="font-bold text-primary">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{module.title}</h4>
                            <p className="text-sm text-muted-foreground">{module.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {module.estimatedMinutes || 30} min
                              </span>
                              {module.videoUrl && (
                                <span className="flex items-center">
                                  <Video className="w-3 h-3 mr-1" />
                                  Video
                                </span>
                              )}
                              {module.content && (
                                <span className="flex items-center">
                                  <FileText className="w-3 h-3 mr-1" />
                                  Reading
                                </span>
                              )}
                            </div>
                          </div>
                          {isEnrolled ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Course modules will be available after enrollment</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Course Stats */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="w-5 h-5 text-accent mr-2" />
                    Course Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Difficulty</span>
                      <Badge className={`${difficultyColors[courseData.difficulty] || 'bg-muted/20 text-muted-foreground'}`}>
                        {courseData.difficulty.charAt(0).toUpperCase() + courseData.difficulty.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Duration</span>
                      <span className="font-semibold">{courseData.estimatedHours}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Students</span>
                      <span className="font-semibold">{courseData.studentsCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Rating</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-current text-accent" />
                        <span className="font-semibold">{courseData.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Objectives */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 text-secondary mr-2" />
                    What You'll Learn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                      <p className="text-sm">Master the core concepts and fundamentals</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                      <p className="text-sm">Apply knowledge through hands-on projects</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                      <p className="text-sm">Build a portfolio of practical work</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                      <p className="text-sm">Prepare for real-world applications</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prerequisites */}
              {courseData.difficulty !== 'beginner' && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Prerequisites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {courseData.difficulty === 'intermediate' && (
                        <p>• Basic understanding of the subject matter</p>
                      )}
                      {courseData.difficulty === 'advanced' && (
                        <>
                          <p>• Solid foundation in intermediate concepts</p>
                          <p>• Previous project experience recommended</p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

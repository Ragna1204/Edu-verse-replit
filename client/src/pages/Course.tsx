import { useEffect } from "react";
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
import {
  BookOpen,
  Clock,
  Users,
  Star,
  CheckCircle,
  ArrowLeft,
  Trophy,
  Target,
  HelpCircle,
  Lock,
  Sparkles,
  Zap,
} from "lucide-react";

interface LessonWithProgress {
  id: string;
  courseId: string;
  title: string;
  type: 'reading' | 'quiz';
  content: string;
  order: number;
  xpReward: number;
  estimatedMinutes: number;
  progress: {
    isCompleted: boolean;
    score: number | null;
    completedAt: string | null;
  } | null;
}

export default function Course() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: courseData, isLoading, error } = useQuery<any>({
    queryKey: [`/api/courses/${id}`],
    enabled: !!id && isAuthenticated && !authLoading,
    retry: false,
  });

  const { data: lessonsData } = useQuery<LessonWithProgress[]>({
    queryKey: [`/api/courses/${id}/lessons`],
    enabled: !!id && isAuthenticated && !authLoading,
    retry: false,
  });

  const { data: enrollments } = useQuery<any[]>({
    queryKey: ["/api/user/enrollments"],
    enabled: isAuthenticated && !authLoading,
    retry: false,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/courses/${id}/enroll`);
    },
    onSuccess: () => {
      toast({ title: "Enrolled Successfully! 🎉", description: `You're now enrolled. Start learning!` });
      queryClient.invalidateQueries({ queryKey: ["/api/user/enrollments"] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}/lessons`] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Please log in again.", variant: "destructive" });
        return;
      }
      toast({ title: "Enrollment Failed", description: "Could not enroll. Please try again.", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
      toast({ title: "Unauthorized", description: "Please log in again.", variant: "destructive" });
    }
  }, [error, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="py-8 max-w-4xl mx-auto px-4">
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Course Not Found</h3>
            <p className="text-muted-foreground mb-6">This course doesn't exist or has been removed.</p>
            <Button asChild><Link href="/courses">Back to Courses</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userEnrollment = (enrollments as any[])?.find((e: any) => e.courseId === id);
  const isEnrolled = !!userEnrollment;
  const lessons = lessonsData || [];
  const completedLessons = lessons.filter(l => l.progress?.isCompleted).length;
  const totalLessons = lessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Find the next lesson to continue from
  const nextLesson = lessons.find(l => !l.progress?.isCompleted);

  const categoryEmoji: Record<string, string> = {
    "programming": "💻", "data-science": "📊", "design": "🎨",
    "business": "💼", "devops": "⚙️", "ai-ml": "🤖", "mathematics": "📐",
  };

  const difficultyColors: Record<string, string> = {
    "beginner": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "intermediate": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "advanced": "bg-rose-500/20 text-rose-400 border-rose-500/30",
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/courses">
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Courses
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <Card className="glass-card border-primary/20 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/10 flex items-center justify-center relative">
                <div className="text-7xl opacity-40">
                  {categoryEmoji[courseData.category] || '📚'}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>

              <CardContent className="p-6 -mt-8 relative z-10">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {courseData.category?.toUpperCase().replace('-', ' ')}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${difficultyColors[courseData.difficulty] || ''}`}>
                    {courseData.difficulty?.charAt(0).toUpperCase() + courseData.difficulty?.slice(1)}
                  </Badge>
                  {courseData.xpReward && (
                    <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                      <Zap className="w-3 h-3 mr-1" />
                      {courseData.xpReward} XP
                    </Badge>
                  )}
                </div>

                <h1 className="font-display text-3xl font-bold mb-3">{courseData.title}</h1>
                <p className="text-muted-foreground mb-5 leading-relaxed">{courseData.description}</p>

                <div className="flex items-center gap-6 text-sm text-muted-foreground mb-5">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {courseData.estimatedHours}h
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {(courseData.enrollmentCount || 0).toLocaleString()} students
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    {totalLessons} lessons
                  </span>
                  {courseData.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current text-yellow-400" />
                      {courseData.rating?.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Progress Bar (enrolled) */}
                {isEnrolled && (
                  <div className="mb-5 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Course Progress</span>
                      <span className="font-bold text-primary">{completedLessons}/{totalLessons} lessons · {progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2.5" />
                  </div>
                )}

                {/* CTA Button */}
                {isEnrolled ? (
                  nextLesson ? (
                    <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/20">
                      <Link href={`/lesson/${nextLesson.id}`}>
                        <Sparkles className="w-5 h-5 mr-2" />
                        {completedLessons > 0 ? 'Continue Learning' : 'Start Learning'}
                      </Link>
                    </Button>
                  ) : (
                    <Button size="lg" disabled className="bg-emerald-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Course Completed!
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isPending}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/20"
                  >
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll Now — Free"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Lesson Syllabus */}
            <Card className="glass-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Course Syllabus
                  <Badge variant="outline" className="ml-auto text-xs font-normal">
                    {completedLessons}/{totalLessons} complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lessons.length > 0 ? (
                  <div className="space-y-2">
                    {lessons.map((lesson, index) => {
                      const isCompleted = lesson.progress?.isCompleted;
                      const isLocked = !isEnrolled;
                      const isCurrent = isEnrolled && !isCompleted && lesson.id === nextLesson?.id;

                      return (
                        <div key={lesson.id}>
                          {isEnrolled && !isLocked ? (
                            <Link href={`/lesson/${lesson.id}`}>
                              <div className={`
                                flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer
                                ${isCurrent
                                  ? 'border-primary/50 bg-primary/5 shadow-sm shadow-primary/10'
                                  : isCompleted
                                    ? 'border-border/50 bg-muted/20 opacity-80'
                                    : 'border-border/30 hover:border-primary/30 hover:bg-muted/10'}
                              `}>
                                {/* Number / Status Icon */}
                                <div className={`
                                  w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm
                                  ${isCompleted
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : isCurrent
                                      ? 'bg-primary/20 text-primary ring-2 ring-primary/30'
                                      : 'bg-muted/30 text-muted-foreground'}
                                `}>
                                  {isCompleted ? (
                                    <CheckCircle className="w-5 h-5" />
                                  ) : (
                                    <span>{index + 1}</span>
                                  )}
                                </div>

                                {/* Lesson Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className={`font-medium truncate ${isCompleted ? 'line-through opacity-70' : ''}`}>
                                      {lesson.title}
                                    </h4>
                                    {isCurrent && (
                                      <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 py-0">
                                        Next
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      {lesson.type === 'quiz' ? <HelpCircle className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                                      {lesson.type === 'quiz' ? 'Quiz' : 'Reading'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {lesson.estimatedMinutes} min
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Zap className="w-3 h-3" />
                                      {lesson.xpReward} XP
                                    </span>
                                    {isCompleted && lesson.progress?.score !== null && lesson.progress?.score !== undefined && (
                                      <span className="flex items-center gap-1 text-emerald-400">
                                        Score: {lesson.progress.score}%
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Arrow */}
                                <ArrowLeft className="w-4 h-4 rotate-180 text-muted-foreground shrink-0" />
                              </div>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-4 p-4 rounded-xl border border-border/30 opacity-50">
                              <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center shrink-0">
                                <Lock className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{lesson.title}</h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span>{lesson.type === 'quiz' ? 'Quiz' : 'Reading'}</span>
                                  <span>{lesson.estimatedMinutes} min</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No lessons yet</p>
                    <p className="text-sm mt-1">Course content is being prepared.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Stats */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Course Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Difficulty</span>
                  <Badge variant="outline" className={difficultyColors[courseData.difficulty] || ''}>
                    {courseData.difficulty?.charAt(0).toUpperCase() + courseData.difficulty?.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{courseData.estimatedHours} hours</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Lessons</span>
                  <span className="font-medium">{totalLessons}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">XP Reward</span>
                  <span className="font-medium text-yellow-400">{courseData.xpReward || 100} XP</span>
                </div>
                {courseData.rating > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current text-yellow-400" />
                      <span className="font-medium">{courseData.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* What You'll Learn */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="w-5 h-5 text-secondary" />
                  What You'll Learn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {[
                    "Master the core concepts and fundamentals",
                    "Apply knowledge through interactive quizzes",
                    "Track your progress with XP rewards",
                    "Build a strong foundation for advanced topics",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lesson Breakdown */}
            {totalLessons > 0 && (
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Content Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="w-4 h-4" />
                        Reading Lessons
                      </span>
                      <span className="font-medium">{lessons.filter(l => l.type === 'reading').length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <HelpCircle className="w-4 h-4" />
                        Quizzes
                      </span>
                      <span className="font-medium">{lessons.filter(l => l.type === 'quiz').length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Zap className="w-4 h-4" />
                        Total XP Available
                      </span>
                      <span className="font-medium text-yellow-400">
                        {lessons.reduce((sum, l) => sum + (l.xpReward || 0), 0)} XP
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Eye, 
  Crown,
  CheckCircle 
} from "lucide-react";

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    imageUrl?: string;
    estimatedHours: number;
    rating: number;
    studentsCount: number;
    isPublished: boolean;
  };
  enrollment?: {
    progress: number;
    enrolledAt: string;
    completedAt?: string;
  };
  showProgress?: boolean;
}

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

export default function CourseCard({ course, enrollment, showProgress = false }: CourseCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const enrollMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/courses/${course.id}/enroll`);
    },
    onSuccess: () => {
      toast({
        title: "Enrolled Successfully!",
        description: `You're now enrolled in ${course.title}`,
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

  const categoryColor = categoryColors[course.category] || "bg-muted/20 text-muted-foreground";
  const difficultyColor = difficultyColors[course.difficulty] || "bg-muted/20 text-muted-foreground";
  const isPremium = course.estimatedHours > 20;

  return (
    <Card className="glass-card hover-glow group overflow-hidden" data-testid={`course-card-${course.id}`}>
      <div className="relative">
        <div 
          className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"
          style={{
            backgroundImage: course.imageUrl ? `url(${course.imageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!course.imageUrl && (
            <div className="text-6xl opacity-50">
              {course.category === 'programming' && '💻'}
              {course.category === 'data-science' && '📊'}
              {course.category === 'design' && '🎨'}
              {course.category === 'business' && '💼'}
              {course.category === 'devops' && '⚙️'}
              {course.category === 'blockchain' && '⛓️'}
              {course.category === 'ai-ml' && '🤖'}
            </div>
          )}
        </div>
        {isPremium && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
            <Crown className="w-3 h-3 mr-1 inline" />
            PREMIUM
          </div>
        )}
        {enrollment?.completedAt && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-success text-success-foreground text-xs font-bold rounded-full">
            <CheckCircle className="w-3 h-3 mr-1 inline" />
            COMPLETED
          </div>
        )}
      </div>

      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Badge className={`text-xs font-semibold ${categoryColor}`}>
            {course.category.toUpperCase().replace('-', ' ')}
          </Badge>
          <div className="flex items-center space-x-1 text-accent">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-semibold">{course.rating.toFixed(1)}</span>
          </div>
        </div>

        <h3 className="text-lg font-bold mb-2 line-clamp-2" data-testid={`course-title-${course.id}`}>
          {course.title}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {course.description}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span className="flex items-center">
            <BookOpen className="w-3 h-3 mr-1" />
            Course
          </span>
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {course.estimatedHours}h
          </span>
          <span className="flex items-center">
            <Users className="w-3 h-3 mr-1" />
            {course.studentsCount.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <Badge className={`text-xs ${difficultyColor}`}>
            {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
          </Badge>
        </div>

        {showProgress && enrollment && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{Math.round(enrollment.progress)}%</span>
            </div>
            <Progress value={enrollment.progress} className="h-2" />
          </div>
        )}

        <div className="flex items-center space-x-2">
          {enrollment ? (
            <Button 
              asChild 
              className="flex-1 bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20"
              data-testid={`button-continue-${course.id}`}
            >
              <Link href={`/courses/${course.id}`}>
                Continue Learning
              </Link>
            </Button>
          ) : (
            <Button 
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              data-testid={`button-enroll-${course.id}`}
            >
              {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
            </Button>
          )}
          <Button 
            variant="outline" 
            size="icon"
            asChild
            data-testid={`button-preview-${course.id}`}
          >
            <Link href={`/courses/${course.id}`}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

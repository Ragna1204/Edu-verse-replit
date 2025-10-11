import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

export default function QuizForm({ id }: { id?: string }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const isEditing = !!id;

  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [timeLimit, setTimeLimit] = useState(0);
  const [passingScore, setPassingScore] = useState(70);
  const [isAdaptive, setIsAdaptive] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch quiz data if in editing mode
  const { data: quizData, isLoading: quizLoading } = useQuery({
    queryKey: [`/api/quizzes/${id}`], // Assuming an API endpoint for single quiz
    enabled: isEditing && isAuthenticated && !isLoading && user?.isEducator,
  });

  // Fetch educator's courses to link quiz
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/educator/courses"],
    enabled: isAuthenticated && !isLoading && user?.isEducator,
  });

  useEffect(() => {
    if (isEditing && quizData) {
      setCourseId(quizData.courseId || "");
      setTitle(quizData.title || "");
      setDescription(quizData.description || "");
      setDifficulty(quizData.difficulty || "easy");
      setTimeLimit(quizData.timeLimit || 0);
      setPassingScore(quizData.passingScore || 70);
      setIsAdaptive(quizData.isAdaptive || true);
    }
  }, [isEditing, quizData]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && (!user || !user.isEducator)) {
      toast({
        title: "Unauthorized Access",
        description: "You must be an educator to access this page.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user, isAuthenticated, isLoading, toast, navigate]);

  const createQuizMutation = useMutation({
    mutationFn: async (newQuiz: any) => {
      const response = await fetch(`/api/courses/${newQuiz.courseId}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuiz),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create quiz");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/educator/quizzes"] });
      toast({ title: "Quiz created successfully!" });
      navigate("/educator/quizzes");
      // Clear form fields on success for new quiz creation
      if (!isEditing) {
        setCourseId("");
        setTitle("");
        setDescription("");
        setDifficulty("easy");
        setTimeLimit(0);
        setPassingScore(70);
        setIsAdaptive(true);
      }
    },
    onError: (error: any) => {
      if (error.message && error.message.includes("Validation error")) {
        const errors = JSON.parse(error.message.split("Validation error: ")[1]);
        const fieldErrors: Record<string, string> = {};
        errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setFormErrors(fieldErrors);
        toast({ title: "Validation Error", description: "Please check your input.", variant: "destructive" });
      } else {
        toast({ title: "Error creating quiz", description: error.message, variant: "destructive" });
      }
    },
  });

  const updateQuizMutation = useMutation({
    mutationFn: async (updatedQuiz: any) => {
      const response = await fetch(`/api/quizzes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedQuiz),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update quiz");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/educator/quizzes"] });
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${id}`] });
      toast({ title: "Quiz updated successfully!" });
      navigate("/educator/quizzes");
    },
    onError: (error: any) => {
      if (error.message && error.message.includes("Validation error")) {
        const errors = JSON.parse(error.message.split("Validation error: ")[1]);
        const fieldErrors: Record<string, string> = {};
        errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setFormErrors(fieldErrors);
        toast({ title: "Validation Error", description: "Please check your input.", variant: "destructive" });
      } else {
        toast({ title: "Error updating quiz", description: error.message, variant: "destructive" });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous errors
    const quizData = { courseId, title, description, difficulty, timeLimit, passingScore, isAdaptive };
    if (isEditing) {
      updateQuizMutation.mutate(quizData);
    } else {
      createQuizMutation.mutate(quizData);
    }
  };

  if (isLoading || !isAuthenticated || !user || !user.isEducator || (isEditing && quizLoading) || coursesLoading) {
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/educator/quizzes" className="flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quizzes
          </Link>
          <Card className="glass-card transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
            <CardHeader>
              <CardTitle>{isEditing ? "Edit Quiz" : "Create New Quiz"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="course">Associated Course</Label>
                  <Select value={courseId} onValueChange={setCourseId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.map((course: any) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.courseId && <p className="text-destructive text-sm mt-1">{formErrors.courseId}</p>}
                </div>
                <div>
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  {formErrors.title && <p className="text-destructive text-sm mt-1">{formErrors.title}</p>}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                  {formErrors.description && <p className="text-destructive text-sm mt-1">{formErrors.description}</p>}
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.difficulty && <p className="text-destructive text-sm mt-1">{formErrors.difficulty}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                      min={0}
                    />
                    {formErrors.timeLimit && <p className="text-destructive text-sm mt-1">{formErrors.timeLimit}</p>}
                  </div>
                  <div>
                    <Label htmlFor="passingScore">Passing Score (%)</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      value={passingScore}
                      onChange={(e) => setPassingScore(parseInt(e.target.value))}
                      min={0}
                      max={100}
                    />
                    {formErrors.passingScore && <p className="text-destructive text-sm mt-1">{formErrors.passingScore}</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAdaptive"
                    checked={isAdaptive}
                    onCheckedChange={(checked) => setIsAdaptive(checked as boolean)}
                  />
                  <Label htmlFor="isAdaptive">Adaptive Quiz</Label>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={createQuizMutation.isPending || updateQuizMutation.isPending}>
                  {(createQuizMutation.isPending || updateQuizMutation.isPending) && (
                    <span className="animate-spin mr-2">⚙️</span>
                  )}
                  {isEditing ? "Update Quiz" : "Create Quiz"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

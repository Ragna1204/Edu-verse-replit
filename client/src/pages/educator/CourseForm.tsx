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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

export default function CourseForm({ id }: { id?: string }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const isEditing = !!id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [imageUrl, setImageUrl] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [modules, setModules] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch course data if in editing mode
  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: [`/api/courses/${id}`],
    enabled: isEditing && isAuthenticated && !isLoading && user?.isEducator,
  });

  useEffect(() => {
    if (isEditing && courseData) {
      setTitle(courseData.title || "");
      setDescription(courseData.description || "");
      setCategory(courseData.category || "");
      setDifficulty(courseData.difficulty || "beginner");
      setImageUrl(courseData.imageUrl || "");
      setEstimatedHours(courseData.estimatedHours || 0);
      setModules(courseData.modules || 0);
    }
  }, [isEditing, courseData]);

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

  const createCourseMutation = useMutation({
    mutationFn: async (newCourse: any) => {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourse),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create course");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/educator/courses"] });
      toast({ title: "Course created successfully!" });
      navigate("/educator/courses");
      // Clear form fields on success for new course creation
      if (!isEditing) {
        setTitle("");
        setDescription("");
        setCategory("");
        setDifficulty("beginner");
        setImageUrl("");
        setEstimatedHours(0);
        setModules(0);
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
        toast({ title: "Error creating course", description: error.message, variant: "destructive" });
      }
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (updatedCourse: any) => {
      const response = await fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCourse),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update course");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/educator/courses"] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}`] });
      toast({ title: "Course updated successfully!" });
      navigate("/educator/courses");
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
        toast({ title: "Error updating course", description: error.message, variant: "destructive" });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous errors
    const courseData = { title, description, category, difficulty, imageUrl, estimatedHours, modules };
    if (isEditing) {
      updateCourseMutation.mutate(courseData);
    } else {
      createCourseMutation.mutate(courseData);
    }
  };

  if (isLoading || !isAuthenticated || !user || !user.isEducator || (isEditing && courseLoading)) {
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
          <Link href="/educator/courses" className="flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
          <Card className="glass-card transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
            <CardHeader>
              <CardTitle>{isEditing ? "Edit Course" : "Create New Course"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Course Title</Label>
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
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  />
                  {formErrors.category && <p className="text-destructive text-sm mt-1">{formErrors.category}</p>}
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.difficulty && <p className="text-destructive text-sm mt-1">{formErrors.difficulty}</p>}
                </div>
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  {formErrors.imageUrl && <p className="text-destructive text-sm mt-1">{formErrors.imageUrl}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="modules">Number of Modules</Label>
                    <Input
                      id="modules"
                      type="number"
                      value={modules}
                      onChange={(e) => setModules(parseInt(e.target.value))}
                      min={0}
                    />
                    {formErrors.modules && <p className="text-destructive text-sm mt-1">{formErrors.modules}</p>}
                  </div>
                  <div>
                    <Label htmlFor="estimatedHours">Estimated Hours</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(parseInt(e.target.value))}
                      min={0}
                    />
                    {formErrors.estimatedHours && <p className="text-destructive text-sm mt-1">{formErrors.estimatedHours}</p>}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={createCourseMutation.isPending || updateCourseMutation.isPending}>
                  {(createCourseMutation.isPending || updateCourseMutation.isPending) && (
                    <span className="animate-spin mr-2">⚙️</span>
                  )}
                  {isEditing ? "Update Course" : "Create Course"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

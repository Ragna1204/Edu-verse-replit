import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen, HelpCircle } from "lucide-react";

export default function EducatorDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && isAuthenticated && (!user || !user.isEducator)) {
      toast({
        title: "Unauthorized Access",
        description: "You must be an educator to access this page.",
        variant: "destructive",
      });
      // Redirect to dashboard or home if not an educator
      window.location.href = "/dashboard";
    }
  }, [user, isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated || !user || !user.isEducator) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Educator Dashboard
            </h1>
            <p className="text-muted-foreground">Manage your courses, quizzes, and content</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-card transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 text-primary mr-3" />
                  Manage Courses
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-start space-y-4">
                <p className="text-muted-foreground">Create, edit, or publish your courses.</p>
                <Link href="/educator/courses">
                  <Button className="bg-primary hover:bg-primary/90">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Go to Courses
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="glass-card transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="w-5 h-5 text-secondary mr-3" />
                  Manage Quizzes
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-start space-y-4">
                <p className="text-muted-foreground">Design and update quizzes for your courses.</p>
                <Link href="/educator/quizzes">
                  <Button className="bg-secondary hover:bg-secondary/90">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Go to Quizzes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

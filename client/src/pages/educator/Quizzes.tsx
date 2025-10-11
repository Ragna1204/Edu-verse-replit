import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, HelpCircle, Edit } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function EducatorQuizzes() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && isAuthenticated && (!user || !user.isEducator)) {
      toast({
        title: "Unauthorized Access",
        description: "You must be an educator to access this page.",
        variant: "destructive",
      });
      window.location.href = "/dashboard";
    }
  }, [user, isAuthenticated, isLoading, toast]);

  const { data: quizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: ["/api/educator/quizzes"],
    enabled: isAuthenticated && !isLoading && user?.isEducator,
  });

  if (isLoading || !isAuthenticated || !user || !user.isEducator || quizzesLoading) {
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
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                Manage Quizzes
              </h1>
              <p className="text-muted-foreground">Create and edit your educational quizzes</p>
            </div>
            <Link href="/educator/quizzes/new">
              <Button className="bg-primary hover:bg-primary/90">
                <PlusCircle className="w-4 h-4 mr-2" />
                New Quiz
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes && quizzes.length > 0 ? (
              quizzes.map((quiz: any) => (
                <Card key={quiz.id} className="glass-card transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <HelpCircle className="w-5 h-5 text-secondary mr-3" />
                        {quiz.title}
                      </span>
                      <Link href={`/educator/quizzes/edit/${quiz.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-2">{quiz.description}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{quiz.difficulty}</span>
                      <span>{quiz.timeLimit ? `${quiz.timeLimit} min` : "No limit"}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="lg:col-span-3 text-center py-12 text-muted-foreground">
                <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No quizzes created yet.</p>
                <p className="text-sm">Click "New Quiz" to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

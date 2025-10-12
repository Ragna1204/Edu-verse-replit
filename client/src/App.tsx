import { Switch, Route } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import Courses from "@/pages/Courses";
import AdaptiveQuiz from "@/components/AdaptiveQuiz";
import { Leaderboard } from "@/components/Leaderboard";
import AITutor from "@/pages/AITutor";
import Community from "@/pages/Community";
import EducatorDashboard from "@/pages/EducatorDashboard";
import EducatorCourses from "@/pages/educator/Courses";
import CourseForm from "@/pages/educator/CourseForm";
import EducatorQuizzes from "@/pages/educator/Quizzes";
import QuizForm from "@/pages/educator/QuizForm";
import NotFound from "@/pages/not-found";
import { Navigation } from "@/components/Navigation";

export default function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="cosmic-bg"></div>
        <div className="cosmic-particles"></div>
        <div className="content-wrapper flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse glow-primary">
            <i className="fas fa-graduation-cap text-2xl text-white"></i>
          </div>
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              EduVerse
            </h2>
            <p className="text-muted-foreground">Loading your learning universe...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Navigation />
          <Route path="/" component={Home} />
          <Route path="/courses">
            {() => (
              <>
                <div className="cosmic-bg"></div>
                <div className="cosmic-particles"></div>
                <div className="content-wrapper">
                  <Courses />
                </div>
              </>
            )}
          </Route>
          <Route path="/quiz/:quizId?">
            {(params) => (
              <>
                <div className="cosmic-bg"></div>
                <div className="cosmic-particles"></div>
                <div className="content-wrapper">
                  <AdaptiveQuiz quizId={params.quizId || ""} />
                </div>
              </>
            )}
          </Route>
          <Route path="/leaderboard">
            {() => (
              <>
                <div className="cosmic-bg"></div>
                <div className="cosmic-particles"></div>
                <div className="content-wrapper">
                  <Leaderboard />
                </div>
              </>
            )}
          </Route>
          <Route path="/ai-tutor">
            {() => (
              <>
                <div className="cosmic-bg"></div>
                <div className="cosmic-particles"></div>
                <div className="content-wrapper">
                  <AITutor />
                </div>
              </>
            )}
          </Route>
          <Route path="/community">
            {() => (
              <>
                <div className="cosmic-bg"></div>
                <div className="cosmic-particles"></div>
                <div className="content-wrapper">
                  <Community />
                </div>
              </>
            )}
          </Route>
          <Route path="/educator">
            {() => (
              <>
                <div className="cosmic-bg"></div>
                <div className="cosmic-particles"></div>
                <div className="content-wrapper">
                  <EducatorDashboard />
                </div>
              </>
            )}
          </Route>
          <Route path="/educator/courses">
            {() => (
              <>
                <div className="cosmic-bg"></div>
                <div className="cosmic-particles"></div>
                <div className="content-wrapper">
                  <EducatorCourses />
                </div>
              </>
            )}
          </Route>
          <Route path="/educator/courses/new">
            {() => (
              <>
                <div className="cosmic-bg"></div>
                <div className="cosmic-particles"></div>
                <div className="content-wrapper">
                  <CourseForm />
                </div>
              </>
            )}
          </Route>
          <Route path="/educator/courses/edit/:id">
            {(params) => (
              <>
                <div className="cosmic-bg"></div>
                <div className="cosmic-particles"></div>
                <div className="content-wrapper">
                  <CourseForm id={params.id} />
                </div>
              </>
            )}
          </Route>
          <Route path="/educator/quizzes">
            {() => (
              <>
                <div className="cosmic-bg"></div>
                <div className="cosmic-particles"></div>
                <div className="content-wrapper">
                  <EducatorQuizzes />
                </div>
              </>
            )}
          </Route>
          <Route path="/educator/quizzes/new">
            {() => (
              <>
                <div className="cosmic-bg"></div>
                <div className="cosmic-particles"></div>
                <div className="content-wrapper">
                  <QuizForm />
                </div>
              </>
            )}
          </Route>
          <Route path="/educator/quizzes/edit/:id">
            {(params) => (
              <>
                <div className="cosmic-bg"></div>
                <div className="cosmic-particles"></div>
                <div className="content-wrapper">
                  <QuizForm id={params.id} />
                </div>
              </>
            )}
          </Route>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

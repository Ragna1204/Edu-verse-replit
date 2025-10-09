import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { CourseCatalog } from "@/components/CourseCatalog";
import { AdaptiveQuiz } from "@/components/AdaptiveQuiz";
import { Leaderboard } from "@/components/Leaderboard";
import { AITutor } from "@/components/AITutor";
import { Community } from "@/components/Community";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";

function Router() {
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
                  <CourseCatalog />
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
                  <AdaptiveQuiz quizId={params.quizId} topic="General Knowledge" />
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
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

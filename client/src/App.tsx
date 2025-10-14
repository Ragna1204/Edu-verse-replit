import React from "react";
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
import Dashboard from "@/pages/Dashboard";
import Layout from "@/components/Layout";
import { Auth } from "@/pages/Auth";
import { Onboarding } from "@/pages/Onboarding";

export default function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('App.tsx - isLoading:', isLoading);
  console.log('App.tsx - isAuthenticated:', isAuthenticated);
  console.log('App.tsx - user:', user);

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
    <Layout>
      <Switch>
        {!isAuthenticated ? (
          <>
            <Route path="/">
              <Landing />
            </Route>
            <Route path="/auth">
              <Auth onAuthSuccess={() => window.location.reload()} />
            </Route>
            <Route path="/onboarding">
              <Onboarding
                onComplete={() => window.location.reload()}
                initialData={user ? {
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName
                } : undefined}
              />
            </Route>
          </>
        ) : user && (!user.isOnboarded || !user.username) ? (
          <Route path="/">
            <Onboarding
              onComplete={() => window.location.reload()}
              initialData={{
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
              }}
            />
          </Route>
        ) : (
          <>
            <Route path="/">
              <div className="content-wrapper">
                <Dashboard />
              </div>
            </Route>
            <Route path="/courses">
              <div className="content-wrapper">
                <Courses />
              </div>
            </Route>
            <Route path="/quiz/:quizId?">
              {(params) => (
                <div className="content-wrapper">
                  <AdaptiveQuiz quizId={params.quizId || ""} />
                </div>
              )}
            </Route>
            <Route path="/leaderboard">
              <div className="content-wrapper">
                <Leaderboard />
              </div>
            </Route>
            <Route path="/ai-tutor">
              <div className="content-wrapper">
                <AITutor />
              </div>
            </Route>
            <Route path="/community">
              <div className="content-wrapper">
                <Community />
              </div>
            </Route>
            <Route path="/educator">
              <div className="content-wrapper">
                <EducatorDashboard />
              </div>
            </Route>
            <Route path="/educator/courses">
              <div className="content-wrapper">
                <EducatorCourses />
              </div>
            </Route>
            <Route path="/educator/courses/new">
              <div className="content-wrapper">
                <CourseForm />
              </div>
            </Route>
            <Route path="/educator/courses/edit/:id">
              {(params) => (
                <div className="content-wrapper">
                  <CourseForm id={params.id} />
                </div>
              )}
            </Route>
            <Route path="/educator/quizzes">
              <div className="content-wrapper">
                <EducatorQuizzes />
              </div>
            </Route>
            <Route path="/educator/quizzes/new">
              <div className="content-wrapper">
                <QuizForm />
              </div>
            </Route>
            <Route path="/educator/quizzes/edit/:id">
              {(params) => (
                <div className="content-wrapper">
                  <QuizForm id={params.id} />
                </div>
              )}
            </Route>
            <Route component={NotFound} />
          </>
        )}
      </Switch>
    </Layout>
  );
}

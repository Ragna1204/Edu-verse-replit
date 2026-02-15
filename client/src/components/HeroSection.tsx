import React from 'react';
import { Link } from 'wouter';

interface HeroSectionProps {
  isNewUser?: boolean;
}

export function HeroSection({ isNewUser = false }: HeroSectionProps) {
  const stats = {
    activeUsers: "50K+",
    courses: "200+", 
    questions: "10M+",
    accuracy: "94%"
  };

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Welcome to EduVerse
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Your AI-powered gamified learning universe. Explore courses, level up your knowledge, and compete with learners worldwide.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth">
              <button
                className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-lg transition-all hover-glow"
                data-testid="button-start-learning"
              >
                <i className="fas fa-rocket mr-2"></i>Start Learning
              </button>
            </Link>
            <Link href="/courses">
              <button
                className="px-8 py-4 glass-card hover:bg-card text-foreground rounded-lg font-semibold text-lg transition-all border border-border hover:border-primary"
                data-testid="button-explore-courses"
              >
                <i className="fas fa-compass mr-2"></i>Explore Courses
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Banner */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-card rounded-xl p-6 text-center hover-glow" data-testid="card-stat-users">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {stats.activeUsers}
            </div>
            <div className="text-sm text-muted-foreground mt-2">Active Learners</div>
          </div>
          <div className="glass-card rounded-xl p-6 text-center hover-glow" data-testid="card-stat-courses">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              {stats.courses}
            </div>
            <div className="text-sm text-muted-foreground mt-2">AI-Powered Courses</div>
          </div>
          <div className="glass-card rounded-xl p-6 text-center hover-glow" data-testid="card-stat-questions">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              {stats.questions}
            </div>
            <div className="text-sm text-muted-foreground mt-2">Questions Answered</div>
          </div>
          <div className="glass-card rounded-xl p-6 text-center hover-glow" data-testid="card-stat-accuracy">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {stats.accuracy}
            </div>
            <div className="text-sm text-muted-foreground mt-2">Avg Success Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { HeroSection } from '@/components/HeroSection';

export default function Landing() {
  return (
    <>
      {/* Cosmic Background */}
      <div className="cosmic-bg"></div>
      <div className="cosmic-particles"></div>
      
      {/* Content Wrapper */}
      <div className="content-wrapper min-h-screen flex items-center">
        <div className="w-full">
          <HeroSection isNewUser={true} />
          
          {/* Login CTA */}
          <section className="py-16 text-center">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="glass-card rounded-xl p-8 md:p-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl glow-primary">
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  Ready to Start Learning?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands of learners on their educational journey. Get personalized AI tutoring, compete on leaderboards, and earn badges as you master new skills.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <a 
                    href="/api/login" 
                    className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-lg transition-all hover-glow"
                    data-testid="button-get-started"
                  >
                    <i className="fas fa-rocket mr-2"></i>Get Started
                  </a>
                  <p className="text-sm text-muted-foreground">
                    Free to join • No credit card required
                  </p>
                </div>
                
                {/* Features Highlights */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                      <i className="fas fa-robot text-2xl text-primary"></i>
                    </div>
                    <h3 className="font-semibold mb-2">AI-Powered Learning</h3>
                    <p className="text-sm text-muted-foreground">Get personalized tutoring with advanced AI assistance</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
                      <i className="fas fa-trophy text-2xl text-secondary"></i>
                    </div>
                    <h3 className="font-semibold mb-2">Gamified Experience</h3>
                    <p className="text-sm text-muted-foreground">Earn XP, badges, and compete on leaderboards</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
                      <i className="fas fa-chart-line text-2xl text-accent"></i>
                    </div>
                    <h3 className="font-semibold mb-2">Adaptive Learning</h3>
                    <p className="text-sm text-muted-foreground">Quizzes that adapt to your skill level</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

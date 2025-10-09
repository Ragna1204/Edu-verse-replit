import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import type { User, Enrollment, Badge } from '@/types';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  gradientId: string;
  label: string;
  subtitle: string;
}

function ProgressRing({ progress, size = 120, strokeWidth = 8, gradientId, label, subtitle }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg className="progress-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          stroke="hsl(217 33% 24%)" 
          strokeWidth={strokeWidth} 
          fill="none"
        />
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          stroke={`url(#${gradientId})`} 
          strokeWidth={strokeWidth} 
          fill="none" 
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="progress-ring-circle"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {gradientId === 'gradient1' && (
              <>
                <stop offset="0%" style={{stopColor: 'hsl(243 75% 59%)', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: 'hsl(188 94% 43%)', stopOpacity: 1}} />
              </>
            )}
            {gradientId === 'gradient2' && (
              <>
                <stop offset="0%" style={{stopColor: 'hsl(188 94% 43%)', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: 'hsl(142 76% 36%)', stopOpacity: 1}} />
              </>
            )}
            {gradientId === 'gradient3' && (
              <>
                <stop offset="0%" style={{stopColor: 'hsl(38 92% 50%)', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: 'hsl(328 86% 70%)', stopOpacity: 1}} />
              </>
            )}
          </linearGradient>
        </defs>
        <text x={size / 2} y={size / 2 + 5} textAnchor="middle" className="text-2xl font-bold fill-foreground">
          {progress}%
        </text>
      </svg>
      <div className="mt-3 text-center">
        <div className="text-sm font-semibold" data-testid={`text-${label.toLowerCase()}`}>{label}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}

export function StudentDashboard() {
  const { user } = useAuth();

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['/api/user/enrollments'],
  });

  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: ['/api/user/badges'],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/user/analytics'],
  });

  if (enrollmentsLoading || badgesLoading || analyticsLoading) {
    return (
      <section className="py-16 bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted/20 rounded w-64 mb-4"></div>
            <div className="h-4 bg-muted/20 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-card rounded-xl p-6 h-96"></div>
              </div>
              <div className="space-y-6">
                <div className="glass-card rounded-xl p-6 h-64"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentEnrollment = enrollments?.[0];
  const overallProgress = currentEnrollment?.progress || 75;
  const accuracy = 90; // This would come from quiz analytics
  const weeklyGoal = 50; // This would be configurable

  return (
    <section className="py-16 bg-background/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Your Dashboard
          </h2>
          <p className="text-muted-foreground">Track your progress and achievements</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Progress & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <div className="glass-card rounded-xl p-6 glow-primary" data-testid="card-progress-overview">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <i className="fas fa-chart-line text-primary mr-3"></i>
                Learning Progress
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ProgressRing
                  progress={overallProgress}
                  gradientId="gradient1"
                  label="Overall Progress"
                  subtitle={`${enrollments?.length || 0} courses enrolled`}
                />
                <ProgressRing
                  progress={accuracy}
                  gradientId="gradient2"
                  label="Quiz Accuracy"
                  subtitle="Last 10 quizzes"
                />
                <ProgressRing
                  progress={weeklyGoal}
                  gradientId="gradient3"
                  label="Weekly Goal"
                  subtitle="5 of 10 hours"
                />
              </div>
            </div>

            {/* Current Course Progress */}
            {currentEnrollment && (
              <div className="glass-card rounded-xl p-6" data-testid="card-current-course">
                <h3 className="text-xl font-semibold mb-4 flex items-center justify-between">
                  <span><i className="fas fa-book-open text-secondary mr-3"></i>Current Course</span>
                  <span className="text-sm text-muted-foreground">React Advanced Patterns</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Module {currentEnrollment.completedModules + 1}: Custom Hooks</span>
                      <span className="font-semibold" data-testid="text-course-progress">{currentEnrollment.progress}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-secondary to-primary h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${currentEnrollment.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <Link href="/courses">
                    <button 
                      className="w-full py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg font-semibold transition-all hover-glow"
                      data-testid="button-continue-course"
                    >
                      <i className="fas fa-play mr-2"></i>Continue Learning
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="glass-card rounded-xl p-6" data-testid="card-recent-activity">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <i className="fas fa-clock text-accent mr-3"></i>Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-card/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-trophy text-primary"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Earned "Quiz Master" badge</div>
                    <div className="text-xs text-muted-foreground">Completed 10 quizzes with 90%+ accuracy</div>
                  </div>
                  <div className="text-xs text-muted-foreground">2h ago</div>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-card/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check-circle text-secondary"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Completed Module 2</div>
                    <div className="text-xs text-muted-foreground">Advanced React Patterns - State Management</div>
                  </div>
                  <div className="text-xs text-muted-foreground">1d ago</div>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-card/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-fire text-accent"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{user?.streak || 7}-day streak achieved!</div>
                    <div className="text-xs text-muted-foreground">Keep it up to unlock bonus XP</div>
                  </div>
                  <div className="text-xs text-muted-foreground">1d ago</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Level & Badges */}
          <div className="space-y-6">
            {/* Level Card */}
            <div className="glass-card rounded-xl p-6 glow-accent" data-testid="card-level">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-4xl font-display font-bold">
                  <span data-testid="text-level">{user?.level || 12}</span>
                </div>
                <h3 className="text-2xl font-bold mb-1">Advanced Scholar</h3>
                <p className="text-sm text-muted-foreground mb-4">Level {user?.level || 12}</p>
                <div className="w-full bg-border rounded-full h-3 mb-2">
                  <div className="bg-gradient-to-r from-accent to-primary h-3 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-accent" data-testid="text-xp-to-next">550 XP</span> to Level {(user?.level || 12) + 1}
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="glass-card rounded-xl p-6" data-testid="card-badges">
              <h3 className="text-xl font-semibold mb-4 flex items-center justify-between">
                <span><i className="fas fa-medal text-accent mr-2"></i>Badges</span>
                <span className="text-sm text-muted-foreground" data-testid="text-badges-count">{badges?.length || 0}/20</span>
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {badges?.slice(0, 6).map((badge, index) => (
                  <div key={badge.id} className="flex flex-col items-center badge-pulse" data-testid={`badge-${index}`}>
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl mb-2 ${badge.rarity === 'legendary' ? 'glow-accent' : 'glow-primary'}`}>
                      <i className={badge.iconClass}></i>
                    </div>
                    <span className="text-xs text-center font-medium">{badge.name}</span>
                  </div>
                )) || (
                  // Placeholder badges
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex flex-col items-center opacity-40">
                      <div className="w-16 h-16 rounded-full bg-muted/20 border-2 border-dashed border-muted flex items-center justify-center text-2xl mb-2">
                        <i className="fas fa-lock"></i>
                      </div>
                      <span className="text-xs text-center font-medium text-muted-foreground">Locked</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="glass-card rounded-xl p-6" data-testid="card-ai-recommendations">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <i className="fas fa-lightbulb text-accent mr-2"></i>AI Recommendations
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <i className="fas fa-robot text-primary mt-1"></i>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Focus on Async Patterns</p>
                      <p className="text-xs text-muted-foreground mt-1">Based on recent quiz performance, review async/await concepts.</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-secondary/10 border border-secondary/30 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <i className="fas fa-video text-secondary mt-1"></i>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Watch: Hooks Deep Dive</p>
                      <p className="text-xs text-muted-foreground mt-1">This video will help you master custom hooks.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import type { User } from '@/types';

interface LeaderboardUser extends User {
  rank?: number;
}

export function Leaderboard() {
  const { user: currentUser } = useAuth();
  const [timeFrame, setTimeFrame] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['/api/leaderboard', timeFrame],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?timeFrame=${timeFrame}&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const users = await response.json();
      return users.map((user: User, index: number) => ({ ...user, rank: index + 1 }));
    }
  });

  const { data: userStats } = useQuery({
    queryKey: ['/api/user/analytics', '30'],
  });

  const currentUserRank = leaderboard?.findIndex((u: LeaderboardUser) => u.id === currentUser?.id) + 1 || 0;
  const topThree = leaderboard?.slice(0, 3) || [];
  const restOfLeaderboard = leaderboard?.slice(3) || [];

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const timeFrameLabels = {
    weekly: 'This Week',
    monthly: 'This Month',
    alltime: 'All Time'
  };

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted/20 rounded w-64 mb-4"></div>
            <div className="h-4 bg-muted/20 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="glass-card rounded-xl p-6 h-96 mb-6"></div>
                <div className="glass-card rounded-xl h-64"></div>
              </div>
              <div className="space-y-6">
                <div className="glass-card rounded-xl p-6 h-48"></div>
                <div className="glass-card rounded-xl p-6 h-64"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">Leaderboard</h2>
          <p className="text-muted-foreground">See how you rank against other learners</p>
        </div>

        {/* Leaderboard Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {Object.entries(timeFrameLabels).map(([key, label]) => (
            <button
              key={key}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeFrame === key
                  ? 'bg-primary text-primary-foreground'
                  : 'glass-card hover:bg-card border border-border'
              }`}
              onClick={() => setTimeFrame(key as 'weekly' | 'monthly' | 'alltime')}
              data-testid={`filter-${key}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top 3 Podium */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-xl p-6 mb-6">
              <div className="flex items-end justify-center space-x-4 mb-8" data-testid="podium">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="flex flex-col items-center" data-testid="podium-second">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-muted to-border flex items-center justify-center text-2xl font-bold mb-2 glow-secondary">
                      {topThree[1].profileImageUrl ? (
                        <img 
                          src={topThree[1].profileImageUrl} 
                          alt={`${topThree[1].firstName} ${topThree[1].lastName}`}
                          className="w-full h-full rounded-full object-cover" 
                        />
                      ) : (
                        <span className="text-white">
                          {topThree[1].firstName?.[0]}{topThree[1].lastName?.[0]}
                        </span>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-2">
                      <span className="text-2xl">🥈</span>
                    </div>
                    <p className="font-semibold text-center" data-testid="text-second-name">
                      {topThree[1].firstName} {topThree[1].lastName}
                    </p>
                    <p className="text-sm text-secondary font-bold" data-testid="text-second-xp">
                      {topThree[1].xp?.toLocaleString()} XP
                    </p>
                    <div className="mt-2 h-24 w-16 bg-gradient-to-t from-muted/50 to-transparent rounded-t-lg"></div>
                  </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <div className="flex flex-col items-center -mt-8" data-testid="podium-first">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-3xl font-bold mb-2 glow-accent">
                      {topThree[0].profileImageUrl ? (
                        <img 
                          src={topThree[0].profileImageUrl} 
                          alt={`${topThree[0].firstName} ${topThree[0].lastName}`}
                          className="w-full h-full rounded-full object-cover" 
                        />
                      ) : (
                        <span className="text-white">
                          {topThree[0].firstName?.[0]}{topThree[0].lastName?.[0]}
                        </span>
                      )}
                    </div>
                    <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-2">
                      <span className="text-3xl">👑</span>
                    </div>
                    <p className="font-bold text-lg text-center" data-testid="text-first-name">
                      {topThree[0].firstName} {topThree[0].lastName}
                    </p>
                    <p className="text-sm text-accent font-bold" data-testid="text-first-xp">
                      {topThree[0].xp?.toLocaleString()} XP
                    </p>
                    <div className="mt-2 h-32 w-20 bg-gradient-to-t from-accent/50 to-transparent rounded-t-lg"></div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="flex flex-col items-center" data-testid="podium-third">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-muted to-border flex items-center justify-center text-2xl font-bold mb-2">
                      {topThree[2].profileImageUrl ? (
                        <img 
                          src={topThree[2].profileImageUrl} 
                          alt={`${topThree[2].firstName} ${topThree[2].lastName}`}
                          className="w-full h-full rounded-full object-cover" 
                        />
                      ) : (
                        <span className="text-white">
                          {topThree[2].firstName?.[0]}{topThree[2].lastName?.[0]}
                        </span>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-2">
                      <span className="text-2xl">🥉</span>
                    </div>
                    <p className="font-semibold text-center" data-testid="text-third-name">
                      {topThree[2].firstName} {topThree[2].lastName}
                    </p>
                    <p className="text-sm text-muted-foreground font-bold" data-testid="text-third-xp">
                      {topThree[2].xp?.toLocaleString()} XP
                    </p>
                    <div className="mt-2 h-20 w-16 bg-gradient-to-t from-muted/30 to-transparent rounded-t-lg"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Rankings List */}
            <div className="glass-card rounded-xl overflow-hidden" data-testid="rankings-table">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">XP</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Level</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Streak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {restOfLeaderboard.map((user: LeaderboardUser) => (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-card/30 transition-colors ${
                          user.id === currentUser?.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                        }`}
                        data-testid={`row-user-${user.rank}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-bold ${
                            user.id === currentUser?.id ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            {user.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center ${
                              user.id === currentUser?.id ? 'ring-2 ring-primary' : ''
                            }`}>
                              {user.profileImageUrl ? (
                                <img 
                                  src={user.profileImageUrl} 
                                  alt={`${user.firstName} ${user.lastName}`}
                                  className="w-full h-full rounded-full object-cover" 
                                />
                              ) : (
                                <span className="text-xs font-bold text-white">
                                  {user.firstName?.[0]}{user.lastName?.[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {user.firstName} {user.lastName}
                                {user.id === currentUser?.id && (
                                  <span className="text-xs text-primary ml-2">(You)</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">@{user.email?.split('@')[0]}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-primary" data-testid={`text-xp-${user.rank}`}>
                            {user.xp?.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-semibold rounded" data-testid={`text-level-${user.rank}`}>
                            {user.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-muted-foreground flex items-center" data-testid={`text-streak-${user.rank}`}>
                            <i className="fas fa-fire text-accent mr-1"></i>
                            {user.streak}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* Your Stats */}
            <div className="glass-card rounded-xl p-6" data-testid="card-your-stats">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <i className="fas fa-chart-bar text-primary mr-2"></i>Your Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Global Rank</span>
                  <span className="text-lg font-bold text-primary" data-testid="text-global-rank">
                    #{currentUserRank || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total XP</span>
                  <span className="text-lg font-bold text-accent" data-testid="text-total-xp">
                    {currentUser?.xp?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Level</span>
                  <span className="text-lg font-bold text-secondary" data-testid="text-current-level">
                    {currentUser?.level || 1}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Streak</span>
                  <span className="text-lg font-bold text-success flex items-center" data-testid="text-current-streak">
                    <i className="fas fa-fire text-accent mr-1"></i>
                    {currentUser?.streak || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Categories */}
            <div className="glass-card rounded-xl p-6" data-testid="card-top-categories">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <i className="fas fa-crown text-accent mr-2"></i>Top Categories
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Programming</span>
                    <span className="font-semibold">{Math.floor((currentUser?.xp || 0) * 0.4).toLocaleString()} XP</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Data Science</span>
                    <span className="font-semibold">{Math.floor((currentUser?.xp || 0) * 0.3).toLocaleString()} XP</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-1.5">
                    <div className="bg-secondary h-1.5 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Design</span>
                    <span className="font-semibold">{Math.floor((currentUser?.xp || 0) * 0.2).toLocaleString()} XP</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-1.5">
                    <div className="bg-accent h-1.5 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Challenge Mode CTA */}
            <div className="glass-card rounded-xl p-6 bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30" data-testid="card-challenge-mode">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl">
                  <i className="fas fa-bolt"></i>
                </div>
                <h3 className="text-lg font-bold mb-2">Challenge Mode</h3>
                <p className="text-sm text-muted-foreground mb-4">Compete in timed AI quizzes for bonus XP!</p>
                <Link href="/quiz">
                  <button 
                    className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all"
                    data-testid="button-start-challenge"
                  >
                    Start Challenge
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

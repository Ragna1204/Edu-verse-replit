import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

export function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.includes(path)) return true;
    return false;
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3" data-testid="link-home">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center glow-primary">
              <i className="fas fa-graduation-cap text-white text-xl"></i>
            </div>
            <span className="font-display text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              EduVerse
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') ? 'nav-active text-foreground' : 'text-muted-foreground hover:text-primary'
              }`}
              data-testid="nav-dashboard"
            >
              <i className="fas fa-home mr-2"></i>Dashboard
            </Link>
            <Link 
              href="/courses" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/courses') ? 'nav-active text-foreground' : 'text-muted-foreground hover:text-primary'
              }`}
              data-testid="nav-courses"
            >
              <i className="fas fa-book mr-2"></i>Courses
            </Link>
            <Link 
              href="/leaderboard" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/leaderboard') ? 'nav-active text-foreground' : 'text-muted-foreground hover:text-primary'
              }`}
              data-testid="nav-leaderboard"
            >
              <i className="fas fa-trophy mr-2"></i>Leaderboard
            </Link>
            <Link 
              href="/community" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/community') ? 'nav-active text-foreground' : 'text-muted-foreground hover:text-primary'
              }`}
              data-testid="nav-community"
            >
              <i className="fas fa-users mr-2"></i>Community
            </Link>
            <Link 
              href="/ai-tutor" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/ai-tutor') ? 'nav-active text-foreground' : 'text-muted-foreground hover:text-primary'
              }`}
              data-testid="nav-ai-tutor"
            >
              <i className="fas fa-robot mr-2"></i>AI Tutor
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Streak Counter */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/30">
              <i className="fas fa-fire text-accent fire-icon"></i>
              <span className="font-bold text-accent" data-testid="text-streak">{user?.streak || 0}</span>
              <span className="text-xs text-accent/80">day streak</span>
            </div>

            {/* XP Points */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
              <i className="fas fa-star text-primary"></i>
              <span className="font-bold text-primary" data-testid="text-xp">{user?.xp || 0}</span>
              <span className="text-xs text-primary/80">XP</span>
            </div>

            {/* Profile */}
            <div className="flex items-center space-x-2 hover-glow rounded-lg px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center" data-testid="img-avatar">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                )}
              </div>
              <i className="fas fa-chevron-down text-xs text-muted-foreground"></i>
            </div>

            {/* Logout Button */}
            <a 
              href="/api/logout" 
              className="hidden md:block px-4 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
              data-testid="link-logout"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>Logout
            </a>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-2">
              <Link 
                href="/" 
                className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="fas fa-home mr-2"></i>Dashboard
              </Link>
              <Link 
                href="/courses" 
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="fas fa-book mr-2"></i>Courses
              </Link>
              <Link 
                href="/leaderboard" 
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="fas fa-trophy mr-2"></i>Leaderboard
              </Link>
              <Link 
                href="/community" 
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="fas fa-users mr-2"></i>Community
              </Link>
              <Link 
                href="/ai-tutor" 
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="fas fa-robot mr-2"></i>AI Tutor
              </Link>
              <a 
                href="/api/logout" 
                className="px-3 py-2 rounded-md text-sm font-medium text-destructive"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>Logout
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

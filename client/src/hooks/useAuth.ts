import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export interface ExtendedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  grade?: number;
  board?: string;
  subjects?: string[];
  isOnboarded?: boolean;
  profileImageUrl?: string;
  role?: string;
  xp?: number;
  level?: number;
  streak?: number;
  lastActiveDate?: string;
  isEducator?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Get the current user id from localStorage — used by queryClient and other modules
export function getCurrentUserId(): string | null {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser).id || null;
    }
  } catch {
    // ignore
  }
  return null;
}

export function useAuth() {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(prevUser => {
          if (JSON.stringify(prevUser) !== storedUser) {
            return parsedUser;
          }
          return prevUser;
        });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }

    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const signIn = async (username: string, password: string) => {
    const response = await fetch(`/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Sign in failed' }));
      throw new Error(error.message || 'Sign in failed');
    }

    const data = await response.json();
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  };

  const signUp = async (data: {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
  }) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Sign up failed' }));
      throw new Error(error.message || 'Sign up failed');
    }

    const result = await response.json();
    setUser(result.user);
    localStorage.setItem('user', JSON.stringify(result.user));
    return result;
  };

  const completeOnboarding = async (data: {
    grade: number;
    board: string;
    subjects: string[];
  }) => {
    if (!user?.id) throw new Error('User not found');

    const response = await fetch(`/api/auth/onboard/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user.id,
      },
      body: JSON.stringify({
        grade: data.grade,
        board: data.board,
        subjects: data.subjects,
        isOnboarded: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Onboarding failed' }));
      throw new Error(errorData.message || 'Onboarding failed');
    }

    const result = await response.json();
    setUser(result.user);
    localStorage.setItem('user', JSON.stringify(result.user));
    // Don't navigate here — the Onboarding component calls onComplete 
    // which triggers window.location.reload() in App.tsx
    return result;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors during logout
    }
    setUser(null);
    localStorage.removeItem('user');
    navigate('/auth');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    completeOnboarding,
    logout,
  };
}

import { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';

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

// TEMPORARY: Simulating auth flow for testing - simplified version
export function useAuth() {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }

    // Simulate loading delay
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
      throw new Error('Sign in failed');
    }

    const data = await response.json();
    setUser(data.user);
    // Store in localStorage for persistence
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
      throw new Error('Sign up failed');
    }

    const result = await response.json();
    setUser(result.user);
    return result;
  };

  const completeOnboarding = async (data: {
    username: string;
    grade: number;
    board: string;
    subjects: string[];
  }) => {
    if (!user?.id) throw new Error('User not found');

    const response = await fetch(`/api/auth/onboard/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Onboarding failed');
    }

    // Update the user with onboarding data
    setUser({ ...user, ...data, isOnboarded: true });

    // Set up a small delay to ensure state is updated before redirect
    setTimeout(() => {
      window.location.href = '/';
    }, 100);

    return response.json();
  };

  const logout = () => {
    setUser(null);
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

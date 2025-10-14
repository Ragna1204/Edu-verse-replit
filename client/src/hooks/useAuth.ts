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

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);

  // Listen to Firebase auth state - only if Firebase is configured
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsFirebaseLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsFirebaseLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Get user data from backend if Firebase user exists
  const { data: user, isLoading: isUserDataLoading } = useQuery({
    queryKey: ["/api/auth/user", firebaseUser?.uid],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    enabled: !!firebaseUser && isFirebaseConfigured, // Only fetch if we have a Firebase user and Firebase is configured
  });

  const isLoading = !isFirebaseConfigured ? false : (isFirebaseLoading || (firebaseUser && isUserDataLoading));

  return {
    user: user as ExtendedUser | null,
    firebaseUser,
    isLoading,
    isAuthenticated: !!firebaseUser,
  };
}

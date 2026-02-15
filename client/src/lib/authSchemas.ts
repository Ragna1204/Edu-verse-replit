// Username-based authentication schemas
import { z } from 'zod';

// Sign In Schema (username + password)
export const signInSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Sign Up Schema (username + password + personal info)
export const signUpSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

// Onboarding Schema
export const onboardingSchema = z.object({
  educationLevel: z.enum(['middle_school', 'high_school', 'undergraduate', 'postgraduate'], {
    required_error: 'Please select your education level',
  }),
});

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type OnboardingFormData = z.infer<typeof onboardingSchema>;

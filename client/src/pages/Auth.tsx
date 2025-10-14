import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, ArrowRight, AlertTriangle } from 'lucide-react';
import { signInSchema, signUpSchema, SignInFormData, SignUpFormData } from '@/lib/authSchemas';
import { isFirebaseConfigured } from '@/lib/firebase';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/lib/authUtils';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  });

  const handleSignIn = async (data: SignInFormData) => {
    if (!isFirebaseConfigured) {
      setError('Authentication is not configured. Please contact administrator.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmail(data.email, data.password);
      onAuthSuccess();
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.message?.includes('auth/')) {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError(error.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    if (!isFirebaseConfigured) {
      setError('Authentication is not configured. Please contact administrator.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await signUpWithEmail(data.email, data.password);
      // User will be redirected to onboarding after Firebase signup
      onAuthSuccess();
    } catch (error: any) {
      console.error('Sign up error:', error);
      if (error.message?.includes('auth/email-already-in-use')) {
        setError('An account with this email already exists.');
      } else if (error.message?.includes('auth/weak-password')) {
        setError('Password should be at least 6 characters.');
      } else {
        setError(error.message || 'Sign up failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured) {
      setError('Google authentication is not configured. Please contact administrator.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onAuthSuccess();
    } catch (error: any) {
      console.error('Google sign in error:', error);
      if (error.message?.includes('auth/popup-closed-by-user')) {
        setError('Sign in cancelled. Please try again.');
      } else {
        setError(error.message || 'Google sign in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Welcome to EduVerse</CardTitle>
          <CardDescription className="text-center">
            Your AI-powered learning companion
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!isFirebaseConfigured && (
            <Alert className="mb-4 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Authentication Disabled:</strong> Firebase configuration is incomplete. Authentication features are currently disabled. To enable authentication, configure your Firebase project settings in the environment variables.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading || !isFirebaseConfigured}
            className="w-full mb-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      {...signInForm.register('email')}
                    />
                  </div>
                  {signInForm.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {signInForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10"
                      {...signInForm.register('password')}
                    />
                  </div>
                  {signInForm.formState.errors.password && (
                    <p className="text-sm text-red-600 mt-1">
                      {signInForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="signup-firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-firstName"
                        placeholder="First name"
                        className="pl-10"
                        {...signUpForm.register('firstName')}
                      />
                    </div>
                    {signUpForm.formState.errors.firstName && (
                      <p className="text-sm text-red-600 mt-1">
                        {signUpForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="signup-lastName">Last Name</Label>
                    <Input
                      id="signup-lastName"
                      placeholder="Last name"
                      {...signUpForm.register('lastName')}
                    />
                    {signUpForm.formState.errors.lastName && (
                      <p className="text-sm text-red-600 mt-1">
                        {signUpForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      {...signUpForm.register('email')}
                    />
                  </div>
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {signUpForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      className="pl-10"
                      {...signUpForm.register('password')}
                    />
                  </div>
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-red-600 mt-1">
                      {signUpForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Sign Up
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="text-center text-sm text-gray-600">
          By continuing, you agree to EduVerse's Terms of Service and Privacy Policy
        </CardFooter>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import { signInSchema, signUpSchema, SignInFormData, SignUpFormData } from '@/lib/authSchemas';

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
      username: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '',
      password: '',
      firstName: '',
      lastName: '',
    },
  });

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Custom username/password authentication via API
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sign in failed');
      }

      const result = await response.json();
      // Store user session or token as needed
      localStorage.setItem('userId', result.user.id);
      // Refresh the page to trigger auth hooks and routing
      window.location.reload();
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Custom username/password authentication via API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sign up failed');
      }

      const result = await response.json();
      // Store user session or token as needed
      localStorage.setItem('userId', result.user.id);

      onAuthSuccess();
    } catch (error: any) {
      console.error('Sign up error:', error);
      if (error.message?.includes('username already exists')) {
        setError('Username already taken. Please choose a different username.');
      } else if (error.message?.includes('invalid username')) {
        setError('Username can only contain letters, numbers, and underscores.');
      } else {
        setError(error.message || 'Sign up failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('Google authentication is not available. Please use username and password.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5 p-4">
      <div className="cosmic-bg"></div>
      <div className="cosmic-particles"></div>
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Welcome to EduVerse</CardTitle>
          <CardDescription className="text-center">
            Your AI-powered learning companion
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={true}
            className="w-full mb-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 opacity-50 cursor-not-allowed"
          >
            Continue with Google (Coming Soon)
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with username</span>
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
                  <Label htmlFor="signin-username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-username"
                      placeholder="Enter your username"
                      className="pl-10"
                      {...signInForm.register('username')}
                    />
                  </div>
                  {signInForm.formState.errors.username && (
                    <p className="text-sm text-red-600 mt-1">
                      {signInForm.formState.errors.username.message}
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
                <div>
                  <Label htmlFor="signup-username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-username"
                      placeholder="Choose a unique username"
                      className="pl-10"
                      {...signUpForm.register('username')}
                    />
                  </div>
                  {signUpForm.formState.errors.username && (
                    <p className="text-sm text-red-600 mt-1">
                      {signUpForm.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="signup-firstName">First Name</Label>
                    <Input
                      id="signup-firstName"
                      placeholder="First name"
                      {...signUpForm.register('firstName')}
                    />
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

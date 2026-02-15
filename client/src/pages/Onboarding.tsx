import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, GraduationCap, Check, ArrowRight, BookOpen, School, Building, Award } from 'lucide-react';
import { onboardingSchema, OnboardingFormData } from '@/lib/authSchemas';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingProps {
  onComplete: () => void;
  initialData?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

const educationLevels = [
  {
    value: 'middle_school',
    label: 'Middle School',
    description: 'Currently in or below 10th grade',
    icon: School,
    color: 'from-green-500 to-emerald-600',
  },
  {
    value: 'high_school',
    label: 'High School',
    description: '10th to 12th grade',
    icon: BookOpen,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    value: 'undergraduate',
    label: 'Undergraduate',
    description: 'College or university student',
    icon: Building,
    color: 'from-purple-500 to-violet-600',
  },
  {
    value: 'postgraduate',
    label: 'Postgraduate',
    description: 'Masters, PhD, or professional',
    icon: Award,
    color: 'from-amber-500 to-orange-600',
  },
] as const;

export function Onboarding({ onComplete, initialData }: OnboardingProps) {
  const { completeOnboarding } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      educationLevel: undefined,
    },
  });

  const handleLevelSelect = (value: string) => {
    setSelectedLevel(value);
    form.setValue('educationLevel', value as any);
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await completeOnboarding({
        educationLevel: data.educationLevel,
      });

      // Call onComplete to trigger reload from App.tsx
      onComplete();
    } catch (error: any) {
      console.error('Onboarding error:', error.message);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cosmic Background */}
      <div className="fixed inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-radial from-secondary/5 via-transparent to-transparent pointer-events-none" />

      {/* Animated particles */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(2px_2px_at_20%_30%,white,transparent),radial-gradient(2px_2px_at_60%_70%,white,transparent),radial-gradient(1px_1px_at_50%_50%,white,transparent),radial-gradient(1px_1px_at_80%_10%,white,transparent),radial-gradient(2px_2px_at_90%_60%,white,transparent),radial-gradient(1px_1px_at_33%_33%,white,transparent)] bg-[length:200%_200%] animate-[particle-drift_60s_linear_infinite]" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">
              Welcome{initialData?.firstName ? `, ${initialData.firstName}` : ''}! 🎉
            </CardTitle>
            <CardDescription>
              Tell us your education level so we can personalize your learning experience
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Education Level Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {educationLevels.map((level) => {
                  const Icon = level.icon;
                  const isSelected = selectedLevel === level.value;

                  return (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => handleLevelSelect(level.value)}
                      className={`
                        relative p-5 rounded-xl border-2 transition-all duration-200 text-left
                        ${isSelected
                          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}

                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${level.color} flex items-center justify-center mb-3`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      <h3 className="font-semibold text-lg mb-1">{level.label}</h3>
                      <p className="text-sm text-muted-foreground">{level.description}</p>
                    </button>
                  );
                })}
              </div>

              {form.formState.errors.educationLevel && (
                <p className="text-sm text-destructive text-center">
                  {form.formState.errors.educationLevel.message}
                </p>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !selectedLevel}
                className="w-full h-12 text-base"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

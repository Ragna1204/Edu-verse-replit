import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, BookOpen, GraduationCap, Check, ArrowRight } from 'lucide-react';
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

const availableSubjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
  'History', 'Geography', 'Civics', 'Economics', 'Computer Science',
  'Sanskrit', 'French', 'German'
];

const boards = [
  'CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge', 'Others'
];

export function Onboarding({ onComplete, initialData, skipButton }: OnboardingProps & { skipButton?: boolean }) {
  const { completeOnboarding } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      grade: 9,
      board: '',
      subjects: [],
    },
  });

  const handleSubjectToggle = (subject: string) => {
    const newSelectedSubjects = selectedSubjects.includes(subject)
      ? selectedSubjects.filter(s => s !== subject)
      : [...selectedSubjects, subject];

    setSelectedSubjects(newSelectedSubjects);
    form.setValue('subjects', newSelectedSubjects);
  };

  const onSubmit = async (data: OnboardingFormData) => {
    console.log('Onboarding onSubmit called with data:', data);
    setIsLoading(true);
    setError(null);

    try {
      console.log('Calling completeOnboarding with:', {
        grade: data.grade,
        board: data.board,
        subjects: data.subjects,
      });

      // Send onboarding data to backend using the hook method
      const response = await completeOnboarding({
        grade: data.grade,
        board: data.board,
        subjects: data.subjects,
      });

      console.log('Onboarding completed successfully, response:', response);

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
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <GraduationCap className="h-6 w-6" />
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-center">
              Help us personalize your learning experience
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Welcome Section */}
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">
                Welcome, {initialData?.firstName} {initialData?.lastName}!
              </h3>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Grade and Board */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grade">Grade</Label>
                  <Controller
                    name="grade"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                            <SelectItem key={grade} value={grade.toString()}>
                              Grade {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.grade && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.grade.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="board">Board</Label>
                  <Controller
                    name="board"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your board" />
                        </SelectTrigger>
                        <SelectContent>
                          {boards.map((board) => (
                            <SelectItem key={board} value={board} className="justify-between">
                              {board}
                              {board === 'CBSE' && (
                                <Badge variant="secondary" className="ml-2">Most Common</Badge>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.board && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.board.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Subjects */}
              <div>
                <Label className="text-base font-semibold">Select Your Subjects</Label>
                <p className="text-sm text-gray-600 mb-4">
                  Choose the subjects you want to focus on in your learning journey
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableSubjects.map((subject) => (
                    <div key={subject} className="flex items-center space-x-2">
                      <Checkbox
                        id={subject}
                        checked={selectedSubjects.includes(subject)}
                        onCheckedChange={() => handleSubjectToggle(subject)}
                      />
                      <Label
                        htmlFor={subject}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {subject}
                      </Label>
                    </div>
                  ))}
                </div>

                {selectedSubjects.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Selected ({selectedSubjects.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubjects.map((subject) => (
                        <Badge key={subject} variant="secondary" className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {subject}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => handleSubjectToggle(subject)}
                          >
                            ×
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {form.formState.errors.subjects && (
                  <p className="text-sm text-red-600 mt-2">
                    {form.formState.errors.subjects.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={isLoading || selectedSubjects.length === 0} className="w-full">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Complete Setup
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                {skipButton && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onComplete}
                    className="w-full"
                  >
                    Skip for now
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

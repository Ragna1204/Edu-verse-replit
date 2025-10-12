import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Question, UserQuizSession } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface AdaptiveQuizProps {
  quizId: string;
}

interface QuizState {
  session: UserQuizSession | null;
  currentQuestion: Question | null;
  isCompleted: boolean;
  score: number;
}

export default function AdaptiveQuiz({ quizId }: AdaptiveQuizProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [quizState, setQuizState] = useState<QuizState>({
    session: null,
    currentQuestion: null,
    isCompleted: false,
    score: 0,
  });
  const [selectedOption, setSelectedOption] = useState<any | null>(null);

  const { mutate: startQuiz, isPending: isStarting } = useMutation({
    mutationFn: () => apiRequest('POST', `/api/quizzes/${quizId}/start`),
    onSuccess: (data: any) => {
      setQuizState({
        ...quizState,
        session: data.session,
        currentQuestion: data.question,
        score: data.session.score,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error starting quiz',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const { mutate: submitAnswer, isPending: isSubmitting } = useMutation({
    mutationFn: (answer: any) =>
      apiRequest('POST', `/api/quizzes/sessions/${quizState.session?.id}/submit`, answer),
    onSuccess: (data: any) => {
      setQuizState(prev => ({ ...prev, score: data.score }));
      toast({
        title: data.isCorrect ? 'Correct!' : 'Incorrect',
        description: data.isCorrect
          ? 'Great job!'
          : `The correct answer was: ${data.correctOption.text}`,
      });
      // After submitting, fetch the next question
      queryClient.invalidateQueries({queryKey:['nextQuestion', quizState.session?.id]});
    },
    onError: (error: any) => {
      toast({
        title: 'Error submitting answer',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const { data: nextQuestion, isLoading: isLoadingNext } = useQuery({
    queryKey: ['nextQuestion', quizState.session?.id],
    queryFn: () => apiRequest<Question | null>('GET', `/api/quizzes/sessions/${quizState.session?.id}/next`),
    enabled: !!quizState.session && !quizState.isCompleted,
  });

  useEffect(() => {
    if (nextQuestion) {
      setQuizState(prev => ({ ...prev, currentQuestion: nextQuestion }));
      setSelectedOption(null);
    } else if (quizState.session && !isLoadingNext) {
      setQuizState(prev => ({ ...prev, isCompleted: true }));
    }
  }, [nextQuestion, isLoadingNext, quizState.session]);

  useEffect(() => {
    if (quizId) {
      startQuiz();
    }
  }, [quizId, startQuiz]);

  const handleAnswerSelect = (option: any) => {
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;

    submitAnswer({
      questionId: quizState.currentQuestion?.id,
      selectedOption,
    });
  };

  if (isStarting || isLoadingNext) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
        </div>
    );
  }

  if (quizState.isCompleted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Quiz Completed!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Your final score is: {quizState.score}</p>
        </CardContent>
      </Card>
    );
  }

  if (!quizState.currentQuestion) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Quiz Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Could not load quiz question. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  const { content, options, difficulty } = quizState.currentQuestion;
  const progress = quizState.session ? (quizState.session.performanceHistory.length / 10) * 100 : 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Adaptive Quiz</CardTitle>
          <Badge>{difficulty}</Badge>
        </div>
        <Progress value={progress} className="w-full mt-4" />
      </CardHeader>
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">{content}</h2>
        <div className="grid grid-cols-1 gap-4">
          {(options as any[]).map((option, index) => (
            <Button
              key={index}
              variant={selectedOption === option ? 'default' : 'outline'}
              onClick={() => handleAnswerSelect(option)}
              className="w-full justify-start h-auto py-4"
            >
              <span className="text-lg">{option.text}</span>
            </Button>
          ))}
        </div>
        <Button
          onClick={handleSubmitAnswer}
          disabled={selectedOption === null || isSubmitting}
          className="w-full mt-6"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </CardContent>
    </Card>
  );
}
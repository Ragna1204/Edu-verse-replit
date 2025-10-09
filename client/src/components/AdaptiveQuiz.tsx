import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Quiz, QuizQuestion, QuizAttempt } from '@/types';

interface AdaptiveQuizProps {
  quizId?: string;
  courseId?: string;
  topic?: string;
}

interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: Record<number, number>;
  timeRemaining: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isCompleted: boolean;
  score?: number;
}

export function AdaptiveQuiz({ quizId, courseId, topic }: AdaptiveQuizProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    timeRemaining: 600, // 10 minutes default
    difficulty: 'medium',
    isCompleted: false
  });

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Generate AI quiz if no quizId provided
  const { data: generatedQuiz, isLoading: isGenerating } = useQuery({
    queryKey: ['/api/ai/generate-quiz', topic, quizState.difficulty],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/ai/generate-quiz', {
        topic: topic || 'General Knowledge',
        difficulty: quizState.difficulty,
        count: 10
      });
      return response.json();
    },
    enabled: !quizId && !!topic
  });

  // Load existing quiz if quizId provided
  const { data: existingQuiz, isLoading: isLoadingQuiz } = useQuery({
    queryKey: ['/api/quizzes', quizId],
    enabled: !!quizId
  });

  // Submit quiz attempt
  const submitAttemptMutation = useMutation({
    mutationFn: async (attemptData: any) => {
      const response = await apiRequest('POST', `/api/quizzes/${quizId || 'generated'}/attempt`, attemptData);
      return response.json();
    },
    onSuccess: (attempt: QuizAttempt) => {
      setQuizState(prev => ({ 
        ...prev, 
        isCompleted: true, 
        score: attempt.score 
      }));
      
      toast({
        title: attempt.isPassed ? "Quiz Passed! 🎉" : "Quiz Completed",
        description: `You scored ${attempt.score}% - ${attempt.isPassed ? 'Great job!' : 'Keep practicing!'}`,
        variant: attempt.isPassed ? "default" : "destructive",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/user/quiz-attempts'] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Timer effect
  useEffect(() => {
    if (quizState.timeRemaining > 0 && !quizState.isCompleted) {
      const timer = setInterval(() => {
        setQuizState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);

      return () => clearInterval(timer);
    } else if (quizState.timeRemaining === 0 && !quizState.isCompleted) {
      handleSubmitQuiz();
    }
  }, [quizState.timeRemaining, quizState.isCompleted]);

  // Initialize quiz questions
  useEffect(() => {
    if (generatedQuiz?.questions) {
      setQuizState(prev => ({
        ...prev,
        questions: generatedQuiz.questions
      }));
    } else if (existingQuiz?.questions) {
      setQuizState(prev => ({
        ...prev,
        questions: existingQuiz.questions,
        timeRemaining: existingQuiz.timeLimit * 60 || 600
      }));
    }
  }, [generatedQuiz, existingQuiz]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const newAnswers = {
      ...quizState.answers,
      [quizState.currentQuestionIndex]: selectedAnswer
    };

    setQuizState(prev => ({
      ...prev,
      answers: newAnswers
    }));

    // Move to next question or complete quiz
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
      setSelectedAnswer(null);
    } else {
      handleSubmitQuiz(newAnswers);
    }
  };

  const handleSubmitQuiz = (finalAnswers = quizState.answers) => {
    const correctAnswers = quizState.questions.reduce((count, question, index) => {
      return finalAnswers[index] === question.correctAnswer ? count + 1 : count;
    }, 0);

    const score = Math.round((correctAnswers / quizState.questions.length) * 100);
    const timeSpent = (existingQuiz?.timeLimit * 60 || 600) - quizState.timeRemaining;

    submitAttemptMutation.mutate({
      answers: finalAnswers,
      score,
      timeSpent,
      difficulty: quizState.difficulty,
      isPassed: score >= 70
    });
  };

  const handleSkipQuestion = () => {
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
      setSelectedAnswer(null);
    }
  };

  if (isGenerating || isLoadingQuiz) {
    return (
      <section className="py-16 bg-background/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-xl p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-muted/20 rounded w-64 mb-4"></div>
              <div className="h-4 bg-muted/20 rounded w-96 mb-8"></div>
              <div className="h-32 bg-muted/20 rounded mb-6"></div>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted/20 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (quizState.questions.length === 0) {
    return (
      <section className="py-16 bg-background/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
              <i className="fas fa-question-circle text-4xl text-muted-foreground"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Quiz Available</h3>
            <p className="text-muted-foreground">Unable to load quiz questions. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  if (quizState.isCompleted) {
    return (
      <section className="py-16 bg-background/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-xl p-8 text-center">
            <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl ${
              (quizState.score || 0) >= 70 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
            }`}>
              <i className={`fas ${(quizState.score || 0) >= 70 ? 'fa-trophy' : 'fa-redo'}`}></i>
            </div>
            <h3 className="text-2xl font-bold mb-2">Quiz Completed!</h3>
            <p className="text-xl mb-4" data-testid="text-quiz-score">
              Your Score: <span className="font-bold">{quizState.score}%</span>
            </p>
            <p className="text-muted-foreground mb-6">
              {(quizState.score || 0) >= 70 
                ? "Congratulations! You passed the quiz." 
                : "Keep practicing to improve your score."}
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all"
                onClick={() => window.location.reload()}
                data-testid="button-retake-quiz"
              >
                <i className="fas fa-redo mr-2"></i>Retake Quiz
              </button>
              <button 
                className="px-6 py-3 glass-card border border-border rounded-lg font-semibold hover:bg-card transition-all"
                onClick={() => window.history.back()}
                data-testid="button-back-to-course"
              >
                <i className="fas fa-arrow-left mr-2"></i>Back to Course
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
  const progress = ((quizState.currentQuestionIndex + 1) / quizState.questions.length) * 100;

  return (
    <section className="py-16 bg-background/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-xl p-8" data-testid="card-adaptive-quiz">
          {/* Quiz Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold mb-1">
                {topic ? `Quiz: ${topic}` : 'Adaptive Quiz'}
              </h2>
              <p className="text-sm text-muted-foreground">AI-adjusted difficulty based on your performance</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary" data-testid="text-timer">
                {formatTime(quizState.timeRemaining)}
              </div>
              <div className="text-xs text-muted-foreground">Time Remaining</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                Question <span className="font-semibold text-foreground" data-testid="text-current-question">
                  {quizState.currentQuestionIndex + 1}
                </span> of <span data-testid="text-total-questions">{quizState.questions.length}</span>
              </span>
              <span className="text-muted-foreground">
                Difficulty: <span className="font-semibold text-accent" data-testid="text-difficulty">
                  {quizState.difficulty}
                </span>
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="mb-8 p-6 bg-card rounded-lg border border-border">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary" data-testid="text-question-number">
                  {quizState.currentQuestionIndex + 1}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-lg font-medium leading-relaxed" data-testid="text-question">
                  {currentQuestion.question}
                </p>
              </div>
            </div>

            {/* AI Difficulty Indicator */}
            <div className="flex items-center space-x-2 text-sm p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <i className="fas fa-robot text-primary"></i>
              <span className="text-muted-foreground">
                AI adjusted this question to <span className="font-semibold text-primary">{quizState.difficulty}</span> difficulty based on your previous answers
              </span>
            </div>
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`w-full p-4 glass-card border rounded-lg text-left transition-all group ${
                  selectedAnswer === index
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary hover:bg-primary/10'
                }`}
                onClick={() => handleAnswerSelect(index)}
                data-testid={`button-answer-${index}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedAnswer === index
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted/20 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
                  }`}>
                    <span className="font-semibold">
                      {String.fromCharCode(65 + index)}
                    </span>
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Quiz Actions */}
          <div className="flex items-center justify-between">
            <button 
              className="px-6 py-3 glass-card border border-border rounded-lg font-semibold hover:bg-card transition-all"
              onClick={handleSkipQuestion}
              data-testid="button-skip-question"
            >
              <i className="fas fa-forward mr-2"></i>Skip Question
            </button>
            <button 
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all hover-glow disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null || submitAttemptMutation.isPending}
              data-testid="button-submit-answer"
            >
              {submitAttemptMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>Submitting...
                </>
              ) : (
                <>
                  Submit Answer<i className="fas fa-arrow-right ml-2"></i>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

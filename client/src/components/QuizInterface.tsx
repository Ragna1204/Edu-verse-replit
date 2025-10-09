import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  SkipForward,
  ArrowRight,
  Trophy,
  Star
} from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: string;
  points: number;
}

interface QuizInterfaceProps {
  quiz: {
    id: number;
    title: string;
    description: string;
    timeLimit?: number;
    passingScore: number;
    difficulty: string;
    questions: Question[];
  };
  onComplete: (result: any) => void;
}

export default function QuizInterface({ quiz, onComplete }: QuizInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  // Timer effect
  useEffect(() => {
    if (!timeRemaining) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev && prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number | null): string => {
    if (!seconds) return "No limit";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const submitMutation = useMutation({
    mutationFn: async (answers: number[]) => {
      const startTime = Date.now();
      const response = await apiRequest("POST", `/api/quizzes/${quiz.id}/submit`, {
        answers,
        timeSpent: quiz.timeLimit ? (quiz.timeLimit * 60 - (timeRemaining || 0)) : 0,
      });
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Quiz Completed!",
        description: `You scored ${result.attempt.score.toFixed(1)}%`,
        variant: result.attempt.score >= quiz.passingScore ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      onComplete(result);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Submission Failed",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return;
    
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
    setIsAnswered(true);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowExplanation(false);
      setIsAnswered(!!selectedAnswers[currentQuestionIndex + 1]);
    }
  };

  const handleSkipQuestion = () => {
    if (!isAnswered) {
      const newAnswers = [...selectedAnswers];
      newAnswers[currentQuestionIndex] = -1; // -1 indicates skipped
      setSelectedAnswers(newAnswers);
    }
    handleNextQuestion();
  };

  const handleSubmitQuiz = () => {
    submitMutation.mutate(selectedAnswers);
  };

  const difficultyColor = {
    beginner: "bg-success/20 text-success",
    intermediate: "bg-accent/20 text-accent", 
    advanced: "bg-destructive/20 text-destructive",
  }[quiz.difficulty] || "bg-muted/20 text-muted-foreground";

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="glass-card border-primary/20 shadow-lg shadow-primary/10">
        {/* Quiz Header */}
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-2xl mb-1" data-testid="quiz-title">
                {quiz.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-adjusted difficulty based on your performance
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary" data-testid="quiz-timer">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-muted-foreground">
                {timeRemaining ? "Time Remaining" : "No Time Limit"}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                Question <span className="font-semibold text-foreground">{currentQuestionIndex + 1}</span> of{" "}
                <span className="font-semibold">{quiz.questions.length}</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Difficulty:</span>
                <Badge className={`text-xs ${difficultyColor}`}>
                  {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                </Badge>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">{currentQuestionIndex + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-medium leading-relaxed" data-testid="question-text">
                    {currentQuestion.question}
                  </p>
                </div>
              </div>

              {/* AI Difficulty Indicator */}
              <div className="flex items-center space-x-2 text-sm p-3 bg-primary/10 border border-primary/30 rounded-lg mb-6">
                <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                <span className="text-muted-foreground">
                  AI adjusted this question to{" "}
                  <span className="font-semibold text-primary capitalize">{currentQuestion.difficulty}</span>{" "}
                  difficulty based on your previous answers
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswers[currentQuestionIndex] === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showResult = showExplanation && isAnswered;
              
              let buttonClass = "w-full p-4 text-left border rounded-lg transition-all";
              
              if (showResult) {
                if (isCorrect) {
                  buttonClass += " bg-success/20 border-success text-success-foreground";
                } else if (isSelected && !isCorrect) {
                  buttonClass += " bg-destructive/20 border-destructive text-destructive-foreground";
                } else {
                  buttonClass += " bg-muted/10 border-muted text-muted-foreground";
                }
              } else if (isSelected) {
                buttonClass += " bg-primary/20 border-primary text-primary-foreground";
              } else {
                buttonClass += " glass-card border-border hover:border-primary hover:bg-primary/10";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={buttonClass}
                  disabled={isAnswered}
                  data-testid={`answer-option-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center flex-shrink-0">
                      {showResult ? (
                        isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : isSelected ? (
                          <XCircle className="w-5 h-5 text-destructive" />
                        ) : (
                          <span className="font-semibold text-muted-foreground">
                            {String.fromCharCode(65 + index)}
                          </span>
                        )
                      ) : (
                        <span className="font-semibold text-muted-foreground">
                          {String.fromCharCode(65 + index)}
                        </span>
                      )}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && isAnswered && (
            <Card className="bg-accent/10 border-accent/30">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-accent">?</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-accent mb-2">Explanation</h4>
                    <p className="text-sm">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quiz Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleSkipQuestion}
              disabled={submitMutation.isPending || (isLastQuestion && isAnswered)}
              data-testid="button-skip-question"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip Question
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={!isAnswered || submitMutation.isPending}
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                data-testid="button-submit-quiz"
              >
                {submitMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    Submit Quiz
                    <Trophy className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                disabled={!isAnswered}
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                data-testid="button-next-question"
              >
                Next Question
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

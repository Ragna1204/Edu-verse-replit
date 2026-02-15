import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CheckCircle,
    HelpCircle,
    Zap,
    Clock,
    Trophy,
    XCircle,
    RotateCcw,
    Sparkles,
} from "lucide-react";

interface QuizQuestion {
    question: string;
    options: { text: string; isCorrect: boolean }[];
    explanation: string;
}

export default function LessonView() {
    const { id } = useParams<{ id: string }>();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const queryClient = useQueryClient();

    // Quiz state
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [answers, setAnswers] = useState<boolean[]>([]);
    const [quizCompleted, setQuizCompleted] = useState(false);

    const { data: lesson, isLoading } = useQuery<any>({
        queryKey: [`/api/lessons/${id}`],
        enabled: !!id && isAuthenticated && !authLoading,
        retry: false,
    });

    // Get all lessons for navigation
    const { data: allLessons } = useQuery<any[]>({
        queryKey: [`/api/courses/${lesson?.courseId}/lessons`],
        enabled: !!lesson?.courseId && isAuthenticated,
        retry: false,
    });

    const { data: courseData } = useQuery<any>({
        queryKey: [`/api/courses/${lesson?.courseId}`],
        enabled: !!lesson?.courseId && isAuthenticated,
        retry: false,
    });

    const completeMutation = useMutation({
        mutationFn: async (score?: number) => {
            const body: any = {};
            if (score !== undefined) body.score = score;
            const res = await apiRequest("POST", `/api/lessons/${id}/complete`, body);
            return await res.json();
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: [`/api/courses/${lesson?.courseId}/lessons`] });
            queryClient.invalidateQueries({ queryKey: ["/api/user/enrollments"] });
            queryClient.invalidateQueries({ queryKey: [`/api/courses/${lesson?.courseId}`] });

            if (data.courseComplete) {
                toast({
                    title: "🎉 Course Completed!",
                    description: `You earned ${data.xpEarned} XP plus a course completion bonus!`,
                });
            } else {
                toast({
                    title: "Lesson Complete! ⭐",
                    description: `+${data.xpEarned} XP earned`,
                });
            }
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to save progress. Please try again.",
                variant: "destructive",
            });
        },
    });

    // Quiz logic — robust JSON parsing
    const quizQuestions: QuizQuestion[] = useMemo(() => {
        if (lesson?.type !== 'quiz') return [];
        try {
            let parsed = lesson.content;
            if (typeof parsed === 'string') {
                parsed = JSON.parse(parsed);
            }
            // If Gemini nested the array inside an object
            if (parsed && !Array.isArray(parsed) && parsed.questions) {
                parsed = parsed.questions;
            }
            if (!Array.isArray(parsed)) return [];
            return parsed.filter((q: any) => q.question && Array.isArray(q.options));
        } catch {
            return [];
        }
    }, [lesson]);

    // Navigation helpers
    const lessonList = (allLessons as any[]) || [];
    const currentIndex = lessonList.findIndex((l: any) => l.id === id);
    const prevLesson = currentIndex > 0 ? lessonList[currentIndex - 1] : null;
    const nextLessonNav = currentIndex < lessonList.length - 1 ? lessonList[currentIndex + 1] : null;

    // Reset quiz state when lesson changes
    useEffect(() => {
        setCurrentQuestion(0);
        setSelectedOption(null);
        setShowExplanation(false);
        setAnswers([]);
        setQuizCompleted(false);
    }, [id]);

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-muted-foreground">Loading lesson...</p>
                </div>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="py-8 max-w-4xl mx-auto px-4">
                <Card className="glass-card">
                    <CardContent className="p-12 text-center">
                        <div className="text-6xl mb-4">📄</div>
                        <h3 className="text-xl font-semibold mb-2">Lesson Not Found</h3>
                        <Button asChild><Link href="/courses">Back to Courses</Link></Button>
                    </CardContent>
                </Card>
            </div>
        );
    }



    const handleOptionSelect = (optionIndex: number) => {
        if (showExplanation) return;
        setSelectedOption(optionIndex);
    };

    const handleCheckAnswer = () => {
        if (selectedOption === null) return;
        setShowExplanation(true);
        const isCorrect = quizQuestions[currentQuestion].options[selectedOption].isCorrect;
        setAnswers([...answers, isCorrect]);
    };

    const handleNextQuestion = () => {
        if (currentQuestion < quizQuestions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedOption(null);
            setShowExplanation(false);
        } else {
            const correctCount = [...answers].filter(a => a).length;
            const score = Math.round((correctCount / quizQuestions.length) * 100);
            setQuizCompleted(true);
            completeMutation.mutate(score);
        }
    };

    const handleRetryQuiz = () => {
        setCurrentQuestion(0);
        setSelectedOption(null);
        setShowExplanation(false);
        setAnswers([]);
        setQuizCompleted(false);
    };

    const handleCompleteReading = () => {
        completeMutation.mutate(undefined);
    };

    // Markdown components for react-markdown
    const markdownComponents: any = {
        code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
                <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-xl my-4 !bg-[#1a1b26] border border-border/20"
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            ) : (
                <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                </code>
            );
        },
        h1: ({ children }: any) => <h1 className="text-2xl font-bold mt-8 mb-4 text-foreground">{children}</h1>,
        h2: ({ children }: any) => <h2 className="text-xl font-bold mt-8 mb-4 text-foreground border-b border-border/20 pb-2">{children}</h2>,
        h3: ({ children }: any) => <h3 className="text-lg font-semibold mt-6 mb-3 text-foreground">{children}</h3>,
        h4: ({ children }: any) => <h4 className="text-base font-semibold mt-5 mb-2 text-foreground">{children}</h4>,
        p: ({ children }: any) => <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>,
        ul: ({ children }: any) => <ul className="list-disc pl-6 mb-4 space-y-1.5 text-muted-foreground">{children}</ul>,
        ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-muted-foreground">{children}</ol>,
        li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 my-4 text-muted-foreground italic bg-muted/10 py-2 rounded-r-lg">
                {children}
            </blockquote>
        ),
        table: ({ children }: any) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-border/30">
                <table className="w-full text-sm">{children}</table>
            </div>
        ),
        th: ({ children }: any) => <th className="bg-muted/30 px-4 py-2.5 text-left font-semibold text-foreground border-b border-border/30">{children}</th>,
        td: ({ children }: any) => <td className="px-4 py-2.5 border-b border-border/20 text-muted-foreground">{children}</td>,
        strong: ({ children }: any) => <strong className="font-semibold text-foreground">{children}</strong>,
        a: ({ href, children }: any) => <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
        hr: () => <hr className="my-6 border-border/30" />,
    };

    return (
        <div className="py-6">
            <div className="max-w-4xl mx-auto px-4">
                {/* Top Nav */}
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                        <Link href={`/course/${lesson.courseId}`}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {courseData?.title || 'Back to Course'}
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="w-4 h-4" />
                        Lesson {lesson.order} of {lessonList.length}
                    </div>
                </div>

                {/* Lesson Content */}
                {lesson.type === 'reading' ? (
                    <>
                        {/* Reading Lesson */}
                        <Card className="glass-card border-primary/10 mb-6">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                                        <BookOpen className="w-3 h-3 mr-1" />
                                        Reading
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {lesson.estimatedMinutes} min
                                    </Badge>
                                    <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                        <Zap className="w-3 h-3 mr-1" />
                                        {lesson.xpReward} XP
                                    </Badge>
                                </div>
                                <CardTitle className="text-2xl">{lesson.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={markdownComponents}
                                    >
                                        {lesson.content}
                                    </ReactMarkdown>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Complete Reading Button */}
                        <div className="flex items-center justify-between">
                            {prevLesson && (
                                <Button variant="outline" asChild>
                                    <Link href={`/lesson/${prevLesson.id}`}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Previous
                                    </Link>
                                </Button>
                            )}
                            <div className="flex-1" />
                            <Button
                                onClick={handleCompleteReading}
                                disabled={completeMutation.isPending}
                                size="lg"
                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90 shadow-lg shadow-emerald-500/20"
                            >
                                {completeMutation.isPending ? "Saving..." : (
                                    <>
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Mark as Complete
                                        <span className="ml-2 text-xs opacity-80">+{lesson.xpReward} XP</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Quiz Lesson */}
                        {!quizCompleted ? (
                            <Card className="glass-card border-secondary/10 mb-6">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                                                <HelpCircle className="w-3 h-3 mr-1" />
                                                Quiz
                                            </Badge>
                                            <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                                <Zap className="w-3 h-3 mr-1" />
                                                {lesson.xpReward} XP
                                            </Badge>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            Question {currentQuestion + 1} of {quizQuestions.length}
                                        </span>
                                    </div>
                                    <CardTitle className="text-xl mt-2">{lesson.title}</CardTitle>
                                    <Progress
                                        value={((currentQuestion + (showExplanation ? 1 : 0)) / quizQuestions.length) * 100}
                                        className="h-1.5 mt-3"
                                    />
                                </CardHeader>

                                {quizQuestions.length > 0 && (
                                    <CardContent className="space-y-6">
                                        {/* Question */}
                                        <div className="p-5 rounded-xl bg-muted/20 border border-border/30">
                                            <h3 className="text-lg font-semibold leading-relaxed">
                                                {quizQuestions[currentQuestion].question}
                                            </h3>
                                        </div>

                                        {/* Options */}
                                        <div className="space-y-3">
                                            {quizQuestions[currentQuestion].options.map((option, idx) => {
                                                const isSelected = selectedOption === idx;
                                                const isCorrect = option.isCorrect;
                                                let optionStyle = "border-border/30 hover:border-primary/50 hover:bg-muted/10";

                                                if (showExplanation) {
                                                    if (isCorrect) {
                                                        optionStyle = "border-emerald-500/50 bg-emerald-500/10";
                                                    } else if (isSelected && !isCorrect) {
                                                        optionStyle = "border-rose-500/50 bg-rose-500/10";
                                                    } else {
                                                        optionStyle = "border-border/20 opacity-50";
                                                    }
                                                } else if (isSelected) {
                                                    optionStyle = "border-primary/50 bg-primary/10 ring-2 ring-primary/20";
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleOptionSelect(idx)}
                                                        disabled={showExplanation}
                                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${optionStyle}`}
                                                    >
                                                        <div className={`
                              w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold
                              ${showExplanation && isCorrect ? 'bg-emerald-500/30 text-emerald-400' :
                                                                showExplanation && isSelected && !isCorrect ? 'bg-rose-500/30 text-rose-400' :
                                                                    isSelected ? 'bg-primary/30 text-primary' : 'bg-muted/30 text-muted-foreground'}
                            `}>
                                                            {showExplanation ? (
                                                                isCorrect ? <CheckCircle className="w-5 h-5" /> :
                                                                    isSelected ? <XCircle className="w-5 h-5" /> :
                                                                        String.fromCharCode(65 + idx)
                                                            ) : (
                                                                String.fromCharCode(65 + idx)
                                                            )}
                                                        </div>
                                                        <span className="flex-1">{option.text}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Explanation */}
                                        {showExplanation && (
                                            <div className={`p-4 rounded-xl border ${quizQuestions[currentQuestion].options[selectedOption!]?.isCorrect
                                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                                : 'bg-amber-500/10 border-amber-500/30'
                                                }`}>
                                                <p className="text-sm font-medium mb-1">
                                                    {quizQuestions[currentQuestion].options[selectedOption!]?.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {quizQuestions[currentQuestion].explanation}
                                                </p>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex justify-end">
                                            {!showExplanation ? (
                                                <Button
                                                    onClick={handleCheckAnswer}
                                                    disabled={selectedOption === null}
                                                    size="lg"
                                                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                                                >
                                                    Check Answer
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={handleNextQuestion}
                                                    size="lg"
                                                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                                                >
                                                    {currentQuestion < quizQuestions.length - 1 ? (
                                                        <>Next Question <ArrowRight className="w-4 h-4 ml-2" /></>
                                                    ) : (
                                                        <>Finish Quiz <Trophy className="w-4 h-4 ml-2" /></>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ) : (
                            /* Quiz Results */
                            <Card className="glass-card border-primary/10 mb-6">
                                <CardContent className="p-8 text-center">
                                    <div className="mb-6">
                                        {answers.filter(a => a).length >= quizQuestions.length * 0.7 ? (
                                            <div className="text-7xl mb-4">🎉</div>
                                        ) : answers.filter(a => a).length >= quizQuestions.length * 0.4 ? (
                                            <div className="text-7xl mb-4">💪</div>
                                        ) : (
                                            <div className="text-7xl mb-4">📖</div>
                                        )}

                                        <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
                                        <p className="text-muted-foreground text-lg">
                                            You scored {answers.filter(a => a).length}/{quizQuestions.length}
                                        </p>
                                    </div>

                                    <div className="inline-flex items-center gap-6 p-4 rounded-xl bg-muted/20 border border-border/30 mb-6">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-emerald-400">{answers.filter(a => a).length}</div>
                                            <div className="text-xs text-muted-foreground">Correct</div>
                                        </div>
                                        <div className="w-px h-10 bg-border/50" />
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-rose-400">{answers.filter(a => !a).length}</div>
                                            <div className="text-xs text-muted-foreground">Wrong</div>
                                        </div>
                                        <div className="w-px h-10 bg-border/50" />
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-yellow-400">
                                                {Math.round((answers.filter(a => a).length / quizQuestions.length) * 100)}%
                                            </div>
                                            <div className="text-xs text-muted-foreground">Score</div>
                                        </div>
                                        <div className="w-px h-10 bg-border/50" />
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-primary flex items-center gap-1">
                                                <Zap className="w-5 h-5" />{lesson.xpReward}
                                            </div>
                                            <div className="text-xs text-muted-foreground">XP Earned</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-3">
                                        <Button variant="outline" onClick={handleRetryQuiz}>
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Retry Quiz
                                        </Button>
                                        {nextLessonNav ? (
                                            <Button asChild className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                                                <Link href={`/lesson/${nextLessonNav.id}`}>
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                    Next Lesson
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button asChild className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90">
                                                <Link href={`/course/${lesson.courseId}`}>
                                                    <Trophy className="w-4 h-4 mr-2" />
                                                    Back to Course
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {/* Bottom Navigation */}
                {(lesson.type === 'reading' || quizCompleted) && (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-border/20">
                        {prevLesson ? (
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/lesson/${prevLesson.id}`}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    {prevLesson.title}
                                </Link>
                            </Button>
                        ) : <div />}

                        {nextLessonNav ? (
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/lesson/${nextLessonNav.id}`}>
                                    {nextLessonNav.title}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                        ) : (
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/course/${lesson.courseId}`}>
                                    Back to Course
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

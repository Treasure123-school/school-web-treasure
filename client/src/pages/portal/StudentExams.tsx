import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Clock, BookOpen, Trophy, Play, Eye, CheckCircle, XCircle, Timer, Save, RotateCcw, AlertCircle, Loader, FileText } from 'lucide-react';
import type { Exam, ExamSession, ExamQuestion, QuestionOption, StudentAnswer } from '@shared/schema';

// Question save status type
type QuestionSaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export default function StudentExams() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResults, setExamResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  
  // Per-question save status tracking
  const [questionSaveStatus, setQuestionSaveStatus] = useState<Record<number, QuestionSaveStatus>>({});
  const [pendingSaves, setPendingSaves] = useState<Set<number>>(new Set());
  const saveTimeoutsRef = useRef<Record<number, NodeJS.Timeout>>({});

  // Fetch available exams
  const { data: exams = [], isLoading: loadingExams } = useQuery<Exam[]>({
    queryKey: ['/api/exams'],
    enabled: !!user,
  });

  // Fetch exam questions for active session
  const { data: examQuestions = [], isLoading: loadingQuestions } = useQuery<ExamQuestion[]>({
    queryKey: ['/api/exam-questions', activeSession?.examId],
    enabled: !!activeSession?.examId,
  });

  // Fetch question options for current question
  const currentQuestion = examQuestions[currentQuestionIndex];
  const { data: questionOptions = [] } = useQuery<QuestionOption[]>({
    queryKey: ['/api/question-options', currentQuestion?.id],
    enabled: !!currentQuestion?.id && currentQuestion?.questionType === 'multiple_choice',
  });

  // Fetch all question options for multiple choice questions (needed for results review)
  const { data: allQuestionOptions = [] } = useQuery<QuestionOption[]>({
    queryKey: ['/api/question-options/all', examQuestions.map(q => q.id).join(',')],
    queryFn: async () => {
      if (!examQuestions.length) return [];
      
      const allOptions: QuestionOption[] = [];
      const mcQuestions = examQuestions.filter(q => q.questionType === 'multiple_choice');
      
      for (const question of mcQuestions) {
        const response = await apiRequest('GET', `/api/question-options/${question.id}`);
        if (response.ok) {
          const options = await response.json();
          allOptions.push(...options);
        }
      }
      return allOptions;
    },
    enabled: !!examQuestions.length && (showResults || examQuestions.some(q => q.questionType === 'multiple_choice')),
  });

  // Fetch existing answers for active session
  const { data: existingAnswers = [] } = useQuery<StudentAnswer[]>({
    queryKey: ['/api/student-answers/session', activeSession?.id],
    enabled: !!activeSession?.id,
  });

  // Load existing answers into state
  useEffect(() => {
    if (existingAnswers.length > 0) {
      const answerMap: Record<number, any> = {};
      existingAnswers.forEach(answer => {
        if (answer.selectedOptionId) {
          answerMap[answer.questionId] = answer.selectedOptionId;
        } else if (answer.textAnswer) {
          answerMap[answer.questionId] = answer.textAnswer;
        }
      });
      setAnswers(answerMap);
    }
  }, [existingAnswers]);

  // Timer countdown with race condition protection
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && activeSession && !activeSession.isCompleted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            // Auto-submit when time runs out, but wait for pending saves
            handleAutoSubmitOnTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, activeSession]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Client-side answer validation
  const validateAnswer = (questionType: string, answer: any): { isValid: boolean; error?: string } => {
    if (questionType === 'multiple_choice') {
      if (!answer || isNaN(parseInt(answer))) {
        return { isValid: false, error: 'Please select an option' };
      }
      return { isValid: true };
    }
    
    if (questionType === 'text' || questionType === 'essay') {
      if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
        return { isValid: false, error: 'Please enter an answer' };
      }
      if (answer.trim().length < 1) {
        return { isValid: false, error: 'Answer is too short' };
      }
      return { isValid: true };
    }
    
    return { isValid: false, error: 'Unknown question type' };
  };

  // Check if any answers are currently being saved
  const hasPendingSaves = (): boolean => {
    return pendingSaves.size > 0;
  };

  // Auto-submit with pending save protection
  const handleAutoSubmitOnTimeout = async () => {
    if (hasPendingSaves()) {
      // Wait for pending saves to complete, then force submit
      toast({
        title: "Time's Up!",
        description: "Waiting for answers to save before submitting...",
      });
      
      // Wait up to 5 seconds for saves to complete
      const maxWaitTime = 5000;
      const checkInterval = 500;
      let waitTime = 0;
      
      const checkSaves = () => {
        if (!hasPendingSaves()) {
          // All saves completed, now submit
          toast({
            title: "Submitting Exam",
            description: "All answers saved successfully. Submitting exam...",
          });
          forceSubmitExam();
        } else if (waitTime >= maxWaitTime) {
          // Force submit after waiting
          toast({
            title: "Submitting Exam",
            description: "Time limit reached. Submitting exam with any unsaved answers...",
            variant: "destructive",
          });
          forceSubmitExam();
        } else {
          // Keep waiting
          waitTime += checkInterval;
          setTimeout(checkSaves, checkInterval);
        }
      };
      
      checkSaves();
    } else {
      toast({
        title: "Submitting Exam",
        description: "Time limit reached. Submitting exam...",
      });
      forceSubmitExam();
    }
  };

  // Start exam mutation
  const startExamMutation = useMutation({
    mutationFn: async (examId: number) => {
      const response = await apiRequest('POST', '/api/exam-sessions', {
        examId,
        studentId: user?.id,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start exam');
      }
      return response.json();
    },
    onSuccess: (session: ExamSession) => {
      setActiveSession(session);
      setCurrentQuestionIndex(0);
      // Set timer if exam has time limit
      const exam = exams.find(e => e.id === session.examId);
      if (exam?.timeLimit) {
        setTimeRemaining(exam.timeLimit * 60); // Convert minutes to seconds
      }
      toast({
        title: "Exam Started",
        description: "Good luck with your exam!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Enhanced submit answer mutation with status tracking and validation
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer, questionType }: { questionId: number; answer: any; questionType: string }) => {
      // Client-side validation before submission
      const validation = validateAnswer(questionType, answer);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid answer');
      }

      const answerData = questionType === 'multiple_choice'
        ? { sessionId: activeSession!.id, questionId, selectedOptionId: answer }
        : { sessionId: activeSession!.id, questionId, textAnswer: answer };

      const response = await apiRequest('POST', '/api/student-answers', answerData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = `Failed to submit answer (${response.status})`;
        
        // Parse structured error responses
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.errors) {
          // Handle Zod validation errors
          errorMessage = Array.isArray(errorData.errors) 
            ? errorData.errors.map((e: any) => e.message).join(', ')
            : 'Validation failed';
        }
        
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onMutate: (variables) => {
      // Set status to saving and track pending save
      setQuestionSaveStatus(prev => ({ ...prev, [variables.questionId]: 'saving' }));
      setPendingSaves(prev => new Set(prev).add(variables.questionId));
      
      // Clear any existing timeout for this question
      if (saveTimeoutsRef.current[variables.questionId]) {
        clearTimeout(saveTimeoutsRef.current[variables.questionId]);
      }
    },
    onSuccess: (data, variables) => {
      // Mark as saved and remove from pending
      setQuestionSaveStatus(prev => ({ ...prev, [variables.questionId]: 'saved' }));
      setPendingSaves(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.questionId);
        return newSet;
      });
      
      // Auto-clear saved status after 2 seconds
      saveTimeoutsRef.current[variables.questionId] = setTimeout(() => {
        setQuestionSaveStatus(prev => ({ ...prev, [variables.questionId]: 'idle' }));
      }, 2000);

      // Invalidate cache to ensure UI stays in sync
      queryClient.invalidateQueries({ 
        queryKey: ['/api/student-answers/session', activeSession?.id] 
      });
      
      console.log(`Answer saved for question ${variables.questionId}:`, data);
    },
    onError: (error: Error, variables) => {
      // Mark as failed and remove from pending
      setQuestionSaveStatus(prev => ({ ...prev, [variables.questionId]: 'failed' }));
      setPendingSaves(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.questionId);
        return newSet;
      });

      // Show error toast only for unexpected errors, not validation errors
      if (!error.message.includes('Please select') && !error.message.includes('Please enter')) {
        toast({
          title: "Answer Save Failed",
          description: `Question ${variables.questionId}: ${error.message}`,
          variant: "destructive",
        });
      }
    },
  });

  // MILESTONE 1: Synchronous Submit Exam Mutation - No Polling, Instant Feedback! 🚀
  const submitExamMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession) throw new Error('No active session');
      
      console.log('🚀 MILESTONE 1: Synchronous submission for exam:', activeSession.examId);
      
      // Use the new synchronous submit endpoint - no polling needed!
      const response = await apiRequest('POST', `/api/exams/${activeSession.examId}/submit`, {});
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit exam');
      }
      
      const submissionData = await response.json();
      console.log('✅ INSTANT FEEDBACK received:', submissionData);
      
      return submissionData;
    },
    onMutate: () => {
      console.log('🔄 Exam submission started, setting scoring state...');
      setIsScoring(true);
    },
    onSuccess: (data) => {
      console.log('✅ MILESTONE 1: Instant feedback received:', data);
      setIsScoring(false);
      
      // Handle the new synchronous response format
      if (data.submitted && data.result) {
        console.log('🎉 INSTANT FEEDBACK: Results available immediately!', data.result);
        setExamResults(data.result);
        
        // Enhanced cache invalidation for all related data
        queryClient.invalidateQueries({ 
          queryKey: ['/api/student-answers/session', activeSession?.id] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['/api/exam-results', user?.id] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['/api/exam-sessions', activeSession?.id] 
        });
        
        setShowResults(true);
        
        const score = data.result.score ?? 0;
        const maxScore = data.result.maxScore ?? 0;
        const percentage = data.result.percentage ?? 0;
        
        console.log(`📊 INSTANT FEEDBACK: ${score}/${maxScore} = ${percentage}%`);
        
        // Show detailed breakdown if available
        const breakdown = data.result.breakdown;
        let description = `Your Score: ${score}/${maxScore} (${percentage}%)`;
        
        if (breakdown) {
          if (breakdown.autoScoredQuestions > 0 && breakdown.pendingManualReview > 0) {
            description += `. ${breakdown.autoScoredQuestions} questions auto-scored, ${breakdown.pendingManualReview} pending manual review.`;
          } else if (breakdown.pendingManualReview > 0) {
            description += `. Some questions require manual grading by your instructor.`;
          } else {
            description += `. All questions scored automatically!`;
          }
        }
        
        // Handle different submission scenarios
        let toastTitle = "Exam Submitted Successfully! 🎉";
        if (data.alreadySubmitted) {
          toastTitle = "Previous Results Retrieved";
        } else if (data.timedOut) {
          toastTitle = "Exam Submitted (Time Limit Exceeded)";
        }
        
        toast({
          title: toastTitle,
          description,
          variant: data.timedOut ? "destructive" : "default",
        });
      } else if (data.submitted && !data.result) {
        console.log('📝 Exam submitted successfully, awaiting manual grading');
        toast({
          title: "Exam Submitted Successfully",
          description: data.message || "Your exam has been submitted. Results will be available after manual grading by your instructor.",
        });
        // Reset to exam list for manual grading cases
        setActiveSession(null);
        setAnswers({});
        setTimeRemaining(null);
        setCurrentQuestionIndex(0);
      } else {
        console.warn('⚠️ Unexpected response format:', data);
        toast({
          title: "Submission Complete",
          description: data.message || "Your exam has been submitted successfully.",
        });
        // Reset to exam list as fallback
        setActiveSession(null);
        setAnswers({});
        setTimeRemaining(null);
        setCurrentQuestionIndex(0);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/exam-sessions'] });
    },
    onError: (error: Error) => {
      console.error('❌ MILESTONE 1: Synchronous submission failed:', error);
      setIsScoring(false);
      setIsSubmitting(false);
      
      // Handle specific error types for better user experience
      let errorTitle = "Submission Error";
      let errorDescription = error.message;
      
      // Check for specific error types that can happen with synchronous submission
      if (error.message.includes('already submitted')) {
        errorTitle = "Already Submitted";
        errorDescription = "This exam has already been submitted. Please check your results or contact your instructor.";
      } else if (error.message.includes('Time limit exceeded')) {
        errorTitle = "Time Limit Exceeded";
        errorDescription = "The time limit for this exam has been exceeded. Please start over or contact your instructor if you believe this is an error.";
      } else if (error.message.includes('time limit') || error.message.includes('expired')) {
        errorTitle = "Time Limit Exceeded";
        errorDescription = "The time limit for this exam has been exceeded. Your exam may have been automatically submitted.";
      } else if (error.message.includes('No active exam session')) {
        errorTitle = "Session Not Found";
        errorDescription = "No active exam session found. Please start the exam first or contact your instructor if you believe this is an error.";
      } else if (error.message.includes('Auto-scoring failed')) {
        errorTitle = "Submission Successful";
        errorDescription = "Your exam was submitted successfully, but automatic scoring is not available. Your instructor will manually grade your exam.";
      } else if (error.message.includes('technical error') || error.message.includes('database')) {
        errorTitle = "Technical Error";
        errorDescription = "A technical error occurred during submission. Please try again or contact your instructor for assistance.";
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: errorTitle === "Submission Successful" ? "default" : "destructive",
      });
    },
  });

  const handleStartExam = (exam: Exam) => {
    setSelectedExam(exam);
    startExamMutation.mutate(exam.id);
  };

  const handleAnswerChange = (questionId: number, answer: any, questionType: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    // Only submit if answer is meaningful (not empty)
    const validation = validateAnswer(questionType, answer);
    if (validation.isValid) {
      submitAnswerMutation.mutate({ questionId, answer, questionType });
    }
  };

  const handleRetryAnswer = (questionId: number, questionType: string) => {
    const answer = answers[questionId];
    if (answer) {
      submitAnswerMutation.mutate({ questionId, answer, questionType });
    }
  };

  // Handle returning to exam list after viewing results
  const handleBackToExams = () => {
    setShowResults(false);
    setExamResults(null);
    setActiveSession(null);
    setAnswers({});
    setTimeRemaining(null);
    setCurrentQuestionIndex(0);
    setSelectedExam(null);
  };

  // Force submit without checking pending saves (used for auto-submit)
  const forceSubmitExam = async () => {
    setIsSubmitting(true);
    try {
      await submitExamMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Regular submit with pending save protection
  const handleSubmitExam = async () => {
    if (hasPendingSaves()) {
      // Don't submit, let the disabled button and UI indicate the state
      return;
    }

    setIsSubmitting(true);
    try {
      await submitExamMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get save status indicator for a question
  const getSaveStatusIndicator = (questionId: number) => {
    const status = questionSaveStatus[questionId] || 'idle';
    const hasAnswer = !!answers[questionId];
    
    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center space-x-1 text-blue-500">
            <Loader className="w-3 h-3 animate-spin" />
            <span className="text-xs">Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center space-x-1 text-green-500">
            <CheckCircle className="w-3 h-3" />
            <span className="text-xs">Saved</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center space-x-1 text-red-500">
            <AlertCircle className="w-3 h-3" />
            <span className="text-xs">Failed</span>
          </div>
        );
      default:
        return hasAnswer ? (
          <div className="flex items-center space-x-1 text-gray-500">
            <Save className="w-3 h-3" />
            <span className="text-xs">Answer ready</span>
          </div>
        ) : null;
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = examQuestions.length > 0 ? ((currentQuestionIndex + 1) / examQuestions.length) * 100 : 0;

  if (!user) {
    return <div>Please log in to access the exam portal.</div>;
  }

  // Map roleId to role name
  const getRoleName = (roleId: number): 'admin' | 'teacher' | 'parent' | 'student' => {
    const roleMap: { [key: number]: 'admin' | 'teacher' | 'parent' | 'student' } = {
      1: 'admin',
      2: 'teacher', 
      3: 'student',
      4: 'parent'
    };
    return roleMap[roleId] || 'student';
  };

  return (
    <PortalLayout
      userRole={getRoleName(user.roleId)}
      userName={user.firstName + ' ' + user.lastName}
      userInitials={user.firstName.charAt(0) + user.lastName.charAt(0)}
    >
      {/* Scoring Screen */}
      {isScoring ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader className="w-8 h-8 animate-spin mx-auto text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Scoring Your Exam</h2>
              <p className="text-muted-foreground">Please wait while we calculate your results...</p>
            </div>
          </div>
        </div>
      ) : /* Results Screen */
      showResults ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Exam Results</h1>
              <p className="text-muted-foreground">Your exam has been submitted and scored</p>
            </div>
            <Button 
              onClick={handleBackToExams}
              data-testid="button-back-to-exams"
            >
              Back to Exams
            </Button>
          </div>

          {examResults && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Score Overview */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Your Score</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">
                      {examResults.score}/{examResults.maxScore}
                    </div>
                    <div className="text-2xl font-semibold text-muted-foreground">
                      {Math.round((examResults.score / examResults.maxScore) * 100)}%
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Questions:</span>
                      <span>{examQuestions.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Points Earned:</span>
                      <span className="text-green-600 font-medium">
                        {examResults.score} out of {examResults.maxScore}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Auto Scored:</span>
                      <span>{examResults.autoScored ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  {/* Performance indicator */}
                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-2">Performance</div>
                    <div className={`text-lg font-semibold ${
                      (examResults.score / examResults.maxScore) >= 0.8 ? 'text-green-600' :
                      (examResults.score / examResults.maxScore) >= 0.6 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {(examResults.score / examResults.maxScore) >= 0.8 ? 'Excellent!' :
                       (examResults.score / examResults.maxScore) >= 0.6 ? 'Good Job!' :
                       'Keep Practicing!'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Answer Review */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Answer Review</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allQuestionOptions.length === 0 && examQuestions.some(q => q.questionType === 'multiple_choice') ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Loading answer options...
                    </div>
                  ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {examQuestions.map((question, index) => {
                      const studentAnswer = existingAnswers.find(a => a.questionId === question.id);
                      const isCorrect = studentAnswer?.isCorrect;
                      
                      return (
                        <div key={question.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm font-medium">Q{index + 1}.</span>
                                <span className="text-sm text-muted-foreground">({question.points} pts)</span>
                                {isCorrect !== undefined && (
                                  <Badge variant={isCorrect ? 'default' : 'destructive'}>
                                    {isCorrect ? 'Correct' : 'Incorrect'}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm">{question.questionText}</p>
                            </div>
                          </div>
                          
                          {studentAnswer && (
                            <div className="pl-4 border-l-2 border-muted">
                              <div className="text-xs text-muted-foreground mb-1">Your Answer:</div>
                              <div className="text-sm">
                                {question.questionType === 'multiple_choice' ? (
                                  allQuestionOptions
                                    .filter(opt => opt.questionId === question.id)
                                    .find(opt => opt.id === studentAnswer.selectedOptionId)?.optionText || 'No answer selected'
                                ) : (
                                  studentAnswer.textAnswer || 'No text answer provided'
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : /* Active Exam Interface */
      activeSession && examQuestions.length > 0 ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Exam Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{selectedExam?.name}</CardTitle>
                  <p className="text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {examQuestions.length}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {timeRemaining !== null && (
                    <div className="flex items-center space-x-2">
                      <Timer className="w-4 h-4" />
                      <span className={`font-mono ${timeRemaining < 300 ? 'text-red-500' : ''}`}>
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                  )}
                  <Button
                    onClick={handleSubmitExam}
                    disabled={isSubmitting || hasPendingSaves() || isScoring}
                    data-testid="button-submit-exam"
                  >
                    {isScoring ? (
                      'Processing Results...'
                    ) : isSubmitting ? (
                      'Submitting...'
                    ) : hasPendingSaves() ? (
                      'Waiting for answers to save...'
                    ) : (
                      'Submit Exam'
                    )}
                  </Button>
                </div>
              </div>
              <Progress value={progress} className="w-full" />
            </CardHeader>
          </Card>

          {/* Current Question */}
          {currentQuestion && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    Question {currentQuestionIndex + 1}
                    <Badge variant="outline" className="ml-2">
                      {currentQuestion.points} points
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {getSaveStatusIndicator(currentQuestion.id)}
                    {questionSaveStatus[currentQuestion.id] === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetryAnswer(currentQuestion.id, currentQuestion.questionType)}
                        disabled={submitAnswerMutation.isPending}
                        data-testid="button-retry-answer"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base leading-relaxed" data-testid="question-text">
                  {currentQuestion.questionText}
                </p>

                {/* Multiple Choice */}
                {currentQuestion.questionType === 'multiple_choice' && (
                  <RadioGroup
                    value={answers[currentQuestion.id]?.toString() || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value), currentQuestion.questionType)}
                    data-testid="question-options"
                  >
                    {questionOptions.map((option, index) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={option.id.toString()}
                          id={`option-${option.id}`}
                          data-testid={`option-${index}`}
                        />
                        <Label
                          htmlFor={`option-${option.id}`}
                          className="text-base cursor-pointer flex-1"
                        >
                          {option.optionText}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* Text/Essay Questions */}
                {(currentQuestion.questionType === 'text' || currentQuestion.questionType === 'essay') && (
                  <Textarea
                    placeholder="Enter your answer here..."
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value, currentQuestion.questionType)}
                    rows={currentQuestion.questionType === 'essay' ? 8 : 4}
                    data-testid="text-answer"
                  />
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    data-testid="button-previous"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(examQuestions.length - 1, prev + 1))}
                    disabled={currentQuestionIndex === examQuestions.length - 1}
                    data-testid="button-next"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Question Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-2">
                {examQuestions.map((question, index) => (
                  <Button
                    key={question.id}
                    variant={currentQuestionIndex === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentQuestionIndex(index)}
                    className="h-8 w-8 p-0"
                    data-testid={`question-nav-${index}`}
                  >
                    {answers[question.id] ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      index + 1
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Exam List */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">My Exams</h1>
              <p className="text-muted-foreground">View available exams and take tests</p>
            </div>
          </div>

          {/* Available Exams */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingExams ? (
              <div className="col-span-full text-center py-8">Loading exams...</div>
            ) : exams.filter(exam => exam.isPublished).length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No exams available at the moment.
              </div>
            ) : (
              exams
                .filter(exam => exam.isPublished)
                .map((exam) => (
                  <Card key={exam.id} className="hover:shadow-md transition-shadow" data-testid={`exam-card-${exam.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{exam.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(exam.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={exam.isPublished ? 'default' : 'secondary'}>
                          {exam.isPublished ? 'Available' : 'Draft'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-4 h-4" />
                          <span>{exam.totalMarks} marks</span>
                        </div>
                        {exam.timeLimit && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{exam.timeLimit} min</span>
                          </div>
                        )}
                      </div>

                      {exam.instructions && (
                        <p className="text-sm text-muted-foreground">
                          {exam.instructions}
                        </p>
                      )}

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleStartExam(exam)}
                          disabled={startExamMutation.isPending}
                          className="flex-1"
                          data-testid={`button-start-exam-${exam.id}`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {startExamMutation.isPending ? 'Starting...' : 'Start Exam'}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          data-testid={`button-view-exam-${exam.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
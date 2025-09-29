import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
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
import { Clock, BookOpen, Trophy, Play, Eye, CheckCircle, XCircle, Timer, Save, RotateCcw, AlertCircle, Loader, FileText, Maximize, Minimize, Circle, CheckCircle2, HelpCircle } from 'lucide-react';
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
  const [isFullScreen, setIsFullScreen] = useState(false);
  
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

  // PERFORMANCE: Memoize current question to prevent unnecessary re-renders
  const currentQuestion = useMemo(() => examQuestions[currentQuestionIndex], [examQuestions, currentQuestionIndex]);
  
  // Fetch question options for current question
  const { data: questionOptions = [] } = useQuery<QuestionOption[]>({
    queryKey: ['/api/question-options', currentQuestion?.id],
    enabled: !!currentQuestion?.id && currentQuestion?.questionType === 'multiple_choice',
  });

  // PERFORMANCE FIX: Use bulk endpoint to fetch all question options in single request
  const { data: allQuestionOptions = [] } = useQuery<QuestionOption[]>({
    queryKey: ['/api/question-options/bulk', examQuestions.map(q => q.id).join(',')],
    queryFn: async () => {
      if (!examQuestions.length) return [];
      
      const mcQuestions = examQuestions.filter(q => q.questionType === 'multiple_choice');
      if (mcQuestions.length === 0) return [];
      
      const questionIds = mcQuestions.map(q => q.id).join(',');
      const response = await apiRequest('GET', `/api/question-options/bulk?questionIds=${questionIds}`);
      
      if (response.ok) {
        return await response.json();
      }
      return [];
    },
    enabled: !!examQuestions.length && (showResults || examQuestions.some(q => q.questionType === 'multiple_choice')),
  });

  // Fetch existing answers for active session
  const { data: existingAnswers = [] } = useQuery<StudentAnswer[]>({
    queryKey: ['/api/student-answers/session', activeSession?.id],
    enabled: !!activeSession?.id,
  });

  // PERFORMANCE: Memoize answer map calculation to prevent unnecessary computations
  const answerMap = useMemo(() => {
    const map: Record<number, any> = {};
    existingAnswers.forEach(answer => {
      if (answer.selectedOptionId) {
        map[answer.questionId] = answer.selectedOptionId;
      } else if (answer.textAnswer) {
        map[answer.questionId] = answer.textAnswer;
      }
    });
    return map;
  }, [existingAnswers]);

  // Load existing answers into state
  useEffect(() => {
    if (Object.keys(answerMap).length > 0) {
      setAnswers(answerMap);
    }
  }, [answerMap]);

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

  // OPTIMIZED Auto-submit with minimal delay for <2s performance goal
  const handleAutoSubmitOnTimeout = async () => {
    const startTime = Date.now();
    
    if (hasPendingSaves()) {
      // PERFORMANCE OPTIMIZATION: Reduced wait time from 5000ms to 600ms
      // This eliminates the major 5-second bottleneck while allowing time for network jitter
      toast({
        title: "Time's Up!",
        description: "Finalizing answers before submitting...",
      });
      
      // OPTIMIZED: Wait up to 600ms max for saves to complete (down from 5000ms!)
      // This allows time for network jitter while still achieving <2s total submission time
      const maxWaitTime = 600; // Reduced from 5000ms - MAJOR PERFORMANCE IMPROVEMENT
      const checkInterval = 50; // Faster checks (down from 500ms)
      let waitTime = 0;
      
      const checkSaves = () => {
        if (!hasPendingSaves()) {
          // All saves completed, now submit
          const totalWaitTime = Date.now() - startTime;
          console.log(`⚡ OPTIMIZED: Pending saves completed in ${totalWaitTime}ms (was up to 5000ms before)`);
          toast({
            title: "Submitting Exam",
            description: "Submitting exam...",
          });
          forceSubmitExam();
        } else if (waitTime >= maxWaitTime) {
          // Force submit after minimal wait
          const totalWaitTime = Date.now() - startTime;
          console.log(`⚡ OPTIMIZED: Force submit after ${totalWaitTime}ms wait (was 5000ms before)`);
          toast({
            title: "Submitting Exam",
            description: "Submitting exam...",
            variant: "default", // Changed from destructive - minimal delay is normal
          });
          forceSubmitExam();
        } else {
          // Keep waiting (but much shorter intervals)
          waitTime += checkInterval;
          setTimeout(checkSaves, checkInterval);
        }
      };
      
      checkSaves();
    } else {
      console.log(`⚡ OPTIMIZED: No pending saves, immediate submit`);
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

      // Enhanced error handling with specific user-friendly messages
      let userFriendlyMessage = error.message;
      let shouldShowToast = true;
      
      // Handle specific error types
      if (error.message.includes('Please select') || error.message.includes('Please enter')) {
        // Validation errors - don't show toast, user can see status indicator
        shouldShowToast = false;
      } else if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
        userFriendlyMessage = "Network connection issue. Your answer will be retried automatically.";
        // Auto-retry after 2 seconds for network errors
        setTimeout(() => {
          if (answers[variables.questionId]) {
            handleRetryAnswer(variables.questionId, variables.questionType);
          }
        }, 2000);
      } else if (error.message.includes('500')) {
        userFriendlyMessage = "Server error. Please try saving your answer again.";
      } else if (error.message.includes('401') || error.message.includes('Authentication')) {
        userFriendlyMessage = "Session expired. Please refresh the page and log in again.";
      } else if (error.message.includes('403')) {
        userFriendlyMessage = "Permission denied. Please contact your instructor.";
      }

      if (shouldShowToast) {
        toast({
          title: "Answer Save Failed",
          description: `Question ${variables.questionId}: ${userFriendlyMessage}`,
          variant: "destructive",
        });
      }

      // Log performance data for failed saves
      console.warn(`📊 ANSWER SAVE FAILED: Question ${variables.questionId} - ${error.message}`);
    },
  });

  // MILESTONE 1: Synchronous Submit Exam Mutation - No Polling, Instant Feedback! 🚀
  const submitExamMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession) throw new Error('No active session');
      
      const startTime = Date.now();
      console.log('🚀 MILESTONE 1: Synchronous submission for exam:', activeSession.examId);
      
      // Use the new synchronous submit endpoint - no polling needed!
      const response = await apiRequest('POST', `/api/exams/${activeSession.examId}/submit`, {});
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit exam');
      }
      
      const submissionData = await response.json();
      const totalTime = Date.now() - startTime;
      
      // Log client-side performance metrics
      console.log(`📊 CLIENT PERFORMANCE: Exam submission took ${totalTime}ms`);
      
      // Send performance metrics to server (fire and forget)
      try {
        await apiRequest('POST', '/api/performance-events', {
          sessionId: activeSession.id,
          eventType: 'submission',
          duration: totalTime,
          metadata: {
            examId: activeSession.examId,
            clientSide: true,
            timestamp: new Date().toISOString()
          }
        });
      } catch (perfError) {
        console.warn('Failed to log performance metrics:', perfError);
      }
      
      console.log('✅ INSTANT FEEDBACK received:', submissionData);
      
      return { ...submissionData, clientPerformance: { totalTime } };
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

  // Get timer color based on remaining time
  const getTimerColor = (seconds: number) => {
    if (seconds > 600) return 'text-green-600'; // > 10 minutes
    if (seconds > 300) return 'text-yellow-600'; // 5-10 minutes
    return 'text-red-600 animate-pulse'; // < 5 minutes
  };

  // Calculate timer progress percentage for visual indicator
  const getTimerProgress = () => {
    if (!timeRemaining || !selectedExam?.timeLimit) return 100;
    const totalSeconds = selectedExam.timeLimit * 60;
    return (timeRemaining / totalSeconds) * 100;
  };

  // PERFORMANCE: Memoize progress calculation to prevent unnecessary computations
  const progress = useMemo(() => {
    return examQuestions.length > 0 ? ((currentQuestionIndex + 1) / examQuestions.length) * 100 : 0;
  }, [examQuestions.length, currentQuestionIndex]);

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
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Success Banner */}
            <div 
              className="bg-green-600 text-white p-4 rounded-lg flex items-center space-x-3"
              role="status"
              aria-live="polite"
              data-testid="banner-success"
            >
              <CheckCircle className="w-6 h-6" aria-hidden="true" />
              <div>
                <span className="font-medium">Your exam answers have been submitted successfully.</span>
                <p className="text-green-100 text-sm mt-1">Initial scoring complete - Full detailed report coming soon!</p>
              </div>
            </div>

            {examResults && (() => {
              // Normalize data structure to handle different response formats
              const normalizedResults = {
                score: examResults.totalScore || examResults.score || 0,
                maxScore: examResults.maxScore || 0,
                percentage: 0,
                pendingCount: examResults.pendingReview?.count || 0,
                correctAnswers: examResults.immediateResults?.questions?.filter((q: any) => q.isCorrect).length || 0,
                wrongAnswers: examResults.immediateResults?.questions?.filter((q: any) => !q.isCorrect).length || 0,
                submittedAt: examResults.submittedAt
              };
              
              // Safe percentage calculation with guards
              if (normalizedResults.maxScore > 0) {
                normalizedResults.percentage = Math.round((normalizedResults.score / normalizedResults.maxScore) * 100);
                normalizedResults.percentage = Math.max(0, Math.min(100, normalizedResults.percentage)); // Clamp to [0,100]
              }

              // SVG progress calculations
              const radius = 85;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference * (1 - normalizedResults.percentage / 100);

              return (
                <>
                  {/* Provisional Score Warning */}
                  {normalizedResults.pendingCount > 0 && (
                    <div 
                      className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-4 rounded-lg"
                      role="status"
                      aria-live="polite"
                      data-testid="banner-provisional"
                    >
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium">📊 Objective Questions Only</p>
                          <p className="text-xs mt-1">
                            This score reflects only your multiple-choice and objective answers. 
                            Your essay questions, theory responses, and practical assessments 
                            are still being reviewed by your teacher.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Clarity Banner */}
                  <div 
                    className="bg-blue-50 border border-blue-200 p-4 rounded-lg"
                    data-testid="banner-clarity"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                        💡
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">What you're seeing now:</p>
                        <p className="text-xs text-blue-800 mt-1">
                          This page shows your immediate results for automatically-graded questions only. 
                          Your teacher is currently reviewing your written responses, essays, and subjective answers. 
                          Once complete, you'll receive your final grade and detailed feedback report.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Results Card */}
                  <Card className="bg-white shadow-lg" data-testid="card-exam-results">
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Circular Progress */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="relative w-48 h-48">
                            <svg 
                              className="w-48 h-48 transform -rotate-90" 
                              viewBox="0 0 200 200"
                              role="img"
                              aria-label={`Score: ${normalizedResults.percentage}% (${normalizedResults.score} out of ${normalizedResults.maxScore})`}
                              data-testid="progress-circular"
                            >
                              {/* Background circle */}
                              <circle
                                cx="100"
                                cy="100"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="transparent"
                                className="text-gray-200"
                              />
                              {/* Progress circle */}
                              <circle
                                cx="100"
                                cy="100"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="text-green-500 transition-all duration-1000 ease-in-out"
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="text-4xl font-bold text-gray-900" data-testid="text-percentage">
                                {normalizedResults.percentage}%
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 text-center">
                            <h2 className="text-xl font-semibold text-gray-900">Objective Questions Score:</h2>
                            <p className="text-lg text-gray-600" data-testid="text-score-fraction">
                              {normalizedResults.score}/{normalizedResults.maxScore} ({normalizedResults.percentage}%)
                            </p>
                            <p className="text-sm text-gray-500 mt-1">📝 Multiple-choice and automatic scoring only</p>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Quick Stats</h3>
                          
                          <div className="space-y-4">
                            {/* Correct Answers */}
                            <div className="flex items-center space-x-3" data-testid="stat-correct-answers">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
                              </div>
                              <div>
                                <span className="font-semibold text-green-600">Correct: </span>
                                <span className="text-gray-900" data-testid="value-correct-count">
                                  {normalizedResults.correctAnswers}
                                </span>
                              </div>
                            </div>

                            {/* Wrong Answers */}
                            <div className="flex items-center space-x-3" data-testid="stat-wrong-answers">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
                              </div>
                              <div>
                                <span className="font-semibold text-red-600">Wrong: </span>
                                <span className="text-gray-900" data-testid="value-wrong-count">
                                  {normalizedResults.wrongAnswers}
                                </span>
                              </div>
                            </div>

                            {/* Time (if available) */}
                            <div className="flex items-center space-x-3" data-testid="stat-completion-time">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Clock className="w-5 h-5 text-blue-600" aria-hidden="true" />
                              </div>
                              <div>
                                <span className="font-semibold text-blue-600">Time: </span>
                                <span className="text-gray-900" data-testid="value-completion-time">
                                  {normalizedResults.submittedAt ? 
                                    `Completed at ${new Date(normalizedResults.submittedAt).toLocaleTimeString()}` : 
                                    'Completed'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    {/* Pending Sections */}
                    {examResults.pendingReview && examResults.pendingReview.count > 0 && (
                      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg" data-testid="section-pending-review">
                        <div className="flex items-center space-x-2 mb-4">
                          <Clock className="w-5 h-5 text-blue-600" aria-hidden="true" />
                          <h3 className="text-lg font-semibold text-blue-900">🔍 Still Under Review</h3>
                        </div>
                        <div className="space-y-3 mb-4">
                          <div className="flex items-start space-x-2 text-sm text-blue-800">
                            <span className="font-medium">•</span>
                            <span><strong>Essay Questions</strong> - Being graded by your teacher</span>
                          </div>
                          <div className="flex items-start space-x-2 text-sm text-blue-800">
                            <span className="font-medium">•</span>
                            <span><strong>Theory Responses</strong> - Manual evaluation in progress</span>
                          </div>
                          <div className="flex items-start space-x-2 text-sm text-blue-800">
                            <span className="font-medium">•</span>
                            <span><strong>Practical Assessments</strong> - Awaiting instructor feedback</span>
                          </div>
                          <div className="flex items-start space-x-2 text-sm text-blue-800">
                            <span className="font-medium">•</span>
                            <span><strong>Final Grade Calculation</strong> - Will include all components</span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border-l-4 border-blue-400">
                          <p className="text-sm text-gray-700">
                            <strong>📅 Expected Release:</strong> Your complete report with final grades, 
                            teacher comments, and detailed feedback will be available within 2-3 business days.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-wrap gap-3 justify-center">
                      <Button 
                        onClick={handleBackToExams}
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        data-testid="button-back-to-dashboard"
                      >
                        Back to Dashboard
                      </Button>
                      
                      {examResults.pendingReview && examResults.pendingReview.count > 0 && (
                        <Button 
                          variant="outline"
                          disabled
                          className="text-gray-500"
                          data-testid="button-full-report-pending"
                        >
                          Full Report - Coming Soon
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline"
                        onClick={() => {
                          // Could add functionality to view detailed breakdown
                          toast({
                            title: "Feature Coming Soon",
                            description: "Detailed question breakdown will be available soon."
                          });
                        }}
                        data-testid="button-view-details"
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            );
            })()}
          </div>
        </div>
      ) : /* Active Exam Interface */
      activeSession && examQuestions.length > 0 ? (
        <div className={`${isFullScreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-auto' : ''}`}>
          <div className={`${isFullScreen ? 'max-w-7xl mx-auto p-6' : 'flex gap-6'}`}>
            {/* Question Navigation Sidebar */}
            <div className={`${isFullScreen ? 'mb-6' : 'w-64 flex-shrink-0'}`}>
              <Card className="sticky top-6">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm">Questions</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFullScreen(!isFullScreen)}
                      data-testid="button-toggle-fullscreen"
                    >
                      {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Summary */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Answered:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {Object.keys(answers).length}/{examQuestions.length}
                      </span>
                    </div>
                    <Progress value={(Object.keys(answers).length / examQuestions.length) * 100} className="h-2" />
                  </div>

                  {/* Enhanced Timer Display */}
                  {timeRemaining !== null && (
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Time Remaining</span>
                        <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className={`text-2xl font-mono font-bold ${getTimerColor(timeRemaining)}`}>
                        {formatTime(timeRemaining)}
                      </div>
                      <Progress value={getTimerProgress()} className="h-1.5 mt-2" />
                      {timeRemaining < 300 && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                          ⚠️ Less than 5 minutes left!
                        </p>
                      )}
                    </div>
                  )}

                  {/* Question Grid Navigation */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Jump to question:</p>
                    <div className="grid grid-cols-5 gap-2">
                      {examQuestions.map((question, index) => {
                        const isAnswered = !!answers[question.id];
                        const isCurrent = currentQuestionIndex === index;
                        const saveStatus = questionSaveStatus[question.id];
                        
                        return (
                          <button
                            key={question.id}
                            onClick={() => setCurrentQuestionIndex(index)}
                            className={`
                              relative h-10 w-10 rounded-lg font-semibold text-sm
                              transition-all duration-200 flex items-center justify-center
                              ${isCurrent 
                                ? 'bg-blue-600 text-white shadow-lg scale-110' 
                                : isAnswered
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-2 border-green-500 dark:border-green-600'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600'
                              }
                              hover:scale-105 hover:shadow-md
                            `}
                            data-testid={`question-nav-${index}`}
                          >
                            {isAnswered ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <span>{index + 1}</span>
                            )}
                            {saveStatus === 'saving' && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded bg-blue-600"></div>
                      <span className="text-gray-600 dark:text-gray-300">Current</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-700 dark:text-green-300" />
                      </div>
                      <span className="text-gray-600 dark:text-gray-300">Answered</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600"></div>
                      <span className="text-gray-600 dark:text-gray-300">Not answered</span>
                    </div>
                  </div>

                  {/* Submit Button in Sidebar */}
                  <Button
                    onClick={handleSubmitExam}
                    disabled={isSubmitting || hasPendingSaves() || isScoring}
                    className="w-full"
                    size="lg"
                    data-testid="button-submit-exam-sidebar"
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
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 space-y-6">
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
                  </div>
                  <Progress value={progress} className="w-full mt-2" />
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
            </div>
          </div>
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
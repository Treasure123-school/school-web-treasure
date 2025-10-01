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

  // Tab switch detection state
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  const tabSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Network status monitoring
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkIssues, setNetworkIssues] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Fetch available exams
  const { data: exams = [], isLoading: loadingExams, error: examsError } = useQuery<Exam[]>({
    queryKey: ['/api/exams'],
    enabled: !!user,
    queryFn: async () => {
      console.log('🔍 Fetching exams for student:', user?.id);
      const response = await apiRequest('GET', '/api/exams');

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch exams:', response.status, errorText);
        throw new Error(`Failed to fetch exams: ${response.status}`);
      }

      const examsData = await response.json();
      console.log('📚 Fetched exams:', examsData.length, 'exams');
      console.log('📋 Published exams:', examsData.filter((e: Exam) => e.isPublished).length);

      return examsData;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch exam questions for active session
  const { data: examQuestionsRaw = [], isLoading: loadingQuestions } = useQuery<ExamQuestion[]>({
    queryKey: ['/api/exam-questions', activeSession?.examId],
    enabled: !!activeSession?.examId,
  });

  // QUESTION RANDOMIZATION: Shuffle questions if exam has shuffleQuestions enabled
  const examQuestions = useMemo(() => {
    if (!examQuestionsRaw.length) return [];

    const exam = exams.find(e => e.id === activeSession?.examId);

    // If shuffleQuestions is enabled, shuffle the questions
    if (exam?.shuffleQuestions && !activeSession?.isCompleted && activeSession?.id) {
      // Seeded random function based on session ID for consistent shuffling
      const seed = activeSession.id;
      let seedValue = seed;
      const seededRandom = () => {
        seedValue = (seedValue * 9301 + 49297) % 233280;
        return seedValue / 233280;
      };

      // Use Fisher-Yates shuffle algorithm with seeded random
      const shuffled = [...examQuestionsRaw];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    // Otherwise return in original order
    return examQuestionsRaw;
  }, [examQuestionsRaw, activeSession?.examId, activeSession?.isCompleted, activeSession?.id, exams]);

  // PERFORMANCE: Memoize current question to prevent unnecessary re-renders
  const currentQuestion = useMemo(() => examQuestions[currentQuestionIndex], [examQuestions, currentQuestionIndex]);

  // Fetch question options for current question
  const { data: questionOptionsRaw = [] } = useQuery<QuestionOption[]>({
    queryKey: ['/api/question-options', currentQuestion?.id],
    enabled: !!currentQuestion?.id && currentQuestion?.questionType === 'multiple_choice',
  });

  // OPTION RANDOMIZATION: Shuffle options if exam has shuffleQuestions enabled
  const questionOptions = useMemo(() => {
    if (!questionOptionsRaw.length || !currentQuestion) return [];

    const exam = exams.find(e => e.id === activeSession?.examId);

    // If shuffleQuestions is enabled, shuffle the options
    if (exam?.shuffleQuestions && !activeSession?.isCompleted && activeSession?.id) {
      // Use seeded random based on session ID + question ID for consistent shuffling
      const seed = activeSession.id + currentQuestion.id;
      let seedValue = seed;
      const seededRandom = () => {
        seedValue = (seedValue * 9301 + 49297) % 233280;
        return seedValue / 233280;
      };

      // Use Fisher-Yates shuffle algorithm with seeded random
      const shuffled = [...questionOptionsRaw];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    // Otherwise return in original order
    return questionOptionsRaw;
  }, [questionOptionsRaw, currentQuestion, activeSession?.examId, activeSession?.isCompleted, activeSession?.id, exams]);

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

  // Check for existing active session on component mount
  useEffect(() => {
    if (user?.id && !activeSession) {
      apiRequest('GET', `/api/exam-sessions/student/${user.id}/active`)
        .then(response => response.json())
        .then(session => {
          if (session) {
            console.log('🔄 Found existing active session, resuming...', session);
            setActiveSession(session);
            const exam = exams.find(e => e.id === session.examId);
            if (exam) {
              setSelectedExam(exam);
            }

            // Restore session state
            try {
              const metadata = session.metadata ? JSON.parse(session.metadata) : {};
              if (metadata.currentQuestionIndex) {
                setCurrentQuestionIndex(metadata.currentQuestionIndex);
              }
            } catch (e) {
              console.warn('Could not parse session metadata:', e);
            }
          }
        })
        .catch(error => {
          console.error('Error checking for active session:', error);
        });
    }
  }, [user?.id, exams]);

  // SESSION RECOVERY: Resume active session with timer recovery
  useEffect(() => {
    if (activeSession && !activeSession.isCompleted) {
      const exam = exams.find(e => e.id === activeSession.examId);

      // Recover timer from session if available
      if (activeSession.timeRemaining !== null && activeSession.timeRemaining !== undefined) {
        setTimeRemaining(activeSession.timeRemaining);
        toast({
          title: "Session Resumed",
          description: `Exam resumed with ${Math.floor(activeSession.timeRemaining / 60)} minutes remaining`,
        });
      } else if (exam?.timeLimit && activeSession.startedAt) {
        // Calculate remaining time based on start time
        const elapsedSeconds = Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000);
        const totalSeconds = exam.timeLimit * 60;
        const remaining = Math.max(0, totalSeconds - elapsedSeconds);
        setTimeRemaining(remaining);

        if (remaining > 0) {
          toast({
            title: "Session Resumed",
            description: `Exam resumed with ${Math.floor(remaining / 60)} minutes remaining`,
          });
        }
      }
    }
  }, [activeSession, exams]);

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

  // Network status monitoring and session health check
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkIssues(false);
      toast({
        title: "Connection Restored",
        description: "Your internet connection has been restored. Retrying failed saves...",
        variant: "default",
      });

      // Retry any failed saves
      Object.keys(answers).forEach(questionId => {
        const qId = parseInt(questionId);
        if (questionSaveStatus[qId] === 'failed') {
          const question = examQuestions.find(q => q.id === qId);
          if (question) {
            handleRetryAnswer(qId, question.questionType);
          }
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkIssues(true);
      toast({
        title: "Connection Lost",
        description: "Your internet connection was lost. Answers will be saved when connection is restored.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [answers, questionSaveStatus, examQuestions]);

  // Session health monitoring - check every 5 minutes during active exam
  useEffect(() => {
    if (!activeSession || activeSession.isCompleted) return;

    const healthCheck = async () => {
      try {
        const response = await apiRequest('GET', `/api/exam-sessions/${activeSession.id}`);
        if (!response.ok && response.status === 401) {
          toast({
            title: "Session Expired",
            description: "Your exam session has expired. Please refresh the page and log in again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        // Silent fail - network issues will be handled by other mechanisms
        console.warn('Session health check failed:', error);
      }
    };

    const interval = setInterval(healthCheck, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [activeSession]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
      if (tabSwitchTimeoutRef.current) clearTimeout(tabSwitchTimeoutRef.current);
    };
  }, []);

  // TAB SWITCH DETECTION - Security Feature to detect when students leave exam page
  useEffect(() => {
    if (!activeSession || activeSession.isCompleted) return;

    let tabSwitchTimer: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Delay the warning to avoid false positives from quick system notifications
        tabSwitchTimer = setTimeout(() => {
          if (document.hidden) {
            // Student switched away from the tab
            setTabSwitchCount(prev => {
              const newCount = prev + 1;

              // Show warning on first 3 switches
              if (newCount <= 3) {
                setShowTabSwitchWarning(true);

                // Auto-hide warning after 5 seconds
                if (tabSwitchTimeoutRef.current) clearTimeout(tabSwitchTimeoutRef.current);
                tabSwitchTimeoutRef.current = setTimeout(() => {
                  setShowTabSwitchWarning(false);
                }, 5000);

                toast({
                  title: "⚠️ Tab Switch Detected",
                  description: `Warning ${newCount}/3: Please stay on the exam page. Excessive tab switching may be reported to your instructor.`,
                  variant: "destructive",
                });
              } else {
                // After 3 warnings, just log silently
                console.warn(`Tab switch detected: ${newCount} times`);
              }

              return newCount;
            });
          }
        }, 1000); // 1 second delay to avoid false positives
      } else {
        // Tab became visible again, cancel any pending warnings
        if (tabSwitchTimer) {
          clearTimeout(tabSwitchTimer);
          tabSwitchTimer = null;
        }
      }
    };

    const handleBlur = () => {
      // Window lost focus (less strict than tab switch)
      if (!document.hidden) {
        console.log('Window lost focus (may be normal user behavior)');
      }
    };

    // Listen for visibility changes (tab switches)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [activeSession]);

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

  // Auto-submit with safe wait time for data integrity
  const handleAutoSubmitOnTimeout = async () => {
    const startTime = Date.now();

    console.log(`⏰ AUTO-SUBMIT TRIGGERED: Time limit reached for exam ${activeSession?.examId}`);

    if (hasPendingSaves()) {
      toast({
        title: "Time's Up!",
        description: "Saving your final answers before submitting...",
      });

      const maxWaitTime = 3000;
      const checkInterval = 100;
      let waitTime = 0;

      const checkSaves = () => {
        if (!hasPendingSaves()) {
          const totalWaitTime = Date.now() - startTime;
          console.log(`✅ All pending saves completed in ${totalWaitTime}ms, submitting exam`);
          toast({
            title: "Submitting Exam",
            description: "All answers saved successfully. Submitting exam...",
          });
          forceSubmitExam();
        } else if (waitTime >= maxWaitTime) {
          const totalWaitTime = Date.now() - startTime;
          console.warn(`⚠️ Force submit after ${totalWaitTime}ms wait - some answers may still be saving`);
          toast({
            title: "Submitting Exam",
            description: "Time limit exceeded. Submitting exam now...",
            variant: "destructive",
          });
          forceSubmitExam();
        } else {
          waitTime += checkInterval;
          if (waitTime % 500 === 0) {
            console.log(`Waiting for ${pendingSaves.size} answer(s) to save... (${waitTime}ms elapsed)`);
          }
          setTimeout(checkSaves, checkInterval);
        }
      };

      checkSaves();
    } else {
      console.log(`✅ No pending saves, immediate submit`);
      toast({
        title: "Time's Up!",
        description: "Time limit reached. Submitting exam...",
        variant: "destructive",
      });
      forceSubmitExam();
    }
  };

  // Start exam mutation
  const startExamMutation = useMutation({
    mutationFn: async (examId: number) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('🎯 Starting exam with ID:', examId, 'for student:', user.id);

      const response = await apiRequest('POST', '/api/exam-sessions', {
        examId: examId,
        studentId: user.id,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Exam start failed with status:', response.status, 'Response:', errorText);

        let errorMessage = 'Failed to start exam';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const sessionData = await response.json();
      console.log('✅ Exam session response:', sessionData);
      return sessionData;
    },
    onSuccess: (session: ExamSession) => {
      console.log('✅ Exam session created successfully:', session);

      if (!session || !session.id) {
        console.error('❌ Invalid session data received:', session);
        toast({
          title: "Error",
          description: "Invalid session data received. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setActiveSession(session);
      setCurrentQuestionIndex(0);
      setAnswers({}); // Clear any previous answers
      setTabSwitchCount(0); // Reset tab switch counter

      // Set timer if exam has time limit
      const exam = exams.find(e => e.id === session.examId);
      if (exam?.timeLimit) {
        const timeInSeconds = exam.timeLimit * 60;
        setTimeRemaining(timeInSeconds);
        console.log(`⏰ Timer set to ${exam.timeLimit} minutes (${timeInSeconds} seconds)`);
      } else {
        setTimeRemaining(null);
      }

      toast({
        title: "Exam Started Successfully!",
        description: "Good luck with your exam! Stay on this page during the exam.",
      });
    },
    onError: (error: Error) => {
      console.error('❌ Failed to start exam:', error);

      let errorMessage = error.message || "Unable to start exam. Please try again.";

      // Handle specific error cases
      if (error.message.includes('already has an active session')) {
        errorMessage = "You already have an active exam session. Please contact your instructor if you believe this is an error.";
      } else if (error.message.includes('not published')) {
        errorMessage = "This exam is not yet available. Please check with your instructor.";
      } else if (error.message.includes('not authenticated')) {
        errorMessage = "Please log in again to start the exam.";
      }

      toast({
        title: "Unable to Start Exam",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Enhanced submit answer mutation with robust error handling and automatic retries
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

      console.log(`📝 Submitting answer for question ${questionId}:`, answerData);

      // Enhanced retry logic with exponential backoff
      let lastError: Error | null = null;
      const maxRetries = 3;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Add delay for retry attempts (exponential backoff)
          if (attempt > 0) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
            console.log(`🔄 Retry attempt ${attempt} for question ${questionId} after ${delay}ms delay`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          const response = await apiRequest('POST', '/api/student-answers', answerData);

          if (!response.ok) {
            let errorMessage = `Failed to submit answer (${response.status})`;
            let shouldRetry = false;

            try {
              const errorData = await response.json();
              if (errorData?.message) {
                errorMessage = errorData.message;
              } else if (errorData?.errors) {
                // Handle Zod validation errors
                errorMessage = Array.isArray(errorData.errors) 
                  ? errorData.errors.map((e: any) => e.message).join(', ')
                  : 'Validation failed';
              }
              console.error(`❌ Answer submission failed for question ${questionId} (attempt ${attempt + 1}):`, errorData);
            } catch (parseError) {
              console.error(`❌ Failed to parse error response for question ${questionId}:`, parseError);

              // Provide more specific error messages based on status code
              if (response.status === 401) {
                errorMessage = 'Your session has expired. Please refresh the page and log in again.';
              } else if (response.status === 403) {
                errorMessage = 'Permission denied. Please contact your instructor.';
              } else if (response.status === 408 || response.status === 504) {
                errorMessage = 'Request timeout. Retrying...';
                shouldRetry = true;
              } else if (response.status >= 500) {
                errorMessage = 'Server error occurred. Retrying...';
                shouldRetry = true;
              } else if (response.status === 429) {
                errorMessage = 'Too many requests. Retrying...';
                shouldRetry = true;
              } else if (response.status === 0) {
                errorMessage = 'Unable to connect to server. Retrying...';
                shouldRetry = true;
              } else {
                errorMessage = `Server error (${response.status}). Please try again.`;
              }
            }

            const error = new Error(errorMessage);
            lastError = error;

            // Determine if we should retry based on error type
            if (response.status === 401 || response.status === 403 || response.status === 404) {
              // Don't retry auth errors or not found
              throw error;
            } else if ((response.status >= 500 || response.status === 429 || response.status === 408 || response.status === 504) && attempt < maxRetries) {
              // Retry server errors, rate limits, and timeouts
              shouldRetry = true;
              continue;
            } else {
              // Last attempt or non-retryable error
              throw error;
            }
          }

          try {
            const result = await response.json();
            console.log(`✅ Answer submitted successfully for question ${questionId} (attempt ${attempt + 1}):`, result);
            return result;
          } catch (parseError) {
            console.error(`❌ Failed to parse success response for question ${questionId}:`, parseError);
            const error = new Error('Invalid response from server. Please try again.');
            lastError = error;

            if (attempt < maxRetries) {
              continue; // Retry JSON parsing errors
            }
            throw error;
          }
        } catch (networkError: any) {
          console.error(`❌ Network error for question ${questionId} (attempt ${attempt + 1}):`, networkError);
          lastError = networkError;

          // Check if it's a network/timeout error that should be retried
          if ((networkError.name === 'TypeError' || 
               networkError.name === 'AbortError' || 
               networkError.message?.includes('fetch') ||
               networkError.message?.includes('network') ||
               networkError.message?.includes('timeout')) && 
               attempt < maxRetries) {
            continue; // Retry network errors
          }

          // Last attempt or non-retryable error
          throw new Error('Network connection failed. Please check your internet connection and try again.');
        }
      }

      // If we get here, all retries failed
      throw lastError || new Error('Failed to submit answer after multiple attempts');
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
      let shouldAutoRetry = false;

      console.error(`❌ Answer save failed for question ${variables.questionId}:`, error.message);

      // Handle specific error types
      if (error.message.includes('Please select') || error.message.includes('Please enter')) {
        // Validation errors - don't show toast, user can see status indicator
        shouldShowToast = false;
      } else if (error.message.includes('session has expired') || error.message.includes('Session expired') || error.message.includes('Authentication') || error.message.includes('401')) {
        userFriendlyMessage = "Your session has expired. Please refresh the page and log in again.";
        // Don't auto-retry for authentication issues
      } else if (error.message.includes('Unable to connect') || error.message.includes('Network connection failed') || error.message.includes('internet connection')) {
        userFriendlyMessage = "Connection lost. Answer saved locally and will sync when online.";
        shouldAutoRetry = true;
      } else if (error.message.includes('timeout') || error.message.includes('Request timeout') || error.message.includes('Retrying')) {
        userFriendlyMessage = "Connection slow. Answer will be saved automatically.";
        shouldAutoRetry = true;
        shouldShowToast = false; // Don't spam with timeout messages
      } else if (error.message.includes('Server error') || error.message.includes('500') || error.message.includes('after multiple attempts')) {
        userFriendlyMessage = "Server issue. Click retry or answer will be saved automatically.";
        shouldAutoRetry = true;
      } else if (error.message.includes('403') || error.message.includes('Permission denied')) {
        userFriendlyMessage = "Permission denied. Please contact your instructor.";
      } else if (error.message.includes('Invalid response') || error.message.includes('Server communication error')) {
        userFriendlyMessage = "Connection issue. Answer will be retried automatically.";
        shouldAutoRetry = true;
        shouldShowToast = false; // Don't spam with communication errors
      } else if (error.message.includes('Too many requests')) {
        userFriendlyMessage = "Server busy. Answer will be saved shortly.";
        shouldAutoRetry = true;
        shouldShowToast = false;
      }

      if (shouldShowToast) {
        toast({
          title: "Answer Save Issue",
          description: userFriendlyMessage,
          variant: "destructive",
        });
      }

      // Enhanced auto-retry for recoverable errors with better backoff
      if (shouldAutoRetry && answers[variables.questionId] && isOnline) {
        // Get current retry count from failed saves
        const retryCount = Object.values(questionSaveStatus).filter(status => status === 'failed').length;
        const retryDelay = Math.min(1000 * Math.pow(1.5, retryCount), 15000); // Max 15 seconds

        console.log(`🔄 Auto-retrying question ${variables.questionId} in ${retryDelay}ms (retry count: ${retryCount})`);

        setTimeout(() => {
          if (isOnline && answers[variables.questionId]) {
            handleRetryAnswer(variables.questionId, variables.questionType);
          }
        }, retryDelay);
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
      let shouldResetSession = false;

      // Check for specific error types that can happen with synchronous submission
      if (error.message.includes('already submitted') || error.message.includes('Exam already submitted')) {
        errorTitle = "Already Submitted";
        errorDescription = "This exam has already been submitted. Redirecting to results...";
        shouldResetSession = true;

        // Try to get existing results
        setTimeout(() => {
          setActiveSession(null);
          setAnswers({});
          setTimeRemaining(null);
          setCurrentQuestionIndex(0);
          setSelectedExam(null);
        }, 2000);

      } else if (error.message.includes('No active exam session') || error.message.includes('Session not found')) {
        errorTitle = "Session Expired";
        errorDescription = "Your exam session has expired. Please start the exam again.";
        shouldResetSession = true;

        setTimeout(() => {
          setActiveSession(null);
          setAnswers({});
          setTimeRemaining(null);
          setCurrentQuestionIndex(0);
          setSelectedExam(null);
        }, 2000);

      } else if (error.message.includes('Server error') || error.message.includes('Failed to submit exam')) {
        errorTitle = "Server Error";
        errorDescription = "A server error occurred. Your answers are saved. Please try submitting again.";
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        errorTitle = "Connection Error";
        errorDescription = "Network connection failed. Please check your internet connection and try again.";
      } else if (error.message.includes('timeout')) {
        errorTitle = "Request Timeout";
        errorDescription = "The submission request timed out. Your answers are saved. Please try again.";
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: shouldResetSession ? "default" : "destructive",
      });
    },
  });

  const handleStartExam = (exam: Exam) => {
    console.log('🎯 Starting exam:', exam.name, 'ID:', exam.id);

    // Comprehensive validation checks
    if (!exam.id) {
      console.error('❌ Invalid exam - missing ID:', exam);
      toast({
        title: "Error",
        description: "Invalid exam selected. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      console.error('❌ User not authenticated:', user);
      toast({
        title: "Authentication Required", 
        description: "Please log in again to start the exam.",
        variant: "destructive",
      });
      return;
    }

    if (!exam.isPublished) {
      console.error('❌ Exam not published:', exam);
      toast({
        title: "Exam Not Available",
        description: "This exam is not yet published. Please check with your instructor.",
        variant: "destructive",
      });
      return;
    }

    // Check if already has an active session
    if (activeSession && !activeSession.isCompleted) {
      console.warn('⚠️ Student already has active session:', activeSession);
      toast({
        title: "Active Session Detected",
        description: "You already have an active exam session. Complete it first before starting a new exam.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ All validation checks passed, starting exam...');
    setSelectedExam(exam);
    startExamMutation.mutate(exam.id);
  };

  const handleAnswerChange = (questionId: number, answer: any, questionType: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));

    // Only submit if answer is meaningful (not empty) and different from previous
    const validation = validateAnswer(questionType, answer);
    if (validation.isValid) {
      // Check if this is actually a new/changed answer to avoid duplicate submissions
      const existingAnswer = existingAnswers.find(a => a.questionId === questionId);
      const isNewAnswer = !existingAnswer || 
        (questionType === 'multiple_choice' ? existingAnswer.selectedOptionId !== answer : existingAnswer.textAnswer !== answer);

      if (isNewAnswer) {
        submitAnswerMutation.mutate({ questionId, answer, questionType });
      }
    }
  };

  // Save session progress periodically
  useEffect(() => {
    if (activeSession && timeRemaining !== null) {
      const interval = setInterval(() => {
        if (activeSession.id) {
          apiRequest('PATCH', `/api/exam-sessions/${activeSession.id}/progress`, {
            currentQuestionIndex,
            timeRemaining
          }).catch(error => {
            console.warn('Failed to save session progress:', error);
          });
        }
      }, 30000); // Save every 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeSession, currentQuestionIndex, timeRemaining]);

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
    if (isSubmitting || isScoring) {
      console.log('🔄 Submit already in progress, skipping duplicate submission');
      return;
    }

    console.log('🚀 FORCE SUBMIT: Starting exam submission...');
    setIsSubmitting(true);

    try {
      await submitExamMutation.mutateAsync();
      console.log('✅ FORCE SUBMIT: Exam submitted successfully');
    } catch (error) {
      console.error('❌ FORCE SUBMIT: Failed to submit exam:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit exam. Please try again or contact your instructor.",
        variant: "destructive",
      });
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
            <span className="text-xs">Saved ✓</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center space-x-1 text-red-500 animate-pulse">
            <AlertCircle className="w-3 h-3" />
            <span className="text-xs">Save Failed</span>
          </div>
        );
      default:
        return hasAnswer ? (
          <div className="flex items-center space-x-1 text-amber-600">
            <Circle className="w-3 h-3 fill-current" />
            <span className="text-xs">Ready to save</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 text-gray-400">
            <HelpCircle className="w-3 h-3" />
            <span className="text-xs">No answer</span>
          </div>
        );
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
          {/* Network Status Warning Banner */}
          {!isOnline && (
            <div className="bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500 p-4 mb-4" data-testid="alert-network-offline">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    No Internet Connection
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Your answers are being saved locally and will sync when connection is restored.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Switch Warning Banner */}
          {showTabSwitchWarning && (
            <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-4" data-testid="alert-tab-switch">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Tab Switch Detected ({tabSwitchCount}/3 warnings)
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Please remain on the exam page. Multiple tab switches may be flagged for review.
                  </p>
                </div>
              </div>
            </div>
          )}
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
                  {/* Professional Exam Progress Indicator */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                      <span>Progress</span>
                      <span>{Math.round((Object.keys(answers).length / examQuestions.length) * 100)}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(Object.keys(answers).length / examQuestions.length) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {Object.keys(answers).length} of {examQuestions.length} questions answered
                    </div>
                  </div>

                  {/* Enhanced Timer Display */}
                  {timeRemaining !== null && (
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Time Remaining</span>
                        <div className="flex items-center space-x-2">
                          <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          {!isOnline && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Offline - answers saved locally" />
                          )}
                          {isOnline && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="Online - answers syncing" />
                          )}
                        </div>
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
                      {!isOnline && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
                          📡 Offline mode - answers will sync when online
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
                    onClick={() => {
                      const unanswered = examQuestions.length - Object.keys(answers).length;
                      if (unanswered > 0) {
                        const confirmed = window.confirm(
                          `You have ${unanswered} unanswered questions. Are you sure you want to submit your exam?`
                        );
                        if (!confirmed) return;
                      }
                      handleSubmitExam();
                    }}
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
                        className="text-xs"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Retry Save
                      </Button>
                    )}
                    {!isOnline && (
                      <div className="flex items-center space-x-1 text-orange-500 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>Offline</span>
                      </div>
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
                    onClick={() => {
                      // Save current answer before navigating
                      const currentAnswer = answers[currentQuestion.id];
                      if (currentAnswer && validateAnswer(currentQuestion.questionType, currentAnswer).isValid) {
                        const existingAnswer = existingAnswers.find(a => a.questionId === currentQuestion.id);
                        const isNewAnswer = !existingAnswer || 
                          (currentQuestion.questionType === 'multiple_choice' ? existingAnswer.selectedOptionId !== currentAnswer : existingAnswer.textAnswer !== currentAnswer);

                        if (isNewAnswer) {
                          submitAnswerMutation.mutate({ 
                            questionId: currentQuestion.id, 
                            answer: currentAnswer, 
                            questionType: currentQuestion.questionType 
                          });
                        }
                      }
                      setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
                    }}
                    disabled={currentQuestionIndex === 0}
                    data-testid="button-previous"
                  >
                    Previous
                  </Button>

                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{currentQuestionIndex + 1} of {examQuestions.length}</span>
                    {hasPendingSaves() && (
                      <div className="flex items-center space-x-1 text-blue-500">
                        <Loader className="w-3 h-3 animate-spin" />
                        <span>Saving...</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      // Save current answer before navigating
                      const currentAnswer = answers[currentQuestion.id];
                      if (currentAnswer && validateAnswer(currentQuestion.questionType, currentAnswer).isValid) {
                        const existingAnswer = existingAnswers.find(a => a.questionId === currentQuestion.id);
                        const isNewAnswer = !existingAnswer || 
                          (currentQuestion.questionType === 'multiple_choice' ? existingAnswer.selectedOptionId !== currentAnswer : existingAnswer.textAnswer !== currentAnswer);

                        if (isNewAnswer) {
                          submitAnswerMutation.mutate({ 
                            questionId: currentQuestion.id, 
                            answer: currentAnswer, 
                            questionType: currentQuestion.questionType 
                          });
                        }
                      }
                      setCurrentQuestionIndex(prev => Math.min(examQuestions.length - 1, prev + 1));
                    }}
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
              <div className="col-span-full text-center py-8">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Loading exams...</span>
                </div>
              </div>
            ) : examsError ? (
              <div className="col-span-full text-center py-8">
                <div className="text-red-600 mb-2">Failed to load exams</div>
                <div className="text-sm text-muted-foreground">
                  {examsError instanceof Error ? examsError.message : 'Unknown error occurred'}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
            ) : exams.filter(exam => exam.isPublished).length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <div className="mb-2">No exams available at the moment.</div>
                {exams.length > 0 && (
                  <div className="text-sm text-yellow-600">
                    {exams.length} exam(s) found but not yet published
                  </div>
                )}
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
                          disabled={startExamMutation.isPending || !exam.isPublished}
                          className="flex-1"
                          data-testid={`button-start-exam-${exam.id}`}
                        >
                          {startExamMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Starting...
                            </>
                          ) : !exam.isPublished ? (
                            <>
                              <Clock className="w-4 h-4 mr-2" />
                              Not Available
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Start Exam
                            </>
                          )}
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
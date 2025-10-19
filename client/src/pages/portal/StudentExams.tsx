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
import { Clock, BookOpen, Trophy, Play, Eye, CheckCircle, XCircle, Timer, Save, RotateCcw, AlertCircle, Loader, FileText, Circle, CheckCircle2, HelpCircle, ClipboardCheck, GraduationCap, Award, Calendar } from 'lucide-react';
import type { Exam, ExamSession, ExamQuestion, QuestionOption, StudentAnswer } from '@shared/schema';
import schoolLogo from '@assets/1000025432-removebg-preview (1)_1757796555126.png';
import RequireCompleteProfile from '@/components/RequireCompleteProfile';

// Constants for violation tracking and penalties
const MAX_VIOLATIONS_BEFORE_PENALTY = 3;
const PENALTY_PER_VIOLATION = 5;
const MAX_PENALTY = 20; // System never reduces score below Test 40 base

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
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Per-question save status tracking
  const [questionSaveStatus, setQuestionSaveStatus] = useState<Record<number, QuestionSaveStatus>>({});
  const [pendingSaves, setPendingSaves] = useState<Set<number>>(new Set());
  const saveTimeoutsRef = useRef<Record<number, NodeJS.Timeout>>({});

  // Tab switch detection state
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  const tabSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [violationPenalty, setViolationPenalty] = useState(0); // State for penalty calculation

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

  // PERFORMANCE: Use bulk endpoint to fetch all question options in single request
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
              // Restore tab switch count and penalty if they were saved in metadata
              if (metadata.tabSwitchCount !== undefined) {
                setTabSwitchCount(metadata.tabSwitchCount);
                const calculatedPenalty = calculateViolationPenalty(metadata.tabSwitchCount);
                setViolationPenalty(calculatedPenalty);
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
      Object.values(debounceTimersRef.current).forEach(timeout => clearTimeout(timeout));
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

              // Update penalty based on new count
              const calculatedPenalty = calculateViolationPenalty(newCount);
              setViolationPenalty(calculatedPenalty);

              if (newCount <= MAX_VIOLATIONS_BEFORE_PENALTY) {
                setShowTabSwitchWarning(true);

                // Auto-hide warning after 5 seconds
                if (tabSwitchTimeoutRef.current) clearTimeout(tabSwitchTimeoutRef.current);
                tabSwitchTimeoutRef.current = setTimeout(() => {
                  setShowTabSwitchWarning(false);
                }, 5000);

                toast({
                  title: "Tab Switch Detected",
                  description: `Warning ${newCount}/${MAX_VIOLATIONS_BEFORE_PENALTY}: Please stay on the exam page. Excessive tab switching may be reported to your instructor.`,
                  variant: "destructive",
                });
              } else {
                // After max warnings, just log silently
                console.warn(`Tab switch detected: ${newCount} times`);
                // Optionally show a persistent warning if penalty is applied
                if (calculatedPenalty > 0) {
                  setShowTabSwitchWarning(true);
                }
              }

              // Save tab switch count and penalty to session metadata if possible
              if (activeSession?.id) {
                apiRequest('PATCH', `/api/exam-sessions/${activeSession.id}/metadata`, {
                  metadata: JSON.stringify({
                    ...JSON.parse(activeSession.metadata || '{}'),
                    tabSwitchCount: newCount,
                    violationPenalty: calculatedPenalty
                  })
                }).catch(error => console.warn('Failed to save tab switch metadata:', error));
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
  }, [activeSession, tabSwitchCount]); // Add tabSwitchCount to dependency array

  // Function to calculate violation penalty
  const calculateViolationPenalty = (violations: number): number => {
    if (violations === 0) return 0;
    const penalty = violations * PENALTY_PER_VIOLATION;
    return Math.min(penalty, MAX_PENALTY);
  };

  // Client-side answer validation - relaxed for better UX
  const validateAnswer = (questionType: string, answer: any): { isValid: boolean; error?: string } => {
    if (questionType === 'multiple_choice') {
      // Allow any truthy value for MC questions
      if (answer === null || answer === undefined || answer === '') {
        return { isValid: false, error: 'Please select an option' };
      }
      return { isValid: true };
    }

    if (questionType === 'text' || questionType === 'essay') {
      // Only validate that answer exists and is a string
      if (answer === null || answer === undefined) {
        return { isValid: false, error: 'Please enter an answer' };
      }
      if (typeof answer !== 'string') {
        return { isValid: false, error: 'Invalid answer format' };
      }
      // Allow even single character answers for auto-save
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
      });

      if (!response.ok) {
        let errorMessage = 'Failed to start exam';
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            const errorText = await response.text();
            console.error('❌ Non-JSON error response:', errorText);
            errorMessage = 'Server error - please try again';
          }
        } catch (parseError) {
          console.error('❌ Error parsing response:', parseError);
          errorMessage = 'Server error - please try again';
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
      setViolationPenalty(0); // Reset penalty

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

      console.error(`❌ Answer save failed for question ${variables.questionId}:`, error.message);

      // Determine error category and response
      let shouldShowToast = false;
      let shouldAutoRetry = false;
      let userFriendlyMessage = error.message;

      // Network/Connection errors - auto-retry silently
      if (error.message.includes('fetch') || error.message.includes('Network') || 
          error.message.includes('timeout') || error.message.includes('500')) {
        shouldAutoRetry = true;
        console.log(`🔄 Network issue detected, will auto-retry question ${variables.questionId}`);
      }
      // Authentication errors - show to user
      else if (error.message.includes('401') || error.message.includes('session') || 
               error.message.includes('Authentication')) {
        shouldShowToast = true;
        userFriendlyMessage = "Session expired. Please refresh the page.";
      }
      // Permission errors - show to user
      else if (error.message.includes('403') || error.message.includes('Permission')) {
        shouldShowToast = true;
        userFriendlyMessage = "Permission denied. Contact your instructor.";
      }
      // Validation errors - silent (user sees status indicator)
      else if (error.message.includes('Please select') || error.message.includes('Please enter') ||
               error.message.includes('validation') || error.message.includes('Invalid')) {
        console.log(`Validation issue for question ${variables.questionId}, showing status only`);
      }
      // Unknown errors - show after multiple failures
      else {
        const failCount = Object.values(questionSaveStatus).filter(s => s === 'failed').length;
        if (failCount > 2) {
          shouldShowToast = true;
          userFriendlyMessage = "Having trouble saving. Please check your connection.";
        } else {
          shouldAutoRetry = true;
        }
      }

      if (shouldShowToast) {
        toast({
          title: "Save Error",
          description: userFriendlyMessage,
          variant: "destructive",
        });
      }

      // Auto-retry logic for recoverable errors
      if (shouldAutoRetry && answers[variables.questionId] && isOnline) {
        const retryDelay = 2000; // 2 second delay for retries
        console.log(`🔄 Retrying question ${variables.questionId} in ${retryDelay}ms`);

        setTimeout(() => {
          if (isOnline && answers[variables.questionId]) {
            handleRetryAnswer(variables.questionId, variables.questionType);
          }
        }, retryDelay);
      }
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

        // Handle different submission scenarios
        let toastTitle = "Exam Submitted Successfully!";
        if (data.alreadySubmitted) {
          toastTitle = "Previous Results Retrieved";
        } else if (data.timedOut) {
          toastTitle = "Exam Submitted (Time Limit Exceeded)";
        }

        toast({
          title: toastTitle,
          description: data.message || `Your Score: ${score}/${maxScore} (${percentage}%)`,
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

      // Check if error is HTML response (server crash)
      if (error.message.includes('<!DOCTYPE') || error.message.includes('Unexpected token') || error.message.includes('JSON')) {
        errorTitle = "Server Error";
        errorDescription = "The server encountered an error while processing your submission. Your answers have been saved. Please try submitting again.";
        console.error('🔥 Server returned HTML instead of JSON - critical backend error');
      }
      // Check for specific error types that can happen with synchronous submission
      else if (error.message.includes('already submitted') || error.message.includes('Exam already submitted')) {
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
        errorDescription = "Your exam session has expired or could not be found. Please start the exam again.";
        shouldResetSession = true;

        setTimeout(() => {
          setActiveSession(null);
          setAnswers({});
          setTimeRemaining(null);
          setCurrentQuestionIndex(0);
          setSelectedExam(null);
        }, 2000);

      } else if (error.message.includes('Server error') || error.message.includes('Failed to submit exam') || error.message.includes('500')) {
        errorTitle = "Server Error";
        errorDescription = "A server error occurred. Your answers are saved. Please try submitting again in a moment.";
      } else if (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
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
        duration: 8000, // Show longer for critical errors
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

    // Pre-flight check: confirm exam has questions
    toast({
      title: "Starting Exam",
      description: "Preparing exam session, please wait...",
    });

    console.log('✅ All validation checks passed, starting exam...');
    setSelectedExam(exam);

    // Reset all state for clean start
    setAnswers({});
    setCurrentQuestionIndex(0);
    setTimeRemaining(null);
    setTabSwitchCount(0); // Reset tab switch counter
    setViolationPenalty(0); // Reset penalty
    setQuestionSaveStatus({});
    setPendingSaves(new Set());
    setShowTabSwitchWarning(false); // Hide any previous warnings

    startExamMutation.mutate(exam.id);
  };

  // Debounce timer ref for answer changes
  const debounceTimersRef = useRef<Record<number, NodeJS.Timeout>>({});

  const handleAnswerChange = (questionId: number, answer: any, questionType: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));

    // Clear existing debounce timer for this question
    if (debounceTimersRef.current[questionId]) {
      clearTimeout(debounceTimersRef.current[questionId]);
    }

    // Immediately mark as ready to save (visual feedback)
    setQuestionSaveStatus(prev => ({ ...prev, [questionId]: 'idle' }));

    // Debounce the actual save (500ms delay for typing)
    debounceTimersRef.current[questionId] = setTimeout(() => {
      const validation = validateAnswer(questionType, answer);
      if (validation.isValid) {
        // Check if this is actually a new/changed answer
        const existingAnswer = existingAnswers.find(a => a.questionId === questionId);
        const isNewAnswer = !existingAnswer || 
          (questionType === 'multiple_choice' ? existingAnswer.selectedOptionId !== answer : existingAnswer.textAnswer !== answer);

        if (isNewAnswer) {
          console.log(`💾 Auto-saving answer for question ${questionId}:`, answer);
          submitAnswerMutation.mutate({ questionId, answer, questionType });
        }
      }
    }, 500); // 500ms debounce for text input, instant for MC
  };

  // Save session progress periodically
  useEffect(() => {
    if (activeSession && timeRemaining !== null) {
      const interval = setInterval(() => {
        if (activeSession.id) {
          apiRequest('PATCH', `/api/exam-sessions/${activeSession.id}/progress`, {
            currentQuestionIndex,
            timeRemaining,
            tabSwitchCount, // Save tab switch count and penalty
            violationPenalty
          }).catch(error => {
            console.warn('Failed to save session progress:', error);
          });
        }
      }, 30000); // Save every 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeSession, currentQuestionIndex, timeRemaining, tabSwitchCount, violationPenalty]);

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
    setTabSwitchCount(0);
    setViolationPenalty(0);
    setQuestionSaveStatus({});
    setPendingSaves(new Set());
    setShowTabSwitchWarning(false);
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
      toast({
        title: "Please Wait",
        description: "Some answers are still being saved. Please wait a moment before submitting.",
        variant: "default",
      });
      return;
    }

    console.log('🚀 User clicked Submit Exam button');
    setIsSubmitting(true);
    
    try {
      await submitExamMutation.mutateAsync();
      console.log('✅ Submission completed successfully');
    } catch (error) {
      console.error('❌ Submission failed:', error);
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

  // Render active exam without PortalLayout wrapper
  if (activeSession && examQuestions.length > 0) {
    return (
      <RequireCompleteProfile feature="exams">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Warning Banners */}
          {(showTabSwitchWarning || !isOnline) && (
            <div className="sticky top-0 z-40 space-y-2 p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b shadow-sm">
              {showTabSwitchWarning && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r-lg p-3 flex items-center gap-3 text-yellow-800 dark:text-yellow-200 shadow-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">
                      {tabSwitchCount <= MAX_VIOLATIONS_BEFORE_PENALTY 
                        ? `Warning ${tabSwitchCount}/${MAX_VIOLATIONS_BEFORE_PENALTY}`
                        : `Penalty Applied: -${violationPenalty} marks`
                      }
                    </p>
                    <p className="text-xs mt-0.5">Please stay on the exam page to avoid penalties</p>
                  </div>
                </div>
              )}
              {!isOnline && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg p-3 flex items-center gap-3 text-red-800 dark:text-red-200 shadow-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Connection Lost</p>
                    <p className="text-xs mt-0.5">Your answers are being saved locally and will sync when connection is restored</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Simple Exam Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 border-b border-blue-800 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={schoolLogo} 
                    alt="Treasure-Home School" 
                    className="h-10 w-10 object-contain bg-white rounded-full p-1"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-white">Treasure-Home School</h2>
                    <p className="text-xs text-blue-100">Online Examination Portal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Exam Content */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Small Progress Indicator */}
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Question {currentQuestionIndex + 1} of {examQuestions.length}
                  </span>
                  {timeRemaining !== null && (
                    <span className={`text-sm font-medium ${timeRemaining > 300 ? 'text-gray-700 dark:text-gray-300' : timeRemaining > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      <Clock className="w-4 h-4 inline mr-1" />
                      {formatTime(timeRemaining)}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {Object.keys(answers).length} answered
                </span>
              </div>
            </div>

            {/* Question Card */}
            {currentQuestion && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-700 shadow-md p-8 mb-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Question {currentQuestionIndex + 1}
                    </h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {currentQuestion.points} points
                    </span>
                  </div>
                  <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed">
                    {currentQuestion.questionText}
                  </p>
                </div>

                {/* Multiple Choice Options */}
                {currentQuestion.questionType === 'multiple_choice' && (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value, 'multiple_choice')}
                    className="space-y-3"
                  >
                    {questionOptions.map((option: any, index: number) => (
                      <div
                        key={option.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          answers[currentQuestion.id] === String(option.id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem
                            value={String(option.id)}
                            id={`option-${option.id}`}
                            className="mt-1"
                            data-testid={`option-${index}`}
                          />
                          <Label
                            htmlFor={`option-${option.id}`}
                            className="cursor-pointer flex-1 text-base text-gray-700 dark:text-gray-300"
                          >
                            {String.fromCharCode(65 + index)}. {option.optionText}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* Text/Essay Answer */}
                {(currentQuestion.questionType === 'text' || currentQuestion.questionType === 'essay') && (
                  <Textarea
                    placeholder="Type your answer here..."
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value, currentQuestion.questionType)}
                    rows={currentQuestion.questionType === 'essay' ? 10 : 5}
                    className="text-base"
                    data-testid="text-answer"
                  />
                )}

                {/* Save Status */}
                {questionSaveStatus[currentQuestion.id] === 'saving' && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </div>
                )}
                {questionSaveStatus[currentQuestion.id] === 'saved' && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Saved
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  const currentAnswer = answers[currentQuestion.id];
                  if (currentAnswer && validateAnswer(currentQuestion.questionType, currentAnswer).isValid) {
                    const existingAnswer = existingAnswers.find(a => a.questionId === currentQuestion.id);
                    const isNewAnswer = !existingAnswer || 
                      (currentQuestion.questionType === 'multiple_choice' ? existingAnswer.selectedOptionId !== currentAnswer : existingAnswer.textAnswer !== currentAnswer);
                    if (isNewAnswer) {
                      submitAnswerMutation.mutate({ questionId: currentQuestion.id, answer: currentAnswer, questionType: currentQuestion.questionType });
                    }
                  }
                  setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
                }}
                disabled={currentQuestionIndex === 0}
                className="px-6 border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-950"
                data-testid="button-previous"
              >
                ← Previous
              </Button>

              {currentQuestionIndex === examQuestions.length - 1 ? (
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={isSubmitting || hasPendingSaves() || isScoring}
                  className="px-6 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                  data-testid="button-submit-exam"
                >
                  {isScoring ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Exam
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    const currentAnswer = answers[currentQuestion.id];
                    if (currentAnswer && validateAnswer(currentQuestion.questionType, currentAnswer).isValid) {
                      const existingAnswer = existingAnswers.find(a => a.questionId === currentQuestion.id);
                      const isNewAnswer = !existingAnswer || 
                        (currentQuestion.questionType === 'multiple_choice' ? existingAnswer.selectedOptionId !== currentAnswer : existingAnswer.textAnswer !== currentAnswer);
                      if (isNewAnswer) {
                        submitAnswerMutation.mutate({ questionId: currentQuestion.id, answer: currentAnswer, questionType: currentQuestion.questionType });
                      }
                    }
                    setCurrentQuestionIndex(prev => Math.min(examQuestions.length - 1, prev + 1));
                  }}
                  disabled={currentQuestionIndex === examQuestions.length - 1}
                  className="px-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  data-testid="button-next"
                >
                  Next →
                </Button>
              )}
            </div>

            {/* Question Grid - Small and at bottom */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Quick Navigation</p>
              <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-2">
                {examQuestions.map((q, idx) => {
                  const isAnswered = answers[q.id];
                  const isCurrent = idx === currentQuestionIndex;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        const currentAnswer = answers[currentQuestion.id];
                        if (currentAnswer && validateAnswer(currentQuestion.questionType, currentAnswer).isValid) {
                          const existingAnswer = existingAnswers.find(a => a.questionId === currentQuestion.id);
                          const isNewAnswer = !existingAnswer || 
                            (currentQuestion.questionType === 'multiple_choice' ? existingAnswer.selectedOptionId !== currentAnswer : existingAnswer.textAnswer !== currentAnswer);
                          if (isNewAnswer) {
                            submitAnswerMutation.mutate({ questionId: currentQuestion.id, answer: currentAnswer, questionType: currentQuestion.questionType });
                          }
                        }
                        setCurrentQuestionIndex(idx);
                      }}
                      className={`h-8 w-8 rounded text-xs font-medium transition-colors ${
                        isCurrent 
                          ? 'bg-blue-600 text-white' 
                          : isAnswered 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600'
                      }`}
                      data-testid={`nav-question-${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Custom Submit Confirmation Dialog */}
          <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Submit Exam
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    You have answered <span className="font-bold text-blue-600 dark:text-blue-400">{Object.keys(answers).length}</span> out of <span className="font-bold text-blue-600 dark:text-blue-400">{examQuestions.length}</span> questions.
                  </p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Are you sure you want to submit your exam? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmitDialog(false)}
                  className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  data-testid="button-cancel-submit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowSubmitDialog(false);
                    handleSubmitExam();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
                  data-testid="button-confirm-submit"
                >
                  Yes, Submit
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </RequireCompleteProfile>
    );
  }

  // Render exam list and results with PortalLayout wrapper
  return (
    <RequireCompleteProfile feature="exams">
      {isScoring ? (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 border-b border-blue-800 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center space-x-3">
                <img 
                  src={schoolLogo} 
                  alt="Treasure-Home School" 
                  className="h-10 w-10 object-contain bg-white rounded-full p-1"
                />
                <div>
                  <h2 className="text-lg font-bold text-white">Treasure-Home School</h2>
                  <p className="text-xs text-blue-100">Online Examination Portal</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scoring Content */}
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 border border-blue-200 dark:border-blue-800">
              <Loader className="w-16 h-16 animate-spin mx-auto text-blue-600" />
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Scoring Your Exam</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Please wait while we calculate your results...</p>
              </div>
            </div>
          </div>
        </div>
      ) : /* Results Screen */
      showResults ? (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 border-b border-blue-800 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center space-x-3">
                <img 
                  src={schoolLogo} 
                  alt="Treasure-Home School" 
                  className="h-10 w-10 object-contain bg-white rounded-full p-1"
                />
                <div>
                  <h2 className="text-lg font-bold text-white">Treasure-Home School</h2>
                  <p className="text-xs text-blue-100">Exam Results</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Content */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Success Banner */}
            <div 
              className="bg-green-600 text-white p-4 rounded-lg flex items-center space-x-3 shadow-md"
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
              // Enhanced data structure to handle all response formats and show detailed feedback
              const normalizedResults = {
                score: examResults.totalScore || examResults.score || 0,
                maxScore: examResults.maxScore || 0,
                percentage: 0,
                pendingCount: examResults.pendingReview?.count || 0,
                correctAnswers: 0,
                wrongAnswers: 0,
                totalAnswered: 0,
                autoScoredQuestions: 0,
                submittedAt: examResults.submittedAt,
                breakdown: examResults.breakdown || null,
                questionDetails: examResults.questionDetails || [],
                hasDetailedResults: false
              };

              // Enhanced result parsing for better feedback
              if (examResults.immediateResults?.questions) {
                const questions = examResults.immediateResults.questions;
                normalizedResults.correctAnswers = questions.filter((q: any) => q.isCorrect === true).length;
                normalizedResults.wrongAnswers = questions.filter((q: any) => q.isCorrect === false).length;
                normalizedResults.totalAnswered = questions.length;
                normalizedResults.autoScoredQuestions = questions.filter((q: any) => q.autoScored !== false).length;
                normalizedResults.hasDetailedResults = true;
                normalizedResults.questionDetails = questions;
              } else if (examResults.breakdown) {
                // Use breakdown data if available
                normalizedResults.correctAnswers = examResults.breakdown.correctAnswers || 0;
                normalizedResults.wrongAnswers = examResults.breakdown.incorrectAnswers || 0;
                normalizedResults.totalAnswered = examResults.breakdown.totalQuestions || 0;
                normalizedResults.autoScoredQuestions = examResults.breakdown.autoScoredQuestions || 0;
                normalizedResults.hasDetailedResults = true;
              } else {
                // Fallback: calculate from exam questions if available
                if (examQuestions.length > 0) {
                  const mcQuestions = examQuestions.filter(q => q.questionType === 'multiple_choice');
                  normalizedResults.autoScoredQuestions = mcQuestions.length;
                  normalizedResults.totalAnswered = examQuestions.length;
                  // For display purposes, show estimated breakdown
                  const estimatedCorrect = Math.round((normalizedResults.score / normalizedResults.maxScore) * mcQuestions.length);
                  normalizedResults.correctAnswers = estimatedCorrect;
                  normalizedResults.wrongAnswers = mcQuestions.length - estimatedCorrect;
                }
              }

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
                      className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-4 rounded-lg shadow-sm"
                      role="status"
                      aria-live="polite"
                      data-testid="banner-provisional"
                    >
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1.5">
                            <Trophy className="w-4 h-4" />
                            Objective Questions Only
                          </p>
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
                    className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 dark:border-blue-600 p-4 rounded-lg shadow-sm my-6"
                    data-testid="banner-clarity"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                          Auto-Graded Results
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          This shows your score for multiple-choice questions only. Your teacher is reviewing your essay answers and will release your final grade soon.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Results Card */}
                  <Card className="bg-white dark:bg-gray-800 shadow-lg border-blue-200 dark:border-blue-800" data-testid="card-exam-results">
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
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                              <FileText className="w-3 h-3" />
                              Multiple-choice and automatic scoring only
                            </p>
                          </div>
                        </div>

                        {/* Enhanced Quick Stats */}
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Detailed Results</h3>

                          <div className="space-y-4">
                            {/* Correct Answers */}
                            <div className="flex items-center space-x-3" data-testid="stat-correct-answers">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
                              </div>
                              <div className="flex-1">
                                <span className="font-semibold text-green-600">Correct Answers: </span>
                                <span className="text-gray-900 text-lg font-bold" data-testid="value-correct-count">
                                  {normalizedResults.correctAnswers}
                                </span>
                                {normalizedResults.autoScoredQuestions > 0 && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    (out of {normalizedResults.autoScoredQuestions} auto-scored)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Wrong Answers */}
                            <div className="flex items-center space-x-3" data-testid="stat-wrong-answers">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
                              </div>
                              <div className="flex-1">
                                <span className="font-semibold text-red-600">Incorrect Answers: </span>
                                <span className="text-gray-900 text-lg font-bold" data-testid="value-wrong-count">
                                  {normalizedResults.wrongAnswers}
                                </span>
                                {normalizedResults.autoScoredQuestions > 0 && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    (out of {normalizedResults.autoScoredQuestions} auto-scored)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Auto-Scored Progress */}
                            {normalizedResults.autoScoredQuestions > 0 && (
                              <div className="flex items-center space-x-3" data-testid="stat-auto-scored">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <CheckCircle2 className="w-5 h-5 text-blue-600" aria-hidden="true" />
                                </div>
                                <div className="flex-1">
                                  <span className="font-semibold text-blue-600">Auto-Scored: </span>
                                  <span className="text-gray-900" data-testid="value-auto-scored-count">
                                    {normalizedResults.autoScoredQuestions} / {normalizedResults.totalAnswered} questions
                                  </span>
                                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full" 
                                      style={{
                                        width: `${normalizedResults.totalAnswered > 0 ? (normalizedResults.autoScoredQuestions / normalizedResults.totalAnswered) * 100 : 0}%`
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Performance Indicator */}
                            <div className="flex items-center space-x-3" data-testid="stat-performance">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                normalizedResults.percentage >= 80 ? 'bg-green-100' : 
                                normalizedResults.percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                              }`}>
                                <Trophy className={`w-5 h-5 ${
                                  normalizedResults.percentage >= 80 ? 'text-green-600' : 
                                  normalizedResults.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`} aria-hidden="true" />
                              </div>
                              <div>
                                <span className="font-semibold text-gray-700">Performance: </span>
                                <span className={`font-bold ${
                                  normalizedResults.percentage >= 80 ? 'text-green-600' : 
                                  normalizedResults.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`} data-testid="value-performance">
                                  {normalizedResults.percentage >= 80 ? 'Excellent!' : 
                                   normalizedResults.percentage >= 60 ? 'Good!' : 'Needs Improvement'}
                                </span>
                              </div>
                            </div>

                            {/* Time (if available) */}
                            <div className="flex items-center space-x-3" data-testid="stat-completion-time">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <Clock className="w-5 h-5 text-purple-600" aria-hidden="true" />
                              </div>
                              <div>
                                <span className="font-semibold text-purple-600">Completed: </span>
                                <span className="text-gray-900" data-testid="value-completion-time">
                                  {normalizedResults.submittedAt ? 
                                    new Date(normalizedResults.submittedAt).toLocaleString() : 
                                    'Just now'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    {/* Question-by-Question Breakdown */}
                    {normalizedResults.hasDetailedResults && normalizedResults.questionDetails.length > 0 && (
                      <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg" data-testid="section-question-breakdown">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Question-by-Question Results
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {normalizedResults.autoScoredQuestions} auto-scored
                          </Badge>
                        </div>

                        <div className="grid gap-3 max-h-64 overflow-y-auto">
                          {normalizedResults.questionDetails.map((questionResult: any, index: number) => (
                            <div 
                              key={index} 
                              className={`p-3 rounded-lg border-l-4 ${
                                questionResult.isCorrect === true 
                                  ? 'bg-green-50 border-green-400' 
                                  : questionResult.isCorrect === false
                                  ? 'bg-red-50 border-red-400'
                                  : 'bg-yellow-50 border-yellow-400'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-sm font-medium text-gray-700">
                                      Question {index + 1}
                                    </span>
                                    {questionResult.isCorrect === true && (
                                      <Badge variant="default" className="bg-green-600 text-white text-xs">
                                        ✓ Correct
                                      </Badge>
                                    )}
                                    {questionResult.isCorrect === false && (
                                      <Badge variant="destructive" className="text-xs">
                                        ✗ Incorrect
                                      </Badge>
                                    )}
                                    {questionResult.isCorrect === null && (
                                      <Badge variant="secondary" className="text-xs">
                                        ⏳ Manual Review
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="text-xs text-gray-600 space-y-1">
                                    <div>
                                      <span className="font-medium">Points:</span> 
                                      <span className="ml-1">
                                        {questionResult.pointsEarned || 0} / {questionResult.maxPoints || questionResult.points || 1}
                                      </span>
                                    </div>

                                    {questionResult.questionType && (
                                      <div>
                                        <span className="font-medium">Type:</span> 
                                        <span className="ml-1 capitalize">
                                          {questionResult.questionType.replace('_', ' ')}
                                        </span>
                                      </div>
                                    )}

                                    {questionResult.autoScored !== false && (
                                      <div className="text-blue-600">
                                        <span className="font-medium">✨ Auto-scored</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="ml-3">
                                  {questionResult.isCorrect === true && (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  )}
                                  {questionResult.isCorrect === false && (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                  )}
                                  {questionResult.isCorrect === null && (
                                    <Clock className="w-5 h-5 text-yellow-600" />
                                  )}
                                </div>
                              </div>

                              {questionResult.feedback && (
                                <div className="mt-2 p-2 bg-white rounded text-xs text-gray-700">
                                  <span className="font-medium">Feedback:</span> {questionResult.feedback}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>
                              <strong>{normalizedResults.correctAnswers}</strong> correct, 
                              <strong className="ml-1">{normalizedResults.wrongAnswers}</strong> incorrect
                            </span>
                            <span>
                              Auto-scored: <strong>{normalizedResults.autoScoredQuestions}</strong>/{normalizedResults.totalAnswered}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

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
      ) : (
        <PortalLayout
          userRole={getRoleName(user.roleId)}
          userName={user.firstName + ' ' + user.lastName}
          userInitials={user.firstName.charAt(0) + user.lastName.charAt(0)}
        >
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 rounded-xl p-6 shadow-lg">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              My Exams
            </h1>
            <p className="text-sm text-blue-50 mt-2">View and take your available examinations</p>
          </div>

          <div className="grid gap-5">
            {loadingExams ? (
              <Card className="shadow-sm border-blue-100 dark:border-blue-900">
                <CardContent className="text-center py-12">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Loading exams...</span>
                  </div>
                </CardContent>
              </Card>
            ) : examsError ? (
              <Card className="shadow-sm border-red-100 dark:border-red-900">
                <CardContent className="text-center py-12">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                  <div className="text-red-600 font-semibold mb-2">Failed to load exams</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {examsError instanceof Error ? examsError.message : 'Unknown error occurred'}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reload Page
                  </Button>
                </CardContent>
              </Card>
            ) : exams.filter(exam => exam.isPublished).length === 0 ? (
              <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                <CardContent className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">No exams available</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Check back later for new examinations
                  </div>
                  {exams.length > 0 && (
                    <div className="text-sm text-yellow-600 dark:text-yellow-500 mt-3 flex items-center justify-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {exams.length} exam(s) found but not yet published
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              exams
                .filter(exam => exam.isPublished)
                .map((exam) => (
                  <Card 
                    key={exam.id}
                    className="group hover:shadow-md transition-all duration-200 border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700"
                    data-testid={`exam-card-${exam.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-green-500 hover:bg-green-600 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Available
                            </Badge>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {exam.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(exam.date).toLocaleDateString('en-US', { 
                              weekday: 'short',
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <GraduationCap className="h-10 w-10 text-blue-100 dark:text-blue-900 group-hover:text-blue-200 dark:group-hover:text-blue-800 transition-colors" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-5 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Trophy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Total Marks</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{exam.totalMarks || 60}</div>
                          </div>
                        </div>
                        {exam.timeLimit && (
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">{exam.timeLimit} min</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => handleStartExam(exam)}
                        disabled={startExamMutation.isPending || !exam.isPublished}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm hover:shadow-md transition-all duration-200"
                        data-testid={`button-start-exam-${exam.id}`}
                      >
                        {startExamMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Starting Exam...
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
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </div>
        </PortalLayout>
      )}
    </RequireCompleteProfile>
  );
}
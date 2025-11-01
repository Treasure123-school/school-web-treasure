import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient, resetCircuitBreaker, getCircuitBreakerStatus } from '@/lib/queryClient';
import { optimisticToggle, optimisticDelete, optimisticCreate, optimisticUpdateItem, rollbackOnError } from '@/lib/optimisticUpdates';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertExamSchema, insertExamQuestionSchema, insertQuestionOptionSchema, type Exam, type ExamQuestion, type QuestionOption, type Class, type Subject } from '@shared/schema';
import { z } from 'zod';
import { Plus, Edit, Search, BookOpen, Trash2, Clock, Users, FileText, Eye, Play, Upload, Save, Shield } from 'lucide-react';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

// Form schemas - Use the shared insertExamSchema which has proper preprocessing
const examFormSchema = insertExamSchema.omit({ createdBy: true });

const questionFormSchema = insertExamQuestionSchema
  .omit({ examId: true, orderNumber: true }) // These are added later in onSubmitQuestion
  .extend({
    // Handle NaN values from frontend forms with valueAsNumber: true
    points: z.preprocess((val) => {
      if (val === '' || val === null || val === undefined || Number.isNaN(val)) return 1;
      return val;
    }, z.coerce.number().int().min(1, "Points must be at least 1").default(1)),

    // Enhanced fields for theory questions
    instructions: z.string().optional(),
    sampleAnswer: z.string().optional(),

    options: z.array(z.object({
      optionText: z.string().min(1, 'Option text is required'),
      isCorrect: z.boolean(),
      // Enhanced option fields
      partialCreditValue: z.preprocess((val) => {
        if (val === '' || val === null || val === undefined || Number.isNaN(val)) return 0;
        return val;
      }, z.coerce.number().min(0).default(0)).optional(),
      explanationText: z.string().optional(),
    })).optional(),
}).refine((data) => {
  if (data.questionType === 'multiple_choice') {
    if (!data.options || data.options.length < 2) {
      return false;
    }
    const nonEmptyOptions = data.options.filter(opt => opt.optionText.trim() !== '');
    if (nonEmptyOptions.length < 2) {
      return false;
    }
    const hasCorrectAnswer = nonEmptyOptions.some(opt => opt.isCorrect);
    return hasCorrectAnswer;
  }
  // Enhanced validation for theory questions
  if (data.questionType === 'essay' && data.questionText && data.questionText.length < 20) {
    return false;
  }
  return true;
}, {
  message: "Multiple choice questions require at least 2 non-empty options with one marked as correct. Essay questions need detailed question text (20+ characters).",
  path: ["options"]
});

type ExamForm = z.infer<typeof examFormSchema>;
type QuestionForm = z.infer<typeof questionFormSchema>;

// Component to display question options
function QuestionOptions({ questionId }: { questionId: number }) {
  const { data: options = [], isLoading } = useQuery<QuestionOption[]>({
    queryKey: ['/api/question-options', questionId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/question-options/${questionId}`);
      if (!response.ok) throw new Error('Failed to fetch question options');
      return response.json();
    },
    enabled: !!questionId,
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading options...</div>;
  }

  if (options.length === 0) {
    return <div className="text-sm text-muted-foreground">No options added yet</div>;
  }

  return (
    <div className="space-y-1">
      {options.map((option: any, index: number) => (
        <div key={option.id} className="flex items-center space-x-2">
          <span className="text-sm font-mono text-muted-foreground min-w-[20px]">
            {String.fromCharCode(65 + index)}.
          </span>
          <span className="text-sm">{option.optionText}</span>
          {option.isCorrect && (
            <span className="text-xs bg-green-100 text-green-800 px-1 rounded">✓ Correct</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ExamManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [previewExam, setPreviewExam] = useState<Exam | null>(null);

  const { register: registerExam, handleSubmit: handleExamSubmit, formState: { errors: examErrors }, control: examControl, setValue: setExamValue, reset: resetExam, watch: watchExam } = useForm<ExamForm>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      examType: 'exam',
      timerMode: 'individual',
      timeLimit: 60,
      isPublished: false,
      allowRetakes: false,
      shuffleQuestions: false,
      // Enhanced auto-grading defaults
      autoGradingEnabled: true,
      instantFeedback: false,
      showCorrectAnswers: false,
      passingScore: 60,
      gradingScale: 'standard',
      // Proctoring and security defaults
      enableProctoring: false,
      lockdownMode: false,
      requireWebcam: false,
      requireFullscreen: false,
      maxTabSwitches: 3,
      shuffleOptions: false,
    }
  });

  const { register: registerQuestion, handleSubmit: handleQuestionSubmit, formState: { errors: questionErrors }, control: questionControl, setValue: setQuestionValue, reset: resetQuestion, watch: watchQuestion } = useForm<QuestionForm>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      questionType: 'multiple_choice',
      points: 1,
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
      ]
    }
  });

  const questionType = watchQuestion('questionType');
  const options = watchQuestion('options');
  const watchTimerMode = watchExam('timerMode');
  const watchDuration = watchExam('timeLimit');
  const watchGlobalStartTime = watchExam('startTime');

  // Fetch exams
  const { data: exams = [], isLoading: loadingExams } = useQuery({
    queryKey: ['/api/exams'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/exams');
      return await response.json();
    },
  });

  // Enable real-time updates for exams
  useSupabaseRealtime({ 
    table: 'exams', 
    queryKey: ['/api/exams']
  });

  // Fetch classes for dropdown
  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/classes');
      return await response.json();
    },
  });

  // Fetch subjects for dropdown
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subjects');
      return await response.json();
    },
  });

  // Fetch teachers for teacher in-charge dropdown
  const { data: teachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['/api/users', 'Teacher'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users?role=Teacher');
      return await response.json();
    },
  });

  const { data: terms = [], isLoading: loadingTerms } = useQuery<any[]>({
    queryKey: ['/api/terms'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/terms');
      if (!response.ok) throw new Error('Failed to fetch terms');
      return response.json();
    },
  });

  const { data: examQuestions = [], isLoading: loadingQuestions } = useQuery<ExamQuestion[]>({
    queryKey: ['/api/exam-questions', selectedExam?.id],
    enabled: !!selectedExam?.id,
  });

  const { data: previewQuestions = [], isLoading: loadingPreviewQuestions } = useQuery<ExamQuestion[]>({
    queryKey: ['/api/exam-questions', previewExam?.id],
    enabled: !!previewExam?.id,
  });

  // Fetch question counts for all exams
  const { data: questionCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ['/api/exams/question-counts', exams.map(exam => exam.id)],
    enabled: exams.length > 0,
    queryFn: async () => {
      const examIds = exams.map(exam => exam.id);
      if (examIds.length === 0) return {};

      const queryString = examIds.map(id => `examIds=${id}`).join('&');
      const response = await apiRequest('GET', `/api/exams/question-counts?${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch question counts');
      return response.json();
    },
  });

  // Create exam mutation
  const createExamMutation = useMutation({
    mutationFn: async (examData: ExamForm) => {
      const response = await apiRequest('POST', '/api/exams', examData);
      if (!response.ok) throw new Error('Failed to create exam');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      setIsExamDialogOpen(false);
      resetExam();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create exam",
        variant: "destructive",
      });
    },
  });

  // Publish/Unpublish exam mutation with optimistic update
  const togglePublishMutation = useMutation({
    mutationFn: async ({ examId, isPublished }: { examId: number; isPublished: boolean }) => {
      const response = await apiRequest('PATCH', `/api/exams/${examId}/publish`, { isPublished });
      if (!response.ok) throw new Error('Failed to update exam publish status');
      return response.json();
    },
    onMutate: async ({ examId, isPublished }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/exams'] });
      const previousExams = queryClient.getQueryData(['/api/exams']);
      
      // Optimistically update the exam's published status for instant feedback
      queryClient.setQueryData(['/api/exams'], (old: any) => {
        if (!old) return old;
        return old.map((exam: any) => 
          exam.id === examId ? { ...exam, isPublished } : exam
        );
      });
      
      return { previousExams };
    },
    onSuccess: (data, { isPublished }) => {
      // Update cache with confirmed backend data
      queryClient.setQueryData(['/api/exams'], (old: any) => {
        if (!old) return old;
        return old.map((exam: any) => 
          exam.id === data.id ? data : exam
        );
      });
      
      toast({
        title: "Success",
        description: `Exam ${isPublished ? 'published' : 'unpublished'} successfully`,
      });
    },
    onError: (error: any, variables, context: any) => {
      if (context?.previousExams) {
        queryClient.setQueryData(['/api/exams'], context.previousExams);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update exam publish status",
        variant: "destructive",
      });
    },
  });

  // Delete exam mutation with optimistic update
  const deleteExamMutation = useMutation({
    mutationFn: async (examId: number) => {
      const response = await apiRequest('DELETE', `/api/exams/${examId}`);
      if (!response.ok) throw new Error('Failed to delete exam');
      if (response.status === 204) return;
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 0) {
        return response.json();
      }
      return;
    },
    onMutate: async (examId) => {
      const queryKey = ['/api/exams'];
      const context = await optimisticDelete<Exam[]>({ queryKey, idToDelete: examId });
      
      if (selectedExam?.id === examId) {
        setSelectedExam(null);
        setEditingExam(null);
        setEditingQuestion(null);
      }
      
      toast({
        title: "Deleting...",
        description: "Removing exam from the system",
      });
      
      return context;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exam-questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exams/question-counts'] });
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        rollbackOnError(['/api/exams'], context.previousData);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete exam",
        variant: "destructive",
      });
    },
  });

  // Delete question mutation with optimistic update
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const response = await apiRequest('DELETE', `/api/exam-questions/${questionId}`);
      if (!response.ok) throw new Error('Failed to delete question');
      if (response.status === 204) return;
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 0) {
        return response.json();
      }
      return;
    },
    onMutate: async (questionId) => {
      const queryKey = ['/api/exam-questions', selectedExam?.id];
      const context = await optimisticDelete<ExamQuestion[]>({ queryKey, idToDelete: questionId });
      
      toast({
        title: "Deleting...",
        description: "Removing question",
      });
      
      return context;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exam-questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exams/question-counts'] });
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        rollbackOnError(['/api/exam-questions', selectedExam?.id], context.previousData);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete question",
        variant: "destructive",
      });
    },
  });

  // Create question mutation with no retries to prevent circuit breaker amplification
  const createQuestionMutation = useMutation({
    retry: false, // Disable retries for question creation to prevent circuit breaker amplification
    mutationFn: async (questionData: QuestionForm & { examId: number }) => {
      console.log('🔄 Creating question:', questionData);
      const response = await apiRequest('POST', '/api/exam-questions', questionData);

      // apiRequest already handles error classification for non-OK responses
      const result = await response.json();
      console.log('✅ Question created:', result);
      return result;
    },
    onSuccess: (createdQuestion) => {
      toast({
        title: "Success",
        description: "Question added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exam-questions', selectedExam?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/exams/question-counts', exams.map(exam => exam.id)] });
      // Invalidate question options for the newly created question to ensure fresh data
      if (createdQuestion?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/question-options', createdQuestion.id] });
      }
      setIsQuestionDialogOpen(false);
      // Reset form with default values
      resetQuestion({
        questionType: 'multiple_choice',
        points: 1,
        questionText: '',
        instructions: '',
        sampleAnswer: '',
        options: [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
        ]
      });
    },
    onError: (error: any) => {
      console.error('❌ Question creation mutation error:', error);

      // Use classified error types for better error handling
      if (error?.message?.includes('Circuit breaker is OPEN')) {
        toast({
          title: "Connection Issue",
          description: "Too many failed requests. Please click the 'Reset Connection' button above, wait 30 seconds, then try again.",
          variant: "destructive",
          duration: 8000,
        });
      } else if (error?.errorType === 'auth') {
        toast({
          title: "Authentication Error",
          description: "Please log out and log back in to continue.",
          variant: "destructive",
        });
      } else if (error?.errorType === 'timeout') {
        toast({
          title: "Request Timeout",
          description: "The request took too long. Please try again.",
          variant: "destructive",
        });
      } else if (error?.errorType === 'network') {
        toast({
          title: "Network Error",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else if (error?.errorType === 'client') {
        toast({
          title: "Invalid Question Data",
          description: (
            <div className="space-y-2">
              <p>{error.message || "Please check your question data and try again."}</p>
              <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                <p className="text-xs font-medium">Quick Checklist:</p>
                <ul className="text-xs space-y-1 mt-1">
                  <li>• Question text is at least 5 characters</li>
                  <li>• Multiple choice has at least 2 options</li>
                  <li>• One option is marked as correct</li>
                  <li>• Point value is assigned</li>
                </ul>
              </div>
            </div>
          ),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to Create Question",
          description: (
            <div className="space-y-2">
              <p>{error.message || "Unable to save the question. Please review and try again."}</p>
              <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                <p className="text-xs font-medium">Need help?</p>
                <p className="text-xs mt-1">
                  • Check all required fields are filled<br />
                  • Ensure proper question format<br />
                  • Contact admin if issue persists
                </p>
              </div>
            </div>
          ),
          variant: "destructive",
        });
      }
    },
  });

  const onSubmitExam = (data: ExamForm) => {
    console.log('📤 Submitting exam data to server:', JSON.stringify(data, null, 2));
    console.log('📤 Data types:', {
      classId: typeof data.classId,
      subjectId: typeof data.subjectId,
      termId: typeof data.termId,
      totalMarks: typeof data.totalMarks,
      date: typeof data.date,
    });
    createExamMutation.mutate(data);
  };

  const onInvalidExam = (errors: any) => {
    console.log('Form validation errors:', errors);
    const errorFields = Object.keys(errors);
    const friendlyFieldNames = {
      classId: 'Class',
      subjectId: 'Subject', 
      termId: 'Academic Term',
      totalMarks: 'Total Marks',
      date: 'Exam Date',
      name: 'Exam Name'
    };
    const errorMessages = errorFields.map(field => {
      const friendlyName = friendlyFieldNames[field as keyof typeof friendlyFieldNames] || field;
      return `${friendlyName}: ${errors[field].message}`;
    }).join(', ');
    toast({
      title: "Please Fix Required Fields",
      description: errorMessages || "Please check all required fields and try again",
      variant: "destructive",
    });
  };

  const onInvalidQuestion = (errors: any) => {
    console.log('Question form validation errors:', errors);
    const errorFields = Object.keys(errors);
    const errorMessages = errorFields.map(field => `${field}: ${errors[field].message}`).join(', ');
    toast({
      title: "Question Validation Error",
      description: errorMessages || "Please check all required fields",
      variant: "destructive",
    });
  };

  // Circuit breaker status and reset handler
  const handleCircuitBreakerReset = () => {
    resetCircuitBreaker();
    toast({
      title: "Connection Reset",
      description: "Circuit breaker has been reset. You can try your request again.",
    });
  };

  const onSubmitQuestion = (data: QuestionForm) => {
    console.log('📝 Manual question submission:', data);

    if (!selectedExam) {
      toast({
        title: "No Exam Selected",
        description: "Please select an exam before adding questions",
        variant: "destructive",
      });
      return;
    }

    // Enhanced validation for question text
    if (!data.questionText || data.questionText.trim().length < 5) {
      toast({
        title: "Invalid Question",
        description: "Question text must be at least 5 characters long",
        variant: "destructive",
      });
      return;
    }

    const nextOrderNumber = examQuestions.length + 1;

    // Prepare the question data
    const questionData: any = {
      ...data,
      examId: selectedExam.id,
      orderNumber: nextOrderNumber,
      questionText: data.questionText.trim(),
      points: data.points || 1,
    };

    // For multiple choice questions, filter out empty options and validate
    if (data.questionType === 'multiple_choice' && data.options) {
      const validOptions = data.options
        .filter(option => option.optionText && option.optionText.trim() !== '')
        .map((option, index) => ({
          optionText: option.optionText.trim(),
          isCorrect: option.isCorrect
          // orderNumber is automatically set by the backend
        }));

      // Validate multiple choice requirements
      if (validOptions.length < 2) {
        toast({
          title: "Invalid Options",
          description: "Multiple choice questions require at least 2 non-empty options",
          variant: "destructive",
        });
        return;
      }

      const hasCorrectAnswer = validOptions.some(opt => opt.isCorrect);
      if (!hasCorrectAnswer) {
        toast({
          title: "No Correct Answer",
          description: "Please mark at least one option as correct",
          variant: "destructive",
        });
        return;
      }

      questionData.options = validOptions;
      console.log('✅ Multiple choice validation passed:', validOptions);
    } else {
      // For non-multiple choice questions, don't send options
      delete questionData.options;
      console.log('✅ Non-multiple choice question ready');
    }

    console.log('🚀 Submitting question data:', questionData);
    createQuestionMutation.mutate(questionData);
  };

  const addOption = () => {
    const currentOptions = options || [];
    setQuestionValue('options', [...currentOptions, { optionText: '', isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    const currentOptions = options || [];
    const newOptions = currentOptions.filter((_, i) => i !== index);
    setQuestionValue('options', newOptions);
  };

  const updateOption = (index: number, field: 'optionText' | 'isCorrect', value: string | boolean) => {
    const currentOptions = options || [];
    const newOptions = [...currentOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setQuestionValue('options', newOptions);
  };

  // CSV upload mutation with optimistic updates for instant UI feedback
  const csvUploadMutation = useMutation({
    retry: false,
    mutationFn: async (questions: any[]) => {
      console.log('🔄 Starting CSV upload with', questions.length, 'questions');
      const response = await apiRequest('POST', '/api/exam-questions/bulk', { 
        examId: selectedExam?.id,
        questions 
      });

      const result = await response.json();
      console.log('✅ CSV upload result:', result);
      return result;
    },
    onMutate: async (newQuestions) => {
      const queryKey = ['/api/exam-questions', selectedExam?.id];
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot previous value
      const previousQuestions = queryClient.getQueryData<ExamQuestion[]>(queryKey);
      
      // Optimistically add new questions with temporary IDs
      const optimisticQuestions = newQuestions.map((q, index) => ({
        id: -(Date.now() + index), // Negative temp ID
        examId: selectedExam!.id,
        questionText: q.questionText,
        questionType: q.questionType,
        points: q.points,
        orderNumber: (previousQuestions?.length || 0) + index + 1,
        imageUrl: null,
        expectedAnswers: null,
        explanationText: null,
        hintText: null,
        partialCreditRules: null,
        instructions: q.instructions,
        sampleAnswer: q.sampleAnswer,
        createdAt: new Date().toISOString(),
        options: q.options || []
      }));
      
      // Immediately update UI with optimistic data
      queryClient.setQueryData<ExamQuestion[]>(queryKey, (old = []) => [...old, ...optimisticQuestions]);
      
      console.log('⚡ Optimistic update applied:', optimisticQuestions.length, 'questions added instantly');
      
      return { previousQuestions, queryKey };
    },
    onSuccess: async (data, variables, context) => {
      const successMessage = data.errors && data.errors.length > 0 
        ? `${data.created} questions uploaded successfully. ${data.errors.length} failed - check logs for details.`
        : `${data.created} questions uploaded successfully`;

      toast({
        title: "Upload Complete",
        description: successMessage,
        variant: data.errors && data.errors.length > 0 ? "default" : "default",
      });

      // Wait for Supabase to commit before refetching - prevents data disappearing
      console.log('⏳ Waiting 1 second for Supabase to commit data...');
      setTimeout(async () => {
        console.log('🔄 Refetching questions with real IDs from database...');
        
        // Invalidate queries to mark as stale
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['/api/exam-questions', selectedExam?.id] }),
          queryClient.invalidateQueries({ queryKey: ['/api/exams/question-counts', exams.map(exam => exam.id)] })
        ]);

        // Refetch to replace optimistic data with real data
        await queryClient.refetchQueries({ queryKey: ['/api/exam-questions', selectedExam?.id] });
        
        console.log('✅ Questions updated with real data from database');
      }, 1000); // 1 second delay to allow Supabase to commit

      if (data.errors && data.errors.length > 0) {
        console.warn('⚠️ Upload errors:', data.errors);
        setTimeout(() => {
          const errorSummary = data.errors.slice(0, 3).join('; ');
          const moreErrors = data.errors.length > 3 ? ` (and ${data.errors.length - 3} more)` : '';

          toast({
            title: `${data.errors.length} Questions Failed Validation`,
            description: `${errorSummary}${moreErrors}. Check browser console for all details.`,
            variant: "destructive",
            duration: 8000,
          });
        }, 2000);
      }
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousQuestions) {
        queryClient.setQueryData(context.queryKey, context.previousQuestions);
        console.log('↩️ Rolled back optimistic update due to error');
      }
      console.error('❌ CSV upload mutation error:', error);

      // Enhanced error handling for CSV uploads using classified error types
      if (error?.message?.includes('Circuit breaker is OPEN')) {
        toast({
          title: "Connection Issue - CSV Upload",
          description: "Too many failed requests. Please click the 'Reset Connection' button above, wait 30 seconds, then try again.",
          variant: "destructive",
          duration: 8000,
        });
      } else if (error?.errorType === 'auth') {
        toast({
          title: "Authentication Error",
          description: "Your session may have expired. Please log out and log back in.",
          variant: "destructive",
        });
      } else if (error?.errorType === 'timeout') {
        toast({
          title: "Upload Timeout",
          description: "The CSV upload took too long. Try uploading fewer questions at once.",
          variant: "destructive",
        });
      } else if (error?.errorType === 'network') {
        toast({
          title: "Network Error",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else if (error?.errorType === 'client' || (error?.message?.includes('400') && error?.message?.includes('Validation'))) {
        // Extract validation errors from the response if available
        let errorDetails = "Please check your CSV format. Download the template and ensure all required fields are filled.";
        if (error?.errors && Array.isArray(error.errors)) {
          const firstFewErrors = error.errors.slice(0, 2).join('; ');
          errorDetails = `${firstFewErrors}${error.errors.length > 2 ? ' (and more)' : ''}`;
        }

        toast({
          title: "CSV Validation Errors",
          description: errorDetails,
          variant: "destructive",
          duration: 8000,
        });
      } else {
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload questions. Please check your CSV format and try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Download CSV template
  const downloadCSVTemplate = () => {
    const csvContent = `QuestionText,Type,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Points,Instructions,SampleAnswer
"What is 2 + 2?",multiple_choice,"2","3","4","5","C",1,"Choose the correct answer","4"
"What is the capital of France?",multiple_choice,"London","Paris","Berlin","Madrid","B",1,"Select the correct capital city","Paris"
"Explain what a Control Account is and state five advantages.",essay,"","","","","",15,"Write a detailed explanation showing your understanding of control accounts and their benefits in accounting","A Control Account is a summary account that shows the total balance of a subsidiary ledger. Advantages include: 1) Error detection 2) Time saving 3) Fraud prevention 4) Quick trial balance 5) Management control"
"Define Partnership Deed and explain its importance.",essay,"","","","","",10,"Provide definition and explain why it's important in partnerships","A Partnership Deed is a legal document that outlines the terms and conditions of a partnership business..."
"What is Depreciation? Distinguish between Straight Line and Reducing Balance methods.",text,"","","","","",8,"Define depreciation and compare the two methods with examples","Depreciation is the systematic allocation of an asset's cost over its useful life. Straight line method allocates equal amounts annually while reducing balance applies a fixed percentage to the reducing book value"
"Calculate compound interest: Principal ₦50,000, Rate 10% per annum, Time 3 years.",text,"","","","","",5,"Show your working step by step","Using A = P(1 + r)^n: A = 50,000(1 + 0.1)^3 = 50,000 × 1.331 = ₦66,550. Compound Interest = ₦66,550 - ₦50,000 = ₦16,550"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exam_questions_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Enhanced Template Downloaded",
      description: "CSV template with support for multiple choice, text, and essay questions has been downloaded.",
    });
  };

  // Handle CSV file upload
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    console.log('📂 CSV file selected:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      hasSelectedExam: !!selectedExam,
      examId: selectedExam?.id
    });
    
    if (!file || !selectedExam) {
      if (!selectedExam) {
        toast({
          title: "No Exam Selected",
          description: "Please select an exam first before uploading questions.",
          variant: "destructive",
        });
      }
      event.target.value = '';
      return;
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file (.csv extension).",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "CSV file must be smaller than 1MB.",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        
        if (!csv || csv.trim().length === 0) {
          throw new Error('CSV file is empty');
        }
        
        console.log('📄 CSV content loaded, parsing...');
        const questions = parseCSV(csv);

        console.log('✅ CSV parsed successfully:', {
          questionCount: questions.length,
          firstQuestion: questions[0]
        });

        // Show instant feedback - questions will appear immediately via optimistic update
        toast({
          title: "⚡ Uploading...",
          description: `Adding ${questions.length} questions instantly...`,
        });

        csvUploadMutation.mutate(questions);
      } catch (error: any) {
        console.error('❌ CSV parsing error:', error);
        toast({
          title: "CSV Format Error",
          description: error.message || "Failed to parse CSV file. Please check the format and try again.",
          variant: "destructive",
          duration: 8000,
        });
      }
    };

    reader.onerror = () => {
      console.error('❌ File read error');
      toast({
        title: "File Read Error",
        description: "Failed to read the CSV file. Please try again.",
        variant: "destructive",
      });
    };

    reader.readAsText(file);

    // Reset the input
    event.target.value = '';
  };

  // Parse CSV content into questions array
  const parseCSV = (csvContent: string) => {
    console.log('📊 Starting enhanced CSV parsing...');
    
    if (!csvContent || csvContent.trim().length === 0) {
      throw new Error('CSV file is empty. Please provide a valid CSV file with question data.');
    }
    
    const lines = csvContent.trim().split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
      throw new Error(`CSV must have at least a header row and one question row. Found only ${lines.length} line(s). Please download the template for the correct format.`);
    }

    // Parse headers more carefully to handle quoted content
    const headers = parseCSVLine(lines[0]);
    const requiredHeaders = ['QuestionText', 'Type', 'Points'];
    const optionalHeaders = ['OptionA', 'OptionB', 'OptionC', 'OptionD', 'CorrectAnswer', 'Instructions', 'SampleAnswer'];

    console.log('📋 CSV headers found:', headers);
    console.log('📋 Expected headers (required):', requiredHeaders);
    console.log('📋 Expected headers (optional):', optionalHeaders);

    // Validate required headers with case-insensitive matching
    const normalizedHeaders = headers.map(h => h.trim());
    const missingRequiredHeaders = requiredHeaders.filter(expected => 
      !normalizedHeaders.some(found => found.toLowerCase() === expected.toLowerCase())
    );

    if (missingRequiredHeaders.length > 0) {
      throw new Error(
        `Missing required CSV headers: ${missingRequiredHeaders.join(', ')}\n\n` +
        `Required headers: ${requiredHeaders.join(', ')}\n` +
        `Optional headers: ${optionalHeaders.join(', ')}\n` +
        `Found headers: ${headers.join(', ')}\n\n` +
        `Please download the template to see the correct format.`
      );
    }

    const questions = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const row = parseCSVLine(lines[i]);

        if (row.length < headers.length) {
          errors.push(`Row ${i + 1}: Incomplete row (expected ${headers.length} columns, found ${row.length})`);
          continue;
        }

        // Use case-insensitive header matching for robustness
        const getColumnValue = (expectedHeader: string) => {
          const headerIndex = normalizedHeaders.findIndex(h => h.toLowerCase() === expectedHeader.toLowerCase());
          return headerIndex >= 0 ? row[headerIndex]?.trim() : '';
        };

        const questionText = getColumnValue('QuestionText');
        const questionType = getColumnValue('Type')?.toLowerCase().replace(/[-\s]/g, '_');
        const pointsText = getColumnValue('Points');
        const instructions = getColumnValue('Instructions');
        const sampleAnswer = getColumnValue('SampleAnswer');

        // Validate required fields
        if (!questionText || questionText.length < 5) {
          errors.push(`Row ${i + 1}: Question text is required and must be at least 5 characters`);
          continue;
        }

        if (!['multiple_choice', 'text', 'essay'].includes(questionType)) {
          errors.push(`Row ${i + 1}: Invalid question type "${questionType}". Must be: multiple_choice, text, or essay`);
          continue;
        }

        const points = parseInt(pointsText) || 1;
        if (points < 1 || points > 100) {
          errors.push(`Row ${i + 1}: Points must be between 1 and 100 (found: ${pointsText})`);
          continue;
        }

        // Enhanced validation for theory questions
        if (questionType === 'essay') {
          if (questionText.length < 20) {
            errors.push(`Row ${i + 1}: Essay questions should have detailed question text (at least 20 characters)`);
            continue;
          }
          if (points < 5) {
            console.warn(`Row ${i + 1}: Essay questions typically have 5+ points. Current: ${points}`);
          }
        }

        if (questionType === 'text') {
          if (points > 10) {
            console.warn(`Row ${i + 1}: Text questions typically have 10 or fewer points. Current: ${points}`);
          }
        }

        const question: any = {
          questionText: questionText.trim(),
          questionType,
          points,
          orderNumber: i,
          instructions: instructions?.trim() || null,
          sampleAnswer: sampleAnswer?.trim() || null
        };

        // Handle multiple choice questions
        if (questionType === 'multiple_choice') {
          const correctAnswer = getColumnValue('CorrectAnswer')?.toUpperCase();
          const optionLetters = ['A', 'B', 'C', 'D'];

          if (!optionLetters.includes(correctAnswer)) {
            errors.push(`Row ${i + 1}: Multiple choice questions require correct answer A, B, C, or D (found: "${correctAnswer}")`);
            continue;
          }

          const options = optionLetters.map(letter => ({
            optionText: getColumnValue(`Option${letter}`),
            isCorrect: letter === correctAnswer
          })).filter(opt => opt.optionText && opt.optionText.trim() !== '');

          if (options.length < 2) {
            errors.push(`Row ${i + 1}: Multiple choice questions need at least 2 non-empty options`);
            continue;
          }

          const hasCorrectOption = options.some(opt => opt.isCorrect);
          if (!hasCorrectOption) {
            errors.push(`Row ${i + 1}: The correct answer "${correctAnswer}" doesn't match any provided options`);
            continue;
          }

          question.options = options.map((opt, index) => ({
            ...opt,
            optionText: opt.optionText.trim()
            // orderNumber is automatically set by the backend
          }));
        } else {
          // For text and essay questions, validate that no multiple choice fields are filled
          const hasOptions = ['A', 'B', 'C', 'D'].some(letter => {
            const option = getColumnValue(`Option${letter}`);
            return option && option.trim() !== '';
          });

          if (hasOptions) {
            console.warn(`Row ${i + 1}: ${questionType} questions don't need option columns. Options will be ignored.`);
          }
        }

        questions.push(question);
        console.log(`✅ Parsed question ${i}: ${questionText.substring(0, 50)}...`);
      } catch (rowError: any) {
        errors.push(`Row ${i + 1}: ${rowError.message}`);
      }
    }

    // Report any errors found
    if (errors.length > 0) {
      console.warn('⚠️ CSV parsing errors:', errors);
      throw new Error(`Found ${errors.length} error(s) in CSV:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n... and ' + (errors.length - 5) + ' more errors.' : ''}`);
    }

    if (questions.length === 0) {
      throw new Error('No valid questions found in CSV. Please check the format and content.');
    }

    console.log(`✅ CSV parsing completed: ${questions.length} questions parsed`);
    return questions;
  };

  // Helper function to parse CSV line handling quoted content
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  };

  const filteredExams = exams.filter((exam: Exam) => 
    exam.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClassNameById = (classId: number) => {
    const classItem = classes.find((c: Class) => c.id === classId);
    return classItem?.name || 'Unknown Class';
  };

  const getSubjectNameById = (subjectId: number) => {
    const subject = subjects.find((s: Subject) => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  if (!user) {
    return <div>Please log in to access the exam management portal.</div>;
  }

  // Map roleId to role name (lowercase as expected by PortalLayout)
  const getRoleName = (roleId: number): 'admin' | 'teacher' | 'parent' | 'student' => {
    const roleMap: { [key: number]: 'admin' | 'teacher' | 'parent' | 'student' } = {
      1: 'student',
      2: 'teacher', 
      3: 'parent',
      4: 'admin'
    };
    return roleMap[roleId] || 'teacher';
  };

  return (
    <PortalLayout
      userRole={getRoleName(user.roleId)}
      userName={user.firstName + ' ' + user.lastName}
      userInitials={user.firstName.charAt(0) + user.lastName.charAt(0)}
    >
      <div className="space-y-6">
        {/* Circuit Breaker Status Display */}
        {(() => {
          const cbStatus = getCircuitBreakerStatus();
          if (cbStatus.state === 'OPEN' || cbStatus.failures > 0) {
            return (
              <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${cbStatus.state === 'OPEN' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <span className="text-sm font-medium">
                        {cbStatus.state === 'OPEN' ? 'Connection Issues Detected' : 'Connection Warnings'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({cbStatus.failures} failed requests)
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleCircuitBreakerReset}
                      data-testid="button-reset-connection"
                    >
                      Reset Connection
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cbStatus.state === 'OPEN' 
                      ? 'Requests are temporarily blocked. Click Reset or wait for automatic recovery.'
                      : 'Some requests have failed. Monitor for connection issues.'}
                  </p>
                </CardContent>
              </Card>
            );
          }
          return null;
        })()}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Exam Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Create and manage exams for your classes</p>
          </div>
          <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-exam" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Create New Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleExamSubmit(onSubmitExam, onInvalidExam)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Exam Name</Label>
                    <Input 
                      id="name" 
                      {...registerExam('name')} 
                      data-testid="input-exam-name"
                      placeholder="e.g., Mid-term Mathematics Test"
                    />
                    {examErrors.name && <p className="text-sm text-red-500">{examErrors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="date">Exam Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      {...registerExam('date')} 
                      data-testid="input-exam-date"
                    />
                    {examErrors.date && <p className="text-sm text-red-500">{examErrors.date.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="class">Class</Label>
                    <Controller
                      name="classId"
                      control={examControl}
                      render={({ field }) => (
                        <Select 
                          onValueChange={(value) => {
                            const numValue = Number(value);
                            if (!isNaN(numValue)) {
                              field.onChange(numValue);
                            }
                          }} 
                          value={field.value !== undefined && field.value !== null ? field.value.toString() : ''}
                        >
                          <SelectTrigger data-testid="select-exam-class">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((classItem: any) => (
                              <SelectItem key={classItem.id} value={classItem.id.toString()}>
                                {classItem.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {examErrors.classId && <p className="text-sm text-red-500">{examErrors.classId.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Controller
                      name="subjectId"
                      control={examControl}
                      render={({ field }) => (
                        <Select 
                          onValueChange={(value) => {
                            const numValue = Number(value);
                            if (!isNaN(numValue)) {
                              field.onChange(numValue);
                            }
                          }} 
                          value={field.value !== undefined && field.value !== null ? field.value.toString() : ''}
                        >
                          <SelectTrigger data-testid="select-exam-subject">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject: any) => (
                              <SelectItem key={subject.id} value={subject.id.toString()}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {examErrors.subjectId && <p className="text-sm text-red-500">{examErrors.subjectId.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="examType">Assessment Type</Label>
                    <Controller
                      name="examType"
                      control={examControl}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger data-testid="select-exam-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="test">Test (40 marks weight)</SelectItem>
                            <SelectItem value="exam">Exam (60 marks weight)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {examErrors.examType && <p className="text-sm text-red-500">{examErrors.examType.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      Final grades are calculated as: Test (40%) + Exam (60%) = Total (100%)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="teacherInChargeId">Teacher In-Charge</Label>
                    <Controller
                      name="teacherInChargeId"
                      control={examControl}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <SelectTrigger data-testid="select-teacher-in-charge">
                            <SelectValue placeholder="Select teacher (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers && teachers.length > 0 ? (
                              teachers.map((teacher: any) => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.firstName} {teacher.lastName} - {teacher.department || 'No Department'}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-teachers" disabled>
                                No teachers available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Assigns grading responsibility
                    </p>
                    {examErrors.teacherInChargeId && <p className="text-sm text-red-500">{examErrors.teacherInChargeId.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea 
                    id="instructions" 
                    {...registerExam('instructions')} 
                    data-testid="textarea-exam-instructions"
                    placeholder="Enter exam instructions for students..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    These will be shown to students before they start the exam
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="termId">Academic Term</Label>
                    <Controller
                      name="termId"
                      control={examControl}
                      render={({ field }) => (
                        <Select 
                          onValueChange={(value) => {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue)) {
                              field.onChange(numValue);
                            }
                          }} 
                          value={field.value !== undefined && field.value !== null ? field.value.toString() : ''}
                        >
                          <SelectTrigger data-testid="select-term">
                            <SelectValue placeholder="Select term" />
                          </SelectTrigger>
                          <SelectContent>
                            {terms && terms.length > 0 ? (
                              terms.map((term: any) => (
                                <SelectItem key={term.id} value={term.id.toString()}>
                                  {term.name} - {term.year}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-terms" disabled>
                                No academic terms available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {examErrors.termId && <p className="text-sm text-red-500">{examErrors.termId.message}</p>}
                  </div>
                </div>

                {/* Timer Mode Selection Section */}
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Timer Mode Selection
                  </h4>

                  <div>
                    <Label htmlFor="timerMode">Choose Timer Mode</Label>
                    <Controller
                      name="timerMode"
                      control={examControl}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || 'individual'}>
                          <SelectTrigger data-testid="select-timer-mode">
                            <SelectValue placeholder="Select timer mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">
                              <div className="flex flex-col">
                                <span className="font-medium">Individual Timer</span>
                                <span className="text-xs text-muted-foreground">Each student starts their own countdown</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="global">
                              <div className="flex flex-col">
                                <span className="font-medium">Global Timer</span>
                                <span className="text-xs text-muted-foreground">All students start and end at the same time</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {watchTimerMode === 'individual' && (
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                      <p className="text-sm font-medium mb-2">Individual Timer Mode</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Students can start the exam at any time within the availability window</li>
                        <li>• Each student gets the full duration from when they click "Start"</li>
                        <li>• Best for flexible scheduling and different time zones</li>
                      </ul>
                    </div>
                  )}

                  {watchTimerMode === 'global' && (
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                      <p className="text-sm font-medium mb-2">Global Timer Mode</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• All students start the exam at the exact same date/time</li>
                        <li>• The exam automatically ends at a fixed time for everyone</li>
                        <li>• Best for proctored exams and uniform conditions</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalMarks">Total Marks</Label>
                    <Input 
                      id="totalMarks" 
                      type="number" 
                      {...registerExam('totalMarks', { valueAsNumber: true })} 
                      data-testid="input-exam-total-marks"
                      placeholder="100"
                    />
                    {examErrors.totalMarks && <p className="text-sm text-red-500">{examErrors.totalMarks.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="timeLimit">
                      {watchTimerMode === 'individual' ? 'Duration per Student' : 'Exam Duration'} (minutes)
                    </Label>
                    <Input 
                      id="timeLimit" 
                      type="number" 
                      {...registerExam('timeLimit', { valueAsNumber: true })} 
                      data-testid="input-exam-time-limit"
                      placeholder="60"
                    />
                    {examErrors.timeLimit && <p className="text-sm text-red-500">{examErrors.timeLimit.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {watchTimerMode === 'individual' 
                        ? 'Each student gets this many minutes from when they start' 
                        : 'Total duration of the exam window for all students'}
                    </p>
                  </div>
                </div>

                {/* Scheduling Section for Global Timer */}
                {watchTimerMode === 'global' && (
                  <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Global Timer Configuration
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startTime">Start Time</Label>
                          <Input
                            id="startTime"
                            type="datetime-local"
                            {...registerExam('startTime')} 
                            data-testid="input-exam-start-time"
                            min={new Date().toISOString().slice(0, 16)}
                          />
                          {examErrors.startTime && (
                            <p className="text-sm text-red-500 mt-1">{examErrors.startTime.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Exam becomes available
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="endTime">End Time</Label>
                          <Input
                            id="endTime"
                            type="datetime-local"
                            {...registerExam('endTime')} 
                            data-testid="input-exam-end-time"
                            min={watchGlobalStartTime || new Date().toISOString().slice(0, 16)}
                          />
                          {examErrors.endTime && (
                            <p className="text-sm text-red-500 mt-1">{examErrors.endTime.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Exam auto-submits at this time
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          All students must complete the exam between these times. The exam will automatically submit at the end time, regardless of when students start.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Publishing & Options Section */}
                <div className="space-y-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Publishing & Options
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="isPublished"
                        control={examControl}
                        render={({ field }) => (
                          <Switch 
                            checked={field.value || false} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-exam-published"
                          />
                        )}
                      />
                      <div>
                        <Label>Publish Immediately</Label>
                        <p className="text-xs text-muted-foreground">
                          {watchTimerMode === 'global' 
                            ? 'Will be published at scheduled start time' 
                            : 'Make exam visible to students now'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Controller
                        name="allowRetakes"
                        control={examControl}
                        render={({ field }) => (
                          <Switch 
                            checked={field.value || false} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-exam-retakes"
                          />
                        )}
                      />
                      <div>
                        <Label>Allow Retakes</Label>
                        <p className="text-xs text-muted-foreground">Students can attempt multiple times</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                      name="shuffleQuestions"
                      control={examControl}
                      render={({ field }) => (
                        <Switch 
                          checked={field.value || false} 
                          onCheckedChange={field.onChange}
                          data-testid="switch-exam-shuffle"
                        />
                      )}
                    />
                    <div>
                      <Label>Shuffle Questions</Label>
                      <p className="text-xs text-muted-foreground">Randomize question order for each student</p>
                    </div>
                  </div>

                  {!watchExam('isPublished') && (
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                      <p className="text-sm font-medium mb-1">💾 Saved as Draft</p>
                      <p className="text-xs text-muted-foreground">
                        This exam will be saved as a draft. You can add questions and publish it later.
                      </p>
                    </div>
                  )}
                </div>

                {/* Enhanced Auto-Grading Controls */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm">Auto-Grading Settings</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="autoGradingEnabled"
                        control={examControl}
                        render={({ field }) => (
                          <Switch 
                            checked={field.value || false} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-auto-grading"
                          />
                        )}
                      />
                      <Label>Enable Auto-Grading</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="instantFeedback"
                        control={examControl}
                        render={({ field }) => (
                          <Switch 
                            checked={field.value || false} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-instant-feedback"
                          />
                        )}
                      />
                      <Label>Instant Feedback</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="showCorrectAnswers"
                        control={examControl}
                        render={({ field }) => (
                          <Switch 
                            checked={field.value || false} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-show-answers"
                          />
                        )}
                      />
                      <Label>Show Correct Answers</Label>
                    </div>
                    <div>
                      <Label htmlFor="passingScore">Passing Score (%)</Label>
                      <Input 
                        id="passingScore" 
                        type="number" 
                        min="0" 
                        max="100" 
                        {...registerExam('passingScore', { valueAsNumber: true })} 
                        data-testid="input-passing-score"
                        placeholder="60"
                      />
                      {examErrors.passingScore && <p className="text-sm text-red-500">{examErrors.passingScore.message}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="gradingScale">Grading Scale</Label>
                    <Controller
                      name="gradingScale"
                      control={examControl}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || 'standard'} data-testid="select-grading-scale">
                          <SelectTrigger>
                            <SelectValue placeholder="Select grading scale" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard (A-F)</SelectItem>
                            <SelectItem value="percentage">Percentage Only</SelectItem>
                            <SelectItem value="points">Points Only</SelectItem>
                            <SelectItem value="custom">Custom Scale</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Proctoring & Security Settings */}
                <div className="space-y-4 p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Proctoring & Security Settings
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="enableProctoring"
                        control={examControl}
                        render={({ field }) => (
                          <Switch 
                            checked={field.value || false} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-enable-proctoring"
                          />
                        )}
                      />
                      <div>
                        <Label>Enable Proctoring</Label>
                        <p className="text-xs text-muted-foreground">Monitor students during exam</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Controller
                        name="lockdownMode"
                        control={examControl}
                        render={({ field }) => (
                          <Switch 
                            checked={field.value || false} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-lockdown-mode"
                          />
                        )}
                      />
                      <div>
                        <Label>Lockdown Mode</Label>
                        <p className="text-xs text-muted-foreground">Prevent tab switching & copy-paste</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Controller
                        name="requireWebcam"
                        control={examControl}
                        render={({ field }) => (
                          <Switch 
                            checked={field.value || false} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-require-webcam"
                          />
                        )}
                      />
                      <div>
                        <Label>Require Webcam</Label>
                        <p className="text-xs text-muted-foreground">Students must enable camera</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Controller
                        name="requireFullscreen"
                        control={examControl}
                        render={({ field }) => (
                          <Switch 
                            checked={field.value || false} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-require-fullscreen"
                          />
                        )}
                      />
                      <div>
                        <Label>Require Fullscreen</Label>
                        <p className="text-xs text-muted-foreground">Force fullscreen mode</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxTabSwitches">Max Tab Switches</Label>
                      <Input 
                        id="maxTabSwitches" 
                        type="number" 
                        min="0" 
                        max="10" 
                        {...registerExam('maxTabSwitches', { valueAsNumber: true })} 
                        data-testid="input-max-tab-switches"
                        placeholder="3"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto-submit after this many violations (0 = unlimited)
                      </p>
                      {examErrors.maxTabSwitches && <p className="text-sm text-red-500">{examErrors.maxTabSwitches.message}</p>}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Controller
                        name="shuffleOptions"
                        control={examControl}
                        render={({ field }) => (
                          <Switch 
                            checked={field.value || false} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-shuffle-options"
                          />
                        )}
                      />
                      <div>
                        <Label>Shuffle Options</Label>
                        <p className="text-xs text-muted-foreground">Randomize option order (A, B, C, D)</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                    <p className="text-sm font-medium mb-1">🔒 Security Features</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Proctoring monitors student activity during exams</li>
                      <li>• Lockdown mode prevents cheating via external resources</li>
                      <li>• Tab switching limits help maintain exam integrity</li>
                      <li>• Shuffled options reduce answer sharing</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsExamDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createExamMutation.isPending} data-testid="button-submit-exam">
                    {createExamMutation.isPending ? 'Creating...' : 'Create Exam'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
            data-testid="input-search-exams"
          />
        </div>

        {/* Exams Table/Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Exams</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {loadingExams ? (
              <div className="text-center py-8">Loading exams...</div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {filteredExams.map((exam: any) => (
                    <div 
                      key={exam.id} 
                      className="border border-border rounded-lg p-3 bg-muted/30"
                      data-testid={`card-exam-${exam.id}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{exam.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {getClassNameById(exam.classId)} • {getSubjectNameById(exam.subjectId)}
                            </p>
                          </div>
                          <Badge variant={exam.isPublished ? 'default' : 'secondary'} className="ml-2 flex-shrink-0">
                            {exam.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-3">
                            <span>{new Date(exam.date).toLocaleDateString()}</span>
                            {exam.timeLimit && (
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {exam.timeLimit}m
                              </div>
                            )}
                          </div>
                          <div className="flex items-center">
                            <FileText className="w-3 h-3 mr-1" />
                            {questionCounts[exam.id] || 0}
                          </div>
                        </div>

                        {(() => {
                          const now = new Date();
                          const startTime = exam.startTime ? new Date(exam.startTime) : null;
                          const endTime = exam.endTime ? new Date(exam.endTime) : null;

                          if (exam.timerMode === 'global' && startTime && endTime) {
                            if (now < startTime) {
                              return (
                                <Badge variant="outline" className="bg-yellow-50 w-fit">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Scheduled
                                </Badge>
                              );
                            } else if (now >= startTime && now <= endTime) {
                              return (
                                <Badge variant="default" className="bg-green-600 w-fit">
                                  <Play className="w-3 h-3 mr-1" />
                                  Live Now
                                </Badge>
                              );
                            } else {
                              return (
                                <Badge variant="secondary" className="w-fit">
                                  Ended
                                </Badge>
                              );
                            }
                          }
                          return null;
                        })()}

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedExam(exam)}
                            data-testid={`button-manage-questions-${exam.id}`}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Questions
                          </Button>
                          <Button
                            variant={exam.isPublished ? "default" : "secondary"}
                            size="sm"
                            onClick={() => togglePublishMutation.mutate({ 
                              examId: exam.id, 
                              isPublished: !exam.isPublished 
                            })}
                            disabled={togglePublishMutation.isPending}
                            data-testid={`button-toggle-publish-${exam.id}`}
                            className="flex-1"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            {togglePublishMutation.isPending 
                              ? (exam.isPublished ? 'Unpublishing...' : 'Publishing...') 
                              : (exam.isPublished ? 'Unpublish' : 'Publish')
                            }
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-preview-exam-${exam.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deleteExamMutation.isPending}
                                data-testid={`button-delete-exam-${exam.id}`}
                                aria-label={`Delete exam ${exam.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the exam "{exam.name}"? This action cannot be undone and will permanently remove all exam questions and student results.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={deleteExamMutation.isPending}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteExamMutation.mutate(exam.id)}
                                  disabled={deleteExamMutation.isPending}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  {deleteExamMutation.isPending ? 'Deleting...' : 'Delete Exam'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredExams.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No exams found. Create your first exam to get started.
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.map((exam: any) => (
                        <TableRow key={exam.id} data-testid={`row-exam-${exam.id}`}>
                          <TableCell className="font-medium">{exam.name}</TableCell>
                          <TableCell>{getClassNameById(exam.classId)}</TableCell>
                          <TableCell>{getSubjectNameById(exam.subjectId)}</TableCell>
                          <TableCell>{new Date(exam.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {exam.timeLimit ? (
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {exam.timeLimit}m
                              </div>
                            ) : 'No limit'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={exam.isPublished ? 'default' : 'secondary'}>
                              {exam.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const now = new Date();
                              const startTime = exam.startTime ? new Date(exam.startTime) : null;
                              const endTime = exam.endTime ? new Date(exam.endTime) : null;

                              if (exam.timerMode === 'global' && startTime && endTime) {
                                if (now < startTime) {
                                  return (
                                    <Badge variant="outline" className="bg-yellow-50">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Scheduled
                                    </Badge>
                                  );
                                } else if (now >= startTime && now <= endTime) {
                                  return (
                                    <Badge variant="default" className="bg-green-600">
                                      <Play className="w-3 h-3 mr-1" />
                                      Live Now
                                    </Badge>
                                  );
                                } else {
                                  return (
                                    <Badge variant="secondary">
                                      Ended
                                    </Badge>
                                  );
                                }
                              }
                              return (
                                <span className="text-sm text-muted-foreground">
                                  Individual Timer
                                </span>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-1" />
                              {questionCounts[exam.id] || 0} question{(questionCounts[exam.id] || 0) !== 1 ? 's' : ''}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedExam(exam)}
                                data-testid={`button-manage-questions-${exam.id}`}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Questions
                              </Button>
                              <Button
                                variant={exam.isPublished ? "default" : "secondary"}
                                size="sm"
                                onClick={() => togglePublishMutation.mutate({ 
                                  examId: exam.id, 
                                  isPublished: !exam.isPublished 
                                })}
                                disabled={togglePublishMutation.isPending}
                                data-testid={`button-toggle-publish-${exam.id}`}
                              >
                                <Play className="w-4 h-4 mr-1" />
                                {togglePublishMutation.isPending 
                                  ? (exam.isPublished ? 'Unpublishing...' : 'Publishing...') 
                                  : (exam.isPublished ? 'Unpublish' : 'Publish')
                                }
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewExam(exam)}
                                data-testid={`button-preview-exam-${exam.id}`}
                                title="Preview exam as student"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={deleteExamMutation.isPending}
                                    data-testid={`button-delete-exam-${exam.id}`}
                                    aria-label={`Delete exam ${exam.name}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the exam "{exam.name}"? This action cannot be undone and will permanently remove all exam questions and student results.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel disabled={deleteExamMutation.isPending}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteExamMutation.mutate(exam.id)}
                                      disabled={deleteExamMutation.isPending}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      {deleteExamMutation.isPending ? 'Deleting...' : 'Delete Exam'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredExams.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No exams found. Create your first exam to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Empty state guidance when no exam is selected */}
        {!selectedExam && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Select an Exam to Manage Questions</h3>
                <p className="text-sm">
                  To add questions or upload CSV files, please select an exam from the list above by clicking the "Manage Questions" button.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question Management Modal */}
        {selectedExam && (
          <Dialog open={!!selectedExam} onOpenChange={(open) => { if (!open) setSelectedExam(null); }}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage Questions - {selectedExam.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    {examQuestions.length} questions • {selectedExam.totalMarks} total marks
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* CSV Template Download */}
                    <Button
                      variant="outline"
                      onClick={downloadCSVTemplate}
                      data-testid="button-download-template"
                      title="Download CSV template for bulk question upload"
                      className="w-full sm:w-auto"
                      size="sm"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Download Template</span>
                      <span className="sm:hidden">Template</span>
                    </Button>

                    {/* CSV Upload Button */}
                    <div className="relative w-full sm:w-auto">
                      <input
                        type="file"
                        id="csv-upload"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="hidden"
                        data-testid="input-csv-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('csv-upload')?.click()}
                        data-testid="button-upload-csv"
                        disabled={!selectedExam || csvUploadMutation.isPending}
                        title={!selectedExam ? "Please select an exam first" : "Upload questions from CSV file"}
                        className="w-full sm:w-auto"
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {csvUploadMutation.isPending ? 'Uploading...' : 'Upload CSV'}
                      </Button>
                    </div>

                    {/* Manual Add Question */}
                    <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                      <DialogTrigger asChild>
                        <div title={!selectedExam ? "Select an exam from the list above to add questions" : ""} className="w-full sm:w-auto">
                          <Button 
                            data-testid="button-add-question" 
                            disabled={!selectedExam}
                            style={!selectedExam ? { pointerEvents: 'none' } : {}}
                            className="w-full sm:w-auto"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Question
                          </Button>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add New Question</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleQuestionSubmit(onSubmitQuestion, onInvalidQuestion)} className="space-y-4">
                          <div>
                            <Label htmlFor="questionText">Question Text</Label>
                            <Textarea 
                              id="questionText" 
                              {...registerQuestion('questionText')} 
                              data-testid="textarea-question-text"
                              placeholder="Enter your question here..."
                              rows={3}
                            />
                            {questionErrors.questionText && <p className="text-sm text-red-500">{questionErrors.questionText.message}</p>}
                          </div>

                          {(questionType === 'text' || questionType === 'essay') && (
                            <>
                              <div>
                                <Label htmlFor="instructions">Instructions (Optional)</Label>
                                <Textarea 
                                  id="instructions" 
                                  {...registerQuestion('instructions')} 
                                  data-testid="textarea-question-instructions"
                                  placeholder="e.g., Write a detailed explanation (minimum 200 words), Show your working..."
                                  rows={2}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Provide specific guidance for students on how to answer this question
                                </p>
                              </div>

                              <div>
                                <Label htmlFor="sampleAnswer">Sample Answer (Optional)</Label>
                                <Textarea 
                                  id="sampleAnswer" 
                                  {...registerQuestion('sampleAnswer')} 
                                  data-testid="textarea-question-sample"
                                  placeholder="Provide a sample or model answer for grading reference..."
                                  rows={3}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  This will help with consistent grading and is not shown to students
                                </p>
                              </div>
                            </>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="questionType">Question Type</Label>
                              <Controller
                                name="questionType"
                                control={questionControl}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger data-testid="select-question-type">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                      <SelectItem value="text">Short Answer</SelectItem>
                                      <SelectItem value="essay">Essay</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                            <div>
                              <Label htmlFor="points">Points</Label>
                              <Input 
                                id="points" 
                                type="number" 
                                {...registerQuestion('points', { valueAsNumber: true })} 
                                data-testid="input-question-points"
                                min="1"
                              />
                            </div>
                          </div>

                          {questionType === 'multiple_choice' && (
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <Label>Answer Options</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add Option
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {options?.map((option, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      name="correctOption"
                                      checked={option.isCorrect}
                                      onChange={() => {
                                        // Uncheck all other options
                                        const newOptions = options.map((opt, i) => ({
                                          ...opt,
                                          isCorrect: i === index
                                        }));
                                        setQuestionValue('options', newOptions);
                                      }}
                                      data-testid={`radio-option-${index}`}
                                    />
                                    <Input
                                      value={option.optionText}
                                      onChange={(e) => updateOption(index, 'optionText', e.target.value)}
                                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                      className="flex-1"
                                      data-testid={`input-option-${index}`}
                                    />
                                    {options.length > 2 && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeOption(index)}
                                        data-testid={`button-remove-option-${index}`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {questionErrors.options && (
                                <p className="text-sm text-red-500 mt-2">{questionErrors.options.message}</p>
                              )}
                            </div>
                          )}

                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createQuestionMutation.isPending} data-testid="button-submit-question">
                              {createQuestionMutation.isPending ? 'Adding...' : 'Add Question'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-3">
                  {loadingQuestions ? (
                    <div className="text-center py-8">Loading questions...</div>
                  ) : examQuestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No questions added yet. Add your first question to get started.
                    </div>
                  ) : (
                    examQuestions.map((question: any, index: number) => (
                      <Card key={question.id} data-testid={`card-question-${question.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline">Q{index + 1}</Badge>
                                <Badge variant={question.questionType === 'multiple_choice' ? 'secondary' : question.questionType === 'essay' ? 'default' : 'outline'}>
                                  {question.questionType === 'multiple_choice' ? 'Multiple Choice' : 
                                   question.questionType === 'essay' ? 'Essay' : 'Short Answer'}
                                </Badge>
                                <span className="text-sm text-muted-foreground">{question.points} points</span>
                              </div>
                              <p className="mb-2 font-medium">{question.questionText}</p>

                              {question.instructions && (
                                <div className="mb-2 p-2 bg-blue-50 rounded text-sm">
                                  <span className="font-medium text-blue-800">Instructions: </span>
                                  <span className="text-blue-700">{question.instructions}</span>
                                </div>
                              )}

                              {question.questionType === 'multiple_choice' && (
                                <div className="ml-4 space-y-1">
                                  <QuestionOptions questionId={question.id} />
                                </div>
                              )}

                              {(question.questionType === 'text' || question.questionType === 'essay') && (
                                <div className="ml-4 text-sm text-muted-foreground">
                                  <div className="flex items-center space-x-4">
                                    <span>
                                      {question.questionType === 'essay' ? '📝 Essay question' : '📝 Short answer question'}
                                    </span>
                                    {question.sampleAnswer && (
                                      <span className="text-green-600">✓ Sample answer provided</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-1">
                              <Button variant="outline" size="sm" data-testid={`button-edit-question-${question.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    disabled={deleteQuestionMutation.isPending}
                                    data-testid={`button-delete-question-${question.id}`}
                                    aria-label={`Delete question ${index + 1}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this question? This action cannot be undone and will permanently remove the question and all associated answer options.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel disabled={deleteQuestionMutation.isPending}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteQuestionMutation.mutate(question.id)}
                                      disabled={deleteQuestionMutation.isPending}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      {deleteQuestionMutation.isPending ? 'Deleting...' : 'Delete Question'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Preview Exam Dialog */}
        {previewExam && (
          <Dialog open={!!previewExam} onOpenChange={(open) => { if (!open) setPreviewExam(null); }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Preview: {previewExam.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">Student view of the exam</p>
              </DialogHeader>

              <div className="space-y-6">
                {/* Exam Info */}
                <Card className="bg-blue-50 dark:bg-blue-950/20">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Class:</span> {getClassNameById(previewExam.classId)}
                      </div>
                      <div>
                        <span className="font-medium">Subject:</span> {getSubjectNameById(previewExam.subjectId)}
                      </div>
                      <div>
                        <span className="font-medium">Total Marks:</span> {previewExam.totalMarks}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {previewExam.timeLimit} minutes
                      </div>
                    </div>
                    {previewExam.instructions && (
                      <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded">
                        <p className="text-sm font-medium mb-1">Instructions:</p>
                        <p className="text-sm">{previewExam.instructions}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Questions */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Questions ({previewQuestions.length})</h3>
                  {loadingPreviewQuestions ? (
                    <div className="text-center py-8">Loading questions...</div>
                  ) : previewQuestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No questions added to this exam yet.
                    </div>
                  ) : (
                    previewQuestions.map((question: any, index: number) => (
                      <Card key={question.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-4">
                            <Badge variant="outline">Q{index + 1}</Badge>
                            <div className="flex-1">
                              <p className="font-medium mb-2">{question.questionText}</p>
                              <p className="text-xs text-muted-foreground mb-3">
                                {question.points} {question.points === 1 ? 'point' : 'points'}
                              </p>
                              {question.questionType === 'multiple_choice' && (
                                <div className="space-y-2">
                                  <QuestionOptions questionId={question.id} />
                                </div>
                              )}
                              {question.questionType === 'essay' && (
                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded text-sm text-muted-foreground">
                                  Essay answer box would appear here
                                </div>
                              )}
                              {question.questionType === 'text' && (
                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded text-sm text-muted-foreground">
                                  Short answer text box would appear here
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setPreviewExam(null)}>
                    Close Preview
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </PortalLayout>
  );
}
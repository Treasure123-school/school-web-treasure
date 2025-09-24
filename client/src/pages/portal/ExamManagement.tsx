import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertExamSchema, insertExamQuestionSchema, insertQuestionOptionSchema, type Exam, type ExamQuestion, type QuestionOption, type Class, type Subject } from '@shared/schema';
import { z } from 'zod';
import { Plus, Edit, Search, BookOpen, Trash2, Clock, Users, FileText, Eye, Play, Upload } from 'lucide-react';

// Form schemas - Use the shared insertExamSchema which has proper preprocessing
const examFormSchema = insertExamSchema.omit({ createdBy: true });

const questionFormSchema = insertExamQuestionSchema.extend({
  options: z.array(z.object({
    optionText: z.string().min(1, 'Option text is required'),
    isCorrect: z.boolean(),
    // Enhanced option fields
    partialCreditValue: z.number().min(0).optional(),
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
  return true;
}, {
  message: "Multiple choice questions require at least 2 non-empty options with one marked as correct",
  path: ["options"]
});

type ExamForm = z.infer<typeof examFormSchema>;
type QuestionForm = z.infer<typeof questionFormSchema>;

// Component to display question options
function QuestionOptions({ questionId }: { questionId: number }) {
  const { data: options = [], isLoading } = useQuery<QuestionOption[]>({
    queryKey: ['/api/question-options', questionId],
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

  const { register: registerExam, handleSubmit: handleExamSubmit, formState: { errors: examErrors }, control: examControl, setValue: setExamValue, reset: resetExam } = useForm<ExamForm>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
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

  // Fetch data
  const { data: exams = [], isLoading: loadingExams } = useQuery<Exam[]>({
    queryKey: ['/api/exams'],
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  const { data: terms = [] } = useQuery<any[]>({
    queryKey: ['/api/terms'],
  });

  const { data: examQuestions = [], isLoading: loadingQuestions } = useQuery<ExamQuestion[]>({
    queryKey: ['/api/exam-questions', selectedExam?.id],
    enabled: !!selectedExam?.id,
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

  // Publish/Unpublish exam mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ examId, isPublished }: { examId: number; isPublished: boolean }) => {
      const response = await apiRequest('PATCH', `/api/exams/${examId}/publish`, { isPublished });
      if (!response.ok) throw new Error('Failed to update exam publish status');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam publish status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update exam publish status",
        variant: "destructive",
      });
    },
  });

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: QuestionForm & { examId: number }) => {
      const response = await apiRequest('POST', '/api/exam-questions', questionData);
      if (!response.ok) throw new Error('Failed to create question');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exam-questions', selectedExam?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/exams/question-counts', exams.map(exam => exam.id)] });
      setIsQuestionDialogOpen(false);
      // Reset form with default values
      resetQuestion({
        questionType: 'multiple_choice',
        points: 1,
        questionText: '',
        options: [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
        ]
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create question",
        variant: "destructive",
      });
    },
  });

  const onSubmitExam = (data: ExamForm) => {
    createExamMutation.mutate(data);
  };

  const onInvalidExam = (errors: any) => {
    console.log('Form validation errors:', errors);
    const errorFields = Object.keys(errors);
    const errorMessages = errorFields.map(field => `${field}: ${errors[field].message}`).join(', ');
    toast({
      title: "Validation Error",
      description: errorMessages || "Please check all required fields",
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

  const onSubmitQuestion = (data: QuestionForm) => {
    if (!selectedExam) {
      toast({
        title: "No Exam Selected",
        description: "Please select an exam before adding questions",
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
    };
    
    // For multiple choice questions, filter out empty options and validate
    if (data.questionType === 'multiple_choice' && data.options) {
      const validOptions = data.options
        .filter(option => option.optionText.trim() !== '')
        .map((option, index) => ({
          optionText: option.optionText.trim(),
          isCorrect: option.isCorrect,
          orderNumber: index + 1
        }));
      
      questionData.options = validOptions;
    } else {
      // For non-multiple choice questions, don't send options
      delete questionData.options;
    }
    
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

  // CSV upload mutation
  const csvUploadMutation = useMutation({
    mutationFn: async (questions: any[]) => {
      const response = await apiRequest('POST', '/api/exam-questions/bulk', { 
        examId: selectedExam?.id,
        questions 
      });
      if (!response.ok) throw new Error('Failed to upload questions');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `${data.created} questions uploaded successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exam-questions', selectedExam?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload questions",
        variant: "destructive",
      });
    },
  });

  // Handle CSV file upload
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedExam) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const questions = parseCSV(csv);
        csvUploadMutation.mutate(questions);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to parse CSV file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  // Parse CSV content into questions array
  const parseCSV = (csvContent: string) => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one question row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const expectedHeaders = ['QuestionText', 'Type', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'CorrectAnswer', 'Points'];
    
    // Validate headers
    if (!expectedHeaders.every(h => headers.includes(h))) {
      throw new Error(`CSV headers must include: ${expectedHeaders.join(', ')}`);
    }

    const questions = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
      if (row.length < headers.length) continue; // Skip incomplete rows

      const question: any = {
        questionText: row[headers.indexOf('QuestionText')],
        questionType: row[headers.indexOf('Type')],
        points: parseInt(row[headers.indexOf('Points')]) || 1,
        orderNumber: i
      };

      // Add options for multiple choice questions
      if (question.questionType === 'multiple_choice') {
        const correctAnswer = row[headers.indexOf('CorrectAnswer')].toUpperCase();
        const options = ['A', 'B', 'C', 'D'].map(letter => ({
          optionText: row[headers.indexOf(`Option${letter}`)],
          isCorrect: letter === correctAnswer
        })).filter(opt => opt.optionText); // Remove empty options

        question.options = options;
      }

      questions.push(question);
    }

    if (questions.length === 0) {
      throw new Error('No valid questions found in CSV');
    }

    return questions;
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Exam Management</h1>
            <p className="text-muted-foreground">Create and manage exams for your classes</p>
          </div>
          <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-exam">
                <Plus className="w-4 h-4 mr-2" />
                Create New Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleExamSubmit(onSubmitExam, onInvalidExam)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="class">Class</Label>
                    <Controller
                      name="classId"
                      control={examControl}
                      render={({ field }) => (
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
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
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
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

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="term">Academic Term</Label>
                    <Controller
                      name="termId"
                      control={examControl}
                      render={({ field }) => (
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                          <SelectTrigger data-testid="select-exam-term">
                            <SelectValue placeholder="Select term" />
                          </SelectTrigger>
                          <SelectContent>
                            {terms.map((term: any) => (
                              <SelectItem key={term.id} value={term.id.toString()}>
                                {term.name} ({term.year})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {examErrors.termId && <p className="text-sm text-red-500">{examErrors.termId.message}</p>}
                  </div>
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
                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                    <Input 
                      id="timeLimit" 
                      type="number" 
                      {...registerExam('timeLimit', { valueAsNumber: true })} 
                      data-testid="input-exam-time-limit"
                      placeholder="60"
                    />
                    {examErrors.timeLimit && <p className="text-sm text-red-500">{examErrors.timeLimit.message}</p>}
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
                </div>

                <div className="grid grid-cols-3 gap-4">
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
                    <Label>Published</Label>
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
                    <Label>Allow Retakes</Label>
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
                    <Label>Shuffle Questions</Label>
                  </div>
                </div>

                {/* Enhanced Auto-Grading Controls */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm">Auto-Grading Settings</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
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

        {/* Exams Table */}
        <Card>
          <CardHeader>
            <CardTitle>Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingExams ? (
              <div className="text-center py-8">Loading exams...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
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
                            {exam.isPublished ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-preview-exam-${exam.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredExams.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No exams found. Create your first exam to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {examQuestions.length} questions • {selectedExam.totalMarks} total marks
                  </div>
                  <div className="flex space-x-2">
                    {/* CSV Upload Button */}
                    <div className="relative">
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
                        disabled={!selectedExam}
                        title={!selectedExam ? "Please select an exam first" : ""}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload CSV
                      </Button>
                    </div>
                    
                    {/* Manual Add Question */}
                    <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                      <DialogTrigger asChild>
                        <div title={!selectedExam ? "Select an exam from the list above to add questions" : ""}>
                          <Button 
                            data-testid="button-add-question" 
                            disabled={!selectedExam}
                            style={!selectedExam ? { pointerEvents: 'none' } : {}}
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
                                <Badge variant="secondary">{question.questionType.replace('_', ' ')}</Badge>
                                <span className="text-sm text-muted-foreground">{question.points} points</span>
                              </div>
                              <p className="mb-2">{question.questionText}</p>
                              {question.questionType === 'multiple_choice' && (
                                <div className="ml-4 space-y-1">
                                  <QuestionOptions questionId={question.id} />
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-1">
                              <Button variant="outline" size="sm" data-testid={`button-edit-question-${question.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" data-testid={`button-delete-question-${question.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
      </div>
    </PortalLayout>
  );
}
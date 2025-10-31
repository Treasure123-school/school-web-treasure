import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import PortalLayout from '@/components/layout/PortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ChevronDown,
  ChevronUp,
  Save,
  Send,
  FileText,
  Calendar,
  Settings,
  Lock,
  CheckCircle,
  Clock,
  BookOpen,
  GraduationCap,
  AlertCircle,
  X,
  Upload
} from 'lucide-react';

const createExamSchema = z.object({
  name: z.string().min(3, 'Exam name must be at least 3 characters'),
  classId: z.number({ required_error: 'Please select a class' }).min(1, 'Please select a class'),
  subjectId: z.number({ required_error: 'Please select a subject' }).min(1, 'Please select a subject'),
  termId: z.number({ required_error: 'Please select a term' }).min(1, 'Please select a term'),
  examType: z.enum(['test', 'exam'], { required_error: 'Please select exam type' }),
  totalMarks: z.number().min(1, 'Total marks must be at least 1').max(1000, 'Maximum 1000 marks'),
  passingScore: z.number().min(0).max(100).optional(),
  teacherInChargeId: z.string().uuid().optional(),
  date: z.string().min(1, 'Exam date is required'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timeLimit: z.number().min(1).optional(),
  timerMode: z.enum(['individual', 'global']).default('individual'),
  instructions: z.string().optional(),
  isPublished: z.boolean().default(false),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  allowRetakes: z.boolean().default(false),
  autoGradingEnabled: z.boolean().default(true),
  instantFeedback: z.boolean().default(false),
  showCorrectAnswers: z.boolean().default(false),
  enableProctoring: z.boolean().default(false),
  lockdownMode: z.boolean().default(false),
  requireWebcam: z.boolean().default(false),
  requireFullscreen: z.boolean().default(false),
  maxTabSwitches: z.number().min(0).max(10).default(3),
});

type CreateExamFormData = z.infer<typeof createExamSchema>;

interface CollapsibleSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isComplete?: boolean;
}

function CollapsibleSection({ title, description, icon, isOpen, onToggle, children, isComplete }: CollapsibleSectionProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md border-border">
      <CardHeader 
        className="cursor-pointer bg-gradient-to-r from-background to-muted/20 hover:bg-muted/30 transition-colors"
        onClick={onToggle}
        data-testid={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {title}
                {isComplete && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <CardContent className="pt-6 space-y-4">
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function CreateExam() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [openSections, setOpenSections] = useState<string[]>(['basic']);
  const [showPreview, setShowPreview] = useState(false);

  if (!user) {
    return <div>Loading...</div>;
  }

  const userRole = 'teacher' as 'admin' | 'teacher' | 'student' | 'parent';
  const userName = `${user.firstName} ${user.lastName}`;
  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;

  if (user.roleId !== 2) {
    navigate('/portal/teacher/dashboard');
    return null;
  }

  const form = useForm<CreateExamFormData>({
    resolver: zodResolver(createExamSchema),
    defaultValues: {
      examType: 'exam',
      timerMode: 'individual',
      totalMarks: 100,
      passingScore: 60,
      timeLimit: 60,
      isPublished: false,
      shuffleQuestions: false,
      shuffleOptions: false,
      allowRetakes: false,
      autoGradingEnabled: true,
      instantFeedback: false,
      showCorrectAnswers: false,
      enableProctoring: false,
      lockdownMode: false,
      requireWebcam: false,
      requireFullscreen: false,
      maxTabSwitches: 3,
    },
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/classes');
      return await response.json();
    },
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subjects');
      return await response.json();
    },
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['/api/terms'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/terms');
      return await response.json();
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['/api/users', 'Teacher'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users?role=Teacher');
      return await response.json();
    },
  });

  const createExamMutation = useMutation({
    mutationFn: async (data: CreateExamFormData) => {
      const response = await apiRequest('POST', '/api/exams', {
        ...data,
        createdBy: user.id,
      });
      if (!response.ok) throw new Error('Failed to create exam');
      return response.json();
    },
    onMutate: () => {
      // INSTANT FEEDBACK: Show creating toast immediately
      toast({
        title: 'Creating Exam...',
        description: 'Setting up your new exam',
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Exam Created Successfully!',
        description: `"${data.name}" has been created. You can now add questions.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      navigate(`/portal/teacher/exams/${data.id}/questions`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error Creating Exam',
        description: error.message || 'Failed to create exam. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const onSubmit = (data: CreateExamFormData) => {
    createExamMutation.mutate(data);
  };

  const onSaveDraft = () => {
    const data = form.getValues();
    createExamMutation.mutate({ ...data, isPublished: false });
  };

  const formValues = form.watch();
  const isSectionComplete = (section: string) => {
    switch (section) {
      case 'basic':
        return !!(formValues.name && formValues.classId && formValues.subjectId && formValues.termId && formValues.examType && formValues.totalMarks);
      case 'scheduling':
        return !!(formValues.date && formValues.timeLimit);
      case 'instructions':
        return true;
      case 'settings':
        return true;
      case 'proctoring':
        return true;
      default:
        return false;
    }
  };

  return (
    <PortalLayout userRole={userRole} userName={userName} userInitials={userInitials}>
      <div className="max-w-5xl mx-auto py-8 px-4" data-testid="create-exam-page">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
                Create New Exam
              </h1>
              <p className="text-muted-foreground mt-2">
                Design a comprehensive exam with modern features, security, and automatic grading.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/portal/teacher/exams')}
              data-testid="button-cancel"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
          <Separator className="mt-4" />
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CollapsibleSection
            title="Basic Exam Details"
            description="Essential information about the exam"
            icon={<FileText className="w-5 h-5" />}
            isOpen={openSections.includes('basic')}
            onToggle={() => toggleSection('basic')}
            isComplete={isSectionComplete('basic')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Exam Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Mid-Term Mathematics Test"
                  {...form.register('name')}
                  data-testid="input-exam-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="examType">
                  Assessment Type <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="examType"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger data-testid="select-exam-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="test">Test (40 marks)</SelectItem>
                        <SelectItem value="exam">Exam (60 marks)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.examType && (
                  <p className="text-sm text-destructive">{form.formState.errors.examType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="classId">
                  Class / Grade <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="classId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={(value) => field.onChange(Number(value))}>
                      <SelectTrigger data-testid="select-class">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls: any) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.classId && (
                  <p className="text-sm text-destructive">{form.formState.errors.classId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectId">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="subjectId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={(value) => field.onChange(Number(value))}>
                      <SelectTrigger data-testid="select-subject">
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
                {form.formState.errors.subjectId && (
                  <p className="text-sm text-destructive">{form.formState.errors.subjectId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="termId">
                  Academic Term <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="termId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={(value) => field.onChange(Number(value))}>
                      <SelectTrigger data-testid="select-term">
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
                {form.formState.errors.termId && (
                  <p className="text-sm text-destructive">{form.formState.errors.termId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalMarks">
                  Total Marks <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="totalMarks"
                  type="number"
                  placeholder="100"
                  {...form.register('totalMarks', { valueAsNumber: true })}
                  data-testid="input-total-marks"
                />
                {form.formState.errors.totalMarks && (
                  <p className="text-sm text-destructive">{form.formState.errors.totalMarks.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passingScore">Passing Score (%)</Label>
                <Input
                  id="passingScore"
                  type="number"
                  placeholder="60"
                  {...form.register('passingScore', { valueAsNumber: true })}
                  data-testid="input-passing-score"
                />
                {form.formState.errors.passingScore && (
                  <p className="text-sm text-destructive">{form.formState.errors.passingScore.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacherInChargeId">Teacher In-Charge</Label>
                <Controller
                  name="teacherInChargeId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger data-testid="select-teacher-in-charge">
                        <SelectValue placeholder="Select teacher (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher: any) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.firstName} {teacher.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Scheduling & Duration"
            description="Set exam timing and availability"
            icon={<Calendar className="w-5 h-5" />}
            isOpen={openSections.includes('scheduling')}
            onToggle={() => toggleSection('scheduling')}
            isComplete={isSectionComplete('scheduling')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Exam Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  {...form.register('date')}
                  data-testid="input-exam-date"
                />
                {form.formState.errors.date && (
                  <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeLimit">
                  Duration (minutes) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="timeLimit"
                  type="number"
                  placeholder="60"
                  {...form.register('timeLimit', { valueAsNumber: true })}
                  data-testid="input-time-limit"
                />
                {form.formState.errors.timeLimit && (
                  <p className="text-sm text-destructive">{form.formState.errors.timeLimit.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  {...form.register('startTime')}
                  data-testid="input-start-time"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...form.register('endTime')}
                  data-testid="input-end-time"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="timerMode">Timer Mode</Label>
                <Controller
                  name="timerMode"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger data-testid="select-timer-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">
                          Individual Timer - Each student gets full duration when they start
                        </SelectItem>
                        <SelectItem value="global">
                          Fixed Timer - All students start and end at the same time
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {formValues.timerMode === 'individual' 
                    ? 'Students can start at different times and each gets the full duration'
                    : 'All students must complete the exam within the specified time window'}
                </p>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Instructions & Rules"
            description="Add exam guidelines for students"
            icon={<BookOpen className="w-5 h-5" />}
            isOpen={openSections.includes('instructions')}
            onToggle={() => toggleSection('instructions')}
            isComplete={isSectionComplete('instructions')}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instructions">Exam Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Enter detailed instructions for students (e.g., allowed materials, rules, etc.)"
                  rows={6}
                  {...form.register('instructions')}
                  data-testid="input-instructions"
                />
                <p className="text-xs text-muted-foreground">
                  Provide clear guidelines about what students should know before taking the exam
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Pro Tip: Include Essential Information
                    </p>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 ml-4 list-disc">
                      <li>Required materials (calculator, formula sheet, etc.)</li>
                      <li>Exam format and question types</li>
                      <li>Grading criteria and expectations</li>
                      <li>Academic integrity reminders</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Exam Settings"
            description="Configure display and behavior options"
            icon={<Settings className="w-5 h-5" />}
            isOpen={openSections.includes('settings')}
            onToggle={() => toggleSection('settings')}
            isComplete={isSectionComplete('settings')}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublished">Publish Immediately</Label>
                  <p className="text-xs text-muted-foreground">
                    Make exam visible to students right away
                  </p>
                </div>
                <Controller
                  name="isPublished"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="isPublished"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-published"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
                  <p className="text-xs text-muted-foreground">
                    Randomize question order for each student
                  </p>
                </div>
                <Controller
                  name="shuffleQuestions"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="shuffleQuestions"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-shuffle-questions"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="shuffleOptions">Shuffle Options</Label>
                  <p className="text-xs text-muted-foreground">
                    Randomize answer option order (A, B, C, D)
                  </p>
                </div>
                <Controller
                  name="shuffleOptions"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="shuffleOptions"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-shuffle-options"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="allowRetakes">Allow Retakes</Label>
                  <p className="text-xs text-muted-foreground">
                    Students can attempt the exam multiple times
                  </p>
                </div>
                <Controller
                  name="allowRetakes"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="allowRetakes"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-allow-retakes"
                    />
                  )}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="space-y-0.5">
                  <Label htmlFor="autoGradingEnabled">Enable Auto-Grading</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically grade objective questions
                  </p>
                </div>
                <Controller
                  name="autoGradingEnabled"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="autoGradingEnabled"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-auto-grading"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="instantFeedback">Instant Feedback</Label>
                  <p className="text-xs text-muted-foreground">
                    Show correct/incorrect immediately after answering
                  </p>
                </div>
                <Controller
                  name="instantFeedback"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="instantFeedback"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-instant-feedback"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="showCorrectAnswers">Show Correct Answers</Label>
                  <p className="text-xs text-muted-foreground">
                    Display correct answers after submission
                  </p>
                </div>
                <Controller
                  name="showCorrectAnswers"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="showCorrectAnswers"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-show-correct-answers"
                    />
                  )}
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Proctoring & Security"
            description="Ensure exam integrity and prevent cheating"
            icon={<Lock className="w-5 h-5" />}
            isOpen={openSections.includes('proctoring')}
            onToggle={() => toggleSection('proctoring')}
            isComplete={isSectionComplete('proctoring')}
          >
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Security Settings
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      These options help maintain exam integrity for online assessments. Enable as needed based on your exam requirements.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="enableProctoring">Enable Proctoring</Label>
                  <p className="text-xs text-muted-foreground">
                    Monitor student activity during exam
                  </p>
                </div>
                <Controller
                  name="enableProctoring"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="enableProctoring"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-enable-proctoring"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="lockdownMode">Lockdown Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Disable copy, paste, and new tabs
                  </p>
                </div>
                <Controller
                  name="lockdownMode"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="lockdownMode"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-lockdown-mode"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="requireWebcam">Require Webcam</Label>
                  <p className="text-xs text-muted-foreground">
                    Enforce live video feed during exam
                  </p>
                </div>
                <Controller
                  name="requireWebcam"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="requireWebcam"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-require-webcam"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="requireFullscreen">Require Fullscreen Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Prevent multitasking during exam
                  </p>
                </div>
                <Controller
                  name="requireFullscreen"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id="requireFullscreen"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-require-fullscreen"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTabSwitches">Maximum Tab Switches</Label>
                <Input
                  id="maxTabSwitches"
                  type="number"
                  min="0"
                  max="10"
                  {...form.register('maxTabSwitches', { valueAsNumber: true })}
                  data-testid="input-max-tab-switches"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-submit exam after this many violations (default: 3)
                </p>
              </div>
            </div>
          </CollapsibleSection>

          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Ready to Create Exam?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Review your settings and create the exam. You can add questions next.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onSaveDraft}
                    disabled={createExamMutation.isPending}
                    data-testid="button-save-draft"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button
                    type="submit"
                    disabled={createExamMutation.isPending}
                    data-testid="button-create-exam"
                  >
                    {createExamMutation.isPending ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Create Exam & Add Questions
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </PortalLayout>
  );
}

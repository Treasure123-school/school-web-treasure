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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Search, BookOpen, Users, TrendingUp, Clock, GraduationCap, Edit, Eye, Filter, Download, Upload, CheckCircle, XCircle, AlertCircle, FileText, MessageSquare, Star, RefreshCw, BarChart3, ClipboardCheck, Trophy, Signature } from 'lucide-react';

const examSchema = z.object({
  name: z.string().min(1, 'Exam name is required'),
  classId: z.number().min(1, 'Class is required'),
  subjectId: z.number().min(1, 'Subject is required'),
  totalMarks: z.number().min(1, 'Total marks must be at least 1'),
  date: z.string().min(1, 'Date is required'),
  termId: z.number().min(1, 'Term is required'),
});

const gradeSchema = z.object({
  marksObtained: z.number().min(0, 'Marks cannot be negative'),
  grade: z.string().optional(),
  remarks: z.string().optional(),
});

type ExamFormData = z.infer<typeof examSchema>;
type GradeFormData = z.infer<typeof gradeSchema>;

export default function TeacherGrades() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGradingTask, setSelectedGradingTask] = useState<any>(null);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [selectedStudentForGrading, setSelectedStudentForGrading] = useState<any>(null);

  if (!user) {
    return <div>Loading...</div>;
  }

  const userName = `${user.firstName} ${user.lastName}`;
  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;
  const userRole = (user.role?.toLowerCase() || 'teacher') as 'admin' | 'teacher' | 'student' | 'parent';

  // Form handlers
  const examForm = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      name: '',
      classId: 0,
      subjectId: 0,
      totalMarks: 100,
      date: '',
      termId: 1,
    },
  });

  const gradeForm = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      marksObtained: 0,
      grade: '',
      remarks: '',
    },
  });

  // Fetch exams
  const { data: exams = [], isLoading: loadingExams } = useQuery({
    queryKey: ['/api/exams'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/exams');
      return await response.json();
    },
  });

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/classes');
      return await response.json();
    },
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subjects');
      return await response.json();
    },
  });

  // Fetch students for selected class when grading
  const { data: students = [] } = useQuery({
    queryKey: ['/api/students', selectedExam?.classId],
    queryFn: async () => {
      if (!selectedExam?.classId) return [];
      const response = await apiRequest('GET', `/api/students?classId=${selectedExam.classId}`);
      return await response.json();
    },
    enabled: !!selectedExam?.classId,
  });

  // Fetch users to get student details
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return await response.json();
    },
  });

  // Fetch exam results for selected exam
  const { data: examResults = [] } = useQuery({
    queryKey: ['/api/exam-results/exam', selectedExam?.id],
    queryFn: async () => {
      if (!selectedExam?.id) return [];
      const response = await apiRequest('GET', `/api/exam-results/exam/${selectedExam.id}`);
      return await response.json();
    },
    enabled: !!selectedExam?.id,
  });

  // Fetch essay submissions needing review
  const { data: essaySubmissions = [] } = useQuery({
    queryKey: ['/api/essay-submissions', selectedExam?.id],
    queryFn: async () => {
      if (!selectedExam?.id) return [];
      const response = await apiRequest('GET', `/api/essay-submissions/${selectedExam.id}`);
      return await response.json();
    },
    enabled: !!selectedExam?.id,
  });

  // Fetch student answers that need manual grading
  const { data: pendingAnswers = [] } = useQuery({
    queryKey: ['/api/student-answers/pending-review', selectedExam?.id],
    queryFn: async () => {
      if (!selectedExam?.id) return [];
      const response = await apiRequest('GET', `/api/student-answers/pending-review/${selectedExam.id}`);
      return await response.json();
    },
    enabled: !!selectedExam?.id,
  });

  // Fetch grading statistics
  const { data: gradingStats } = useQuery({
    queryKey: ['/api/grading/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/grading/stats');
      if (!response.ok) {
        return { pendingTasks: 0, gradedToday: 0, avgTimePerTask: 0 };
      }
      return response.json();
    },
  });

  // Fetch pending grading tasks
  const { data: gradingTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['/api/grading/tasks'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/grading/tasks?status=pending&limit=100');
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch answers for grading when task is selected
  const { data: gradingAnswers = [] } = useQuery({
    queryKey: ['/api/grading/answers', selectedGradingTask?.session_id],
    queryFn: async () => {
      if (!selectedGradingTask?.session_id) return [];
      const response = await apiRequest('GET', `/api/grading/answers/${selectedGradingTask.session_id}`);
      if (!response.ok) throw new Error('Failed to fetch answers');
      return response.json();
    },
    enabled: !!selectedGradingTask?.session_id,
  });

  // Create exam mutation
  const createExamMutation = useMutation({
    mutationFn: async (examData: ExamFormData) => {
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
      setIsCreateDialogOpen(false);
      examForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create exam",
        variant: "destructive",
      });
    },
  });

  // Record grade mutation
  const recordGradeMutation = useMutation({
    mutationFn: async (data: GradeFormData) => {
      const response = await apiRequest('POST', '/api/exam-results', {
        examId: selectedExam.id,
        studentId: selectedStudentForGrading.id,
        ...data,
        recordedBy: user.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Grade recorded successfully',
      });
      // Invalidate the specific exam results cache and exams cache
      queryClient.invalidateQueries({ queryKey: ['/api/exam-results/exam', selectedExam.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      setIsGradeDialogOpen(false);
      setSelectedStudentForGrading(null);
      gradeForm.reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to record grade',
        variant: 'destructive',
      });
    },
  });

  // Grade answer mutation
  const gradeAnswerMutation = useMutation({
    mutationFn: async ({ answerId, pointsEarned, feedbackText, maxPoints }: {
      answerId: number;
      pointsEarned: number;
      feedbackText: string;
      maxPoints: number;
    }) => {
      const response = await apiRequest('POST', `/api/grading/answers/${answerId}/grade`, {
        pointsEarned,
        feedbackText,
        maxPoints
      });
      if (!response.ok) throw new Error('Failed to grade answer');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Answer Graded",
        description: `Successfully graded answer. ${data.remainingTasks} tasks remaining.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/grading/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/grading/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/grading/answers', selectedGradingTask?.session_id] });

      if (data.remainingTasks === 0) {
        toast({
          title: "Session Complete!",
          description: "All manual grading for this session is complete. Final results have been generated.",
        });
        setSelectedGradingTask(null); // Clear selected task when session is done
        setGradingDialogOpen(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Grading Error",
        description: error.message || "Failed to grade answer",
        variant: "destructive",
      });
    },
  });

  // Calculate grade based on percentage
  const calculateGrade = (marks: number, total: number) => {
    const percentage = (marks / total) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'F';
  };

  // Get enriched students with user details and exam results
  const enrichedStudents = students.map((student: any) => {
    const userDetails = users.find((u: any) => u.id === student.id);
    const result = examResults.find((r: any) => r.studentId === student.id);

    return {
      ...student,
      user: userDetails,
      result,
    };
  });

  // Get class and subject names for display
  const getClassName = (classId: number) => {
    const cls = classes.find((c: any) => c.id === classId);
    return cls ? cls.name : 'Unknown Class';
  };

  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find((s: any) => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  const onExamSubmit = (data: ExamFormData) => {
    createExamMutation.mutate(data);
  };

  const onGradeSubmit = (data: GradeFormData) => {
    const calculatedGrade = calculateGrade(data.marksObtained, selectedExam.totalMarks);
    recordGradeMutation.mutate({
      ...data,
      grade: calculatedGrade,
    });
  };

  const startGrading = (student: any) => {
    setSelectedStudentForGrading(student);
    setIsGradeDialogOpen(true);
    gradeForm.reset({
      marksObtained: 0,
      grade: '',
      remarks: '',
    });
  };

  const openGradingDialog = (task: any) => {
    setSelectedGradingTask(task);
    setGradingDialogOpen(true);
  };

  const handleGradeAnswer = (answerId: number, pointsEarned: number, feedbackText: string, maxPoints: number) => {
    gradeAnswerMutation.mutate({ answerId, pointsEarned, feedbackText, maxPoints });
  };

  return (
    <PortalLayout 
      userRole={userRole} 
      userName={userName}
      userInitials={userInitials}
    >
      <div className="space-y-6" data-testid="teacher-grades">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grades & Exams</h1>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              data-testid="button-create-exam"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Exam
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="grading">Grading</TabsTrigger>
            <TabsTrigger value="queue">
              Grading Queue 
              {gradingTasks.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {gradingTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{exams.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Grading Tasks</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{gradingStats?.pendingTasks || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasks Graded Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{gradingStats?.gradedToday || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Time Per Task</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{gradingStats?.avgTimePerTask || 0}s</div>
                </CardContent>
              </Card>
            </div>

            {/* Grading Queue Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Manual Grading Queue
                  </span>
                  <Button size="sm" onClick={() => setActiveTab('queue')} variant="outline">View Queue</Button>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Tasks currently waiting for manual review and grading.
                </p>
              </CardHeader>
              <CardContent>
                {loadingTasks ? (
                  <div className="text-center py-8">Loading grading tasks...</div>
                ) : gradingTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Pending Grading Tasks</h3>
                    <p className="text-muted-foreground mb-4">
                      All assigned grading tasks are up to date.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Exam</TableHead>
                        <TableHead>Question Type</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gradingTasks.slice(0, 5).map((task: any) => (
                        <TableRow key={task.session_id} data-testid={`row-grading-task-${task.session_id}`}>
                          <TableCell className="font-medium">
                            {task.studentName || 'N/A'}
                          </TableCell>
                          <TableCell>{task.examName || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{task.questionType}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(task.submissionTime), 'MMM dd, HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => openGradingDialog(task)}>
                              <Edit className="w-4 h-4" /> Grade
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Exam Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingExams ? (
                  <div className="text-center py-8">Loading exams...</div>
                ) : exams.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Exams Created</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first exam to start managing student assessments.
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Exam
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total Marks</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams.map((exam: any) => (
                        <TableRow key={exam.id} data-testid={`row-exam-${exam.id}`}>
                          <TableCell className="font-medium">
                            {exam.name}
                          </TableCell>
                          <TableCell>{getClassName(exam.classId)}</TableCell>
                          <TableCell>{getSubjectName(exam.subjectId)}</TableCell>
                          <TableCell>
                            {format(new Date(exam.date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>{exam.totalMarks}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedExam(exam);
                                  setActiveTab('grading');
                                }}
                                data-testid={`button-grade-${exam.id}`}
                              >
                                <GraduationCap className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-view-${exam.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-edit-${exam.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grading" className="space-y-4">
            {selectedExam ? (
              <div className="space-y-4">
                {/* Comprehensive Grade Entry */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <BookOpen className="w-5 h-5 mr-2" />
                        Comprehensive Grade Entry
                      </span>
                      <Badge variant="secondary">
                        Test (40%) + Exam (60%) = Total (100%)
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Enter both test and exam scores for comprehensive student assessment
                    </p>
                  </CardHeader>
                  <CardContent>
                    {/* Placeholder for student selection or single student view */}
                    {enrichedStudents.length > 0 ? (
                      <TestExamGradeEntry 
                        student={enrichedStudents[0]} // Placeholder: Implement student selection
                        subjects={subjects}
                        term={{ id: selectedExam.termId, name: 'Current Term' }} // Placeholder: Fetch actual term
                        onGradeSubmitted={() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/exam-results'] });
                          toast({ title: "Success", description: "Grade recorded successfully" });
                        }}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Students Found</h3>
                        <p className="text-muted-foreground">
                          There are no students associated with this exam's class.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Digital Exam Grading */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <GraduationCap className="w-5 h-5 mr-2" />
                        Digital Exam Results - {selectedExam.name}
                      </span>
                      <Badge variant="secondary">
                        {getClassName(selectedExam.classId)} • {getSubjectName(selectedExam.subjectId)}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Review and finalize digital exam submissions
                    </p>
                  </CardHeader>
                  <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Admission Number</TableHead>
                        <TableHead>Current Grade</TableHead>
                        <TableHead>Marks Obtained</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrichedStudents.map((student: any) => (
                        <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                          <TableCell className="font-medium">
                            {student.user?.firstName} {student.user?.lastName}
                          </TableCell>
                          <TableCell className="font-mono">
                            {student.admissionNumber}
                          </TableCell>
                          <TableCell>
                            {student.result ? (
                              <Badge variant="secondary">
                                {student.result.grade}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Not graded</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.result ? (
                              `${student.result.marksObtained}/${selectedExam.totalMarks}`
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={student.result ? "outline" : "default"}
                              onClick={() => startGrading(student)}
                              data-testid={`button-grade-student-${student.id}`}
                            >
                              {student.result ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select an Exam to Grade</h3>
                  <p className="text-muted-foreground">
                    Go to the "My Exams" tab and click the grade button on an exam to start grading students.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="essay-review" className="space-y-4">
            {selectedExam ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Essay Review - {selectedExam.name}
                    </span>
                    <Badge variant="secondary">
                      {pendingAnswers.filter((a: any) => a.questionType === 'essay').length} essays pending
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingAnswers.filter((a: any) => a.questionType === 'essay').length > 0 ? (
                    <div className="space-y-4">
                      {pendingAnswers.filter((a: any) => a.questionType === 'essay').map((answer: any) => (
                        <Card key={answer.id} className="border-l-4 border-l-orange-500">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium">{answer.studentName}</h4>
                                <p className="text-sm text-muted-foreground">Question {answer.questionNumber}</p>
                              </div>
                              <Badge variant="outline">{answer.points} points</Badge>
                            </div>
                            <div className="mb-3">
                              <p className="font-medium text-sm mb-2">Question:</p>
                              <p className="text-sm bg-muted p-2 rounded">{answer.questionText}</p>
                            </div>
                            <div className="mb-4">
                              <p className="font-medium text-sm mb-2">Student Answer:</p>
                              <div className="bg-gray-50 p-3 rounded border">
                                <p className="whitespace-pre-wrap">{answer.textAnswer || 'No answer provided'}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Input 
                                type="number" 
                                placeholder="Points earned" 
                                className="w-32"
                                min="0"
                                max={answer.points}
                              />
                              <Input 
                                placeholder="Feedback (optional)" 
                                className="flex-1"
                              />
                              <Button size="sm">Save Grade</Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Essays to Review</h3>
                      <p className="text-muted-foreground">
                        All essay questions for this exam have been graded.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select an Exam to Review Essays</h3>
                  <p className="text-muted-foreground">
                    Choose an exam from the "My Exams" tab to review essay submissions.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="queue" className="space-y-4">
            <Card className="border-blue-100 dark:border-blue-900 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center text-blue-900 dark:text-blue-100">
                    <ClipboardCheck className="w-5 h-5 mr-2" />
                    Auto-Grading Queue
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" className="border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/grading/tasks'] })}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setActiveTab('overview')}>
                      Back to Overview
                    </Button>
                  </div>
                </CardTitle>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Review and grade pending student submissions requiring manual review
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                {loadingTasks ? (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">Loading grading tasks...</p>
                    </div>
                  </div>
                ) : gradingTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      No pending grading tasks at the moment. Great job keeping up!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{gradingTasks.length} Task{gradingTasks.length !== 1 ? 's' : ''} Pending</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Click "Grade" to review and score submissions</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-900">
                          <TableRow>
                            <TableHead className="font-semibold">Student</TableHead>
                            <TableHead className="font-semibold">Exam</TableHead>
                            <TableHead className="font-semibold">Type</TableHead>
                            <TableHead className="font-semibold">Submitted</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {gradingTasks.map((task: any) => (
                            <TableRow 
                              key={task.session_id} 
                              data-testid={`row-grading-task-${task.session_id}`}
                              className="hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                    {task.studentName?.charAt(0) || 'S'}
                                  </div>
                                  {task.studentName || 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-700 dark:text-gray-300">{task.examName || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">
                                  {task.questionType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-600 dark:text-gray-400 text-sm">
                                {format(new Date(task.submissionTime), 'MMM dd, HH:mm')}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={task.status === 'pending' ? 'destructive' : task.status === 'graded' ? 'default' : 'secondary'}
                                  className={task.status === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                                >
                                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  size="sm" 
                                  className="bg-blue-600 hover:bg-blue-700 text-white" 
                                  onClick={() => openGradingDialog(task)} 
                                  disabled={task.status !== 'pending'}
                                >
                                  <Edit className="w-4 h-4 mr-1" /> Grade
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report-finalization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Student Report Finalization
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review, finalize, and approve student report cards with teacher remarks and signatures.
                </p>
              </CardHeader>
              <CardContent>
                {selectedExam ? (
                  <StudentReportFinalization 
                    exam={selectedExam} 
                    students={enrichedStudents}
                    onReportFinalized={() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/exam-results'] });
                      toast({ title: "Success", description: "Report finalized successfully" });
                    }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select an Exam to Finalize Reports</h3>
                    <p className="text-muted-foreground">
                      Choose an exam from the "My Exams" tab to review and finalize student report cards.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Exams</p>
                      <p className="text-2xl font-bold">{exams.length}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                      <p className="text-2xl font-bold">{examResults.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-secondary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                      <p className="text-2xl font-bold">
                        {examResults.length > 0 
                          ? Math.round(examResults.reduce((sum: number, r: any) => sum + (r.score || r.marksObtained || 0), 0) / examResults.length)
                          : 0}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                      <p className="text-2xl font-bold">
                        {examResults.length > 0 
                          ? Math.round((examResults.filter((r: any) => (r.score || r.marksObtained || 0) >= 50).length / examResults.length) * 100)
                          : 0}%
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time Submission Tracking */}
            {selectedExam && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Live Exam Results - {selectedExam.name}
                    </span>
                    <Badge variant="outline">
                      {examResults.length} / {enrichedStudents.length} submitted
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Grade Distribution */}
                    <div>
                      <h4 className="font-medium mb-2">Grade Distribution</h4>
                      <div className="grid grid-cols-5 gap-2 text-sm">
                        {['A+', 'A', 'B', 'C', 'F'].map(grade => {
                          const count = examResults.filter((r: any) => {
                            const score = (r.score || r.marksObtained || 0);
                            const percentage = (score / selectedExam.totalMarks) * 100;
                            if (grade === 'A+') return percentage >= 90;
                            if (grade === 'A') return percentage >= 80 && percentage < 90;
                            if (grade === 'B') return percentage >= 60 && percentage < 80;
                            if (grade === 'C') return percentage >= 50 && percentage < 60;
                            return percentage < 50;
                          }).length;
                          return (
                            <div key={grade} className="text-center p-2 bg-muted rounded">
                              <div className="font-bold">{grade}</div>
                              <div className="text-xs text-muted-foreground">{count}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recent Submissions */}
                    <div>
                      <h4 className="font-medium mb-2">Recent Submissions</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {examResults
                          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 5)
                          .map((result: any) => {
                            const student = enrichedStudents.find((s: any) => s.id === result.studentId);
                            const score = result.score || result.marksObtained || 0;
                            const percentage = Math.round((score / selectedExam.totalMarks) * 100);
                            return (
                              <div key={result.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <span className="text-sm">
                                  {student?.user?.firstName} {student?.user?.lastName}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">
                                    {score}/{selectedExam.totalMarks}
                                  </span>
                                  <Badge 
                                    variant={percentage >= 70 ? "default" : percentage >= 50 ? "secondary" : "destructive"}
                                    className="text-xs"
                                  >
                                    {percentage}%
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {examResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Top Performers</h4>
                      <div className="space-y-2">
                        {examResults
                          .map((result: any) => {
                            const student = users.find((u: any) => u.id === result.studentId);
                            return {
                              ...result,
                              studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
                              percentage: Math.round(((result.score || result.marksObtained || 0) / (result.maxScore || 100)) * 100)
                            };
                          })
                          .sort((a: any, b: any) => b.percentage - a.percentage)
                          .slice(0, 3)
                          .map((result: any, index: number) => (
                            <div key={result.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                              <div className="flex items-center space-x-2">
                                <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">
                                  {index + 1}
                                </span>
                                <span className="text-sm font-medium">{result.studentName}</span>
                              </div>
                              <span className="text-sm font-bold text-green-600">{result.percentage}%</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Students Needing Support</h4>
                      <div className="space-y-2">
                        {examResults
                          .map((result: any) => {
                            const student = users.find((u: any) => u.id === result.studentId);
                            return {
                              ...result,
                              studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
                              percentage: Math.round(((result.score || result.marksObtained || 0) / (result.maxScore || 100)) * 100)
                            };
                          })
                          .filter((result: any) => result.percentage < 60)
                          .sort((a: any, b: any) => a.percentage - b.percentage)
                          .slice(0, 3)
                          .map((result: any) => (
                            <div key={result.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                              <span className="text-sm font-medium">{result.studentName}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-red-600">{result.percentage}%</span>
                                <Button size="sm" variant="outline" className="text-xs">
                                  Support Plan
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Exam Results Yet</h3>
                    <p className="text-muted-foreground">
                      Performance insights will appear once students submit their exams.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Exam Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]" data-testid="dialog-create-exam">
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
              <DialogDescription>
                Create a new exam for your students. Fill in all the required details.
              </DialogDescription>
            </DialogHeader>
            <Form {...examForm}>
              <form onSubmit={examForm.handleSubmit(onExamSubmit)} className="space-y-4">
                <FormField
                  control={examForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Mid-term Mathematics Test" {...field} data-testid="input-exam-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={examForm.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-class">
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes.map((cls: any) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={examForm.control}
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-subject">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map((subject: any) => (
                              <SelectItem key={subject.id} value={subject.id.toString()}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={examForm.control}
                    name="totalMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Marks</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="100" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-total-marks"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={examForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-exam-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createExamMutation.isPending}
                    data-testid="button-save-exam"
                  >
                    {createExamMutation.isPending ? 'Creating...' : 'Create Exam'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Grade Student Dialog */}
        <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
          <DialogContent className="sm:max-w-[425px]" data-testid="dialog-grade-student">
            <DialogHeader>
              <DialogTitle>
                Record Grade - {selectedStudentForGrading?.user?.firstName} {selectedStudentForGrading?.user?.lastName}
              </DialogTitle>
              <DialogDescription>
                Enter the marks obtained by the student for {selectedExam?.name}.
              </DialogDescription>
            </DialogHeader>
            <Form {...gradeForm}>
              <form onSubmit={gradeForm.handleSubmit(onGradeSubmit)} className="space-y-4">
                <FormField
                  control={gradeForm.control}
                  name="marksObtained"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marks Obtained (out of {selectedExam?.totalMarks})</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          min="0"
                          max={selectedExam?.totalMarks}
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-marks-obtained"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={gradeForm.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Excellent work, Need improvement in..." 
                          {...field} 
                          data-testid="input-remarks"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={recordGradeMutation.isPending}
                    data-testid="button-save-grade"
                  >
                    {recordGradeMutation.isPending ? 'Recording...' : 'Record Grade'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Grading Task Dialog */}
        <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
          <DialogContent className="sm:max-w-[650px] lg:max-w-[850px] max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 -m-6 mb-6 rounded-t-lg">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <ClipboardCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                Grade Answer - {selectedGradingTask?.studentName}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-4 text-sm mt-2">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {selectedGradingTask?.examName}
                </span>
                <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">
                  {selectedGradingTask?.questionType}
                </Badge>
              </DialogDescription>
            </DialogHeader>
            {gradingAnswers.length > 0 ? (
              <div className="space-y-6">
                {gradingAnswers.map((answer: any, index: number) => (
                  <Card key={answer.id} className="border-blue-100 dark:border-blue-900">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base text-gray-900 dark:text-white mb-1">
                            Question {answer.questionNumber}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {answer.questionText}
                          </p>
                        </div>
                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white ml-3">
                          <Star className="h-3 w-3 mr-1" />
                          {answer.maxPoints} pts
                        </Badge>
                      </div>

                      <div className="mb-5 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <h5 className="font-semibold text-sm text-gray-900 dark:text-white">Student's Answer:</h5>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {answer.answerText || <span className="text-gray-400 italic">No answer provided</span>}
                        </p>
                      </div>

                      <div className="bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900 rounded-lg p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`points-earned-${answer.id}`} className="text-sm font-semibold flex items-center gap-1">
                              <Trophy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              Points Earned
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Input 
                                type="number" 
                                placeholder="0" 
                                defaultValue={answer.pointsEarned ?? 0} 
                                min="0"
                                max={answer.maxPoints}
                                className="w-24 text-base font-semibold border-blue-300 dark:border-blue-700 focus:border-blue-500"
                                id={`points-earned-${answer.id}`}
                              />
                              <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">/ {answer.maxPoints}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`feedback-${answer.id}`} className="text-sm font-semibold flex items-center gap-1">
                              <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              Teacher Feedback (Optional)
                            </Label>
                            <Textarea 
                              placeholder="Provide constructive feedback..." 
                              defaultValue={answer.feedbackText || ''}
                              rows={3}
                              id={`feedback-${answer.id}`}
                              className="text-sm border-blue-300 dark:border-blue-700 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end pt-2">
                          <Button 
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm"
                            onClick={() => {
                              const pointsInput = document.getElementById(`points-earned-${answer.id}`) as HTMLInputElement;
                              const feedbackTextarea = document.getElementById(`feedback-${answer.id}`) as HTMLTextAreaElement;
                              handleGradeAnswer(
                                answer.id,
                                parseInt(pointsInput.value),
                                feedbackTextarea.value,
                                answer.maxPoints
                              );
                            }}
                            disabled={gradeAnswerMutation.isPending}
                          >
                            {gradeAnswerMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Grading...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Submit Grade
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Loading Answers...</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Fetching the student's answers for grading.
                </p>
              </div>
            )}
            <DialogFooter className="mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setGradingDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  );
}

// Enhanced Test/Exam Grade Entry Component
function TestExamGradeEntry({ student, subjects, term, onGradeSubmitted }: {
  student: any;
  subjects: any[];
  term: any;
  onGradeSubmitted: () => void;
}) {
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [testScore, setTestScore] = useState<number>(0);
  const [examScore, setExamScore] = useState<number>(0);
  const [teacherRemarks, setTeacherRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateWeightedTotal = () => {
    const testWeighted = (testScore / 40) * 40; // Test out of 40
    const examWeighted = (examScore / 60) * 60; // Exam out of 60
    return Math.round(testWeighted + examWeighted);
  };

  const calculateGrade = (total: number) => {
    if (total >= 90) return 'A+';
    if (total >= 80) return 'A';
    if (total >= 70) return 'B+';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    return 'F';
  };

  const submitGrade = async () => {
    if (!selectedSubject) {
      toast({
        title: "Validation Error",
        description: "Please select a subject.",
        variant: "destructive",
      });
      return;
    }

    if (testScore < 0 || testScore > 40 || examScore < 0 || examScore > 60) {
      toast({
        title: "Invalid Scores",
        description: "Test score must be 0-40, Exam score must be 0-60.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const totalScore = calculateWeightedTotal();
      const grade = calculateGrade(totalScore);

      const response = await apiRequest('POST', '/api/comprehensive-grades', {
        studentId: student.id,
        subjectId: selectedSubject.id,
        termId: term.id,
        testScore,
        testMaxScore: 40,
        examScore,
        examMaxScore: 60,
        totalScore,
        grade,
        teacherRemarks,
        recordedBy: student.user?.id // Current teacher
      });

      if (response.ok) {
        toast({
          title: "Grade Recorded",
          description: `${selectedSubject.name}: ${totalScore}/100 (${grade}) recorded successfully.`,
        });
        onGradeSubmitted();
        setSelectedSubject(null);
        setTestScore(0);
        setExamScore(0);
        setTeacherRemarks('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record grade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const weightedTotal = calculateWeightedTotal();
  const finalGrade = calculateGrade(weightedTotal);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <GraduationCap className="w-5 h-5 mr-2" />
          Grade Entry - {student.user?.firstName} {student.user?.lastName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Record Test (40 marks) and Exam (60 marks) scores for comprehensive assessment
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subject Selection */}
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Select onValueChange={(value) => setSelectedSubject(subjects.find(s => s.id.toString() === value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject to grade" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject: any) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedSubject && (
          <>
            {/* Score Entry Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="testScore">Test Score (out of 40)</Label>
                <Input
                  id="testScore"
                  type="number"
                  min="0"
                  max="40"
                  value={testScore}
                  onChange={(e) => setTestScore(Number(e.target.value))}
                  placeholder="Enter test score"
                />
                <p className="text-xs text-muted-foreground">
                  Continuous assessment, assignments, quizzes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="examScore">Exam Score (out of 60)</Label>
                <Input
                  id="examScore"
                  type="number"
                  min="0"
                  max="60"
                  value={examScore}
                  onChange={(e) => setExamScore(Number(e.target.value))}
                  placeholder="Enter exam score"
                />
                <p className="text-xs text-muted-foreground">
                  Major examination, final assessment
                </p>
              </div>
            </div>

            {/* Calculated Results Preview */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium mb-3">Grade Calculation Preview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Test (40%)</p>
                  <p className="font-semibold text-lg">{testScore}/40</p>
                  <p className="text-xs">({Math.round((testScore/40)*100) || 0}%)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Exam (60%)</p>
                  <p className="font-semibold text-lg">{examScore}/60</p>
                  <p className="text-xs">({Math.round((examScore/60)*100) || 0}%)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Score</p>
                  <p className="font-semibold text-xl text-blue-600">{weightedTotal}/100</p>
                  <p className="text-xs">({Math.round(weightedTotal) || 0}%)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Final Grade</p>
                  <Badge 
                    variant={finalGrade.startsWith('A') ? "default" : finalGrade.startsWith('B') ? "secondary" : "destructive"}
                    className="text-lg font-bold"
                  >
                    {finalGrade}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Teacher Remarks */}
            <div>
              <Label htmlFor="teacherRemarks">Teacher's Remarks</Label>
              <Textarea
                id="teacherRemarks"
                value={teacherRemarks}
                onChange={(e) => setTeacherRemarks(e.target.value)}
                placeholder="Enter comments about the student's performance in this subject..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {teacherRemarks.length}/500 characters - These remarks will appear on the report card
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                onClick={submitGrade}
                disabled={isSubmitting || !selectedSubject || testScore < 0 || examScore < 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Recording...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Record Grade
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Student Report Finalization Component
function StudentReportFinalization({ exam, students, onReportFinalized }: {
  exam: any;
  students: any[];
  onReportFinalized: () => void;
}) {
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [teacherRemarks, setTeacherRemarks] = useState('');
  const [isFinalizingReport, setIsFinalizingReport] = useState(false);

  // Fetch all exam results for this exam to calculate comprehensive scores
  const { data: allExamResults = [] } = useQuery({
    queryKey: ['/api/exam-results/exam', exam.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/exam-results/exam/${exam.id}`);
      return await response.json();
    },
    enabled: !!exam.id,
  });

  // Fetch terms for report context
  const { data: terms = [] } = useQuery({
    queryKey: ['/api/terms'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/terms');
      return await response.json();
    },
  });

  const finalizeStudentReport = async () => {
    if (!selectedStudent || !teacherRemarks.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a student and provide teacher remarks.",
        variant: "destructive",
      });
      return;
    }

    setIsFinalizingReport(true);
    try {
      // Update the exam result with teacher finalization
      const response = await apiRequest('PATCH', `/api/exam-results/${selectedStudent.result?.id}`, {
        teacherRemarks: teacherRemarks,
        teacherFinalized: true,
        finalizedAt: new Date().toISOString(),
        finalizedBy: exam.createdBy,
      });

      if (response.ok) {
        toast({
          title: "Report Finalized",
          description: `Report for ${selectedStudent.user?.firstName} ${selectedStudent.user?.lastName} has been finalized.`,
        });
        onReportFinalized();
        setSelectedStudent(null);
        setTeacherRemarks('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to finalize report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFinalizingReport(false);
    }
  };

  const getStudentComprehensiveScore = (student: any) => {
    const result = allExamResults.find((r: any) => r.studentId === student.id);
    if (!result) return { testScore: 0, examScore: 0, total: 0, grade: 'F' };

    // For the comprehensive report, we need to calculate Test (40%) + Exam (60%)
    // This is a simplified version - in reality, you'd fetch all test and exam results for the term
    const rawScore = result.score || result.marksObtained || 0;
    const maxScore = result.maxScore || exam.totalMarks || 100;
    const percentage = Math.round((rawScore / maxScore) * 100);

    // Simulate test and exam breakdown (you would fetch this from actual test/exam results)
    const testScore = exam.examType === 'test' ? percentage : Math.round(percentage * 0.7); // Simulate test score
    const examScore = exam.examType === 'exam' ? percentage : Math.round(percentage * 1.2); // Simulate exam score

    // Calculate weighted total: Test (40%) + Exam (60%)
    const weightedTotal = Math.round((testScore * 0.4) + (examScore * 0.6));

    let grade = 'F';
    if (weightedTotal >= 90) grade = 'A+';
    else if (weightedTotal >= 80) grade = 'A';
    else if (weightedTotal >= 70) grade = 'B+';
    else if (weightedTotal >= 60) grade = 'B';
    else if (weightedTotal >= 50) grade = 'C';

    return {
      testScore: testScore,
      examScore: examScore, 
      total: weightedTotal,
      grade: grade,
      rawScore: rawScore,
      maxScore: maxScore
    };
  };

  return (
    <div className="space-y-6">
      {/* Students List for Report Finalization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Students - Report Finalization Status</span>
            <Badge variant="secondary">
              {exam.name} • {exam.examType?.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {students.map((student: any) => {
              const score = getStudentComprehensiveScore(student);
              const isFinalized = student.result?.teacherFinalized;

              return (
                <div 
                  key={student.id}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedStudent?.id === student.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedStudent(student);
                    setTeacherRemarks(student.result?.teacherRemarks || ''); // Pre-fill remarks if available
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      isFinalized ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium">
                        {student.user?.firstName} {student.user?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.admissionNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">
                        {score.total}% ({score.grade})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Test: {score.testScore}% | Exam: {score.examScore}%
                      </p>
                    </div>

                    {isFinalized ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Report Finalization Form */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Signature className="w-5 h-5 mr-2" />
              Finalize Report - {selectedStudent.user?.firstName} {selectedStudent.user?.lastName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Student Score Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Performance Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Test Score (40%)</p>
                  <p className="font-semibold">{getStudentComprehensiveScore(selectedStudent).testScore}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Exam Score (60%)</p>
                  <p className="font-semibold">{getStudentComprehensiveScore(selectedStudent).examScore}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Score</p>
                  <p className="font-semibold text-lg">{getStudentComprehensiveScore(selectedStudent).total}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Grade</p>
                  <Badge variant="default" className="font-semibold">
                    {getStudentComprehensiveScore(selectedStudent).grade}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Teacher Remarks */}
            <div>
              <Label htmlFor="teacherRemarks" className="text-base font-medium">
                Teacher's Remarks & Comments
              </Label>
              <textarea
                id="teacherRemarks"
                className="w-full mt-2 p-3 border rounded-lg resize-none h-24"
                placeholder="Enter your professional remarks about the student's performance, improvement areas, and recommendations..."
                value={teacherRemarks}
                onChange={(e) => setTeacherRemarks(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {teacherRemarks.length}/500 characters
              </p>
            </div>

            {/* Finalization Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <p>Once finalized, this report will be:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Available to students and parents</li>
                  <li>Included in the official transcript</li>
                  <li>Signed with your teacher credentials</li>
                </ul>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedStudent(null);
                    setTeacherRemarks('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={finalizeStudentReport}
                  disabled={isFinalizingReport || !teacherRemarks.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isFinalizingReport ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Finalizing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finalize Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
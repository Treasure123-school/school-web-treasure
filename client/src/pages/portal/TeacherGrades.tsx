import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import PortalLayout from '@/components/layout/PortalLayout';
import { useAuth } from '@/lib/auth';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  BookOpen, 
  Users, 
  TrendingUp,
  FileText,
  GraduationCap,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

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
  const [activeTab, setActiveTab] = useState('exams');

  if (!user) {
    return <div>Loading...</div>;
  }
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [selectedStudentForGrading, setSelectedStudentForGrading] = useState<any>(null);

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
    queryKey: ['/api/exam-sessions/exam', selectedExam?.id],
    queryFn: async () => {
      if (!selectedExam?.id) return [];
      const response = await apiRequest('GET', `/api/exam-sessions/exam/${selectedExam.id}`);
      const sessions = await response.json();
      
      // Filter for completed sessions that need essay review
      return sessions.filter((session: any) => 
        session.isCompleted && !session.fullyGraded
      );
    },
    enabled: !!selectedExam?.id,
  });

  // Create exam mutation
  const createExamMutation = useMutation({
    mutationFn: async (data: ExamFormData) => {
      const response = await apiRequest('POST', '/api/exams', {
        ...data,
        createdBy: user.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Exam created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
      setIsCreateDialogOpen(false);
      examForm.reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create exam',
        variant: 'destructive',
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

  return (
    <PortalLayout 
      userRole="teacher" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
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
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-grades">
            <TabsTrigger value="exams" data-testid="tab-exams">
              <BookOpen className="w-4 h-4 mr-2" />
              My Exams
            </TabsTrigger>
            <TabsTrigger value="grading" data-testid="tab-grading" disabled={!selectedExam}>
              <GraduationCap className="w-4 h-4 mr-2" />
              Grade Students
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <GraduationCap className="w-5 h-5 mr-2" />
                      Grade Students - {selectedExam.name}
                    </span>
                    <Badge variant="secondary">
                      {getClassName(selectedExam.classId)} • {getSubjectName(selectedExam.subjectId)}
                    </Badge>
                  </CardTitle>
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

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <p className="text-sm font-medium text-muted-foreground">Classes Taught</p>
                      <p className="text-2xl font-bold">{classes.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-secondary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Subjects</p>
                      <p className="text-2xl font-bold">{subjects.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Exam Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed performance analytics and charts will be available once you have exam results.
                  </p>
                </div>
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
      </div>
    </PortalLayout>
  );
}
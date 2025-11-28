import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { 
  FileText, 
  Users, 
  GraduationCap, 
  Download,
  RefreshCw,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  Search,
  TrendingUp,
  Award,
  BarChart3,
  Printer
} from 'lucide-react';
import { format } from 'date-fns';

export default function TeacherReportCards() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editRemarks, setEditRemarks] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) {
    return <div>Loading...</div>;
  }

  const userName = `${user.firstName} ${user.lastName}`;
  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;
  const userRole = (user.role?.toLowerCase() || 'teacher') as 'admin' | 'teacher' | 'student' | 'parent';

  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/classes');
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

  const { data: classReport, isLoading: loadingReport, refetch: refetchReport } = useQuery({
    queryKey: ['/api/reports/class', selectedClass, selectedTerm],
    queryFn: async () => {
      if (!selectedClass || !selectedTerm) return null;
      const response = await apiRequest('GET', `/api/reports/class/${selectedClass}?termId=${selectedTerm}`);
      if (!response.ok) return null;
      return await response.json();
    },
    enabled: !!selectedClass && !!selectedTerm,
  });

  const { data: studentReportCard, isLoading: loadingStudentReport } = useQuery({
    queryKey: ['/api/reports/student-report-card', selectedStudent?.studentId, selectedTerm],
    queryFn: async () => {
      if (!selectedStudent?.studentId || !selectedTerm) return null;
      const response = await apiRequest('GET', `/api/reports/student-report-card/${selectedStudent.studentId}?termId=${selectedTerm}`);
      if (!response.ok) return null;
      return await response.json();
    },
    enabled: !!selectedStudent?.studentId && !!selectedTerm && isViewDialogOpen,
  });

  const { data: gradingConfig } = useQuery({
    queryKey: ['/api/grading-config'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/grading-config');
      if (!response.ok) return null;
      return await response.json();
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async (data: { studentId: string; termId: number; teacherRemarks?: string }) => {
      const response = await apiRequest('POST', '/api/reports/generate', data);
      if (!response.ok) throw new Error('Failed to generate report card');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report card generated successfully",
      });
      refetchReport();
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate report card",
        variant: "destructive",
      });
    },
  });

  const generateClassReportsMutation = useMutation({
    mutationFn: async (data: { classId: string; termId: number }) => {
      const response = await apiRequest('POST', `/api/reports/generate-class/${data.classId}`, { termId: data.termId });
      if (!response.ok) throw new Error('Failed to generate class reports');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Generated ${data.success?.length || 0} report cards`,
      });
      refetchReport();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate class reports",
        variant: "destructive",
      });
    },
  });

  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };

  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    setEditRemarks('');
    setIsEditDialogOpen(true);
  };

  const handleGenerateReport = () => {
    if (!selectedStudent || !selectedTerm) return;
    generateReportMutation.mutate({
      studentId: selectedStudent.studentId,
      termId: Number(selectedTerm),
      teacherRemarks: editRemarks || undefined,
    });
  };

  const handleGenerateAllReports = () => {
    if (!selectedClass || !selectedTerm) return;
    generateClassReportsMutation.mutate({
      classId: selectedClass,
      termId: Number(selectedTerm),
    });
  };

  const getGradeColor = (grade: string) => {
    if (!grade) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'C':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'D':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'F':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const filteredStudents = classReport?.students?.filter((student: any) => 
    student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const statistics = classReport?.students ? {
    totalStudents: classReport.students.length,
    passedStudents: classReport.students.filter((s: any) => s.percentage >= 50).length,
    failedStudents: classReport.students.filter((s: any) => s.percentage < 50).length,
    classAverage: classReport.students.length > 0 
      ? Math.round(classReport.students.reduce((sum: number, s: any) => sum + s.percentage, 0) / classReport.students.length * 10) / 10
      : 0,
    highestScore: classReport.students.length > 0 
      ? Math.max(...classReport.students.map((s: any) => s.percentage))
      : 0,
    lowestScore: classReport.students.length > 0 
      ? Math.min(...classReport.students.map((s: any) => s.percentage))
      : 0,
  } : null;

  const handlePrintReportCard = () => {
    window.print();
  };

  return (
    <PortalLayout 
      userRole={userRole} 
      userName={userName}
      userInitials={userInitials}
    >
      <div className="space-y-6" data-testid="teacher-report-cards">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Report Cards</h1>
            <p className="text-muted-foreground">View and manage student report cards</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-40" data-testid="select-class">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-48" data-testid="select-term">
                <SelectValue placeholder="Select Term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term: any) => (
                  <SelectItem key={term.id} value={term.id.toString()}>
                    {term.name} ({term.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClass && selectedTerm && (
              <Button 
                onClick={handleGenerateAllReports}
                disabled={generateClassReportsMutation.isPending}
                data-testid="button-generate-all"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${generateClassReportsMutation.isPending ? 'animate-spin' : ''}`} />
                Generate All
              </Button>
            )}
          </div>
        </div>

        {!selectedClass || !selectedTerm ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select Class and Term</h3>
              <p className="text-muted-foreground">
                Please select a class and academic term to view report cards.
              </p>
            </CardContent>
          </Card>
        ) : loadingReport ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading report cards...</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statistics.totalStudents}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Passed</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{statistics.passedStudents}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Failed</CardTitle>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{statistics.failedStudents}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Class Average</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statistics.classAverage}%</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                      <Award className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{statistics.highestScore}%</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Lowest Score</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{statistics.lowestScore}%</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Class Summary - {classReport?.class?.name}
                  </CardTitle>
                  <CardDescription>
                    {classReport?.term?.name} ({classReport?.term?.year})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {classReport?.students?.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No student data found for this class and term.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                            data-testid="input-search-students"
                          />
                        </div>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Position</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Admission No.</TableHead>
                            <TableHead>Subjects</TableHead>
                            <TableHead>Percentage</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.map((student: any) => (
                            <TableRow key={student.studentId} data-testid={`row-student-${student.studentId}`}>
                              <TableCell className="font-medium">
                                {student.position}/{student.totalStudents}
                              </TableCell>
                              <TableCell className="font-medium">{student.studentName}</TableCell>
                              <TableCell>{student.admissionNumber || '-'}</TableCell>
                              <TableCell>{student.subjectsCount}</TableCell>
                              <TableCell>
                                <span className={student.percentage >= 50 ? 'text-green-600' : 'text-red-600'}>
                                  {student.percentage}%
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={getGradeColor(student.grade)}>
                                  {student.grade || '-'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleViewStudent(student)}
                                    data-testid={`button-view-${student.studentId}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleEditStudent(student)}
                                    data-testid={`button-edit-${student.studentId}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Report Cards</CardTitle>
                  <CardDescription>
                    View detailed report cards for each student
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredStudents.map((student: any) => (
                        <Card key={student.studentId} className="hover-elevate cursor-pointer" onClick={() => handleViewStudent(student)}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                  {student.studentName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                </div>
                                <div>
                                  <h4 className="font-medium">{student.studentName}</h4>
                                  <p className="text-sm text-muted-foreground">{student.admissionNumber}</p>
                                </div>
                              </div>
                              <Badge className={getGradeColor(student.grade)}>
                                {student.grade}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Position: {student.position}/{student.totalStudents}</span>
                              <span className={student.percentage >= 50 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                {student.percentage}%
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Grade Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {classReport?.students && (
                      <div className="space-y-3">
                        {['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map((grade) => {
                          const count = classReport.students.filter((s: any) => s.grade === grade).length;
                          const percentage = classReport.students.length > 0 
                            ? Math.round((count / classReport.students.length) * 100) 
                            : 0;
                          return (
                            <div key={grade} className="flex items-center gap-3">
                              <Badge className={`w-12 justify-center ${getGradeColor(grade)}`}>{grade}</Badge>
                              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4">
                                <div 
                                  className={`h-4 rounded-full ${grade.startsWith('A') ? 'bg-green-500' : grade.startsWith('B') ? 'bg-blue-500' : grade === 'C' ? 'bg-yellow-500' : grade === 'D' ? 'bg-orange-500' : 'bg-red-500'}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground w-16 text-right">{count} ({percentage}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statistics && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <span>Pass Rate</span>
                          <span className="font-bold text-green-600">
                            {statistics.totalStudents > 0 
                              ? Math.round((statistics.passedStudents / statistics.totalStudents) * 100) 
                              : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <span>Class Average</span>
                          <span className="font-bold text-blue-600">{statistics.classAverage}%</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <span>Score Range</span>
                          <span className="font-bold">{statistics.lowestScore}% - {statistics.highestScore}%</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Student Report Card
              </DialogTitle>
              <DialogDescription>
                Detailed academic performance report
              </DialogDescription>
            </DialogHeader>
            
            {loadingStudentReport ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading report card...</p>
              </div>
            ) : studentReportCard ? (
              <div className="space-y-6 print:space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg print:bg-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Student Name</p>
                      <p className="font-semibold">{studentReportCard.student?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Admission Number</p>
                      <p className="font-semibold">{studentReportCard.student?.admissionNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Class</p>
                      <p className="font-semibold">{studentReportCard.student?.className}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Term</p>
                      <p className="font-semibold">{studentReportCard.term?.name} ({studentReportCard.term?.year})</p>
                    </div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Test Score</TableHead>
                      <TableHead className="text-center">Exam Score</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Percentage</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentReportCard.subjects?.map((subject: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{subject.subjectName}</TableCell>
                        <TableCell className="text-center">{subject.testScore}/{subject.testMax}</TableCell>
                        <TableCell className="text-center">{subject.examScore}/{subject.examMax}</TableCell>
                        <TableCell className="text-center font-medium">{subject.totalScore}/{subject.totalMax}</TableCell>
                        <TableCell className="text-center">{subject.percentage}%</TableCell>
                        <TableCell className="text-center">
                          <Badge className={getGradeColor(subject.grade)}>{subject.grade}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{subject.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Marks</p>
                        <p className="text-xl font-bold">{studentReportCard.summary?.totalObtained}/{studentReportCard.summary?.totalMax}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Percentage</p>
                        <p className="text-xl font-bold text-blue-600">{studentReportCard.summary?.percentage}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Overall Grade</p>
                        <Badge className={`text-lg ${getGradeColor(studentReportCard.summary?.grade)}`}>
                          {studentReportCard.summary?.grade}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Subjects</p>
                        <p className="text-xl font-bold">{studentReportCard.summary?.subjectsCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2 print:hidden">
                  <Button variant="outline" onClick={handlePrintReportCard}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No report card data available</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Report Card</DialogTitle>
              <DialogDescription>
                Generate or update report card for {selectedStudent?.studentName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Teacher Remarks (Optional)</label>
                <Textarea
                  placeholder="Add remarks about the student's performance..."
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  rows={4}
                  data-testid="textarea-remarks"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateReport}
                disabled={generateReportMutation.isPending}
                data-testid="button-generate-report"
              >
                {generateReportMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, Users, TrendingUp, Award, Search, 
  RefreshCw, CheckCircle, XCircle, Clock, BarChart3, Sparkles,
  Eye, Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

interface AcademicTerm {
  id: number;
  name: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface ClassInfo {
  id: number;
  name: string;
  level: string;
  section?: string;
}

interface TeacherAssignments {
  isAdmin: boolean;
  classes: ClassInfo[];
  subjects: any[];
  assignments: any[];
}

interface ReportCardItem {
  id: number;
  subjectId: number;
  subjectName: string;
  testScore: number | null;
  testMaxScore: number;
  testWeightedScore: number | null;
  examScore: number | null;
  examMaxScore: number;
  examWeightedScore: number | null;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  teacherRemarks: string | null;
  canEditTest?: boolean;
  canEditExam?: boolean;
  canEditRemarks?: boolean;
}

interface ReportCard {
  id: number;
  studentId: string;
  studentName: string;
  admissionNumber?: string;
  className: string;
  classId: number;
  termId: number;
  termName: string;
  termYear: string;
  totalObtainedMarks: number;
  totalMaxMarks: number;
  averagePercentage: number;
  overallGrade: string;
  position?: number;
  teacherRemarks: string | null;
  principalRemarks: string | null;
  status: string;
  generatedAt: string;
  items: ReportCardItem[];
}

const GRADING_SCALES = [
  { value: 'standard', label: 'Standard (A-F)' },
  { value: 'nigerian', label: 'Nigerian (A1-F9)' },
  { value: 'percentage', label: 'Percentage Based' },
];

export default function TeacherReportCards() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [gradingScale, setGradingScale] = useState<string>('standard');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: assignments, isLoading: loadingAssignments, isError: assignmentsError } = useQuery<TeacherAssignments>({
    queryKey: ['/api/my-assignments'],
  });

  const assignedClasses = useMemo(() => {
    return assignments?.classes || [];
  }, [assignments]);

  const { data: terms = [], isLoading: loadingTerms, isError: termsError } = useQuery<AcademicTerm[]>({
    queryKey: ['/api/terms'],
  });

  const currentTerm = useMemo(() => terms.find(t => t.isCurrent), [terms]);

  // Auto-select current term when terms load
  useEffect(() => {
    if (currentTerm && !selectedTerm) {
      setSelectedTerm(currentTerm.id.toString());
    }
  }, [currentTerm]);

  const { 
    data: reportCards = [], 
    isLoading: loadingReports,
    isError: reportsError,
    refetch: refetchReports 
  } = useQuery<ReportCard[]>({
    queryKey: ['/api/teacher/my-report-cards', selectedClass, selectedTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedTerm) params.append('termId', selectedTerm);
      const queryString = params.toString();
      const url = queryString ? `/api/teacher/my-report-cards?${queryString}` : '/api/teacher/my-report-cards';
      
      const response = await apiRequest('GET', url);
      if (!response.ok) {
        throw new Error('Failed to fetch report cards');
      }
      return response.json();
    },
    enabled: !!selectedClass || !!selectedTerm,
  });

  const { data: reportCardDetails } = useQuery<ReportCard>({
    queryKey: ['/api/reports', selectedReportCard?.id, 'full'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/reports/${selectedReportCard?.id}/full`);
      if (!response.ok) {
        throw new Error('Failed to fetch report card details');
      }
      return response.json();
    },
    enabled: !!selectedReportCard?.id && detailsOpen,
  });

  const filteredReportCards = useMemo(() => {
    let filtered = [...reportCards];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(rc => rc.status?.toLowerCase() === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rc => 
        rc.studentName?.toLowerCase().includes(query) ||
        rc.admissionNumber?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [reportCards, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    if (filteredReportCards.length === 0) {
      return { total: 0, passed: 0, failed: 0, pending: 0, avgScore: 0 };
    }

    const passed = filteredReportCards.filter(rc => (rc.averagePercentage || 0) >= 50).length;
    const failed = filteredReportCards.filter(rc => (rc.averagePercentage || 0) < 50).length;
    const pending = filteredReportCards.filter(rc => rc.status === 'pending').length;
    const avgScore = filteredReportCards.reduce((sum, rc) => sum + (rc.averagePercentage || 0), 0) / filteredReportCards.length;

    return {
      total: filteredReportCards.length,
      passed,
      failed,
      pending,
      avgScore: Math.round(avgScore * 10) / 10,
    };
  }, [filteredReportCards]);

  const handleViewDetails = (reportCard: ReportCard) => {
    setSelectedReportCard(reportCard);
    setDetailsOpen(true);
  };

  const getGradeColor = (grade: string) => {
    const gradeUpper = grade?.toUpperCase() || '';
    if (gradeUpper.startsWith('A')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (gradeUpper.startsWith('B')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (gradeUpper.startsWith('C')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (gradeUpper.startsWith('D')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Published</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"><Edit className="w-3 h-3 mr-1" />Draft</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Report Cards</h1>
        <p className="text-muted-foreground">View and manage auto-generated student report cards</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Auto-Generated Report Cards</CardTitle>
          </div>
          <CardDescription>
            Report cards are automatically created when students complete exams. Select a class and term to view and manage them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(assignmentsError || termsError) && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              <XCircle className="inline w-4 h-4 mr-2" />
              {assignmentsError && 'Failed to load your class assignments. '}
              {termsError && 'Failed to load academic terms. '}
              Please refresh the page to try again.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="select-class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {assignedClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select 
                value={selectedTerm} 
                onValueChange={setSelectedTerm}
              >
                <SelectTrigger data-testid="select-term">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id.toString()}>
                      {term.name} ({term.year}) {term.isCurrent ? '(Current)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Grading Scale</label>
              <Select value={gradingScale} onValueChange={setGradingScale}>
                <SelectTrigger data-testid="select-grading-scale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADING_SCALES.map((scale) => (
                    <SelectItem key={scale.value} value={scale.value}>
                      {scale.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status Filter</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(selectedClass || selectedTerm) && (
            <div className="text-sm text-muted-foreground">
              <BarChart3 className="inline w-4 h-4 mr-1" />
              Test: 40% | Exam: 60%
            </div>
          )}
        </CardContent>
      </Card>

      {(selectedClass || selectedTerm) && (
        <>
          {reportsError && (
            <Card className="border-destructive/50">
              <CardContent className="py-6 text-center">
                <XCircle className="h-10 w-10 mx-auto mb-3 text-destructive" />
                <p className="text-destructive font-medium">Failed to load report cards</p>
                <p className="text-sm text-muted-foreground mt-1">Please try again or contact support if the issue persists.</p>
                <Button variant="outline" className="mt-4" onClick={() => refetchReports()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
          
          {!reportsError && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="students" data-testid="tab-students">Students</TabsTrigger>
              <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Class Overview</h3>
              </div>

              {loadingReports ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-2xl font-bold" data-testid="text-total-students">{stats.total}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Passed</p>
                          <p className="text-2xl font-bold text-green-600" data-testid="text-passed">{stats.passed}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-8 w-8 text-red-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Failed</p>
                          <p className="text-2xl font-bold text-red-600" data-testid="text-failed">{stats.failed}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Score</p>
                          <p className="text-2xl font-bold text-blue-600" data-testid="text-avg-score">{stats.avgScore}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {stats.total > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base">Pass Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Pass Rate</span>
                        <span className="font-medium">{Math.round((stats.passed / stats.total) * 100)}%</span>
                      </div>
                      <Progress value={(stats.passed / stats.total) * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => refetchReports()}
                  data-testid="button-refresh"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="students" className="space-y-4 mt-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Showing {filteredReportCards.length} of {reportCards.length} students
                </p>
              </div>

              {loadingReports ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : filteredReportCards.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      {reportCards.length === 0 
                        ? 'No report cards found for your subjects in this class/term.'
                        : 'No matching students found.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReportCards.map((rc) => (
                        <TableRow key={rc.id} data-testid={`row-student-${rc.id}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{rc.studentName}</p>
                              <p className="text-sm text-muted-foreground">{rc.admissionNumber}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold">{(rc.averagePercentage || 0).toFixed(1)}%</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={getGradeColor(rc.overallGrade)}>
                              {rc.overallGrade || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(rc.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleViewDetails(rc)}
                              data-testid={`button-view-${rc.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Performance Analytics</h3>
              </div>

              {loadingReports || reportCards.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      {loadingReports ? 'Loading analytics...' : 'No data available for analytics.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Grade Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {['A', 'B', 'C', 'D', 'F'].map((grade) => {
                        const count = reportCards.filter(rc => rc.overallGrade?.startsWith(grade)).length;
                        const percentage = reportCards.length > 0 ? (count / reportCards.length) * 100 : 0;
                        return (
                          <div key={grade} className="flex items-center gap-3 mb-3">
                            <Badge className={`w-8 ${getGradeColor(grade)}`}>{grade}</Badge>
                            <Progress value={percentage} className="flex-1 h-2" />
                            <span className="text-sm text-muted-foreground w-16">{count} ({Math.round(percentage)}%)</span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Top Performers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {[...reportCards]
                        .sort((a, b) => (b.averagePercentage || 0) - (a.averagePercentage || 0))
                        .slice(0, 5)
                        .map((rc, index) => (
                          <div key={rc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground w-4">{index + 1}.</span>
                              <span className="font-medium">{rc.studentName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{(rc.averagePercentage || 0).toFixed(1)}%</span>
                              <Badge className={getGradeColor(rc.overallGrade)}>
                                {rc.overallGrade || '-'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
          )}
        </>
      )}

      {!selectedClass && !selectedTerm && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Select a class and term to view report cards.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Card Details
            </DialogTitle>
            <DialogDescription>
              {selectedReportCard?.studentName} - {selectedReportCard?.className}
            </DialogDescription>
          </DialogHeader>

          {reportCardDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-xl font-bold">{(reportCardDetails.averagePercentage || 0).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overall Grade</p>
                  <Badge className={getGradeColor(reportCardDetails.overallGrade)}>
                    {reportCardDetails.overallGrade || '-'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Term</p>
                  <p className="font-medium">{reportCardDetails.termName} ({reportCardDetails.termYear})</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(reportCardDetails.status)}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Test (40%)</TableHead>
                      <TableHead className="text-center">Exam (60%)</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportCardDetails.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.subjectName}</TableCell>
                        <TableCell className="text-center">
                          {item.testScore !== null ? `${item.testScore}/${item.testMaxScore}` : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.examScore !== null ? `${item.examScore}/${item.examMaxScore}` : '-'}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {(item.percentage || 0).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getGradeColor(item.grade)}>{item.grade || '-'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {reportCardDetails.teacherRemarks && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Teacher Remarks</p>
                  <p className="text-sm">{reportCardDetails.teacherRemarks}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

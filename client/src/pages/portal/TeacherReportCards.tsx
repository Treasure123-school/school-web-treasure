import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Users, 
  GraduationCap, 
  RefreshCw,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  Search,
  TrendingUp,
  Award,
  BarChart3,
  Printer,
  Save,
  Send,
  Clock,
  Calculator,
  PenTool,
  Loader2,
  Undo2,
  Lock,
  Unlock
} from 'lucide-react';
import { format } from 'date-fns';

interface ReportCardItem {
  id: number;
  subjectId: number;
  subjectName: string;
  subjectCode?: string;
  testScore: number | null;
  testMaxScore: number | null;
  testWeightedScore: number | null;
  examScore: number | null;
  examMaxScore: number | null;
  examWeightedScore: number | null;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  remarks: string;
  teacherRemarks: string | null;
  isOverridden: boolean;
  overriddenAt: string | null;
}

interface ReportCard {
  id: number;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  termName: string;
  averagePercentage: number;
  overallGrade: string;
  position: number;
  totalStudentsInClass: number;
  status: string;
  gradingScale: string;
  teacherRemarks: string | null;
  principalRemarks: string | null;
  generatedAt: string;
  items: ReportCardItem[];
}

export default function TeacherReportCards() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null);
  const [selectedGradingScale, setSelectedGradingScale] = useState<string>('standard');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReportCardItem | null>(null);
  const [overrideData, setOverrideData] = useState({
    testScore: '',
    testMaxScore: '',
    examScore: '',
    examMaxScore: '',
    teacherRemarks: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [remarks, setRemarks] = useState({ teacher: '', principal: '' });

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

  const { data: reportCards = [], isLoading: loadingReportCards, refetch: refetchReportCards } = useQuery({
    queryKey: ['/api/reports/class-term', selectedClass, selectedTerm],
    queryFn: async () => {
      if (!selectedClass || !selectedTerm) return [];
      const response = await apiRequest('GET', `/api/reports/class-term/${selectedClass}/${selectedTerm}`);
      if (!response.ok) return [];
      return await response.json();
    },
    enabled: !!selectedClass && !!selectedTerm,
  });

  const { data: fullReportCard, isLoading: loadingFullReport, refetch: refetchFullReport } = useQuery({
    queryKey: ['/api/reports', selectedReportCard?.id, 'full'],
    queryFn: async () => {
      if (!selectedReportCard?.id) return null;
      const response = await apiRequest('GET', `/api/reports/${selectedReportCard.id}/full`);
      if (!response.ok) return null;
      return await response.json();
    },
    enabled: !!selectedReportCard?.id && isViewDialogOpen,
  });

  const generateReportCardsMutation = useMutation({
    mutationFn: async (data: { classId: string; termId: number; gradingScale: string }) => {
      const response = await apiRequest('POST', `/api/reports/generate-enhanced/${data.classId}`, {
        termId: data.termId,
        gradingScale: data.gradingScale
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate report cards');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Report cards generated successfully",
      });
      refetchReportCards();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate report cards",
        variant: "destructive",
      });
    },
  });

  const autoPopulateMutation = useMutation({
    mutationFn: async (reportCardId: number) => {
      const response = await apiRequest('POST', `/api/reports/${reportCardId}/auto-populate`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to auto-populate scores');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Scores populated successfully",
      });
      refetchFullReport();
      refetchReportCards();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to auto-populate scores",
        variant: "destructive",
      });
    },
  });

  const overrideScoreMutation = useMutation({
    mutationFn: async (data: { itemId: number; testScore?: number; testMaxScore?: number; examScore?: number; examMaxScore?: number; teacherRemarks?: string }) => {
      const response = await apiRequest('PATCH', `/api/reports/items/${data.itemId}/override`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to override score');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Score overridden successfully",
      });
      setIsOverrideDialogOpen(false);
      refetchFullReport();
      refetchReportCards();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to override score",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: { reportCardId: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/reports/${data.reportCardId}/status`, { status: data.status });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Status updated successfully",
      });
      refetchFullReport();
      refetchReportCards();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const updateRemarksMutation = useMutation({
    mutationFn: async (data: { reportCardId: number; teacherRemarks?: string; principalRemarks?: string }) => {
      const response = await apiRequest('PATCH', `/api/reports/${data.reportCardId}/remarks`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update remarks');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Remarks updated successfully",
      });
      refetchFullReport();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update remarks",
        variant: "destructive",
      });
    },
  });

  const handleViewReportCard = (reportCard: any) => {
    setSelectedReportCard(reportCard);
    setRemarks({ teacher: reportCard.teacherRemarks || '', principal: reportCard.principalRemarks || '' });
    setIsViewDialogOpen(true);
  };

  const handleOverrideScore = (item: ReportCardItem) => {
    setSelectedItem(item);
    setOverrideData({
      testScore: item.testScore?.toString() || '',
      testMaxScore: item.testMaxScore?.toString() || '',
      examScore: item.examScore?.toString() || '',
      examMaxScore: item.examMaxScore?.toString() || '',
      teacherRemarks: item.teacherRemarks || ''
    });
    setIsOverrideDialogOpen(true);
  };

  const handleSaveOverride = () => {
    if (!selectedItem) return;
    
    overrideScoreMutation.mutate({
      itemId: selectedItem.id,
      testScore: overrideData.testScore ? Number(overrideData.testScore) : undefined,
      testMaxScore: overrideData.testMaxScore ? Number(overrideData.testMaxScore) : undefined,
      examScore: overrideData.examScore ? Number(overrideData.examScore) : undefined,
      examMaxScore: overrideData.examMaxScore ? Number(overrideData.examMaxScore) : undefined,
      teacherRemarks: overrideData.teacherRemarks || undefined
    });
  };

  const handleGenerateReportCards = () => {
    if (!selectedClass || !selectedTerm) return;
    generateReportCardsMutation.mutate({
      classId: selectedClass,
      termId: Number(selectedTerm),
      gradingScale: selectedGradingScale
    });
  };

  const getGradeColor = (grade: string) => {
    if (!grade) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    const gradeUpper = grade.toUpperCase();
    if (gradeUpper.startsWith('A')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (gradeUpper.startsWith('B')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (gradeUpper.startsWith('C')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (gradeUpper.startsWith('D') || gradeUpper.startsWith('E')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Draft</Badge>;
      case 'finalized':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"><CheckCircle className="w-3 h-3 mr-1" /> Finalized</Badge>;
      case 'published':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><Send className="w-3 h-3 mr-1" /> Published</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredReportCards = reportCards.filter((rc: any) =>
    rc.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rc.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statistics = reportCards.length > 0 ? {
    totalStudents: reportCards.length,
    passedStudents: reportCards.filter((rc: any) => (rc.averagePercentage || 0) >= 50).length,
    failedStudents: reportCards.filter((rc: any) => (rc.averagePercentage || 0) < 50).length,
    classAverage: Math.round(reportCards.reduce((sum: number, rc: any) => sum + (rc.averagePercentage || 0), 0) / reportCards.length * 10) / 10,
    draftCount: reportCards.filter((rc: any) => rc.status === 'draft').length,
    finalizedCount: reportCards.filter((rc: any) => rc.status === 'finalized').length,
    publishedCount: reportCards.filter((rc: any) => rc.status === 'published').length,
  } : null;

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
            <p className="text-muted-foreground">Generate, view and manage student report cards with auto-population</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Report Cards</CardTitle>
            <CardDescription>Select class, term, and grading scale to generate report cards with auto-populated exam scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-2">
                <Label>Class</Label>
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
              </div>
              
              <div className="flex flex-col gap-2">
                <Label>Term</Label>
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
              </div>
              
              <div className="flex flex-col gap-2">
                <Label>Grading Scale</Label>
                <Select value={selectedGradingScale} onValueChange={setSelectedGradingScale}>
                  <SelectTrigger className="w-40" data-testid="select-grading-scale">
                    <SelectValue placeholder="Grading Scale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (A-F)</SelectItem>
                    <SelectItem value="waec">WAEC (A1-F9)</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleGenerateReportCards}
                disabled={!selectedClass || !selectedTerm || generateReportCardsMutation.isPending}
                data-testid="button-generate-all"
              >
                {generateReportCardsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Calculator className="w-4 h-4 mr-2" />
                )}
                Generate Report Cards
              </Button>
            </div>
          </CardContent>
        </Card>

        {!selectedClass || !selectedTerm ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select Class and Term</h3>
              <p className="text-muted-foreground">
                Please select a class and academic term to view or generate report cards.
              </p>
            </CardContent>
          </Card>
        ) : loadingReportCards ? (
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
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total</CardTitle>
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
                      <CardTitle className="text-sm font-medium">Average</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statistics.classAverage}%</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Draft</CardTitle>
                      <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">{statistics.draftCount}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Finalized</CardTitle>
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{statistics.finalizedCount}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Published</CardTitle>
                      <Send className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{statistics.publishedCount}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Class Report Cards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reportCards.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No report cards found for this class and term.</p>
                      <Button onClick={handleGenerateReportCards} disabled={generateReportCardsMutation.isPending}>
                        <Calculator className="w-4 h-4 mr-2" />
                        Generate Report Cards
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                          data-testid="input-search-students"
                        />
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pos</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Adm. No.</TableHead>
                            <TableHead>Average</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReportCards.map((rc: any) => (
                            <TableRow key={rc.id} data-testid={`row-report-${rc.id}`}>
                              <TableCell className="font-medium">
                                {rc.position || '-'}/{rc.totalStudentsInClass || reportCards.length}
                              </TableCell>
                              <TableCell className="font-medium">{rc.studentName}</TableCell>
                              <TableCell>{rc.admissionNumber || '-'}</TableCell>
                              <TableCell>
                                <span className={(rc.averagePercentage || 0) >= 50 ? 'text-green-600' : 'text-red-600'}>
                                  {rc.averagePercentage || 0}%
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={getGradeColor(rc.overallGrade)}>
                                  {rc.overallGrade || '-'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(rc.status)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleViewReportCard(rc)}
                                  data-testid={`button-view-${rc.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
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
                  <CardDescription>Click on a card to view details and manage scores</CardDescription>
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
                      {filteredReportCards.map((rc: any) => (
                        <Card key={rc.id} className="hover-elevate cursor-pointer" onClick={() => handleViewReportCard(rc)}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                  {rc.studentName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                </div>
                                <div>
                                  <h4 className="font-medium">{rc.studentName}</h4>
                                  <p className="text-sm text-muted-foreground">{rc.admissionNumber}</p>
                                </div>
                              </div>
                              <Badge className={getGradeColor(rc.overallGrade)}>
                                {rc.overallGrade || '-'}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-3">
                              <span className="text-muted-foreground">Position: {rc.position || '-'}/{rc.totalStudentsInClass || reportCards.length}</span>
                              <span className={(rc.averagePercentage || 0) >= 50 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                {rc.averagePercentage || 0}%
                              </span>
                            </div>
                            <div className="mt-2">
                              {getStatusBadge(rc.status)}
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
                    {reportCards.length > 0 && (
                      <div className="space-y-3">
                        {['A', 'B', 'C', 'D', 'E', 'F'].map((gradePrefix) => {
                          const count = reportCards.filter((rc: any) => 
                            rc.overallGrade?.toUpperCase().startsWith(gradePrefix)
                          ).length;
                          const percentage = reportCards.length > 0 
                            ? Math.round((count / reportCards.length) * 100) 
                            : 0;
                          return (
                            <div key={gradePrefix} className="flex items-center gap-3">
                              <Badge className={`w-12 justify-center ${getGradeColor(gradePrefix)}`}>{gradePrefix}</Badge>
                              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4">
                                <div 
                                  className={`h-4 rounded-full ${gradePrefix === 'A' ? 'bg-green-500' : gradePrefix === 'B' ? 'bg-blue-500' : gradePrefix === 'C' ? 'bg-yellow-500' : gradePrefix === 'D' || gradePrefix === 'E' ? 'bg-orange-500' : 'bg-red-500'}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm w-12 text-right">{count} ({percentage}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Status Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statistics && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            Draft
                          </span>
                          <span className="font-medium">{statistics.draftCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                            Finalized
                          </span>
                          <span className="font-medium">{statistics.finalizedCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Send className="w-4 h-4 text-green-500" />
                            Published
                          </span>
                          <span className="font-medium">{statistics.publishedCount}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* View Report Card Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Report Card - {fullReportCard?.studentName}
            </DialogTitle>
            <DialogDescription>
              {fullReportCard?.className} - {fullReportCard?.termName}
            </DialogDescription>
          </DialogHeader>
          
          {loadingFullReport ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading report card...</p>
            </div>
          ) : fullReportCard ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Average</p>
                    <p className="text-2xl font-bold">{fullReportCard.averagePercentage || 0}%</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Grade</p>
                    <Badge className={`text-lg ${getGradeColor(fullReportCard.overallGrade)}`}>
                      {fullReportCard.overallGrade || '-'}
                    </Badge>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Position</p>
                    <p className="text-2xl font-bold">{fullReportCard.position || '-'}/{fullReportCard.totalStudentsInClass || '-'}</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(fullReportCard.status)}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {/* Status indicator */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mr-2">
                    {fullReportCard.status === 'draft' ? (
                      <><Unlock className="w-4 h-4" /> Editing enabled</>
                    ) : (
                      <><Lock className="w-4 h-4" /> Editing locked</>
                    )}
                  </div>
                  
                  {/* Refresh Scores - only enabled when in draft status */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => autoPopulateMutation.mutate(fullReportCard.id)}
                    disabled={autoPopulateMutation.isPending || fullReportCard.status !== 'draft'}
                    data-testid="button-refresh-scores"
                  >
                    {autoPopulateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh Scores
                  </Button>
                  
                  {/* DRAFT status: Show Finalize button */}
                  {fullReportCard.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ reportCardId: fullReportCard.id, status: 'finalized' })}
                      disabled={updateStatusMutation.isPending}
                      data-testid="button-finalize"
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Finalize
                    </Button>
                  )}
                  
                  {/* FINALIZED status: Show Publish and Revert to Draft buttons */}
                  {fullReportCard.status === 'finalized' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ reportCardId: fullReportCard.id, status: 'published' })}
                        disabled={updateStatusMutation.isPending}
                        data-testid="button-publish"
                      >
                        {updateStatusMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Publish
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ reportCardId: fullReportCard.id, status: 'draft' })}
                        disabled={updateStatusMutation.isPending}
                        data-testid="button-revert-to-draft"
                      >
                        <Undo2 className="w-4 h-4 mr-2" />
                        Revert to Draft
                      </Button>
                    </>
                  )}
                  
                  {/* PUBLISHED status: Show Revert to Finalized and Revert to Draft buttons */}
                  {fullReportCard.status === 'published' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ reportCardId: fullReportCard.id, status: 'finalized' })}
                        disabled={updateStatusMutation.isPending}
                        data-testid="button-revert-to-finalized"
                      >
                        <Undo2 className="w-4 h-4 mr-2" />
                        Revert to Finalized
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ reportCardId: fullReportCard.id, status: 'draft' })}
                        disabled={updateStatusMutation.isPending}
                        data-testid="button-revert-to-draft-from-published"
                      >
                        <Undo2 className="w-4 h-4 mr-2" />
                        Revert to Draft
                      </Button>
                    </>
                  )}
                </div>

                {/* Subject Scores */}
                <div>
                  <h4 className="font-semibold mb-3">Subject Scores</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">Test (40%)</TableHead>
                        <TableHead className="text-center">Exam (60%)</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fullReportCard.items?.map((item: ReportCardItem) => (
                        <TableRow key={item.id} className={item.isOverridden ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {item.subjectName}
                              {item.isOverridden && (
                                <Badge variant="outline" className="text-xs">
                                  <PenTool className="w-3 h-3 mr-1" />
                                  Modified
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.testScore !== null ? `${item.testScore}/${item.testMaxScore}` : '-'}
                            {item.testWeightedScore !== null && (
                              <span className="text-xs text-muted-foreground block">({item.testWeightedScore})</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.examScore !== null ? `${item.examScore}/${item.examMaxScore}` : '-'}
                            {item.examWeightedScore !== null && (
                              <span className="text-xs text-muted-foreground block">({item.examWeightedScore})</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {item.obtainedMarks}/{item.totalMarks}
                            <span className="text-xs text-muted-foreground block">({item.percentage}%)</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(item.grade)}>
                              {item.grade || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOverrideScore(item)}
                              disabled={fullReportCard.status !== 'draft'}
                              data-testid={`button-override-${item.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Remarks */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Remarks</h4>
                  {fullReportCard.status !== 'draft' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md">
                      <Lock className="w-4 h-4" />
                      <span>Remarks are locked. Revert to draft to edit.</span>
                    </div>
                  )}
                  <div>
                    <Label>Teacher Remarks</Label>
                    <Textarea
                      value={remarks.teacher}
                      onChange={(e) => setRemarks(prev => ({ ...prev, teacher: e.target.value }))}
                      placeholder="Enter teacher remarks..."
                      disabled={fullReportCard.status !== 'draft'}
                      className="mt-1"
                      data-testid="textarea-teacher-remarks"
                    />
                  </div>
                  <div>
                    <Label>Principal Remarks</Label>
                    <Textarea
                      value={remarks.principal}
                      onChange={(e) => setRemarks(prev => ({ ...prev, principal: e.target.value }))}
                      placeholder="Enter principal remarks..."
                      disabled={fullReportCard.status !== 'draft'}
                      className="mt-1"
                      data-testid="textarea-principal-remarks"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => updateRemarksMutation.mutate({
                      reportCardId: fullReportCard.id,
                      teacherRemarks: remarks.teacher,
                      principalRemarks: remarks.principal
                    })}
                    disabled={updateRemarksMutation.isPending || fullReportCard.status !== 'draft'}
                    data-testid="button-save-remarks"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Remarks
                  </Button>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p>Failed to load report card</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Override Score Dialog */}
      <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Score</DialogTitle>
            <DialogDescription>
              Modify scores for {selectedItem?.subjectName}. This will be tracked as a teacher override.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Test Score</Label>
                <Input
                  type="number"
                  value={overrideData.testScore}
                  onChange={(e) => setOverrideData(prev => ({ ...prev, testScore: e.target.value }))}
                  placeholder="Score"
                  data-testid="input-test-score"
                />
              </div>
              <div>
                <Label>Test Max Score</Label>
                <Input
                  type="number"
                  value={overrideData.testMaxScore}
                  onChange={(e) => setOverrideData(prev => ({ ...prev, testMaxScore: e.target.value }))}
                  placeholder="Max"
                  data-testid="input-test-max"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Exam Score</Label>
                <Input
                  type="number"
                  value={overrideData.examScore}
                  onChange={(e) => setOverrideData(prev => ({ ...prev, examScore: e.target.value }))}
                  placeholder="Score"
                  data-testid="input-exam-score"
                />
              </div>
              <div>
                <Label>Exam Max Score</Label>
                <Input
                  type="number"
                  value={overrideData.examMaxScore}
                  onChange={(e) => setOverrideData(prev => ({ ...prev, examMaxScore: e.target.value }))}
                  placeholder="Max"
                  data-testid="input-exam-max"
                />
              </div>
            </div>
            
            <div>
              <Label>Teacher Remarks</Label>
              <Textarea
                value={overrideData.teacherRemarks}
                onChange={(e) => setOverrideData(prev => ({ ...prev, teacherRemarks: e.target.value }))}
                placeholder="Reason for override..."
                data-testid="input-override-remarks"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOverrideDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveOverride} disabled={overrideScoreMutation.isPending}>
              {overrideScoreMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}

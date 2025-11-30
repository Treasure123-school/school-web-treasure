import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import PortalLayout from '@/components/layout/PortalLayout';
import { useSocketIORealtime } from '@/hooks/useSocketIORealtime';
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
  PenTool,
  Loader2,
  Undo2,
  Lock,
  Unlock,
  MoreVertical,
  FileCheck,
  FileClock,
  FilePen,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [remarks, setRemarks] = useState({ teacher: '', principal: '' });

  // Real-time subscription for report card updates - scoped to class
  // The hook automatically invalidates the queryKey when events are received
  const { isConnected: realtimeConnected } = useSocketIORealtime({
    table: 'report_cards',
    queryKey: ['/api/reports/class-term', selectedClass, selectedTerm],
    enabled: !!selectedClass && !!selectedTerm,
    classId: selectedClass,
  });

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

  // Bulk status update mutation for finalizing/publishing multiple report cards
  const bulkStatusMutation = useMutation({
    mutationFn: async (data: { reportCardIds: number[]; status: string }) => {
      const results = await Promise.all(
        data.reportCardIds.map(async (reportCardId) => {
          const response = await apiRequest('PATCH', `/api/reports/${reportCardId}/status`, { status: data.status });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Failed to update report card ${reportCardId}`);
          }
          return response.json();
        })
      );
      return results;
    },
    onSuccess: (_, { status }) => {
      const statusLabel = status === 'published' ? 'published' : 
                         status === 'finalized' ? 'finalized' : 'reverted to draft';
      toast({
        title: "Success",
        description: `Report cards ${statusLabel} successfully`,
      });
      refetchReportCards();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update report cards",
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
    mutationFn: async (data: { reportCardId: number; status: string; classId: string; termId: string }) => {
      const response = await apiRequest('PATCH', `/api/reports/${data.reportCardId}/status`, { status: data.status });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }
      return response.json();
    },
    onMutate: async ({ reportCardId, status, classId, termId }) => {
      // Cancel any outgoing refetches immediately
      queryClient.cancelQueries({ queryKey: ['/api/reports', reportCardId, 'full'] });
      queryClient.cancelQueries({ queryKey: ['/api/reports/class-term', classId, termId] });
      
      // Snapshot previous values for rollback (full objects to restore all fields)
      const previousFullReport = queryClient.getQueryData(['/api/reports', reportCardId, 'full']);
      const previousReportCards = queryClient.getQueryData(['/api/reports/class-term', classId, termId]);
      const previousSelectedReportCard = selectedReportCard;
      
      // Determine locked state based on new status
      const locked = status !== 'draft';
      
      // Optimistically update the full report (instant UI update)
      queryClient.setQueryData(['/api/reports', reportCardId, 'full'], (old: any) => {
        if (!old || typeof old !== 'object') return old;
        return { ...old, status, locked };
      });
      
      // Optimistically update the report cards list (instant UI update)
      queryClient.setQueryData(['/api/reports/class-term', classId, termId], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((rc: any) => 
          rc.id === reportCardId ? { ...rc, status, locked } : rc
        );
      });
      
      // Update the selected report card state immediately for instant visual feedback
      setSelectedReportCard(prev => prev?.id === reportCardId ? { ...prev, status, locked } : prev);
      
      return { previousFullReport, previousReportCards, previousSelectedReportCard, classId, termId };
    },
    onSuccess: (data, { reportCardId, status, classId, termId }) => {
      // Extract the server response data
      const reportCard = data.reportCard;
      const message = data.message;
      
      // Reconcile caches with authoritative server data (updates timestamps like finalizedAt, publishedAt)
      if (reportCard && typeof reportCard === 'object') {
        // Update full report cache with server data
        queryClient.setQueryData(['/api/reports', reportCardId, 'full'], (old: any) => {
          if (!old || typeof old !== 'object') return { ...reportCard };
          return { ...old, ...reportCard };
        });
        
        // Update the list cache with server data
        queryClient.setQueryData(['/api/reports/class-term', classId, termId], (old: any) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((rc: any) => rc.id === reportCardId ? { ...rc, ...reportCard } : rc);
        });
        
        // Update selected report card state with server data
        setSelectedReportCard(prev => prev?.id === reportCardId ? { ...prev, ...reportCard } : prev);
      }
      
      const statusLabel = status === 'published' ? 'Published' : 
                         status === 'finalized' ? 'Finalized' : 'Reverted to Draft';
      toast({
        title: "Success",
        description: message || `Report card ${statusLabel.toLowerCase()} successfully`,
      });
    },
    onError: (error: any, { reportCardId }, context: any) => {
      // Rollback to previous values on error (restore full objects)
      if (context?.previousFullReport) {
        queryClient.setQueryData(['/api/reports', reportCardId, 'full'], context.previousFullReport);
      }
      if (context?.previousReportCards && context?.classId && context?.termId) {
        queryClient.setQueryData(['/api/reports/class-term', context.classId, context.termId], context.previousReportCards);
      }
      // Rollback selected report card state to full previous object
      if (context?.previousSelectedReportCard) {
        setSelectedReportCard(context.previousSelectedReportCard);
      }
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

  // Handle bulk status updates
  const handleBulkStatusUpdate = (status: string) => {
    let targetIds: number[] = [];
    
    if (status === 'finalized') {
      // Finalize all draft report cards
      targetIds = reportCards.filter((rc: any) => rc.status === 'draft').map((rc: any) => rc.id);
    } else if (status === 'published') {
      // Publish all finalized report cards
      targetIds = reportCards.filter((rc: any) => rc.status === 'finalized').map((rc: any) => rc.id);
    }
    
    if (targetIds.length === 0) {
      toast({
        title: "No Report Cards to Update",
        description: status === 'finalized' 
          ? "No draft report cards found to finalize." 
          : "No finalized report cards found to publish.",
        variant: "destructive",
      });
      return;
    }
    
    bulkStatusMutation.mutate({ reportCardIds: targetIds, status });
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

  const filteredReportCards = reportCards.filter((rc: any) => {
    const matchesSearch = rc.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rc.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <p className="text-muted-foreground">View and manage auto-generated student report cards</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Auto-Generated Report Cards
                </CardTitle>
                <CardDescription>
                  Report cards are automatically created when students complete exams. Select a class and term to view and manage them.
                </CardDescription>
              </div>
            </div>
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

              <div className="flex flex-col gap-2">
                <Label>Status Filter</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40" data-testid="select-status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="finalized">Finalized</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                {statusFilter !== 'all' && (
                  <span className="text-xs text-muted-foreground">
                    Showing {filteredReportCards.length} of {reportCards.length}
                  </span>
                )}
              </div>

              {/* Real-time connection indicator */}
              {realtimeConnected && (
                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live
                </div>
              )}

              {/* Bulk Actions Dropdown */}
              {reportCards.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      disabled={bulkStatusMutation.isPending}
                      data-testid="button-bulk-actions"
                    >
                      {bulkStatusMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <MoreVertical className="w-4 h-4 mr-2" />
                      )}
                      Bulk Actions
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem 
                      onClick={() => handleBulkStatusUpdate('finalized')}
                      disabled={statistics?.draftCount === 0}
                      className="cursor-pointer"
                      data-testid="bulk-finalize-all"
                    >
                      <FileCheck className="w-4 h-4 mr-2 text-blue-500" />
                      <span>Finalize All Drafts ({statistics?.draftCount || 0})</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleBulkStatusUpdate('published')}
                      disabled={statistics?.finalizedCount === 0}
                      className="cursor-pointer"
                      data-testid="bulk-publish-all"
                    >
                      <Send className="w-4 h-4 mr-2 text-green-500" />
                      <span>Publish All Finalized ({statistics?.finalizedCount || 0})</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => refetchReportCards()}
                      className="cursor-pointer"
                      data-testid="bulk-refresh"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      <span>Refresh Report Cards</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
                      <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Report Cards Yet</h3>
                      <p className="text-muted-foreground mb-2">Report cards will appear here automatically as students complete their exams.</p>
                      <p className="text-sm text-muted-foreground">
                        Once a student submits their first exam for this term, their report card will be created and updated with each subsequent exam.
                      </p>
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
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] p-4 sm:p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Report Card - {fullReportCard?.studentName}</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
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
              <div className="space-y-4 sm:space-y-6 pr-2 sm:pr-4">
                {/* Summary - Responsive Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="bg-muted p-2 sm:p-3 rounded-md">
                    <p className="text-xs sm:text-sm text-muted-foreground">Average</p>
                    <p className="text-xl sm:text-2xl font-bold">{fullReportCard.averagePercentage || 0}%</p>
                  </div>
                  <div className="bg-muted p-2 sm:p-3 rounded-md">
                    <p className="text-xs sm:text-sm text-muted-foreground">Grade</p>
                    <Badge className={`text-base sm:text-lg ${getGradeColor(fullReportCard.overallGrade)}`}>
                      {fullReportCard.overallGrade || '-'}
                    </Badge>
                  </div>
                  <div className="bg-muted p-2 sm:p-3 rounded-md">
                    <p className="text-xs sm:text-sm text-muted-foreground">Position</p>
                    <p className="text-xl sm:text-2xl font-bold">{fullReportCard.position || '-'}/{fullReportCard.totalStudentsInClass || '-'}</p>
                  </div>
                  <div className="bg-muted p-2 sm:p-3 rounded-md">
                    <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(fullReportCard.status)}</div>
                  </div>
                </div>

                {/* Actions - Responsive with Dropdown Menu */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status indicator */}
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                    {fullReportCard.status === 'draft' ? (
                      <><Unlock className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Editing enabled</span></>
                    ) : (
                      <><Lock className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Editing locked</span></>
                    )}
                  </div>
                  
                  {/* Refresh Scores - only enabled when in draft status */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => autoPopulateMutation.mutate(fullReportCard.id)}
                    disabled={autoPopulateMutation.isPending || fullReportCard.status !== 'draft'}
                    className="text-xs sm:text-sm"
                    data-testid="button-refresh-scores"
                  >
                    {autoPopulateMutation.isPending ? (
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    )}
                    <span className="hidden sm:inline">Refresh Scores</span>
                    <span className="sm:hidden">Refresh</span>
                  </Button>
                  
                  {/* Status Change Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="text-xs sm:text-sm"
                        data-testid="button-status-menu"
                      >
                        {fullReportCard.status === 'draft' && <FilePen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                        {fullReportCard.status === 'finalized' && <FileCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                        {fullReportCard.status === 'published' && <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                        <span className="hidden sm:inline">Change Status</span>
                        <span className="sm:hidden">Status</span>
                        <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {/* Show options based on current status */}
                      {fullReportCard.status === 'draft' && (
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ 
                            reportCardId: fullReportCard.id, 
                            status: 'finalized',
                            classId: selectedClass,
                            termId: selectedTerm
                          })}
                          className="cursor-pointer"
                          data-testid="menu-finalize"
                        >
                          <FileCheck className="w-4 h-4 mr-2 text-blue-500" />
                          <span>Finalize Report Card</span>
                        </DropdownMenuItem>
                      )}
                      
                      {fullReportCard.status === 'finalized' && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ 
                              reportCardId: fullReportCard.id, 
                              status: 'published',
                              classId: selectedClass,
                              termId: selectedTerm
                            })}
                            className="cursor-pointer"
                            data-testid="menu-publish"
                          >
                            <Send className="w-4 h-4 mr-2 text-green-500" />
                            <span>Publish to Parents/Students</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ 
                              reportCardId: fullReportCard.id, 
                              status: 'draft',
                              classId: selectedClass,
                              termId: selectedTerm
                            })}
                            className="cursor-pointer"
                            data-testid="menu-revert-draft"
                          >
                            <FilePen className="w-4 h-4 mr-2 text-yellow-500" />
                            <span>Revert to Draft (Edit)</span>
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {fullReportCard.status === 'published' && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ 
                              reportCardId: fullReportCard.id, 
                              status: 'finalized',
                              classId: selectedClass,
                              termId: selectedTerm
                            })}
                            className="cursor-pointer"
                            data-testid="menu-revert-finalized"
                          >
                            <FileCheck className="w-4 h-4 mr-2 text-blue-500" />
                            <span>Unpublish (Finalized)</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ 
                              reportCardId: fullReportCard.id, 
                              status: 'draft',
                              classId: selectedClass,
                              termId: selectedTerm
                            })}
                            className="cursor-pointer"
                            data-testid="menu-revert-draft-published"
                          >
                            <FilePen className="w-4 h-4 mr-2 text-yellow-500" />
                            <span>Revert to Draft (Edit)</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Subject Scores - Responsive Table */}
                <div>
                  <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Subject Scores</h4>
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <div className="min-w-[500px] sm:min-w-0 px-2 sm:px-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm">Subject</TableHead>
                            <TableHead className="text-center text-xs sm:text-sm whitespace-nowrap">Test<br className="sm:hidden"/><span className="hidden sm:inline"> </span>(40%)</TableHead>
                            <TableHead className="text-center text-xs sm:text-sm whitespace-nowrap">Exam<br className="sm:hidden"/><span className="hidden sm:inline"> </span>(60%)</TableHead>
                            <TableHead className="text-center text-xs sm:text-sm">Total</TableHead>
                            <TableHead className="text-xs sm:text-sm">Grade</TableHead>
                            <TableHead className="text-xs sm:text-sm">Edit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fullReportCard.items?.map((item: ReportCardItem) => (
                            <TableRow key={item.id} className={item.isOverridden ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                              <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <span className="truncate max-w-[100px] sm:max-w-none">{item.subjectName}</span>
                                  {item.isOverridden && (
                                    <Badge variant="outline" className="text-[10px] sm:text-xs w-fit">
                                      <PenTool className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                                      Modified
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-xs sm:text-sm py-2 sm:py-4">
                                {item.testScore !== null ? `${item.testScore}/${item.testMaxScore}` : '-'}
                                {item.testWeightedScore !== null && (
                                  <span className="text-[10px] sm:text-xs text-muted-foreground block">({item.testWeightedScore})</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center text-xs sm:text-sm py-2 sm:py-4">
                                {item.examScore !== null ? `${item.examScore}/${item.examMaxScore}` : '-'}
                                {item.examWeightedScore !== null && (
                                  <span className="text-[10px] sm:text-xs text-muted-foreground block">({item.examWeightedScore})</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center font-medium text-xs sm:text-sm py-2 sm:py-4">
                                {item.obtainedMarks}/{item.totalMarks}
                                <span className="text-[10px] sm:text-xs text-muted-foreground block">({item.percentage}%)</span>
                              </TableCell>
                              <TableCell className="py-2 sm:py-4">
                                <Badge className={`text-[10px] sm:text-xs ${getGradeColor(item.grade)}`}>
                                  {item.grade || '-'}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2 sm:py-4">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleOverrideScore(item)}
                                  disabled={fullReportCard.status !== 'draft'}
                                  className="h-7 w-7 sm:h-9 sm:w-9"
                                  data-testid={`button-override-${item.id}`}
                                >
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {/* Remarks - Responsive */}
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-semibold text-sm sm:text-base">Remarks</h4>
                  {fullReportCard.status !== 'draft' && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted p-2 rounded-md">
                      <Lock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>Remarks are locked. Revert to draft to edit.</span>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs sm:text-sm">Teacher Remarks</Label>
                    <Textarea
                      value={remarks.teacher}
                      onChange={(e) => setRemarks(prev => ({ ...prev, teacher: e.target.value }))}
                      placeholder="Enter teacher remarks..."
                      disabled={fullReportCard.status !== 'draft'}
                      className="mt-1 text-sm min-h-[60px] sm:min-h-[80px]"
                      data-testid="textarea-teacher-remarks"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Principal Remarks</Label>
                    <Textarea
                      value={remarks.principal}
                      onChange={(e) => setRemarks(prev => ({ ...prev, principal: e.target.value }))}
                      placeholder="Enter principal remarks..."
                      disabled={fullReportCard.status !== 'draft'}
                      className="mt-1 text-sm min-h-[60px] sm:min-h-[80px]"
                      data-testid="textarea-principal-remarks"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateRemarksMutation.mutate({
                      reportCardId: fullReportCard.id,
                      teacherRemarks: remarks.teacher,
                      principalRemarks: remarks.principal
                    })}
                    disabled={updateRemarksMutation.isPending || fullReportCard.status !== 'draft'}
                    className="text-xs sm:text-sm"
                    data-testid="button-save-remarks"
                  >
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
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

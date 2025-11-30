import { useState, useEffect, useMemo } from 'react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
  ChevronDown,
  Upload,
  Camera,
  History,
  AlertTriangle,
  Calendar,
  User,
  Building,
  Hash
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
  overriddenBy?: string;
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
  finalizedAt?: string;
  publishedAt?: string;
  items: ReportCardItem[];
  studentPhoto?: string;
  locked?: boolean;
}

interface AuditLogEntry {
  id: number;
  action: string;
  previousValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

interface ConfirmDialogState {
  open: boolean;
  type: 'finalize' | 'publish' | 'unpublish' | 'revert' | null;
  reportCardId: number | null;
  studentName: string;
  isBulk?: boolean;
  count?: number;
}

export default function TeacherReportCards() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null);
  const [selectedGradingScale, setSelectedGradingScale] = useState<string>('standard');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [isAuditLogDialogOpen, setIsAuditLogDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReportCardItem | null>(null);
  const [overrideData, setOverrideData] = useState({
    testScore: '',
    testMaxScore: '',
    examScore: '',
    examMaxScore: '',
    teacherRemarks: '',
    overrideReason: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [remarks, setRemarks] = useState({ teacher: '', principal: '' });
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    type: null,
    reportCardId: null,
    studentName: '',
    isBulk: false,
    count: 0
  });

  // Real-time subscription for report card updates - scoped to class
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

  // Extract unique session years from terms
  const sessionYears = useMemo(() => {
    const years = [...new Set(terms.map((term: any) => term.year))];
    return years.sort((a: number, b: number) => b - a);
  }, [terms]);

  // Filter terms by selected session
  const filteredTerms = useMemo(() => {
    if (!selectedSession) return terms;
    return terms.filter((term: any) => term.year?.toString() === selectedSession);
  }, [terms, selectedSession]);

  // Auto-select first class when teacher logs in
  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].id.toString());
    }
  }, [classes, selectedClass]);

  // Auto-select current term
  useEffect(() => {
    if (terms.length > 0 && !selectedTerm) {
      const currentTerm = terms.find((t: any) => t.isCurrent);
      if (currentTerm) {
        setSelectedTerm(currentTerm.id.toString());
        setSelectedSession(currentTerm.year?.toString() || '');
      }
    }
  }, [terms, selectedTerm]);

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

  // Fetch audit logs for a report card item
  const { data: auditLogs = [], isLoading: loadingAuditLogs } = useQuery({
    queryKey: ['/api/audit-logs', 'report-card-item', selectedItem?.id],
    queryFn: async () => {
      if (!selectedItem?.id) return [];
      const response = await apiRequest('GET', `/api/audit-logs?entityType=report_card_item&entityId=${selectedItem.id}`);
      if (!response.ok) return [];
      return await response.json();
    },
    enabled: !!selectedItem?.id && isAuditLogDialogOpen,
  });

  // Generate report cards for the entire class
  const generateReportsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/reports/generate-enhanced/${selectedClass}`, {
        termId: Number(selectedTerm),
        gradingScale: selectedGradingScale
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate report cards');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Report Cards Generated",
        description: data.message || `Successfully generated ${data.count || 0} report cards`,
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

  // Recalculate all report cards
  const recomputeReportsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/reports/recalculate-class/${selectedClass}`, {
        termId: Number(selectedTerm),
        gradingScale: selectedGradingScale
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to recalculate report cards');
      }
      return response.json();
    },
    onSuccess: (data) => {
      refetchReportCards();
      
      // Check if there were any errors during recalculation
      if (data.errors && data.errors.length > 0) {
        const errorDetails = data.errors.slice(0, 3).join('; ');
        toast({
          title: "Partial Success",
          description: `Recalculated ${data.updated || 0} report cards. ${data.errors.length} failed: ${errorDetails}${data.errors.length > 3 ? '...' : ''}. Class positions have been updated for successful cards.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Report Cards Recalculated",
          description: data.message || `Successfully recalculated ${data.updated || data.count || 0} report cards. Class positions have been updated.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to recalculate report cards",
        variant: "destructive",
      });
    },
  });

  // Bulk status update mutation for finalizing/publishing multiple report cards
  const bulkStatusMutation = useMutation({
    mutationFn: async (data: { reportCardIds: number[]; status: string }) => {
      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled(
        data.reportCardIds.map(async (reportCardId) => {
          const response = await apiRequest('PATCH', `/api/reports/${reportCardId}/status`, { status: data.status });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Failed to update report card ${reportCardId}`);
          }
          return { reportCardId, result: await response.json() };
        })
      );
      
      const fulfilled = results.filter((r): r is PromiseFulfilledResult<{ reportCardId: number; result: any }> => r.status === 'fulfilled');
      const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      
      return { 
        successCount: fulfilled.length, 
        failureCount: rejected.length, 
        errors: rejected.map(r => r.reason?.message || 'Unknown error'),
        totalCount: data.reportCardIds.length
      };
    },
    onSuccess: (result, { status }) => {
      const statusLabel = status === 'published' ? 'published' : 
                         status === 'finalized' ? 'finalized' : 'reverted to draft';
      
      // Always refetch to show updated data
      refetchReportCards();
      
      if (result.failureCount === 0) {
        // Only close dialog on complete success
        toast({
          title: "Success",
          description: `All ${result.successCount} report cards ${statusLabel} successfully`,
        });
        setConfirmDialog({ open: false, type: null, reportCardId: null, studentName: '' });
      } else if (result.successCount > 0) {
        // Keep dialog open on partial failure so user can review/retry
        const errorDetails = result.errors.slice(0, 3).join('; ');
        toast({
          title: "Partial Success",
          description: `${result.successCount} of ${result.totalCount} report cards ${statusLabel}. ${result.failureCount} failed: ${errorDetails}${result.errors.length > 3 ? '...' : ''}`,
          variant: "destructive",
        });
        // Dialog stays open - user can close manually or retry
      } else {
        // All failed - keep dialog open
        toast({
          title: "Error",
          description: `Failed to update all report cards: ${result.errors[0] || 'Unknown error'}`,
          variant: "destructive",
        });
        // Dialog stays open - user can close manually or retry
      }
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
    mutationFn: async (data: { itemId: number; testScore?: number; testMaxScore?: number; examScore?: number; examMaxScore?: number; teacherRemarks?: string; reason?: string }) => {
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
        description: "Score overridden successfully. Changes have been logged.",
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
      queryClient.cancelQueries({ queryKey: ['/api/reports', reportCardId, 'full'] });
      queryClient.cancelQueries({ queryKey: ['/api/reports/class-term', classId, termId] });
      
      const previousFullReport = queryClient.getQueryData(['/api/reports', reportCardId, 'full']);
      const previousReportCards = queryClient.getQueryData(['/api/reports/class-term', classId, termId]);
      const previousSelectedReportCard = selectedReportCard;
      
      const locked = status !== 'draft';
      
      queryClient.setQueryData(['/api/reports', reportCardId, 'full'], (old: any) => {
        if (!old || typeof old !== 'object') return old;
        return { ...old, status, locked };
      });
      
      queryClient.setQueryData(['/api/reports/class-term', classId, termId], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((rc: any) => 
          rc.id === reportCardId ? { ...rc, status, locked } : rc
        );
      });
      
      setSelectedReportCard(prev => prev?.id === reportCardId ? { ...prev, status, locked } : prev);
      
      return { previousFullReport, previousReportCards, previousSelectedReportCard, classId, termId };
    },
    onSuccess: (data, { reportCardId, status, classId, termId }) => {
      const reportCard = data.reportCard;
      
      if (reportCard && typeof reportCard === 'object') {
        queryClient.setQueryData(['/api/reports', reportCardId, 'full'], (old: any) => {
          if (!old || typeof old !== 'object') return { ...reportCard };
          return { ...old, ...reportCard };
        });
        
        queryClient.setQueryData(['/api/reports/class-term', classId, termId], (old: any) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((rc: any) => rc.id === reportCardId ? { ...rc, ...reportCard } : rc);
        });
        
        setSelectedReportCard(prev => prev?.id === reportCardId ? { ...prev, ...reportCard } : prev);
      }
      
      const statusLabel = status === 'published' ? 'Published' : 
                         status === 'finalized' ? 'Finalized' : 'Reverted to Draft';
      toast({
        title: "Success",
        description: data.message || `Report card ${statusLabel.toLowerCase()} successfully`,
      });
      setConfirmDialog({ open: false, type: null, reportCardId: null, studentName: '' });
    },
    onError: (error: any, { reportCardId }, context: any) => {
      if (context?.previousFullReport) {
        queryClient.setQueryData(['/api/reports', reportCardId, 'full'], context.previousFullReport);
      }
      if (context?.previousReportCards && context?.classId && context?.termId) {
        queryClient.setQueryData(['/api/reports/class-term', context.classId, context.termId], context.previousReportCards);
      }
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
      teacherRemarks: item.teacherRemarks || '',
      overrideReason: ''
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
      teacherRemarks: overrideData.teacherRemarks || undefined,
      reason: overrideData.overrideReason || undefined
    });
  };

  const handleViewAuditLog = (item: ReportCardItem) => {
    setSelectedItem(item);
    setIsAuditLogDialogOpen(true);
  };

  // Open confirmation dialog for status changes
  const openConfirmDialog = (type: 'finalize' | 'publish' | 'unpublish' | 'revert', reportCardId: number, studentName: string) => {
    setConfirmDialog({
      open: true,
      type,
      reportCardId,
      studentName,
      isBulk: false
    });
  };

  // Open confirmation dialog for bulk status changes
  const openBulkConfirmDialog = (type: 'finalize' | 'publish', count: number) => {
    setConfirmDialog({
      open: true,
      type,
      reportCardId: null,
      studentName: '',
      isBulk: true,
      count
    });
  };

  // Handle confirm dialog action
  const handleConfirmAction = () => {
    if (confirmDialog.isBulk) {
      let targetIds: number[] = [];
      const status = confirmDialog.type === 'finalize' ? 'finalized' : 'published';
      
      if (confirmDialog.type === 'finalize') {
        targetIds = reportCards.filter((rc: any) => rc.status === 'draft').map((rc: any) => rc.id);
      } else if (confirmDialog.type === 'publish') {
        targetIds = reportCards.filter((rc: any) => rc.status === 'finalized').map((rc: any) => rc.id);
      }
      
      bulkStatusMutation.mutate({ reportCardIds: targetIds, status });
    } else if (confirmDialog.reportCardId) {
      let status = 'draft';
      if (confirmDialog.type === 'finalize') status = 'finalized';
      else if (confirmDialog.type === 'publish') status = 'published';
      else if (confirmDialog.type === 'unpublish') status = 'finalized';
      else if (confirmDialog.type === 'revert') status = 'draft';
      
      updateStatusMutation.mutate({
        reportCardId: confirmDialog.reportCardId,
        status,
        classId: selectedClass,
        termId: selectedTerm
      });
    }
  };

  // Handle bulk status updates with confirmation
  const handleBulkStatusUpdate = (status: string) => {
    let targetIds: number[] = [];
    
    if (status === 'finalized') {
      targetIds = reportCards.filter((rc: any) => rc.status === 'draft').map((rc: any) => rc.id);
      if (targetIds.length > 0) {
        openBulkConfirmDialog('finalize', targetIds.length);
      } else {
        toast({
          title: "No Report Cards to Finalize",
          description: "No draft report cards found.",
          variant: "destructive",
        });
      }
    } else if (status === 'published') {
      targetIds = reportCards.filter((rc: any) => rc.status === 'finalized').map((rc: any) => rc.id);
      if (targetIds.length > 0) {
        openBulkConfirmDialog('publish', targetIds.length);
      } else {
        toast({
          title: "No Report Cards to Publish",
          description: "No finalized report cards found.",
          variant: "destructive",
        });
      }
    }
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

  const getConfirmDialogContent = () => {
    const { type, studentName, isBulk, count } = confirmDialog;
    
    switch (type) {
      case 'finalize':
        return {
          title: isBulk ? `Finalize ${count} Report Cards?` : `Finalize Report Card?`,
          description: isBulk 
            ? `You are about to finalize ${count} draft report cards. Once finalized, scores cannot be edited unless you revert to draft. Students and parents will NOT see these yet.`
            : `You are about to finalize the report card for ${studentName}. Once finalized, scores cannot be edited unless you revert to draft. The student and parents will NOT see this yet.`,
          confirmText: 'Finalize',
          confirmClass: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'publish':
        return {
          title: isBulk ? `Publish ${count} Report Cards?` : `Publish Report Card?`,
          description: isBulk
            ? `You are about to publish ${count} finalized report cards. Students and parents will be able to view their report cards immediately.`
            : `You are about to publish the report card for ${studentName}. The student and their parents will be able to view this report card immediately.`,
          confirmText: 'Publish',
          confirmClass: 'bg-green-600 hover:bg-green-700'
        };
      case 'unpublish':
        return {
          title: 'Unpublish Report Card?',
          description: `You are about to unpublish the report card for ${studentName}. Students and parents will no longer be able to view this report card. The report card will be reverted to Finalized status.`,
          confirmText: 'Unpublish',
          confirmClass: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'revert':
        return {
          title: 'Revert to Draft?',
          description: `You are about to revert the report card for ${studentName} to draft status. This will unlock editing capabilities. If the report was published, students and parents will no longer be able to view it.`,
          confirmText: 'Revert to Draft',
          confirmClass: 'bg-yellow-600 hover:bg-yellow-700'
        };
      default:
        return {
          title: 'Confirm Action',
          description: 'Are you sure you want to proceed?',
          confirmText: 'Confirm',
          confirmClass: ''
        };
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

  const confirmDialogContent = getConfirmDialogContent();

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
            <p className="text-muted-foreground">Manage and publish student report cards</p>
          </div>
        </div>

        {/* Top Bar with Selectors and Actions */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Report Card Management
                </CardTitle>
                <CardDescription>
                  Select class, session, and term to view and manage report cards
                </CardDescription>
              </div>
              {realtimeConnected && (
                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live Updates
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              {/* Class Selector */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium">Class</Label>
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

              {/* Session Year Selector */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium">Session Year</Label>
                <Select value={selectedSession} onValueChange={(value) => {
                  setSelectedSession(value);
                  setSelectedTerm('');
                }}>
                  <SelectTrigger className="w-32" data-testid="select-session">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionYears.map((year: number) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}/{year + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Term Selector */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium">Term</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="w-48" data-testid="select-term">
                    <SelectValue placeholder="Select Term" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTerms.map((term: any) => (
                      <SelectItem key={term.id} value={term.id.toString()}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Grading Scale Selector */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium">Grading Scale</Label>
                <Select value={selectedGradingScale} onValueChange={setSelectedGradingScale}>
                  <SelectTrigger className="w-36" data-testid="select-grading-scale">
                    <SelectValue placeholder="Grading Scale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (A-F)</SelectItem>
                    <SelectItem value="waec">WAEC (A1-F9)</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="h-8 hidden md:block" />

              {/* Generate Button */}
              <Button
                variant="default"
                onClick={() => generateReportsMutation.mutate()}
                disabled={!selectedClass || !selectedTerm || generateReportsMutation.isPending}
                data-testid="button-generate-reports"
              >
                {generateReportsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate
              </Button>

              {/* Recompute Button */}
              <Button
                variant="outline"
                onClick={() => recomputeReportsMutation.mutate()}
                disabled={!selectedClass || !selectedTerm || recomputeReportsMutation.isPending || reportCards.length === 0}
                data-testid="button-recompute-reports"
              >
                {recomputeReportsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Recompute
              </Button>

              {/* Bulk Actions */}
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

            {/* Status Filter Row */}
            <div className="flex flex-wrap gap-4 items-center mt-4 pt-4 border-t">
              <Label className="text-xs font-medium">Filter:</Label>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  data-testid="filter-all"
                >
                  All ({reportCards.length})
                </Button>
                <Button
                  variant={statusFilter === 'draft' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('draft')}
                  data-testid="filter-draft"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Draft ({statistics?.draftCount || 0})
                </Button>
                <Button
                  variant={statusFilter === 'finalized' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('finalized')}
                  data-testid="filter-finalized"
                >
                  <FileCheck className="w-3 h-3 mr-1" />
                  Finalized ({statistics?.finalizedCount || 0})
                </Button>
                <Button
                  variant={statusFilter === 'published' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('published')}
                  data-testid="filter-published"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Published ({statistics?.publishedCount || 0})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
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
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="students" data-testid="tab-students">Students</TabsTrigger>
              <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Statistics Cards */}
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

              {/* Report Cards Table */}
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
                      <p className="text-muted-foreground mb-4">Click "Generate" to create report cards for this class.</p>
                      <Button onClick={() => generateReportsMutation.mutate()} disabled={generateReportsMutation.isPending}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Report Cards
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search by name or admission number..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                          data-testid="input-search-students"
                        />
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">Pos</TableHead>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Adm. No.</TableHead>
                              <TableHead className="text-center">Average</TableHead>
                              <TableHead className="text-center">Grade</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredReportCards.map((rc: any) => (
                              <TableRow key={rc.id} data-testid={`row-report-${rc.id}`}>
                                <TableCell className="font-medium">
                                  {rc.position || '-'}/{rc.totalStudentsInClass || reportCards.length}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={rc.studentPhoto} alt={rc.studentName} />
                                      <AvatarFallback className="text-xs">
                                        {rc.studentName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{rc.studentName}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm">{rc.admissionNumber || '-'}</TableCell>
                                <TableCell className="text-center">
                                  <span className={`font-medium ${(rc.averagePercentage || 0) >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                                    {rc.averagePercentage || 0}%
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={getGradeColor(rc.overallGrade)}>
                                    {rc.overallGrade || '-'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(rc.status)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end gap-1">
                                    {/* View Button */}
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleViewReportCard(rc)}
                                      title="View Report Card"
                                      data-testid={`button-view-${rc.id}`}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    
                                    {/* Edit Button - only for draft */}
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleViewReportCard(rc)}
                                      disabled={rc.status !== 'draft'}
                                      title={rc.status === 'draft' ? 'Edit Scores' : 'Locked - Revert to draft to edit'}
                                      data-testid={`button-edit-${rc.id}`}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>

                                    {/* Status Action Buttons */}
                                    {rc.status === 'draft' && (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => openConfirmDialog('finalize', rc.id, rc.studentName)}
                                        title="Finalize Report Card"
                                        className="text-blue-600 hover:text-blue-700"
                                        data-testid={`button-finalize-${rc.id}`}
                                      >
                                        <FileCheck className="w-4 h-4" />
                                      </Button>
                                    )}
                                    
                                    {rc.status === 'finalized' && (
                                      <>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => openConfirmDialog('publish', rc.id, rc.studentName)}
                                          title="Publish Report Card"
                                          className="text-green-600 hover:text-green-700"
                                          data-testid={`button-publish-${rc.id}`}
                                        >
                                          <Send className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => openConfirmDialog('revert', rc.id, rc.studentName)}
                                          title="Revert to Draft"
                                          className="text-yellow-600 hover:text-yellow-700"
                                          data-testid={`button-revert-${rc.id}`}
                                        >
                                          <Undo2 className="w-4 h-4" />
                                        </Button>
                                      </>
                                    )}
                                    
                                    {rc.status === 'published' && (
                                      <>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => openConfirmDialog('unpublish', rc.id, rc.studentName)}
                                          title="Unpublish Report Card"
                                          className="text-yellow-600 hover:text-yellow-700"
                                          data-testid={`button-unpublish-${rc.id}`}
                                        >
                                          <Unlock className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => openConfirmDialog('revert', rc.id, rc.studentName)}
                                          title="Revert to Draft"
                                          className="text-red-600 hover:text-red-700"
                                          data-testid={`button-revert-published-${rc.id}`}
                                        >
                                          <Undo2 className="w-4 h-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
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
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={rc.studentPhoto} alt={rc.studentName} />
                                  <AvatarFallback>
                                    {rc.studentName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-medium">{rc.studentName}</h4>
                                  <p className="text-sm text-muted-foreground font-mono">{rc.admissionNumber}</p>
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
                            <div className="mt-2 flex items-center justify-between">
                              {getStatusBadge(rc.status)}
                              <div className="flex gap-1">
                                {rc.status === 'draft' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => { e.stopPropagation(); openConfirmDialog('finalize', rc.id, rc.studentName); }}
                                    className="h-7 text-blue-600"
                                  >
                                    <FileCheck className="w-3 h-3 mr-1" />
                                    Finalize
                                  </Button>
                                )}
                                {rc.status === 'finalized' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => { e.stopPropagation(); openConfirmDialog('publish', rc.id, rc.studentName); }}
                                    className="h-7 text-green-600"
                                  >
                                    <Send className="w-3 h-3 mr-1" />
                                    Publish
                                  </Button>
                                )}
                              </div>
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
                              <span className="text-sm w-16 text-right">{count} ({percentage}%)</span>
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

      {/* View Report Card Dialog - Enhanced with Student Header and Signature Area */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 sm:p-6 pb-0">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Report Card Details</span>
            </DialogTitle>
          </DialogHeader>
          
          {loadingFullReport ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading report card...</p>
            </div>
          ) : fullReportCard ? (
            <ScrollArea className="max-h-[calc(90vh-80px)]">
              <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-2">
                {/* Student Header Section */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                      <AvatarImage src={fullReportCard.studentPhoto} alt={fullReportCard.studentName} />
                      <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                        {fullReportCard.studentName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold">{fullReportCard.studentName}</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Hash className="w-3 h-3" />
                          <span>{fullReportCard.admissionNumber}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Building className="w-3 h-3" />
                          <span>{fullReportCard.className}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{fullReportCard.termName}</span>
                        </div>
                        <div>
                          {getStatusBadge(fullReportCard.status)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-4xl font-bold text-primary">{fullReportCard.averagePercentage || 0}%</div>
                      <Badge className={`text-lg ${getGradeColor(fullReportCard.overallGrade)}`}>
                        {fullReportCard.overallGrade || '-'}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        Position: {fullReportCard.position || '-'}/{fullReportCard.totalStudentsInClass || '-'}
                      </div>
                    </div>
                  </div>
                  {/* Mobile stats */}
                  <div className="grid grid-cols-3 gap-4 mt-4 sm:hidden">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{fullReportCard.averagePercentage || 0}%</div>
                      <div className="text-xs text-muted-foreground">Average</div>
                    </div>
                    <div className="text-center">
                      <Badge className={`text-lg ${getGradeColor(fullReportCard.overallGrade)}`}>
                        {fullReportCard.overallGrade || '-'}
                      </Badge>
                      <div className="text-xs text-muted-foreground">Grade</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{fullReportCard.position || '-'}/{fullReportCard.totalStudentsInClass || '-'}</div>
                      <div className="text-xs text-muted-foreground">Position</div>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {fullReportCard.status === 'draft' ? (
                      <><Unlock className="w-4 h-4" /> Editing enabled</>
                    ) : (
                      <><Lock className="w-4 h-4" /> Editing locked</>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
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
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                      data-testid="button-print"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>

                    {/* Status Change Buttons */}
                    {fullReportCard.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => openConfirmDialog('finalize', fullReportCard.id, fullReportCard.studentName)}
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid="button-modal-finalize"
                      >
                        <FileCheck className="w-4 h-4 mr-2" />
                        Finalize
                      </Button>
                    )}
                    
                    {fullReportCard.status === 'finalized' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => openConfirmDialog('publish', fullReportCard.id, fullReportCard.studentName)}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid="button-modal-publish"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Publish
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openConfirmDialog('revert', fullReportCard.id, fullReportCard.studentName)}
                          data-testid="button-modal-revert"
                        >
                          <Undo2 className="w-4 h-4 mr-2" />
                          Revert to Draft
                        </Button>
                      </>
                    )}
                    
                    {fullReportCard.status === 'published' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openConfirmDialog('unpublish', fullReportCard.id, fullReportCard.studentName)}
                          data-testid="button-modal-unpublish"
                        >
                          <Unlock className="w-4 h-4 mr-2" />
                          Unpublish
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openConfirmDialog('revert', fullReportCard.id, fullReportCard.studentName)}
                          className="text-red-600"
                          data-testid="button-modal-revert-published"
                        >
                          <Undo2 className="w-4 h-4 mr-2" />
                          Revert to Draft
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Subject Scores Table */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Subject Scores
                  </h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead className="text-center">Test (40%)</TableHead>
                          <TableHead className="text-center">Exam (60%)</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-center">Grade</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fullReportCard.items?.map((item: ReportCardItem) => (
                          <TableRow key={item.id} className={item.isOverridden ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span>{item.subjectName}</span>
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
                            <TableCell className="text-center">
                              <Badge className={getGradeColor(item.grade)}>
                                {item.grade || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleOverrideScore(item)}
                                  disabled={fullReportCard.status !== 'draft'}
                                  title={fullReportCard.status === 'draft' ? 'Edit Score' : 'Locked'}
                                  data-testid={`button-override-${item.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {item.isOverridden && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleViewAuditLog(item)}
                                    title="View Edit History"
                                    data-testid={`button-history-${item.id}`}
                                  >
                                    <History className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Remarks Section */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <PenTool className="w-4 h-4" />
                    Remarks
                  </h4>
                  {fullReportCard.status !== 'draft' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      <span>Remarks are locked. Revert to draft to edit.</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Teacher Remarks</Label>
                      <Textarea
                        value={remarks.teacher}
                        onChange={(e) => setRemarks(prev => ({ ...prev, teacher: e.target.value }))}
                        placeholder="Enter teacher remarks..."
                        disabled={fullReportCard.status !== 'draft'}
                        className="mt-1 min-h-[80px]"
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
                        className="mt-1 min-h-[80px]"
                        data-testid="textarea-principal-remarks"
                      />
                    </div>
                  </div>
                  {fullReportCard.status === 'draft' && (
                    <Button
                      variant="outline"
                      onClick={() => updateRemarksMutation.mutate({
                        reportCardId: fullReportCard.id,
                        teacherRemarks: remarks.teacher,
                        principalRemarks: remarks.principal
                      })}
                      disabled={updateRemarksMutation.isPending}
                      data-testid="button-save-remarks"
                    >
                      {updateRemarksMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Save className="w-4 h-4 mr-2" />
                      Save Remarks
                    </Button>
                  )}
                </div>

                {/* Signature Section */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <PenTool className="w-4 h-4" />
                    Signatures
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="h-16 border-b-2 border-dashed border-gray-300 mb-2 flex items-end justify-center">
                        <span className="text-xl font-cursive text-primary italic">{userName}</span>
                      </div>
                      <p className="text-sm font-medium">Class Teacher</p>
                      <p className="text-xs text-muted-foreground">Date: {format(new Date(), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="h-16 border-b-2 border-dashed border-gray-300 mb-2 flex items-end justify-center">
                        <span className="text-xl font-cursive text-purple-600 italic">Principal</span>
                      </div>
                      <p className="text-sm font-medium">Principal/Head</p>
                      <p className="text-xs text-muted-foreground">
                        {fullReportCard.publishedAt ? `Published: ${format(new Date(fullReportCard.publishedAt), 'dd/MM/yyyy')}` : 'Not yet published'}
                      </p>
                    </div>
                  </div>
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

      {/* Override Score Dialog with Audit Trail */}
      <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Override Score
            </DialogTitle>
            <DialogDescription>
              Modify scores for {selectedItem?.subjectName}. All changes are logged for audit purposes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> Score overrides are tracked and logged. Please provide a reason for the change.
                </div>
              </div>
            </div>

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
              <Label>Subject Remarks</Label>
              <Textarea
                value={overrideData.teacherRemarks}
                onChange={(e) => setOverrideData(prev => ({ ...prev, teacherRemarks: e.target.value }))}
                placeholder="Remarks for this subject..."
                data-testid="input-subject-remarks"
              />
            </div>

            <div>
              <Label className="text-yellow-700 dark:text-yellow-400">Reason for Override *</Label>
              <Textarea
                value={overrideData.overrideReason}
                onChange={(e) => setOverrideData(prev => ({ ...prev, overrideReason: e.target.value }))}
                placeholder="Please explain why you are overriding this score (e.g., correction of marking error, late submission consideration)..."
                className="border-yellow-300 focus:border-yellow-500"
                data-testid="input-override-reason"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOverrideDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveOverride} 
              disabled={overrideScoreMutation.isPending || !overrideData.overrideReason.trim()}
            >
              {overrideScoreMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={isAuditLogDialogOpen} onOpenChange={setIsAuditLogDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Edit History
            </DialogTitle>
            <DialogDescription>
              Audit log for {selectedItem?.subjectName}
            </DialogDescription>
          </DialogHeader>
          
          {loadingAuditLogs ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading history...</p>
            </div>
          ) : auditLogs.length > 0 ? (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {auditLogs.map((log: AuditLogEntry) => (
                  <div key={log.id} className="border rounded-md p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          By {log.changedBy} on {format(new Date(log.changedAt), 'dd MMM yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    {log.reason && (
                      <p className="text-sm mt-2 bg-muted p-2 rounded">
                        <strong>Reason:</strong> {log.reason}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Previous:</span>
                        <span className="ml-1">{log.previousValue || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">New:</span>
                        <span className="ml-1">{log.newValue || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No edit history found for this item.</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAuditLogDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmDialog.type === 'finalize' && <FileCheck className="w-5 h-5 text-blue-500" />}
              {confirmDialog.type === 'publish' && <Send className="w-5 h-5 text-green-500" />}
              {(confirmDialog.type === 'unpublish' || confirmDialog.type === 'revert') && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
              {confirmDialogContent.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              className={confirmDialogContent.confirmClass}
              disabled={updateStatusMutation.isPending || bulkStatusMutation.isPending}
            >
              {(updateStatusMutation.isPending || bulkStatusMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {confirmDialogContent.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
}

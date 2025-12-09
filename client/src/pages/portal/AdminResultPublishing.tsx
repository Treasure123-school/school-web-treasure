import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Send, 
  Eye, 
  XCircle,
  Loader2,
  RefreshCw,
  FileCheck,
  AlertTriangle,
  Users,
  GraduationCap
} from 'lucide-react';
import { format } from 'date-fns';
import { ProfessionalReportCard } from '@/components/ui/professional-report-card';

interface FinalizedReportCard {
  id: number;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classId: number;
  className: string;
  termId: number;
  termName: string;
  sessionYear: string;
  averagePercentage: number | null;
  overallGrade: string | null;
  status: string;
  finalizedAt: string | null;
  publishedAt: string | null;
  generatedAt: string;
}

interface Statistics {
  draft: number;
  finalized: number;
  published: number;
}

export default function AdminResultPublishing() {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('finalized');
  const [selectedReportCards, setSelectedReportCards] = useState<number[]>([]);
  const [viewingReportCard, setViewingReportCard] = useState<FinalizedReportCard | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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

  const { data: reportCardsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/report-cards/finalized', selectedClass, selectedTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedClass !== 'all') params.append('classId', selectedClass);
      if (selectedTerm !== 'all') params.append('termId', selectedTerm);
      params.append('status', statusFilter === 'all' ? 'all' : statusFilter);
      
      const response = await apiRequest('GET', `/api/admin/report-cards/finalized?${params}`);
      if (!response.ok) throw new Error('Failed to fetch report cards');
      return await response.json();
    },
  });

  const reportCards: FinalizedReportCard[] = reportCardsData?.reportCards || [];
  const statistics: Statistics = reportCardsData?.statistics || { draft: 0, finalized: 0, published: 0 };

  const { data: fullReportCard, isLoading: loadingFullReport } = useQuery({
    queryKey: ['/api/reports', viewingReportCard?.id, 'full'],
    queryFn: async () => {
      if (!viewingReportCard?.id) return null;
      const response = await apiRequest('GET', `/api/reports/${viewingReportCard.id}/full`);
      if (!response.ok) return null;
      return await response.json();
    },
    enabled: !!viewingReportCard?.id && isViewDialogOpen,
  });

  const publishMutation = useMutation({
    mutationFn: async (reportCardId: number) => {
      const response = await apiRequest('PATCH', `/api/reports/${reportCardId}/status`, { status: 'published' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to publish');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Report card published successfully" });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bulkPublishMutation = useMutation({
    mutationFn: async (reportCardIds: number[]) => {
      const response = await apiRequest('POST', '/api/admin/report-cards/bulk-publish', { reportCardIds });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to bulk publish');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: data.message });
      setSelectedReportCards([]);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiRequest('POST', `/api/admin/report-cards/${id}/reject`, { reason });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Report Card Rejected", description: "The report card has been reverted to draft for teacher revision" });
      setIsRejectDialogOpen(false);
      setRejectingId(null);
      setRejectReason('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const finalizedIds = reportCards.filter(rc => rc.status === 'finalized').map(rc => rc.id);
      setSelectedReportCards(finalizedIds);
    } else {
      setSelectedReportCards([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedReportCards(prev => [...prev, id]);
    } else {
      setSelectedReportCards(prev => prev.filter(rcId => rcId !== id));
    }
  };

  const handleViewReportCard = (rc: FinalizedReportCard) => {
    setViewingReportCard(rc);
    setIsViewDialogOpen(true);
  };

  const handleReject = (id: number) => {
    setRejectingId(id);
    setIsRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (rejectingId) {
      rejectMutation.mutate({ id: rejectingId, reason: rejectReason });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Draft</Badge>;
      case 'finalized':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"><FileCheck className="w-3 h-3 mr-1" /> Awaiting Approval</Badge>;
      case 'published':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Published</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const finalizedCount = reportCards.filter(rc => rc.status === 'finalized').length;
  const allFinalizedSelected = finalizedCount > 0 && selectedReportCards.length === finalizedCount;

  return (
    <div className="space-y-6 p-4 md:p-6" data-testid="page-admin-result-publishing">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <FileText className="w-6 h-6" />
            Result Publishing
          </h1>
          <p className="text-muted-foreground">
            Review and publish finalized report cards submitted by teachers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Awaiting Approval</p>
                  <p className="text-2xl font-bold text-amber-600" data-testid="stat-finalized">{statistics.finalized}</p>
                </div>
                <FileCheck className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="stat-published">{statistics.published}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Draft</p>
                  <p className="text-2xl font-bold text-gray-600" data-testid="stat-draft">{statistics.draft}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Report Cards</CardTitle>
              <CardDescription>
                {statusFilter === 'finalized' ? 'Finalized report cards awaiting your approval' : 
                 statusFilter === 'published' ? 'Published report cards' : 'All report cards'}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[150px]" data-testid="select-class">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-[150px]" data-testid="select-term">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {terms.map((t: any) => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]" data-testid="select-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="finalized">Awaiting Approval</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="all">All Statuses</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => refetch()}
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedReportCards.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-md">
              <span className="text-sm">{selectedReportCards.length} selected</span>
              <Button 
                size="sm" 
                onClick={() => bulkPublishMutation.mutate(selectedReportCards)}
                disabled={bulkPublishMutation.isPending}
                data-testid="button-bulk-publish"
              >
                {bulkPublishMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Publish Selected
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSelectedReportCards([])}
                data-testid="button-clear-selection"
              >
                Clear Selection
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : reportCards.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {statusFilter === 'finalized' 
                  ? 'No report cards awaiting approval' 
                  : 'No report cards found matching your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {statusFilter === 'finalized' && (
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={allFinalizedSelected}
                          onCheckedChange={handleSelectAll}
                          data-testid="checkbox-select-all"
                        />
                      </TableHead>
                    )}
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Average</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Finalized</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportCards.map((rc) => (
                    <TableRow key={rc.id} data-testid={`row-report-${rc.id}`}>
                      {statusFilter === 'finalized' && (
                        <TableCell>
                          {rc.status === 'finalized' && (
                            <Checkbox 
                              checked={selectedReportCards.includes(rc.id)}
                              onCheckedChange={(checked) => handleSelectOne(rc.id, !!checked)}
                              data-testid={`checkbox-select-${rc.id}`}
                            />
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <p className="font-medium">{rc.studentName}</p>
                          <p className="text-xs text-muted-foreground">{rc.admissionNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>{rc.className}</TableCell>
                      <TableCell>
                        <div>
                          <p>{rc.termName}</p>
                          <p className="text-xs text-muted-foreground">{rc.sessionYear}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={(rc.averagePercentage || 0) >= 50 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {rc.averagePercentage || 0}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rc.overallGrade || '-'}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(rc.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {rc.finalizedAt ? format(new Date(rc.finalizedAt), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleViewReportCard(rc)}
                            data-testid={`button-view-${rc.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {rc.status === 'finalized' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => publishMutation.mutate(rc.id)}
                                disabled={publishMutation.isPending}
                                data-testid={`button-publish-${rc.id}`}
                              >
                                {publishMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost"
                                onClick={() => handleReject(rc.id)}
                                data-testid={`button-reject-${rc.id}`}
                              >
                                <XCircle className="w-4 h-4 text-red-500" />
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
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Report Card Preview
            </DialogTitle>
            <DialogDescription>
              {viewingReportCard?.studentName} - {viewingReportCard?.className} - {viewingReportCard?.termName}
            </DialogDescription>
          </DialogHeader>
          
          {loadingFullReport ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : fullReportCard ? (
            <ScrollArea className="h-[calc(90vh-200px)]">
              <div className="space-y-4 pr-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(fullReportCard.status)}
                    {fullReportCard.status === 'finalized' && (
                      <span className="text-sm text-muted-foreground">
                        Ready for publishing
                      </span>
                    )}
                  </div>
                  {fullReportCard.status === 'finalized' && (
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => {
                          publishMutation.mutate(fullReportCard.id);
                          setIsViewDialogOpen(false);
                        }}
                        disabled={publishMutation.isPending}
                        data-testid="button-publish-dialog"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Approve & Publish
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          handleReject(fullReportCard.id);
                        }}
                        data-testid="button-reject-dialog"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>

                <ProfessionalReportCard
                  reportCard={{
                    id: fullReportCard.id,
                    studentId: fullReportCard.studentId,
                    studentName: fullReportCard.studentName,
                    studentPhoto: fullReportCard.studentPhoto,
                    admissionNumber: fullReportCard.studentUsername || fullReportCard.admissionNumber,
                    className: fullReportCard.className,
                    termName: fullReportCard.termName,
                    academicSession: fullReportCard.sessionYear || '2024/2025',
                    averagePercentage: fullReportCard.averagePercentage || 0,
                    overallGrade: fullReportCard.overallGrade || '-',
                    position: fullReportCard.position || 0,
                    totalStudentsInClass: fullReportCard.totalStudentsInClass || 0,
                    totalScore: fullReportCard.totalScore,
                    items: fullReportCard.items || [],
                    teacherRemarks: fullReportCard.teacherRemarks,
                    principalRemarks: fullReportCard.principalRemarks,
                    status: fullReportCard.status,
                    generatedAt: fullReportCard.generatedAt,
                    classStatistics: {
                      highestScore: 0,
                      lowestScore: 0,
                      classAverage: 0,
                      totalStudents: fullReportCard.totalStudentsInClass || 0
                    },
                    attendance: {
                      timesSchoolOpened: 0,
                      timesPresent: 0,
                      timesAbsent: 0,
                      attendancePercentage: 0
                    }
                  }}
                  testWeight={40}
                  examWeight={60}
                  canEditRemarks={false}
                  isLoading={false}
                />
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p>Failed to load report card details</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Reject Report Card
            </DialogTitle>
            <DialogDescription>
              This will revert the report card back to draft status so the teacher can make corrections.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Reason for Rejection (Optional)</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter feedback for the teacher..."
                className="mt-2"
                data-testid="input-reject-reason"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectingId(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject & Revert to Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

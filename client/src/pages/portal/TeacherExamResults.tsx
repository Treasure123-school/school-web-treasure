import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Download, 
  Users, 
  TrendingUp, 
  Award, 
  FileText, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useSocketIORealtime } from '@/hooks/useSocketIORealtime';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Class, ExamResult, Exam, Subject } from '@shared/schema';

interface EnrichedExamResult extends ExamResult {
  studentName?: string;
  studentUsername?: string;
  admissionNumber?: string | null;
}

interface EditableScore {
  resultId: number;
  testScore: number | null;
  remarks: string;
}

export default function TeacherExamResults() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute('/portal/teacher/results/exam/:examId');
  const examId = params?.examId ? parseInt(params.examId) : null;
  const [editingScores, setEditingScores] = useState<Map<number, EditableScore>>(new Map());
  const [syncingResults, setSyncingResults] = useState<Set<number>>(new Set());
  const [allowingRetake, setAllowingRetake] = useState<Set<number>>(new Set());
  const [retakeConfirmDialog, setRetakeConfirmDialog] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
    resultId: number;
  } | null>(null);

  if (!user) {
    return <div>Loading...</div>;
  }
  const userName = `${user.firstName} ${user.lastName}`;
  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;
  const userRole = (user.role?.toLowerCase() || 'teacher') as 'admin' | 'teacher' | 'student' | 'parent';

  const { data: exams = [] } = useQuery<Exam[]>({
    queryKey: ['/api/exams'],
  });

  const currentExam = exams.find((e) => e.id === examId);

  const { data: examResults = [], isLoading, refetch } = useQuery<EnrichedExamResult[]>({
    queryKey: ['/api/exam-results/exam', examId],
    enabled: !!examId,
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });

  useSocketIORealtime({
    table: 'exam_results',
    queryKey: ['/api/exam-results/exam', examId ?? 0],
    enabled: !!examId,
    onEvent: (event) => {
      console.log('[Exam Results] Result update received', event.eventType);
      refetch();
    }
  });

  const updateScoreMutation = useMutation({
    mutationFn: async ({ resultId, testScore, remarks }: { resultId: number; testScore: number | null; remarks?: string }) => {
      const response = await apiRequest('PATCH', `/api/teacher/exam-results/${resultId}`, {
        testScore,
        remarks
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update score');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Score Updated",
        description: "Test score has been saved successfully.",
      });
      setEditingScores((prev) => {
        const next = new Map(prev);
        next.delete(variables.resultId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exam-results/exam', examId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncToReportCardMutation = useMutation({
    mutationFn: async ({ resultId }: { resultId: number }) => {
      setSyncingResults((prev) => new Set(prev).add(resultId));
      const response = await apiRequest('POST', `/api/teacher/exam-results/${resultId}/sync-reportcard`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sync to report card');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Synced to Report Card",
        description: "Result has been synced to the student's report card.",
      });
      setSyncingResults((prev) => {
        const next = new Set(prev);
        next.delete(variables.resultId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exam-results/exam', examId] });
    },
    onError: (error: Error, variables) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
      setSyncingResults((prev) => {
        const next = new Set(prev);
        next.delete(variables.resultId);
        return next;
      });
    },
  });

  const allowRetakeMutation = useMutation({
    mutationFn: async ({ studentId }: { studentId: string; resultId: number }) => {
      const response = await apiRequest('POST', `/api/teacher/exams/${examId}/allow-retake/${studentId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to allow retake');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Retake Allowed",
        description: "The student can now retake this exam. Their previous submission has been archived.",
      });
      setAllowingRetake((prev) => {
        const next = new Set(prev);
        next.delete(variables.resultId);
        return next;
      });
      setRetakeConfirmDialog(null);
      queryClient.invalidateQueries({ queryKey: ['/api/exam-results/exam', examId] });
    },
    onError: (error: Error, variables) => {
      toast({
        title: "Failed to Allow Retake",
        description: error.message,
        variant: "destructive",
      });
      setAllowingRetake((prev) => {
        const next = new Set(prev);
        next.delete(variables.resultId);
        return next;
      });
      setRetakeConfirmDialog(null);
    },
  });

  const subject = subjects.find((s) => s.id === currentExam?.subjectId);
  const examClass = classes.find((c) => c.id === currentExam?.classId);

  const totalSubmissions = examResults.length;
  const averageScore = totalSubmissions > 0
    ? examResults.reduce((sum: number, r) => sum + (r.score ?? 0), 0) / totalSubmissions
    : 0;
  
  const averagePercentage = totalSubmissions > 0
    ? examResults.reduce((sum: number, r) => {
        const percentage = (r.maxScore ?? 0) > 0 ? ((r.score ?? 0) / (r.maxScore ?? 0)) * 100 : 0;
        return sum + percentage;
      }, 0) / totalSubmissions
    : 0;

  const highestScore = totalSubmissions > 0
    ? Math.max(...examResults.map((r) => r.score ?? 0))
    : 0;

  const lowestScore = totalSubmissions > 0
    ? Math.min(...examResults.map((r) => r.score ?? 0))
    : 0;

  const passCount = examResults.filter((r) => {
    const percentage = (r.maxScore ?? 0) > 0 ? ((r.score ?? 0) / (r.maxScore ?? 0)) * 100 : 0;
    return percentage >= 50;
  }).length;

  const failCount = totalSubmissions - passCount;

  const sortedResults = [...examResults].sort((a, b) => (b.score || 0) - (a.score || 0));

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-500' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-500' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-500' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-500' };
    return { grade: 'F', color: 'text-red-500' };
  };

  const handleTestScoreChange = (resultId: number, value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    setEditingScores((prev) => {
      const next = new Map(prev);
      const existing = prev.get(resultId) || { resultId, testScore: null, remarks: '' };
      next.set(resultId, { ...existing, testScore: isNaN(numValue as number) ? null : numValue });
      return next;
    });
  };

  const handleSaveTestScore = (resultId: number) => {
    const editData = editingScores.get(resultId);
    if (editData) {
      updateScoreMutation.mutate({
        resultId,
        testScore: editData.testScore,
        remarks: editData.remarks
      });
    }
  };

  const handleSyncToReportCard = (resultId: number) => {
    syncToReportCardMutation.mutate({ resultId });
  };

  const handleAllowRetakeClick = (result: EnrichedExamResult) => {
    setRetakeConfirmDialog({
      isOpen: true,
      studentId: result.studentId,
      studentName: result.studentName || 'Unknown Student',
      resultId: result.id,
    });
  };

  const handleConfirmRetake = () => {
    if (retakeConfirmDialog) {
      setAllowingRetake((prev) => new Set(prev).add(retakeConfirmDialog.resultId));
      allowRetakeMutation.mutate({
        studentId: retakeConfirmDialog.studentId,
        resultId: retakeConfirmDialog.resultId,
      });
    }
  };

  const downloadResults = () => {
    if (!currentExam || examResults.length === 0) return;

    const csvContent = [
      ['Student Name', 'Username', 'Admission No.', 'Exam Score', 'Max Score', 'Percentage', 'Grade', 'Submitted At'].join(','),
      ...sortedResults.map((result) => {
        const percentage = (result.maxScore ?? 0) > 0 ? ((result.score ?? 0) / (result.maxScore ?? 0)) * 100 : 0;
        const { grade } = getGrade(percentage);
        return [
          `"${result.studentName || 'Unknown Student'}"`,
          result.studentUsername || result.studentId,
          result.admissionNumber || '-',
          result.score ?? 0,
          result.maxScore ?? 0,
          percentage.toFixed(1) + '%',
          grade,
          result.createdAt ? format(new Date(result.createdAt), 'PPpp') : 'N/A'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentExam.name}_results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!currentExam) {
    return (
      <PortalLayout userRole={userRole} userName={userName} userInitials={userInitials}>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Exam not found</p>
            <Button asChild className="mt-4" data-testid="button-back">
              <Link href="/portal/teacher">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </PortalLayout>
    );
  }
  return (
    <PortalLayout userRole={userRole} userName={userName} userInitials={userInitials}>
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Button variant="outline" size="sm" asChild data-testid="button-back" className="w-fit">
              <Link href="/portal/teacher/recent-exam-results">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-exam-title">{currentExam.name}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground" data-testid="text-exam-info">
                {subject?.name || 'Subject'} • {examClass?.name || 'Class'} • {currentExam.date ? format(new Date(currentExam.date), 'MMMM do, yyyy') : 'N/A'}
              </p>
            </div>
          </div>
          <Button onClick={downloadResults} disabled={totalSubmissions === 0} data-testid="button-download" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Download Results
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card data-testid="card-total-submissions">
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold" data-testid="text-total-submissions">{totalSubmissions}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-average-score">
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold" data-testid="text-average-score">
                {averageScore.toFixed(1)} / {currentExam.totalMarks || 100}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground" data-testid="text-average-percentage">
                {averagePercentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-pass-fail">
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                Pass/Fail Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex gap-4 sm:gap-6">
                <div>
                  <div className="text-lg sm:text-xl font-bold text-green-600" data-testid="text-pass-count">{passCount}</div>
                  <p className="text-xs text-muted-foreground">Passed</p>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-red-600" data-testid="text-fail-count">{failCount}</div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-score-range">
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                Score Range
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex gap-4 sm:gap-6">
                <div>
                  <div className="text-lg sm:text-xl font-bold" data-testid="text-highest-score">{highestScore}</div>
                  <p className="text-xs text-muted-foreground">Highest</p>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold" data-testid="text-lowest-score">{lowestScore}</div>
                  <p className="text-xs text-muted-foreground">Lowest</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-base sm:text-lg">Student Results</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            {isLoading ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-muted-foreground text-sm">Loading results...</p>
              </div>
            ) : totalSubmissions === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-sm">No submissions yet</p>
              </div>
            ) : (
              <>
                <div className="block sm:hidden space-y-3">
                  {sortedResults.map((result, index) => {
                    const percentage = (result.maxScore ?? 0) > 0 ? ((result.score ?? 0) / (result.maxScore ?? 0)) * 100 : 0;
                    const { grade, color } = getGrade(percentage);
                    const isPassed = percentage >= 50;
                    const isSyncing = syncingResults.has(result.id);

                    return (
                      <div 
                        key={result.id} 
                        className="border rounded-lg p-3 bg-muted/30"
                        data-testid={`card-result-mobile-${index}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={index < 3 ? "default" : "outline"} className="text-xs" data-testid={`badge-rank-mobile-${index}`}>
                                #{index + 1}
                              </Badge>
                              <span className="font-semibold text-sm" data-testid={`text-student-name-mobile-${index}`}>
                                {result.studentName || 'Unknown Student'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span data-testid={`text-student-username-mobile-${index}`}>
                                @{result.studentUsername || result.studentId}
                              </span>
                              {result.admissionNumber && (
                                <>
                                  <span>|</span>
                                  <span data-testid={`text-student-adm-mobile-${index}`}>
                                    Adm: {result.admissionNumber}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {isPassed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                          <div>
                            <span className="text-muted-foreground">Score</span>
                            <p className="font-medium" data-testid={`text-score-mobile-${index}`}>
                              {result.score || 0}/{result.maxScore || 0}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Percentage</span>
                            <p className="font-medium" data-testid={`text-percentage-mobile-${index}`}>
                              {percentage.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Grade</span>
                            <p className={`font-bold ${color}`} data-testid={`text-grade-mobile-${index}`}>
                              {grade}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncToReportCard(result.id)}
                            disabled={isSyncing}
                            className="flex-1"
                            data-testid={`button-sync-mobile-${index}`}
                          >
                            {isSyncing ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <RefreshCw className="h-3 w-3 mr-1" />
                            )}
                            Sync to Report
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAllowRetakeClick(result)}
                            disabled={allowingRetake.has(result.id)}
                            className="flex-1"
                            data-testid={`button-retake-mobile-${index}`}
                          >
                            {allowingRetake.has(result.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <RotateCcw className="h-3 w-3 mr-1" />
                            )}
                            Allow Retake
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Rank</TableHead>
                        <TableHead className="text-xs">Student</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Username</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">Adm. No.</TableHead>
                        <TableHead className="text-xs">Exam Score</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">Percentage</TableHead>
                        <TableHead className="text-xs">Grade</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">Submitted At</TableHead>
                        <TableHead className="text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedResults.map((result, index) => {
                        const percentage = (result.maxScore ?? 0) > 0 ? ((result.score ?? 0) / (result.maxScore ?? 0)) * 100 : 0;
                        const { grade, color } = getGrade(percentage);
                        const isPassed = percentage >= 50;
                        const isSyncing = syncingResults.has(result.id);

                        return (
                          <TableRow key={result.id} data-testid={`row-result-${index}`}>
                            <TableCell className="py-2">
                              <Badge variant={index < 3 ? "default" : "outline"} className="text-xs" data-testid={`badge-rank-${index}`}>
                                #{index + 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-xs sm:text-sm py-2" data-testid={`text-student-name-${index}`}>
                              {result.studentName || 'Unknown Student'}
                            </TableCell>
                            <TableCell className="text-xs hidden md:table-cell py-2" data-testid={`text-student-username-${index}`}>
                              @{result.studentUsername || result.studentId}
                            </TableCell>
                            <TableCell className="text-xs hidden lg:table-cell py-2" data-testid={`text-student-adm-${index}`}>
                              {result.admissionNumber || '-'}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm py-2" data-testid={`text-score-${index}`}>
                              {result.score || 0} / {result.maxScore || 0}
                            </TableCell>
                            <TableCell className="text-xs hidden lg:table-cell py-2" data-testid={`text-percentage-${index}`}>
                              {percentage.toFixed(1)}%
                            </TableCell>
                            <TableCell className="py-2">
                              <span className={`font-bold text-xs sm:text-sm ${color}`} data-testid={`text-grade-${index}`}>
                                {grade}
                              </span>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1">
                                {isPassed ? (
                                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" data-testid={`icon-passed-${index}`} />
                                ) : (
                                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" data-testid={`icon-failed-${index}`} />
                                )}
                                <span className={`text-xs ${isPassed ? 'text-green-600' : 'text-red-600'}`} data-testid={`text-status-${index}`}>
                                  {isPassed ? 'Passed' : 'Failed'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs hidden lg:table-cell py-2" data-testid={`text-submitted-at-${index}`}>
                              {result.createdAt ? format(new Date(result.createdAt), 'PPp') : 'N/A'}
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSyncToReportCard(result.id)}
                                  disabled={isSyncing}
                                  title="Sync to Report Card"
                                  data-testid={`button-sync-${index}`}
                                >
                                  {isSyncing ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAllowRetakeClick(result)}
                                  disabled={allowingRetake.has(result.id)}
                                  title="Allow Retake"
                                  data-testid={`button-retake-${index}`}
                                >
                                  {allowingRetake.has(result.id) ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RotateCcw className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <AlertDialog 
          open={retakeConfirmDialog?.isOpen ?? false} 
          onOpenChange={(open) => !open && setRetakeConfirmDialog(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Allow Exam Retake</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to allow <strong>{retakeConfirmDialog?.studentName}</strong> to retake this exam?
                <br /><br />
                This will:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Archive their current submission for your records</li>
                  <li>Remove their current result from the exam</li>
                  <li>Allow them to start the exam fresh</li>
                </ul>
                <br />
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-retake">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmRetake}
                data-testid="button-confirm-retake"
              >
                {allowRetakeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Allow Retake'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PortalLayout>
  );
}

import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Users, TrendingUp, Award, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth';
import type { Class, ExamResult, Exam, Subject, User } from '@shared/schema';

export default function TeacherExamResults() {
  const { user } = useAuth();
  const [, params] = useRoute('/portal/teacher/results/exam/:examId');
  const examId = params?.examId ? parseInt(params.examId) : null;

  if (!user) {
    return <div>Loading...</div>;
  } // fixed
  const userName = `${user.firstName} ${user.lastName}`;
  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;
  const userRole = (user.role?.toLowerCase() || 'teacher') as 'admin' | 'teacher' | 'student' | 'parent';

  // Fetch exam details
  const { data: exams = [] } = useQuery<Exam[]>({
    queryKey: ['/api/exams'],
  });

  const currentExam = exams.find((e) => e.id === examId);

  // Fetch exam results for this exam
  const { data: examResults = [], isLoading } = useQuery<ExamResult[]>({
    queryKey: [`/api/exam-results/exam/${examId}`],
    enabled: !!examId,
  });

  // Fetch all users to get student details
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch subjects for subject names
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  // Fetch classes for class names
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });

  const subject = subjects.find((s) => s.id === currentExam?.subjectId);
  const examClass = classes.find((c) => c.id === currentExam?.classId);

  // Calculate statistics
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

  // Sort results by score (highest first)
  const sortedResults = [...examResults].sort((a, b) => (b.score || 0) - (a.score || 0));

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-500' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-500' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-500' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-500' };
    return { grade: 'F', color: 'text-red-500' };
  };

  const downloadResults = () => {
    if (!currentExam || examResults.length === 0) return;

    const csvContent = [
      ['Student Name', 'Student ID', 'Score', 'Max Score', 'Percentage', 'Grade', 'Submitted At'].join(','),
      ...sortedResults.map((result) => {
        const student = users.find((u) => u.id === result.studentId);
        const percentage = (result.maxScore ?? 0) > 0 ? ((result.score ?? 0) / (result.maxScore ?? 0)) * 100 : 0;
        const { grade } = getGrade(percentage);
        return [
          `"${student?.firstName || ''} ${student?.lastName || ''}"`,
          result.studentId,
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
  } // fixed
  return (
    <PortalLayout userRole={userRole} userName={userName} userInitials={userInitials}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild data-testid="button-back">
              <Link href="/portal/teacher">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-exam-title">{currentExam.name}</h1>
              <p className="text-muted-foreground" data-testid="text-exam-info">
                {subject?.name || 'Subject'} • {examClass?.name || 'Class'} • {currentExam.date ? format(new Date(currentExam.date), 'PPP') : 'N/A'}
              </p>
            </div>
          </div>
          <Button onClick={downloadResults} disabled={totalSubmissions === 0} data-testid="button-download">
            <Download className="h-4 w-4 mr-2" />
            Download Results
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-total-submissions">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-submissions">{totalSubmissions}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-average-score">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-average-score">
                {averageScore.toFixed(1)} / {currentExam.totalMarks || 100}
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-average-percentage">
                {averagePercentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-pass-fail">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                Pass/Fail Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div>
                  <div className="text-xl font-bold text-green-600" data-testid="text-pass-count">{passCount}</div>
                  <p className="text-xs text-muted-foreground">Passed</p>
                </div>
                <div>
                  <div className="text-xl font-bold text-red-600" data-testid="text-fail-count">{failCount}</div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-score-range">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                Score Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div>
                  <div className="text-xl font-bold" data-testid="text-highest-score">{highestScore}</div>
                  <p className="text-xs text-muted-foreground">Highest</p>
                </div>
                <div>
                  <div className="text-xl font-bold" data-testid="text-lowest-score">{lowestScore}</div>
                  <p className="text-xs text-muted-foreground">Lowest</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Results</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading results...</p>
              </div>
            ) : totalSubmissions === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No submissions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedResults.map((result, index) => {
                      const student = users.find((u) => u.id === result.studentId);
                      const percentage = (result.maxScore ?? 0) > 0 ? ((result.score ?? 0) / (result.maxScore ?? 0)) * 100 : 0;
                      const { grade, color } = getGrade(percentage);
                      const isPassed = percentage >= 50;

                      return (
                        <TableRow key={result.id} data-testid={`row-result-${index}`}>
                          <TableCell>
                            <Badge variant={index < 3 ? "default" : "outline"} data-testid={`badge-rank-${index}`}>
                              #{index + 1}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium" data-testid={`text-student-name-${index}`}>
                            {student?.firstName || ''} {student?.lastName || ''}
                          </TableCell>
                          <TableCell data-testid={`text-student-id-${index}`}>
                            {result.studentId}
                          </TableCell>
                          <TableCell data-testid={`text-score-${index}`}>
                            {result.score || 0} / {result.maxScore || 0}
                          </TableCell>
                          <TableCell data-testid={`text-percentage-${index}`}>
                            {percentage.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <span className={`font-bold ${color}`} data-testid={`text-grade-${index}`}>
                              {grade}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {isPassed ? (
                                <CheckCircle className="h-4 w-4 text-green-500" data-testid={`icon-passed-${index}`} />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" data-testid={`icon-failed-${index}`} />
                              )}
                              <span className={isPassed ? 'text-green-600' : 'text-red-600'} data-testid={`text-status-${index}`}>
                                {isPassed ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-submitted-at-${index}`}>
                            {result.createdAt ? format(new Date(result.createdAt), 'PPp') : 'N/A'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

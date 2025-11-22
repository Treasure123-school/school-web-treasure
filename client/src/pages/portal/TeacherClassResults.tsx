import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Users, TrendingUp, Award } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import type { Class, ExamResult, Exam, Subject, User } from '@shared/schema';

export default function TeacherClassResults() {
  const { user } = useAuth();
  const [, params] = useRoute('/portal/teacher/results/class/:classId');
  const classId = params?.classId ? parseInt(params.classId) : null;

  if (!user) {
    return <div>Loading...</div>;
  }

  const userName = `${user.firstName} ${user.lastName}`;
  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;
  const userRole = (user.role?.toLowerCase() || 'teacher') as 'admin' | 'teacher' | 'student' | 'parent';

  // Fetch class details
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });

  const currentClass = classes.find((c) => c.id === classId);

  // Fetch all exam results for this class
  const { data: examResults = [], isLoading } = useQuery<ExamResult[]>({
    queryKey: [`/api/exam-results/class/${classId}`],
    enabled: !!classId,
  });

  // Fetch all exams to get exam details
  const { data: exams = [] } = useQuery<Exam[]>({
    queryKey: ['/api/exams'],
  });

  // Fetch all users to get student details
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch subjects for subject names
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  // Group results by exam
  const resultsByExam = examResults.reduce((acc: Record<number, ExamResult[]>, result) => {
    const examId = result.examId;
    if (!acc[examId]) {
      acc[examId] = [];
    }
    acc[examId].push(result);
    return acc;
  }, {} as Record<number, ExamResult[]>);

  // Calculate statistics
  const totalStudents = new Set(examResults.map((r) => r.studentId)).size;
  const totalExams = Object.keys(resultsByExam).length;
  const averageScore = examResults.length > 0
    ? examResults.reduce((sum: number, r) => sum + (r.score ?? 0), 0) / examResults.length
    : 0;
  const averagePercentage = examResults.length > 0
    ? examResults.reduce((sum: number, r) => {
        const percentage = (r.maxScore ?? 0) > 0 ? ((r.score ?? 0) / (r.maxScore ?? 0)) * 100 : 0;
        return sum + percentage;
      }, 0) / examResults.length
    : 0;

  return (
    <PortalLayout userRole={userRole} userName={userName} userInitials={userInitials}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild data-testid="button-back">
              <Link href="/portal/teacher">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">
                {currentClass?.name || 'Class'} - All Results
              </h1>
              <p className="text-muted-foreground">
                View all exam results for this class
              </p>
            </div>
          </div>
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card data-testid="card-total-students">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-students">{totalStudents}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-exams">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-500" />
                Total Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-exams">{totalExams}</div>
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
                {averageScore.toFixed(1)}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-average-percentage">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                Average %
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-average-percentage">
                {averagePercentage.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results by Exam */}
        <div className="space-y-6">
          {Object.entries(resultsByExam).map(([examId, results]) => {
            const exam = exams.find((e) => e.id === parseInt(examId));
            const subject = subjects.find((s) => s.id === exam?.subjectId);
            const examResultsList = results;

            return (
              <Card key={examId} data-testid={`card-exam-${examId}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle data-testid={`text-exam-name-${examId}`}>
                        {exam?.name || `Exam ${examId}`}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {subject?.name} • {exam?.date ? new Date(exam.date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <Badge variant={exam?.isPublished ? 'default' : 'secondary'}>
                      {examResultsList.length} submissions
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Loading results...</div>
                  ) : examResultsList.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No results yet for this exam
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Recorded By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {examResultsList.map((result, index) => {
                          const student = users.find((u) => u.id === result.studentId);
                          const percentage = (result.maxScore ?? 0) > 0 
                            ? (((result.score ?? 0) / (result.maxScore ?? 0)) * 100).toFixed(1)
                            : '0';
                          
                          return (
                            <TableRow key={result.id} data-testid={`row-result-${result.id}`}>
                              <TableCell data-testid={`text-student-${index}`}>
                                {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
                              </TableCell>
                              <TableCell data-testid={`text-score-${index}`}>
                                {result.score || 0} / {result.maxScore || 0}
                              </TableCell>
                              <TableCell data-testid={`text-percentage-${index}`}>
                                {percentage}%
                              </TableCell>
                              <TableCell data-testid={`text-grade-${index}`}>
                                {result.grade || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={result.autoScored ? 'secondary' : 'default'}
                                  data-testid={`badge-status-${index}`}
                                >
                                  {result.autoScored ? 'Auto-scored' : 'Manual'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {result.recordedBy ? users.find((u) => u.id === result.recordedBy)?.firstName || 'System' : 'System'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {!isLoading && Object.keys(resultsByExam).length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <Award className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">No Results Yet</h3>
                    <p className="text-muted-foreground">
                      No exam results have been recorded for this class yet.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}

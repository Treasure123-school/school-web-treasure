import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Download, Filter, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';

export default function StudentGrades() {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in to access your grades.</div>;
  }

  const { data: examResults, isLoading, error } = useQuery({
    queryKey: ['examResults', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/exam-results/${user.id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch exam results');
      return response.json();
    }
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await fetch('/api/subjects', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch subjects');
      return response.json();
    }
  });

  // Calculate grade based on score
  const calculateGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    return 'F';
  };

  // Get grade color
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-600 bg-green-50';
      case 'B+':
      case 'B':
        return 'text-blue-600 bg-blue-50';
      case 'C':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-red-600 bg-red-50';
    }
  };

  // Format exam results for display
  const formattedGrades = examResults?.map((result: any) => ({
    id: result.id,
    subject: result.subjectName || result.subject,
    examType: result.examType || 'Assessment',
    score: result.score || result.marks,
    maxScore: result.maxScore || result.totalMarks || 100,
    grade: result.grade || calculateGrade(result.score || result.marks),
    date: result.examDate || result.createdAt,
    term: result.term || 'Current Term'
  })) || [];

  // Calculate average score
  const averageScore = formattedGrades.length > 0 
    ? formattedGrades.reduce((sum: number, grade: any) => sum + grade.score, 0) / formattedGrades.length
    : 0;

  // Group grades by subject
  const gradesBySubject = formattedGrades.reduce((acc: any, grade: any) => {
    if (!acc[grade.subject]) {
      acc[grade.subject] = [];
    }
    acc[grade.subject].push(grade);
    return acc;
  }, {});

  return (
    <PortalLayout 
      userRole="student" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Grades</h1>
            <p className="text-muted-foreground">
              View your academic performance and progress
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assessments</p>
                  <p className="text-2xl font-bold">{formattedGrades.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Highest Score</p>
                <p className="text-2xl font-bold">
                  {formattedGrades.length > 0 
                    ? Math.max(...formattedGrades.map((g: any) => g.score))
                    : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subjects</p>
                <p className="text-2xl font-bold">{Object.keys(gradesBySubject).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-medium mb-2 text-destructive">Failed to load grades</h3>
                <p className="text-muted-foreground">
                  Unable to fetch your grades. Please try refreshing the page.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grades by Subject */}
        {!error && isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading grades...</div>
            </CardContent>
          </Card>
        ) : !error && formattedGrades.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(gradesBySubject).map(([subject, grades]: [string, any]) => (
              <Card key={subject}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>{subject}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {grades.map((grade: any) => (
                      <div 
                        key={grade.id} 
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium">{grade.examType}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(grade.date).toLocaleDateString()} • {grade.term}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {grade.score}/{grade.maxScore}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {((grade.score / grade.maxScore) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(grade.grade)}`}>
                            {grade.grade}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !error && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No grades available</h3>
                <p className="text-muted-foreground mb-4">
                  Your grades will appear here once your teachers have posted them.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/portal/student">
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
}
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, GraduationCap, Palette, Briefcase, BookMarked, User, ClipboardList, FileText, Award, ChevronRight } from 'lucide-react';
import PortalLayout from '@/components/layout/PortalLayout';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  general: { 
    label: 'General', 
    icon: BookMarked, 
    color: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-100 dark:bg-slate-800'
  },
  science: { 
    label: 'Science', 
    icon: GraduationCap, 
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900'
  },
  art: { 
    label: 'Art', 
    icon: Palette, 
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900'
  },
  commercial: { 
    label: 'Commercial', 
    icon: Briefcase, 
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900'
  },
};

export default function StudentSubjects() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const userName = user ? `${user.firstName} ${user.lastName}` : 'Student';
  const userInitials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'S';
  const userRole = 'student' as const;

  const { data: studentInfo, isLoading: studentLoading } = useQuery({
    queryKey: ['/api/students/me'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/students/me');
      return await response.json();
    },
  });

  const { data: assignedSubjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['/api/my-subjects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/my-subjects');
      return await response.json();
    },
  });

  const { data: subjectTeachers = {} } = useQuery({
    queryKey: ['/api/my-subject-teachers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/my-subject-teachers');
      return await response.json();
    },
  });

  const groupedSubjects: Record<string, any[]> = assignedSubjects.reduce((acc: Record<string, any[]>, subject: any) => {
    const category = (subject.category || 'general').toLowerCase();
    if (!acc[category]) acc[category] = [];
    acc[category].push(subject);
    return acc;
  }, {} as Record<string, any[]>);

  const getTeacherForSubject = (subjectId: number) => {
    return subjectTeachers[subjectId] || null;
  };

  const handleViewExams = (subjectId: number) => {
    navigate(`/portal/student/exams?subject=${subjectId}`);
  };

  const handleViewScores = (subjectId: number) => {
    navigate(`/portal/student/exam-results?subject=${subjectId}`);
  };

  const handleViewReportCard = () => {
    navigate('/portal/student/report-card');
  };

  const isLoading = studentLoading || subjectsLoading;

  return (
    <PortalLayout userRole={userRole} userName={userName} userInitials={userInitials}>
      <div className="space-y-6" data-testid="student-subjects">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Subjects</h1>
            <p className="text-muted-foreground mt-1">
              {studentInfo?.className 
                ? `Subjects assigned to you in ${studentInfo.className}${studentInfo.department ? ` (${studentInfo.department} Department)` : ''}`
                : 'View your assigned subjects and teachers'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleViewReportCard}
            data-testid="button-view-report-card"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Report Card
          </Button>
        </div>

        {studentInfo && (
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Class:</span>
                  <Badge variant="secondary">{studentInfo.className || 'Not Assigned'}</Badge>
                </div>
                {studentInfo.department && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">Department:</span>
                    <Badge className={CATEGORY_CONFIG[studentInfo.department.toLowerCase()]?.bgColor || 'bg-muted'}>
                      {studentInfo.department}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Total Subjects:</span>
                  <Badge variant="outline">{assignedSubjects.length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : assignedSubjects.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Subjects Assigned</p>
                <p className="text-sm mt-2">
                  Your subjects haven't been assigned yet. Please contact your class teacher or administrator.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSubjects).map(([category, subjects]: [string, any[]]) => {
              const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;
              const CategoryIcon = config.icon;
              
              return (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <CategoryIcon className={`w-5 h-5 ${config.color}`} />
                      {config.label} Subjects
                      <Badge variant="secondary" className="ml-2">{subjects.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {subjects.map((subject: any) => {
                        const teacher = getTeacherForSubject(subject.id || subject.subjectId);
                        
                        return (
                          <Card 
                            key={subject.id || subject.subjectId}
                            className="overflow-hidden"
                            data-testid={`subject-card-${subject.id || subject.subjectId}`}
                          >
                            <div className={`h-1 ${config.bgColor}`} />
                            <CardContent className="p-4 space-y-3">
                              <div>
                                <h3 className="font-semibold text-lg truncate">
                                  {subject.subjectName || subject.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {subject.subjectCode || subject.code}
                                </p>
                              </div>

                              {teacher && (
                                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {teacher.firstName} {teacher.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Subject Teacher</p>
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleViewExams(subject.id || subject.subjectId)}
                                  data-testid={`button-view-exams-${subject.id || subject.subjectId}`}
                                >
                                  <ClipboardList className="w-4 h-4 mr-1" />
                                  Exams
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleViewScores(subject.id || subject.subjectId)}
                                  data-testid={`button-view-scores-${subject.id || subject.subjectId}`}
                                >
                                  <Award className="w-4 h-4 mr-1" />
                                  Scores
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

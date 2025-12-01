import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Users, ClipboardList, UserCheck, Bell, MessageSquare, TrendingUp, Clock, ClipboardCheck, GraduationCap, AlertCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useSocketIORealtime } from '@/hooks/useSocketIORealtime';


// Component for displaying recent exam result card
function RecentExamResultCard({ exam, index }: { exam: any, index: number }) {
  const { data: examResults = [], isLoading } = useQuery({
    queryKey: [`/api/exam-results/exam/${exam.id}`],
    enabled: !!exam.id,
  });

  const results = examResults as any[];
  const totalSubmissions = results.length;
  const averageScore = totalSubmissions > 0 
    ? Math.round((results.reduce((sum: number, r: any) => sum + (r.score || r.marksObtained || 0), 0) / totalSubmissions))
    : 0;

  const examDate = new Date(exam.date || exam.createdAt).toLocaleDateString();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg" data-testid={`exam-result-loading-${index}`}>
        <div className="animate-pulse flex-1">
          <div className="h-4 bg-gray-300 rounded mb-1"></div>
          <div className="h-3 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }
  return (
    <div 
      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
      data-testid={`card-exam-result-${index}`}
    >
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <h4 className="font-medium text-sm" data-testid={`text-exam-name-${index}`}>
            {exam.name}
          </h4>
          <Badge variant={totalSubmissions > 0 ? "default" : "secondary"} data-testid={`badge-submission-count-${index}`}>
            {totalSubmissions} submissions
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground" data-testid={`text-exam-details-${index}`}>
          {exam.subjectName || 'Subject'} • {examDate}
        </p>
      </div>

      <div className="text-right space-y-1">
        {totalSubmissions > 0 && (
          <p className="text-sm font-medium text-primary" data-testid={`text-exam-average-${index}`}>
            {averageScore}% avg
          </p>
        )}
        <Button 
          variant="outline" 
          size="sm"
          asChild
          data-testid={`button-view-exam-results-${index}`}
        >
          <Link href={`/portal/teacher/results/exam/${exam.id}`}>
            View Results
          </Link>
        </Button>
      </div>
    </div>
  );
}
export default function TeacherDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Check teacher profile status
  const { data: profileStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/teacher/profile/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/teacher/profile/status');
      return await response.json();
    },
    enabled: !!user
  });

  // Fetch dashboard data from SCOPED API endpoints - only teacher's assigned data
  // Use scoped endpoint for teacher's assigned classes only
  const { data: myClasses = [], isLoading: classesLoading } = useQuery({
    queryKey: ['/api/teacher/my-classes'],
    enabled: !!user,
  });

  // Use scoped endpoint for teacher's assigned subjects only
  const { data: mySubjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['/api/teacher/my-subjects'],
    enabled: !!user,
  });

  // Use scoped endpoint for students in teacher's assigned classes only
  const { data: myStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/teacher/my-all-students'],
    enabled: !!user,
  });

  // Exams endpoint already filters for teachers (returns only created/assigned exams)
  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['/api/exams'],
    enabled: !!user,
  });

  const { data: pendingGradingTasks = [], isLoading: gradingTasksLoading } = useQuery({
    queryKey: ['/api/grading-tasks'],
    enabled: !!user,
  });

  // Get teacher dashboard stats from scoped endpoint
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/teacher/my-dashboard-stats'],
    enabled: !!user,
  });

  const { data: teacherProfile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['/api/teacher/profile/me'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/teacher/profile/me');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch profile');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!user && !!profileStatus?.hasProfile,
    staleTime: 0,
    gcTime: 0,
    retry: 2,
    retryDelay: 1000
  });

  // Subscribe to exams table for realtime exam updates
  useSocketIORealtime({
    table: 'exams',
    queryKey: ['/api/exams'],
    enabled: !!user,
    onEvent: (event) => {
      console.log('📥 Teacher Dashboard: Exam update received', event.eventType);
    }
  });

  // Subscribe to grading tasks for realtime pending grades updates
  useSocketIORealtime({
    table: 'grading_tasks',
    queryKey: ['/api/grading-tasks'],
    enabled: !!user,
    onEvent: (event) => {
      console.log('📥 Teacher Dashboard: Grading task update received', event.eventType);
    }
  });

  // Subscribe to teacher's classes for realtime updates
  useSocketIORealtime({
    table: 'teacher_class_assignments',
    queryKey: ['/api/teacher/my-classes'],
    enabled: !!user,
    onEvent: (event) => {
      console.log('📥 Teacher Dashboard: Assignment update received', event.eventType);
      // Also refresh stats and students when assignments change
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/my-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/my-all-students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/my-subjects'] });
    }
  });

  // Subscribe to exam sessions for live exam monitoring
  useSocketIORealtime({
    table: 'exam_sessions',
    queryKey: ['/api/exam-sessions'],
    enabled: !!user,
    onEvent: (event) => {
      console.log('📥 Teacher Dashboard: Exam session update received', event.eventType);
      // Also refresh grading tasks and exams when sessions change
      queryClient.invalidateQueries({ queryKey: ['/api/grading-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exams'] });
    }
  });

  // Show profile completion banner if incomplete, but don't redirect
  useEffect(() => {
    if (!statusLoading && profileStatus) {
      // Profile status updated
    }
  }, [profileStatus, statusLoading, teacherProfile, profileLoading, profileError]);

  // Profile data effect
  useEffect(() => {
    if (teacherProfile) {
      // Profile data available
    }
  }, [teacherProfile]);

  if (!user) {
    return <div>Please log in to access the teacher dashboard.</div>;
  }
  if (statusLoading || profileLoading) {
    return (
      <PortalLayout
        userRole="teacher"
        userName={user.firstName + ' ' + user.lastName}
        userInitials={user.firstName.charAt(0) + user.lastName.charAt(0)}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PortalLayout>
    );
  }
  const isLoading = classesLoading || studentsLoading || examsLoading || gradingTasksLoading;

  // Teacher's assigned classes from scoped endpoint (limit to first 3 for dashboard display)
  const teacherClasses = (myClasses as any[]).slice(0, 3);

  // Get recent exams created by this teacher (limit to 5 for dashboard)
  const recentExams = (exams as any[])
    .filter((exam: any) => exam.createdBy === user.id)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Calculate statistics from scoped data (prefer server-side stats if available)
  const totalStudents = dashboardStats?.totalStudents ?? (myStudents as any[]).length;
  const totalClasses = dashboardStats?.totalClasses ?? (myClasses as any[]).length;
  const pendingGradesCount = (pendingGradingTasks as any[]).length;

  // Helper functions to get subject and class names from scoped data
  const getSubjectNames = () => {
    return (mySubjects as any[]).map((s: any) => s.name).filter(Boolean);
  };

  const getClassNames = () => {
    return (myClasses as any[]).map((c: any) => c.className || c.name).filter(Boolean);
  };

  return (
    <PortalLayout 
      userRole="teacher" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      {/* Profile Completion Notice */}
      {!statusLoading && profileStatus && !profileStatus.hasProfile && (
        <div className="mb-4 sm:mb-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 md:p-5 shadow-sm animate-slide-up" data-testid="profile-incomplete-banner">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
              <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-2 sm:p-3 flex-shrink-0">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Complete Your Profile
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Some features are restricted until you complete your teacher profile setup.
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Complete your profile to unlock: Creating Exams, Grading, Attendance Management, and more.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/portal/teacher/profile-setup')}
              variant="outline"
              className="bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium shadow-sm w-full sm:w-auto text-sm sm:text-base"
              data-testid="button-complete-profile"
            >
              Complete Profile Now
            </Button>
          </div>
        </div>
      )}

      {/* Teacher Role Header - Personalized with Dynamic Subject/Class Info */}
      <div className="mb-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl" data-testid="teacher-role-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-tight" data-testid="text-personalized-greeting">
                Welcome back, {user.firstName}!
              </h2>
              <p className="text-emerald-100 text-sm mt-1" data-testid="text-teacher-assignment">
                {profileLoading ? (
                  'Ready to inspire minds today?'
                ) : profileError ? (
                  'Ready to inspire minds today?'
                ) : teacherProfile && (getSubjectNames().length > 0 || getClassNames().length > 0) ? (
                  <>
                    {teacherProfile.department || 'Teaching'}
                    {getSubjectNames().length > 0 && (
                      <> • Teaching {getSubjectNames().join(', ')}</>
                    )}
                    {getClassNames().length > 0 && (
                      <> • {getClassNames().join(', ')}</>
                    )}
                  </>
                ) : (
                  'Ready to inspire minds today?'
                )}
              </p>
              {!profileLoading && teacherProfile && !subjectsLoading && !classesLoading && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {/* Subject Badges - Get actual subject names from subjects array */}
                  {teacherProfile.subjects && Array.isArray(teacherProfile.subjects) && teacherProfile.subjects.length > 0 && Array.isArray(subjects) && subjects.length > 0 && (
                    <>
                      {teacherProfile.subjects.slice(0, 3).map((subjectId: number, idx: number) => {
                        const subject = subjects.find((s: any) => s.id === subjectId);
                        return subject ? (
                          <span key={`subject-${subjectId}-${idx}`} className="px-2 py-1 bg-white/20 rounded-full text-xs">
                            {subject.name}
                          </span>
                        ) : null;
                      })}
                      {teacherProfile.subjects.length > 3 && (
                        <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                          +{teacherProfile.subjects.length - 3} more
                        </span>
                      )}
                    </>
                  )}

                  {/* Class Badges - Get actual class names from classes array */}
                  {teacherProfile.assignedClasses && Array.isArray(teacherProfile.assignedClasses) && teacherProfile.assignedClasses.length > 0 && Array.isArray(classes) && classes.length > 0 && (
                    <>
                      {teacherProfile.assignedClasses.slice(0, 2).map((classId: number, idx: number) => {
                        const classObj = classes.find((c: any) => c.id === classId);
                        return classObj ? (
                          <span key={`class-${classId}-${idx}`} className="px-2 py-1 bg-emerald-700/40 rounded-full text-xs">
                            {classObj.name}
                          </span>
                        ) : null;
                      })}
                      {teacherProfile.assignedClasses.length > 2 && (
                        <span className="px-2 py-1 bg-emerald-700/40 rounded-full text-xs">
                          +{teacherProfile.assignedClasses.length - 2} more
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex justify-end mb-6">
        <Button className="bg-primary text-primary-foreground" asChild>
          <Link href="/portal/teacher/attendance" data-testid="button-take-attendance">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Take Attendance
          </Link>
        </Button>
      </div>

      {/* Stats Cards - Modern Gradient Design */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 animate-slide-up">
        <Card className="group relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1" data-testid="stat-total-students">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 opacity-100"></div>
          <CardContent className="relative p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Students</p>
                <AnimatedCounter
                  value={isLoading ? 0 : totalStudents}
                  className="text-3xl font-bold mt-2"
                />
                <p className="text-blue-100 text-xs mt-2">Across all classes</p>
              </div>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1" data-testid="stat-classes">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 opacity-100"></div>
          <CardContent className="relative p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Classes</p>
                <AnimatedCounter
                  value={isLoading ? 0 : totalClasses}
                  className="text-3xl font-bold mt-2"
                />
                <p className="text-emerald-100 text-xs mt-2">Teaching assignments</p>
              </div>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1" data-testid="stat-total-exams">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-violet-600 to-purple-600 opacity-100"></div>
          <CardContent className="relative p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Exams</p>
                <AnimatedCounter
                  value={isLoading ? 0 : (exams as any[]).filter((e: any) => e.createdBy === user.id).length}
                  className="text-3xl font-bold mt-2"
                />
                <p className="text-purple-100 text-xs mt-2">Exams created</p>
              </div>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <ClipboardList className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1" data-testid="stat-pending-grades">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-600 to-red-500 opacity-100"></div>
          <CardContent className="relative p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Pending Grades</p>
                <AnimatedCounter
                  value={isLoading ? 0 : pendingGradesCount}
                  className="text-3xl font-bold mt-2"
                />
                <p className="text-amber-100 text-xs mt-2">Awaiting review</p>
              </div>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
        {/* Quick Actions - Fully Responsive */}
        <Card>
          <CardHeader className="p-4 sm:p-5 md:p-6">
            <CardTitle className="flex items-center text-sm sm:text-base">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link to="/portal/teacher/exams">
                <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary bg-gradient-to-r hover:from-primary/5 hover:to-transparent group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <ClipboardList className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">Create Exam</span>
                  </div>
                </Button>
              </Link>
              <Link to="/portal/teacher/attendance">
                <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary bg-gradient-to-r hover:from-primary/5 hover:to-transparent group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <UserCheck className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">Take Attendance</span>
                  </div>
                </Button>
              </Link>
              <Link to="/portal/announcements">
                <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary bg-gradient-to-r hover:from-primary/5 hover:to-transparent group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Bell className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">Create Announcement</span>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Recent Exam Results - New Section */}
      {recentExams.length > 0 && (
        <Card className="mt-6 shadow-sm border border-border" data-testid="card-recent-exam-results">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Recent Exam Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentExams.map((exam: any, index: number) => (
                <RecentExamResultCard key={exam.id} exam={exam} index={index} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PortalLayout>
  );
}
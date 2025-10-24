import PortalLayout from '@/components/layout/PortalLayout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Users, ClipboardList, UserCheck, Star, Bell, MessageSquare, TrendingUp, Trophy, Clock, Calendar, CheckSquare, ClipboardCheck, GraduationCap } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { getRoleName } from '@/lib/utils';
import { AnimatedCounter } from '@/components/ui/animated-counter';


// Component for displaying results by class card
function ResultsByClassCard({ cls, index }: { cls: any, index: number }) {
  const { data: classResults = [], isLoading } = useQuery({
    queryKey: [`/api/exam-results/class/${cls.id}`],
    enabled: !!cls.id,
  });

  const results = classResults as any[];
  const totalResults = results.length;
  const averageScore = totalResults > 0 
    ? Math.round((results.reduce((sum: number, r: any) => sum + (r.score || r.marksObtained || 0), 0) / totalResults))
    : 0;

  const recentResultsCount = results.filter((r: any) => {
    const resultDate = new Date(r.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return resultDate >= weekAgo;
  }).length;

  if (isLoading) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg border" data-testid={`class-results-loading-${index}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-3 bg-gray-300 rounded mb-1"></div>
          <div className="h-3 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-4 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors"
      data-testid={`card-class-results-${index}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm" data-testid={`text-class-name-${index}`}>
          {cls.name}
        </h3>
        <Badge variant="secondary" data-testid={`badge-results-count-${index}`}>
          {totalResults} results
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span>Average Score</span>
          <span className="font-medium text-primary" data-testid={`text-average-score-${index}`}>
            {averageScore}%
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Recent Results (7 days)</span>
          <span className="font-medium text-green-600" data-testid={`text-recent-count-${index}`}>
            {recentResultsCount}
          </span>
        </div>
      </div>

      <Button 
        variant="outline" 
        size="sm" 
        className="w-full mt-3" 
        asChild
        data-testid={`button-view-class-results-${index}`}
      >
        <Link href={`/portal/teacher/results/class/${cls.id}`}>
          View All Results
        </Link>
      </Button>
    </div>
  );
}

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

  // Fetch dashboard data from real API endpoints - MUST be before any conditional returns
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
    enabled: !!user,
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['/api/subjects'],
    enabled: !!user,
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students'],
    enabled: !!user,
  });

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['/api/exams'],
    enabled: !!user,
  });

  const { data: pendingGradingTasks = [], isLoading: gradingTasksLoading } = useQuery({
    queryKey: ['/api/grading-tasks'],
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
      console.log('📊 Profile data received:', {
        hasData: !!data,
        department: data?.department,
        subjects: data?.subjects,
        classes: data?.assignedClasses,
        verified: data?.verified
      });
      return data;
    },
    enabled: !!user && !!profileStatus?.hasProfile,
    staleTime: 0,
    cacheTime: 0,
    retry: 2,
    retryDelay: 1000
  });

  // Redirect to setup if profile is incomplete
  useEffect(() => {
    // SAFETY: Only redirect if we have confirmed data (not loading) AND profile is missing
    if (!statusLoading && profileStatus) {
      // A teacher needs setup if they have no profile OR if first_login is explicitly true
      // Note: firstLogin becomes false after setup, so we check hasProfile as primary indicator
      const needsSetup = !profileStatus.hasProfile;

      if (needsSetup) {
        console.log('🔄 Redirecting to profile setup:', { 
          hasProfile: profileStatus.hasProfile, 
          verified: profileStatus.verified 
        });
        navigate('/portal/teacher/profile-setup');
      } else {
        console.log('✅ Teacher profile exists, dashboard access granted:', {
          hasProfile: profileStatus.hasProfile,
          verified: profileStatus.verified,
          profileLoading,
          profileError: profileError?.message,
          profileData: teacherProfile
        });
      }
    }
  }, [profileStatus, statusLoading, navigate, teacherProfile, profileLoading, profileError]);

  // Debug: Log profile data when it changes
  useEffect(() => {
    if (teacherProfile) {
      console.log('📋 TeacherProfile data structure:', {
        department: teacherProfile.department,
        subjects: teacherProfile.subjects,
        assignedClasses: teacherProfile.assignedClasses,
        fullProfile: teacherProfile
      });
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

  // Get teacher's classes for results (limit to first 3 for dashboard)
  const teacherClasses = (classes as any[]).filter((cls: any) => 
    cls.classTeacherId === user.id || 
    (exams as any[]).some((exam: any) => exam.createdBy === user.id && exam.classId === cls.id)
  ).slice(0, 3);

  // Get recent exams created by this teacher (limit to 5 for dashboard)
  const recentExams = (exams as any[])
    .filter((exam: any) => exam.createdBy === user.id)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Calculate real statistics from fetched data
  const totalStudents = (students as any[]).length;
  const totalClasses = teacherClasses.length;
  const pendingGradesCount = (pendingGradingTasks as any[]).length;

  // Helper functions to get subject and class names
  const getSubjectNames = () => {
    if (!teacherProfile || !Array.isArray(teacherProfile.subjects) || !Array.isArray(subjects)) return [];
    return teacherProfile.subjects
      .map((subjectId: number) => {
        const subject = subjects.find((s: any) => s.id === subjectId);
        return subject ? subject.name : null;
      })
      .filter(Boolean); // Remove nulls
  };

  const getClassNames = () => {
    if (!teacherProfile || !Array.isArray(teacherProfile.assignedClasses) || !Array.isArray(classes)) return [];
    return teacherProfile.assignedClasses
      .map((classId: number) => {
        const classObj = classes.find((c: any) => c.id === classId);
        return classObj ? classObj.name : null;
      })
      .filter(Boolean); // Remove nulls
  };

  return (
    <PortalLayout 
      userRole="teacher" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
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
                  {console.log('🎨 Rendering badges:', {
                    hasProfile: !!teacherProfile,
                    subjects: teacherProfile.subjects,
                    classes: teacherProfile.assignedClasses,
                    subjectsArray: subjects,
                    classesArray: classes
                  })}

                  {/* Subject Badges - Get actual subject names from subjects array */}
                  {teacherProfile.subjects && Array.isArray(teacherProfile.subjects) && teacherProfile.subjects.length > 0 && Array.isArray(subjects) && subjects.length > 0 && (
                    <>
                      {teacherProfile.subjects.slice(0, 3).map((subjectId: number, idx: number) => {
                        const subject = subjects.find((s: any) => s.id === subjectId);
                        console.log(`🔍 Subject ${subjectId}:`, subject);
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
                        console.log(`🔍 Class ${classId}:`, classObj);
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
          <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Grading Queue - Fully Responsive */}
        <Card className="lg:col-span-1 order-2 lg:order-1">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center justify-between text-xs sm:text-sm md:text-base">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <span>Grading Queue</span>
              </div>
              {(pendingGradingTasks as any[]).length > 0 && (
                <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                  {(pendingGradingTasks as any[]).length} pending
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            {(pendingGradingTasks as any[]).length === 0 ? (
              <div className="text-center py-4 sm:py-6 text-muted-foreground">
                <CheckSquare className="w-8 h-8 sm:w-10 sm:w-10 md:w-12 md:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                <p className="text-xs sm:text-sm">No pending grading tasks</p>
                <p className="text-[10px] sm:text-xs mt-1">Great! All exams are graded.</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {(pendingGradingTasks as any[]).slice(0, 3).map((task: any) => (
                  <div key={task.id} className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 p-2 sm:p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs sm:text-sm truncate">{task.student_name}</h4>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {task.exam_title} • {task.question_type} question
                      </p>
                    </div>
                    <div className="text-left xs:text-right flex-shrink-0">
                      <Badge variant="outline" className="text-[10px] sm:text-xs">
                        {task.max_marks} marks
                      </Badge>
                    </div>
                  </div>
                ))}
                <Link to="/portal/teacher/grading-queue">
                  <Button className="w-full text-xs sm:text-sm h-8 sm:h-9 md:h-10">
                    <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Grade Now ({(pendingGradingTasks as any[]).length})
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions - Fully Responsive */}
        <Card className="lg:col-span-2 order-1 lg:order-2">
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
              <Link to="/portal/teacher/grades">
                <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary bg-gradient-to-r hover:from-primary/5 hover:to-transparent group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Star className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">Manage Grades</span>
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

      {/* Results by Class - New Section */}
      {teacherClasses.length > 0 && (
        <Card className="mt-6 shadow-sm border border-border" data-testid="card-results-by-class">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5" />
              <span>Results by Class</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {teacherClasses.map((cls: any, index: number) => (
                <ResultsByClassCard key={cls.id} cls={cls} index={index} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
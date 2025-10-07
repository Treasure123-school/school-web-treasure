import PortalLayout from '@/components/layout/PortalLayout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Users, GraduationCap, School, TrendingUp, UserPlus, MessageSquare, BarChart3, FileText, Image as ImageIcon, UserCheck, Bell, AlertCircle, Shield, ShieldAlert, Lock, Key, BookOpen, Calendar } from 'lucide-react';
import { Link, navigate } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

export default function AdminDashboard() {
  const { user } = useAuth();

  // Fetch pending users count for admin notification with real-time updates
  const { data: pendingUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/users/pending'],
    enabled: user?.roleId === 1, // Only for admins
    refetchInterval: 10000, // Sync with notification bell - every 10 seconds
    refetchIntervalInBackground: true,
    staleTime: 5000,
  });

  const pendingCount = pendingUsers.length;
  const { toast } = useToast();
  const previousCountRef = useRef<number>(0);

  // Show toast notification when new pending users arrive
  useEffect(() => {
    if (previousCountRef.current > 0 && pendingCount > previousCountRef.current) {
      const newCount = pendingCount - previousCountRef.current;
      toast({
        title: (
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-orange-600" />
            <span>New Pending Approval{newCount > 1 ? 's' : ''}</span>
          </div>
        ),
        description: `${newCount} new user${newCount > 1 ? 's' : ''} waiting for approval. Click to review.`,
        action: (
          <Link href="/portal/admin/pending-approvals">
            <Button size="sm" variant="outline">
              Review Now
            </Button>
          </Link>
        ),
        className: "border-orange-500 bg-orange-50",
      });
    }
    previousCountRef.current = pendingCount;
  }, [pendingCount, toast]);

  // Fetch real analytics overview data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<any>({
    queryKey: ['/api/analytics/overview'],
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch real performance metrics
  const { data: performanceMetrics, isLoading: performanceLoading } = useQuery<any>({
    queryKey: ['/api/admin/performance-metrics'],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch grading queue statistics
  const { data: gradingStats } = useQuery<any>({
    queryKey: ['/api/grading/stats/system'],
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch all users for recent registrations
  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: !!user,
  });

  // Get recent registrations (last 10 students)
  const mockRecentRegistrations = allUsers
    .filter(u => u.roleId === 3) // Students only
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map((student, index) => ({
    id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.username || 'N/A',
      class: student.roleName || 'Student',
      date: new Date(student.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      status: student.status === 'active' ? 'Active' : 'Pending',
      initials: `${student.firstName[0]}${student.lastName[0]}`,
      color: index === 0 ? 'bg-primary' : index === 1 ? 'bg-secondary' : 'bg-blue-500'
    }));

  const classOverview = [
    {
      level: 'Pre-School',
      classes: 3,
      students: 65,
      capacity: 70,
      color: 'text-primary'
    },
    {
      level: 'Primary',
      classes: 6,
      students: 173,
      capacity: 180,
      color: 'text-secondary'
    },
    {
      level: 'Secondary',
      classes: 6,
      students: 200,
      capacity: 210,
      color: 'text-green-600'
    }
  ];

  const quickActions = [
    {
      title: 'Pending Approvals',
      icon: UserCheck,
      color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700',
      href: '/portal/admin/pending-approvals',
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    {
      title: 'User Management',
      icon: Users,
      color: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700',
      href: '/portal/admin/users'
    },
    {
      title: 'Manage Students',
      icon: UserPlus,
      color: 'bg-primary/10 hover:bg-primary/20 text-primary',
      href: '/portal/admin/students'
    },
    {
      title: 'Add Teacher',
      icon: Users,
      color: 'bg-secondary/10 hover:bg-secondary/20 text-secondary',
      href: '/portal/admin/teachers/add'
    },
    {
      title: 'Manage Exams',
      icon: FileText,
      color: 'bg-purple-100 hover:bg-purple-200 text-purple-600',
      href: '/portal/admin/exams'
    },
    {
      title: 'Create Class',
      icon: School,
      color: 'bg-green-100 hover:bg-green-200 text-green-600',
      href: '/portal/admin/classes/add'
    },
    {
      title: 'Send Announcement',
      icon: MessageSquare,
      color: 'bg-blue-100 hover:bg-blue-200 text-blue-600',
      href: '/portal/admin/announcements/add'
    },
    {
      title: 'Manage Home Page',
      icon: ImageIcon,
      color: 'bg-pink-100 hover:bg-pink-200 text-pink-600',
      href: '/portal/admin/homepage'
    },
    {
      title: 'Generate Report',
      icon: BarChart3,
      color: 'bg-orange-100 hover:bg-orange-200 text-orange-600',
      href: '/portal/admin/reports'
    }
  ];

  // Real stats from analytics API
  const stats = {
    totalStudents: analyticsData?.totalStudents || 0,
    studentsThisMonth: analyticsData?.recentActivity?.newStudentsThisMonth || 0,
    totalTeachers: analyticsData?.totalTeachers || 0,
    teachersThisTerm: analyticsData?.totalTeachers || 0, // Can be enhanced with term-specific data
    totalClasses: analyticsData?.totalClasses || 0,
    classesWithCapacity: analyticsData?.totalClasses > 0 ? 'All classes' : 'No classes',
    averageAttendance: 94, // Can be enhanced with real attendance data
  };

  if (!user) {
    return <div>Please log in to access the admin portal.</div>;
  }

  return (
    <PortalLayout
      userRole="admin"
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      {/* Admin Role Header - Brand Identity */}
      <div className="mb-6 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl" data-testid="admin-role-header">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Admin Portal</h2>
            <p className="text-red-100 text-sm">Command center for school management</p>
          </div>
        </div>
      </div>

      {/* PROMINENT PENDING APPROVALS NOTIFICATION */}
      {pendingCount > 0 && (
        <Card className="mb-4 sm:mb-6 border-2 border-orange-500 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 shadow-lg" data-testid="card-pending-approvals-alert">
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                <div className="relative flex-shrink-0">
                  <Bell className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600 animate-pulse" />
                  <div className="absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold" data-testid="text-pending-count">
                      {pendingCount}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
                    <h3 className="text-base sm:text-lg font-bold text-orange-900 dark:text-orange-200 truncate" data-testid="text-alert-title">
                      Pending Approvals Require Attention
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-300 mt-1" data-testid="text-alert-message">
                    {pendingCount} {pendingCount === 1 ? 'user' : 'users'} waiting for approval. Review and approve to grant portal access.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white shadow-md w-full sm:w-auto sm:size-lg"
                asChild
              >
                <Link href="/portal/admin/pending-approvals" data-testid="button-review-approvals">
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Review Now
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      

      {/* Statistics Cards - Fully Responsive */}
      <div className="grid gap-2 xs:gap-3 sm:gap-4 md:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6">
        {analyticsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatsCard
              title="Total Students"
              value={stats?.totalStudents.toString() ?? '0'}
              description={`↗ +${stats?.studentsThisMonth ?? 0} this month`}
              icon={Users}
              trend="up"
            />
            <StatsCard
              title="Teaching Staff"
              value={stats?.totalTeachers.toString() ?? '0'}
              description={`↗ +${stats?.teachersThisTerm ?? 0} this term`}
              icon={GraduationCap}
              trend="up"
            />
            <StatsCard
              title="Total Classes"
              value={stats?.totalClasses.toString() ?? '0'}
              description={stats?.classesWithCapacity ?? 'All classes'}
              icon={BookOpen}
            />
            <StatsCard
              title="Avg. Attendance"
              value={`${stats?.averageAttendance ?? 0}%`}
              description="Last 30 days"
              icon={Calendar}
              trend={((stats?.averageAttendance ?? 0) >= 85) ? 'up' : 'down'}
            />
          </>
        )}
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Recent Registrations - Fully Responsive */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <Card className="shadow-sm border border-border" data-testid="card-recent-registrations">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Recent Student Registrations</span>
                </CardTitle>
                <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm" asChild>
                  <Link href="/portal/admin/students" data-testid="link-view-all-students">
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 sm:pt-0">
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3">
                {mockRecentRegistrations.map((student, index) => (
                  <div
                    key={student.id}
                    className="border border-border rounded-lg p-3 bg-muted/30"
                    data-testid={`student-card-${index}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className={`w-8 h-8 ${student.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-xs font-medium">{student.initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" data-testid={`text-student-name-${index}`}>
                            {student.name}
                          </p>
                          <p className="text-xs text-muted-foreground" data-testid={`text-admission-number-${index}`}>
                            {student.admissionNumber}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                          student.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                        data-testid={`text-student-status-${index}`}
                      >
                        {student.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                      <span data-testid={`text-student-class-${index}`}>{student.class}</span>
                      <span data-testid={`text-registration-date-${index}`}>{student.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium">Student Name</th>
                      <th className="text-left py-2 px-3 font-medium">Admission No.</th>
                      <th className="text-left py-2 px-3 font-medium">Class</th>
                      <th className="text-left py-2 px-3 font-medium hidden md:table-cell">Date</th>
                      <th className="text-left py-2 px-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRecentRegistrations.map((student, index) => (
                      <tr key={student.id} className="border-b border-border/50" data-testid={`student-row-${index}`}>
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 ${student.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                              <span className="text-white text-xs font-medium">{student.initials}</span>
                            </div>
                            <span data-testid={`text-student-name-${index}`}>{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3" data-testid={`text-admission-number-${index}`}>
                          {student.admissionNumber}
                        </td>
                        <td className="py-3 px-3" data-testid={`text-student-class-${index}`}>
                          {student.class}
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell" data-testid={`text-registration-date-${index}`}>
                          {student.date}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              student.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                            data-testid={`text-student-status-${index}`}
                          >
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Fully Responsive */}
        <Card className="shadow-sm border border-border order-1 lg:order-2">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="space-y-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 px-4 hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary bg-gradient-to-r hover:from-primary/5 hover:to-transparent group"
                    asChild
                  >
                    <Link href={action.href} data-testid={`button-action-${index}`}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{action.title}</span>
                        </div>
                        {action.badge !== undefined && (
                          <Badge variant="destructive" className="ml-2 text-xs" data-testid={`badge-count-${index}`}>
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Overview - Responsive */}
      <Card className="mt-4 sm:mt-6 shadow-sm border border-border">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <School className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Class Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {classOverview.map((overview, index) => (
              <div
                key={index}
                className="border border-border rounded-lg p-3 sm:p-4"
                data-testid={`class-overview-${index}`}
              >
                <h3 className={`font-medium text-sm sm:text-base ${overview.color} mb-2`} data-testid={`text-overview-level-${index}`}>
                  {overview.level} ({overview.classes} classes)
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Students</span>
                    <span className="text-muted-foreground font-medium" data-testid={`text-overview-students-${index}`}>
                      {overview.students}/{overview.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        overview.level === 'Pre-School' ? 'bg-primary' :
                        overview.level === 'Primary' ? 'bg-secondary' : 'bg-green-500'
                      }`}
                      style={{ width: `${(overview.students / overview.capacity) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {Math.round((overview.students / overview.capacity) * 100)}% occupied
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Analytics & Upcoming Events - Fully Responsive */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 mt-4 sm:mt-6">
        <Card className="shadow-sm border border-border" data-testid="card-system-analytics">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">System Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            {performanceLoading ? (
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                <Skeleton className="h-16 sm:h-20 w-full" />
                <Skeleton className="h-16 sm:h-20 w-full" />
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2 p-2.5 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm md:text-base truncate">Goal Achievement</p>
                    <p className="text-xs text-muted-foreground">Sub-2s target rate</p>
                  </div>
                  <div className="text-left xs:text-right">
                    <p className={`text-lg sm:text-xl md:text-2xl font-bold ${
                      (performanceMetrics?.goalAchievementRate || 0) >= 95 ? 'text-green-600' :
                      (performanceMetrics?.goalAchievementRate || 0) >= 80 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {performanceMetrics?.goalAchievementRate || 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {performanceMetrics?.totalEvents || 0} events
                    </p>
                  </div>
                </div>

                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2 p-2.5 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm md:text-base truncate">Pending Grading</p>
                    <p className="text-xs text-muted-foreground">Manual review needed</p>
                  </div>
                  <div className="text-left xs:text-right">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">
                      {gradingStats?.total_pending || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {gradingStats?.teachers_active || 0} graders active
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border" data-testid="card-upcoming-events">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-sm sm:text-base md:text-lg">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 md:p-3 bg-muted/50 rounded-lg">
                <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                  <i className="fas fa-calendar text-primary text-xs sm:text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm truncate">Parent-Teacher Conference</p>
                  <p className="text-xs text-muted-foreground">December 15, 2024</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 md:p-3 bg-muted/50 rounded-lg">
                <div className="bg-secondary/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                  <i className="fas fa-graduation-cap text-secondary text-xs sm:text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm truncate">End of Term Exams</p>
                  <p className="text-xs text-muted-foreground">December 18-22, 2024</p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 md:p-3 bg-green-100 dark:bg-green-950/20 rounded-lg">
                <div className="bg-green-100 dark:bg-green-950/40 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                  <i className="fas fa-trophy text-green-600 text-xs sm:text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm truncate">Inter-House Sports</p>
                  <p className="text-xs text-muted-foreground">January 15, 2025</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts - Responsive */}
      <Card className="mt-4 sm:mt-6 shadow-sm border border-border">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Security Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Failed Login Attempts */}
            <div className="p-3 sm:p-4 border border-border rounded-lg bg-red-50 dark:bg-red-950/20" data-testid="alert-failed-logins">
              <div className="flex items-center justify-between mb-2">
                <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                <span className="text-xl sm:text-2xl font-bold text-red-600" data-testid="text-failed-login-count">3</span>
              </div>
              <h4 className="font-medium text-xs sm:text-sm text-red-900 dark:text-red-200">Failed Logins</h4>
              <p className="text-xs text-red-700 dark:text-yellow-300 mt-1">Last 24 hours</p>
            </div>

            {/* Locked Accounts */}
            <div className="p-3 sm:p-4 border border-border rounded-lg bg-orange-50 dark:bg-orange-950/20" data-testid="alert-locked-accounts">
              <div className="flex items-center justify-between mb-2">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                <span className="text-xl sm:text-2xl font-bold text-orange-600" data-testid="text-locked-account-count">1</span>
              </div>
              <h4 className="font-medium text-xs sm:text-sm text-orange-900 dark:text-orange-200">Locked Accounts</h4>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Require admin review</p>
            </div>

            {/* MFA Enabled */}
            <div className="p-3 sm:p-4 border border-border rounded-lg bg-green-50 dark:bg-green-950/20" data-testid="alert-mfa-status">
              <div className="flex items-center justify-between mb-2">
                <Key className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="text-xl sm:text-2xl font-bold text-green-600" data-testid="text-mfa-percentage">68%</span>
              </div>
              <h4 className="font-medium text-xs sm:text-sm text-green-900 dark:text-green-200">MFA Enabled</h4>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">Staff accounts</p>
            </div>

            {/* Suspended Users */}
            <div className="p-3 sm:p-4 border border-border rounded-lg bg-yellow-50 dark:bg-yellow-950/20" data-testid="alert-suspended-users">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                <span className="text-xl sm:text-2xl font-bold text-yellow-600" data-testid="text-suspended-count">2</span>
              </div>
              <h4 className="font-medium text-xs sm:text-sm text-yellow-900 dark:text-yellow-200">Suspended Users</h4>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                <Link href="/portal/admin/users" className="hover:underline" data-testid="link-manage-suspended">
                  Manage →
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
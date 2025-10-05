import { useState } from 'react';
import PortalLayout from '@/components/layout/PortalLayout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, BookOpen, MessageSquare, TrendingUp, Heart, ChevronRight, UserCircle, Award, Bell, FileText, GraduationCap } from 'lucide-react';
import { Link } from 'wouter';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Fetch all children linked to this parent
  const { data: linkedChildren = [], isLoading: loadingChildren } = useQuery<any[]>({
    queryKey: ['/api/parents/children', user?.id],
    enabled: !!user,
  });

  // Auto-select first child if not selected
  if (!selectedChildId && linkedChildren.length > 0 && !loadingChildren) {
    setSelectedChildId(linkedChildren[0].id);
  }

  const selectedChild = linkedChildren.find((child: any) => child.id === selectedChildId);

  // Fetch parent's children from API (this part is redundant with linkedChildren, will be refactored to use linkedChildren)
  const { data: childrenData = [], isLoading: loadingChildrenOld } = useQuery<any[]>({
    queryKey: ['/api/parent', user?.id, 'children'],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/parent/${user.id}/children`);
      if (!response.ok) throw new Error('Failed to fetch children');
      return response.json();
    },
    enabled: !!user?.id,
  });

  if (!user) {
    return <div>Please log in to access the parent portal.</div>;
  }

  // Transform API data to include display properties
  // This mock data transformation should use the 'linkedChildren' data instead of 'childrenData'
  const mockChildren = linkedChildren.map((child, index) => {
    const colors = ['bg-primary', 'bg-secondary', 'bg-green-500', 'bg-blue-500', 'bg-purple-500'];
    const firstName = child.firstName || child.name?.split(' ')[0] || 'Student';
    const lastName = child.lastName || child.name?.split(' ')[1] || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const initials = `${firstName[0]}${lastName[0] || firstName[1] || ''}`.toUpperCase();

    return {
      id: child.id,
      name: fullName,
      class: child.className || child.class || 'N/A',
      admissionNumber: child.admissionNumber || child.studentId || `THS/${child.id}`,
      currentGPA: child.currentGPA || '0.00',
      attendance: child.attendanceRate ? `${child.attendanceRate}%` : '0%',
      lastAttendance: child.lastAttendance || 'Unknown',
      initials: initials,
      color: colors[index % colors.length]
    };
  });

  const mockRecentGrades = [
    {
      childName: 'John Smith',
      subject: 'Mathematics',
      assessment: 'Mid-term Exam',
      score: '85/100',
      grade: 'A',
      date: '2 days ago'
    },
    {
      childName: 'Jane Smith',
      subject: 'English Language',
      assessment: 'Essay Assignment',
      score: '88/100',
      grade: 'A',
      date: '3 days ago'
    },
    {
      childName: 'John Smith',
      subject: 'Basic Science',
      assessment: 'Lab Report',
      score: '92/100',
      grade: 'A+',
      date: '1 week ago'
    }
  ];

  const mockAnnouncements = [
    {
      id: 1,
      title: 'Parent-Teacher Conference Scheduled',
      content: 'Please register for the upcoming parent-teacher conference on December 15th...',
      publishedAt: '1 day ago',
      color: 'border-primary'
    },
    {
      id: 2,
      title: 'School Fee Payment Reminder',
      content: 'This is a friendly reminder that the second term fees are due...',
      publishedAt: '3 days ago',
      color: 'border-secondary'
    },
    {
      id: 3,
      title: 'Holiday Break Schedule',
      content: 'The school will be closed from December 23rd to January 7th...',
      publishedAt: '1 week ago',
      color: 'border-green-500'
    }
  ];

  const quickActions = [
    {
      title: 'View Grades',
      icon: BookOpen,
      color: 'bg-primary/10 hover:bg-primary/20 text-primary',
      href: '/portal/parent/grades'
    },
    {
      title: 'Check Attendance',
      icon: Calendar,
      color: 'bg-secondary/10 hover:bg-secondary/20 text-secondary',
      href: '/portal/parent/attendance'
    },
    {
      title: 'Messages',
      icon: MessageSquare,
      color: 'bg-green-100 hover:bg-green-200 text-green-600',
      href: '/portal/parent/messages'
    },
    {
      title: 'Fee Payment',
      icon: Heart,
      color: 'bg-blue-100 hover:bg-blue-200 text-blue-600',
      href: '/portal/parent/payments'
    }
  ];

  // Filter data based on selected child
  const selectedChildren = selectedChildId === null
    ? mockChildren // If no child selected, show all
    : mockChildren.filter(c => c.id === selectedChildId);

  const selectedChildForDisplay = selectedChildId === null
    ? null
    : mockChildren.find(c => c.id === selectedChildId);

  // Calculate stats based on selection (with zero-division guard)
  const totalAttendance = selectedChildren.length > 0
    ? selectedChildren.reduce((sum, child) => sum + parseInt(child.attendance), 0) / selectedChildren.length
    : 0;
  const avgGPA = selectedChildren.length > 0
    ? selectedChildren.reduce((sum, child) => sum + parseFloat(child.currentGPA), 0) / selectedChildren.length
    : 0;

  // Filter recent grades based on selection
  const filteredGrades = selectedChildId === null
    ? mockRecentGrades
    : mockRecentGrades.filter(g =>
        mockChildren.find(c => c.id === selectedChildId)?.name === g.childName
      );

  const parentActions = [
    {
      title: 'My Children',
      value: 'View',
      icon: Users,
      description: 'Monitor your children',
      href: '/portal/parent/children',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-indigo-50',
    },
    {
      title: 'Report Cards',
      value: 'Access',
      icon: FileText,
      description: 'Academic performance reports',
      href: '/portal/parent/reports',
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
    },
    {
      title: 'Attendance',
      value: 'Track',
      icon: Calendar,
      description: 'View attendance records',
      href: '/portal/parent/attendance',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-violet-50',
    },
    {
      title: 'Messages',
      value: 'Read',
      icon: MessageSquare,
      description: 'School communications',
      href: '/portal/parent/messages',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-amber-50',
    }
  ];

  return (
    <PortalLayout
      userRole="parent"
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      <div className="space-y-6 sm:space-y-8">
        {/* Parent Role Header - Brand Identity */}
        <div className="mb-6 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 rounded-2xl p-6 text-white shadow-xl" data-testid="parent-role-header">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Parent Portal</h2>
              <p className="text-amber-100 text-sm">Partnering in your child's success</p>
            </div>
          </div>
        </div>

        {/* Child Selector - Only show if parent has children linked */}
        {linkedChildren.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="bg-blue-600 p-3 rounded-xl flex-shrink-0">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      👨‍👩‍👧 Select Your Child's Records
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {linkedChildren.length === 1
                        ? 'Viewing records for your child'
                        : `Choose from ${linkedChildren.length} children to view their academic records`}
                    </p>
                  </div>
                </div>
                <Select value={selectedChildId || ''} onValueChange={setSelectedChildId}>
                  <SelectTrigger className="w-full sm:w-[280px] bg-white dark:bg-gray-900 border-2 border-blue-300 dark:border-blue-700">
                    <SelectValue placeholder="Select a child" />
                  </SelectTrigger>
                  <SelectContent>
                    {linkedChildren.map((child: any) => (
                      <SelectItem key={child.id} value={child.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{child.firstName} {child.lastName}</span>
                          <span className="text-xs text-muted-foreground">
                            ({child.admissionNumber || 'Student'})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show message if no children linked */}
        {!loadingChildren && linkedChildren.length === 0 && (
          <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="p-6 text-center">
              <Bell className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-orange-900 dark:text-orange-200 mb-2">
                No Children Linked
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Your account has not been linked to any student records yet. Please contact the school administrator to link your children's accounts.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards - Fully Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
          <StatsCard
            title={selectedChildId === null ? "All Children" : "Selected Child"}
            value={selectedChildren.length}
            icon={Users}
            color="primary"
          />
          <StatsCard
            title="Avg. Attendance"
            value={`${Math.round(totalAttendance)}%`}
            icon={Calendar}
            color="green"
            change="↗ Excellent"
            changeType="positive"
          />
          <StatsCard
            title="Avg. GPA"
            value={avgGPA.toFixed(2)}
            icon={TrendingUp}
            color="secondary"
          />
          <StatsCard
            title="Unread Messages"
            value="2"
            icon={MessageSquare}
            color="blue"
          />
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-slide-up">
          {parentActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Card className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 overflow-hidden h-full">
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.bgGradient} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4">
                    <CardTitle className="text-sm sm:text-base font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                      {action.title}
                    </CardTitle>
                    <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative space-y-1 sm:space-y-2">
                    <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${action.gradient} bg-clip-text text-transparent`}>
                      {action.value}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Children Overview - Fully Responsive */}
        <Card className="shadow-sm border border-border mb-4 sm:mb-6" data-testid="card-children-overview">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center space-x-2 text-sm sm:text-base md:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>My Children</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {mockChildren.map((child, index) => (
                <div
                  key={child.id}
                  className="border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                  data-testid={`child-card-${index}`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${child.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-medium text-sm sm:text-base">{child.initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate" data-testid={`text-child-name-${index}`}>
                        {child.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate" data-testid={`text-child-class-${index}`}>
                        {child.class} • {child.admissionNumber}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">GPA</p>
                      <p className="font-semibold text-primary text-xs sm:text-sm" data-testid={`text-child-gpa-${index}`}>
                        {child.currentGPA}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Attendance</p>
                      <p className="font-semibold text-green-600 text-xs sm:text-sm" data-testid={`text-child-attendance-${index}`}>
                        {child.attendance}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Today</p>
                      <p className="font-semibold text-green-600 text-xs sm:text-sm" data-testid={`text-child-today-${index}`}>
                        {child.lastAttendance}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 sm:mt-3 text-xs sm:text-sm h-7 sm:h-8"
                    asChild
                  >
                    <Link href={`/portal/parent/children/${child.id}`} data-testid={`button-view-details-${index}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {/* Recent Grades - Fully Responsive */}
          <Card className="shadow-sm border border-border" data-testid="card-recent-grades">
            <CardHeader className="p-4 sm:p-5 md:p-6">
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-4">
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Recent Grades</span>
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/portal/parent/grades" data-testid="link-view-all-grades">
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredGrades.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No recent grades available
                  </p>
                ) : (
                  filteredGrades.map((grade, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      data-testid={`grade-item-${index}`}
                    >
                      <div>
                        <p className="font-medium text-sm" data-testid={`text-grade-child-${index}`}>
                          {grade.childName}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-grade-subject-${index}`}>
                          {grade.subject} • {grade.assessment}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-grade-date-${index}`}>
                          {grade.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary" data-testid={`text-grade-score-${index}`}>
                          {grade.score}
                        </p>
                        <p className="text-sm text-green-600" data-testid={`text-grade-letter-${index}`}>
                          {grade.grade}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card className="shadow-sm border border-border" data-testid="card-announcements">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>School Announcements</span>
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/portal/parent/announcements" data-testid="link-view-all-announcements">
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnnouncements.map((announcement, index) => (
                  <div
                    key={announcement.id}
                    className={`border-l-4 ${announcement.color} pl-4`}
                    data-testid={`announcement-item-${index}`}
                  >
                    <h3 className="font-medium text-sm" data-testid={`text-announcement-title-${index}`}>
                      {announcement.title}
                    </h3>
                    <p className="text-muted-foreground text-xs mt-1" data-testid={`text-announcement-content-${index}`}>
                      {announcement.content}
                    </p>
                    <p className="text-muted-foreground text-xs mt-2" data-testid={`text-announcement-time-${index}`}>
                      {announcement.publishedAt}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6 shadow-sm border border-border" data-testid="card-quick-actions">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-20 flex flex-col space-y-2"
                    asChild
                  >
                    <Link href={action.href} data-testid={`button-action-${index}`}>
                      <Icon className="h-6 w-6" />
                      <span className="text-sm">{action.title}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="mt-6 shadow-sm border border-border" data-testid="card-upcoming-events">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Upcoming Events & Reminders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <i className="fas fa-calendar text-primary"></i>
                </div>
                <div>
                  <p className="font-medium text-sm">Parent-Teacher Conference</p>
                  <p className="text-xs text-muted-foreground">December 15, 2024 • Book your slot now</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="bg-secondary/10 p-2 rounded-lg">
                  <i className="fas fa-money-bill text-secondary"></i>
                </div>
                <div>
                  <p className="font-medium text-sm">Second Term Fees Due</p>
                  <p className="text-xs text-muted-foreground">January 15, 2025 • Pay online for convenience</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="bg-green-100 p-2 rounded-lg">
                  <i className="fas fa-trophy text-green-600"></i>
                </div>
                <div>
                  <p className="font-medium text-sm">Inter-House Sports Day</p>
                  <p className="text-xs text-muted-foreground">February 10, 2025 • Come cheer for your children!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Child Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">Recent Achievements</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground">Your child's accomplishments</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="p-2 rounded-lg bg-green-100">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-gray-900">Excellent Math Score</p>
                  <p className="text-xs sm:text-sm text-gray-600">95% in recent exam</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-gray-900">Perfect Attendance</p>
                  <p className="text-xs sm:text-sm text-gray-600">This month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50/30">
            <CardHeader className="border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">Important Updates</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground">School notifications</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="p-2 rounded-lg bg-orange-100">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-gray-900">Parent-Teacher Meeting</p>
                  <p className="text-xs sm:text-sm text-gray-600">Scheduled for Friday, 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="p-2 rounded-lg bg-purple-100">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-gray-900">Exam Schedule</p>
                  <p className="text-xs sm:text-sm text-gray-600">Mid-term exams next week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
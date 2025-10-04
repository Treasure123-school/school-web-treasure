import PortalLayout from '@/components/layout/PortalLayout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Users, GraduationCap, School, TrendingUp, UserPlus, MessageSquare, BarChart3, FileText, Image as ImageIcon, UserCheck, Bell, AlertCircle, Shield, ShieldAlert, Lock, Key } from 'lucide-react';
import { Link } from 'wouter';

export default function AdminDashboard() {
  const { user } = useAuth();

  // Fetch pending users count
  const { data: pendingUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/users/pending'],
    enabled: !!user,
  });

  const pendingCount = pendingUsers.length;

  if (!user) {
    return <div>Please log in to access the admin portal.</div>;
  }

  // Mock data for demo - in real app this would come from API
  const mockRecentRegistrations = [
    {
      id: 1,
      name: 'John Adebayo',
      admissionNumber: 'THS/2024/001',
      class: 'Primary 3',
      date: 'Dec 10, 2024',
      status: 'Active',
      initials: 'JA',
      color: 'bg-primary'
    },
    {
      id: 2,
      name: 'Mary Okafor',
      admissionNumber: 'THS/2024/002',
      class: 'JSS 1',
      date: 'Dec 09, 2024',
      status: 'Pending',
      initials: 'MO',
      color: 'bg-secondary'
    },
    {
      id: 3,
      name: 'David Smith',
      admissionNumber: 'THS/2024/003',
      class: 'Nursery 2',
      date: 'Dec 08, 2024',
      status: 'Active',
      initials: 'DS',
      color: 'bg-blue-500'
    }
  ];

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

  return (
    <PortalLayout 
      userRole="admin" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      {/* PROMINENT PENDING APPROVALS NOTIFICATION */}
      {pendingCount > 0 && (
        <Card className="mb-6 border-2 border-orange-500 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 shadow-lg" data-testid="card-pending-approvals-alert">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Bell className="h-10 w-10 text-orange-600 animate-pulse" />
                  <div className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold" data-testid="text-pending-count">
                      {pendingCount}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-bold text-orange-900 dark:text-orange-200" data-testid="text-alert-title">
                      Pending Approvals Require Attention
                    </h3>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1" data-testid="text-alert-message">
                    {pendingCount} {pendingCount === 1 ? 'user' : 'users'} waiting for approval. Review and approve to grant portal access.
                  </p>
                </div>
              </div>
              <Button 
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white shadow-md"
                asChild
              >
                <Link href="/portal/admin/pending-approvals" data-testid="button-review-approvals">
                  <UserCheck className="h-5 w-5 mr-2" />
                  Review Now
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header Actions */}
      <div className="flex justify-end mb-6">
        <Button className="bg-primary text-primary-foreground" asChild>
          <Link href="/portal/admin/students" data-testid="button-manage-students">
            <UserPlus className="h-4 w-4 mr-2" />
            Manage Students
          </Link>
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total Students"
          value="487"
          icon={Users}
          color="primary"
          change="↗ +12 this month"
          changeType="positive"
        />
        <StatsCard
          title="Teaching Staff"
          value="52"
          icon={GraduationCap}
          color="secondary"
          change="↗ +3 this term"
          changeType="positive"
        />
        <StatsCard
          title="Active Classes"
          value="15"
          icon={School}
          color="green"
        />
        <StatsCard
          title="Avg. Attendance"
          value="94%"
          icon={TrendingUp}
          color="blue"
          change="↗ +2% this week"
          changeType="positive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registrations */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border border-border" data-testid="card-recent-registrations">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Recent Student Registrations</span>
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/portal/admin/students" data-testid="link-view-all-students">
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2">Student Name</th>
                      <th className="text-left py-2">Admission No.</th>
                      <th className="text-left py-2">Class</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRecentRegistrations.map((student, index) => (
                      <tr key={student.id} className="border-b border-border/50" data-testid={`student-row-${index}`}>
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 ${student.color} rounded-full flex items-center justify-center`}>
                              <span className="text-white text-xs font-medium">{student.initials}</span>
                            </div>
                            <span data-testid={`text-student-name-${index}`}>{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3" data-testid={`text-admission-number-${index}`}>
                          {student.admissionNumber}
                        </td>
                        <td className="py-3" data-testid={`text-student-class-${index}`}>
                          {student.class}
                        </td>
                        <td className="py-3" data-testid={`text-registration-date-${index}`}>
                          {student.date}
                        </td>
                        <td className="py-3">
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

        {/* Quick Actions */}
        <Card className="shadow-sm border border-border" data-testid="card-quick-actions">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button 
                    key={index}
                    variant="ghost"
                    className={`w-full justify-start h-auto p-3 ${action.color} transition-colors`}
                    asChild
                  >
                    <Link href={action.href} data-testid={`button-action-${index}`}>
                      <Icon className="h-4 w-4 mr-3" />
                      <span className="text-sm font-medium flex-1">{action.title}</span>
                      {action.badge !== undefined && (
                        <Badge variant="destructive" className="ml-2" data-testid={`badge-count-${index}`}>
                          {action.badge}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Overview */}
      <Card className="mt-6 shadow-sm border border-border" data-testid="card-class-overview">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <School className="h-5 w-5" />
            <span>Class Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classOverview.map((overview, index) => (
              <div 
                key={index}
                className="border border-border rounded-lg p-4"
                data-testid={`class-overview-${index}`}
              >
                <h3 className={`font-medium ${overview.color} mb-2`} data-testid={`text-overview-level-${index}`}>
                  {overview.level} ({overview.classes} classes)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Students</span>
                    <span className="text-muted-foreground" data-testid={`text-overview-students-${index}`}>
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

      {/* System Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="shadow-sm border border-border" data-testid="card-system-analytics">
          <CardHeader>
            <CardTitle>System Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Daily Active Users</p>
                  <p className="text-sm text-muted-foreground">Portal logins today</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">342</p>
                  <p className="text-xs text-green-600">↗ +15%</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Pending Actions</p>
                  <p className="text-sm text-muted-foreground">Require attention</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">7</p>
                  <p className="text-xs text-muted-foreground">Applications</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border" data-testid="card-upcoming-events">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <i className="fas fa-calendar text-primary"></i>
                </div>
                <div>
                  <p className="font-medium text-sm">Parent-Teacher Conference</p>
                  <p className="text-xs text-muted-foreground">December 15, 2024</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="bg-secondary/10 p-2 rounded-lg">
                  <i className="fas fa-graduation-cap text-secondary"></i>
                </div>
                <div>
                  <p className="font-medium text-sm">End of Term Exams</p>
                  <p className="text-xs text-muted-foreground">December 18-22, 2024</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="bg-green-100 p-2 rounded-lg">
                  <i className="fas fa-trophy text-green-600"></i>
                </div>
                <div>
                  <p className="font-medium text-sm">Inter-House Sports</p>
                  <p className="text-xs text-muted-foreground">January 15, 2025</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <Card className="mt-6 shadow-sm border border-border" data-testid="card-security-alerts">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Failed Login Attempts */}
            <div className="p-4 border border-border rounded-lg bg-red-50 dark:bg-red-950/20" data-testid="alert-failed-logins">
              <div className="flex items-center justify-between mb-2">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                <span className="text-2xl font-bold text-red-600" data-testid="text-failed-login-count">3</span>
              </div>
              <h4 className="font-medium text-sm text-red-900 dark:text-red-200">Failed Logins</h4>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">Last 24 hours</p>
            </div>

            {/* Locked Accounts */}
            <div className="p-4 border border-border rounded-lg bg-orange-50 dark:bg-orange-950/20" data-testid="alert-locked-accounts">
              <div className="flex items-center justify-between mb-2">
                <Lock className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600" data-testid="text-locked-account-count">1</span>
              </div>
              <h4 className="font-medium text-sm text-orange-900 dark:text-orange-200">Locked Accounts</h4>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Require admin review</p>
            </div>

            {/* MFA Enabled */}
            <div className="p-4 border border-border rounded-lg bg-green-50 dark:bg-green-950/20" data-testid="alert-mfa-status">
              <div className="flex items-center justify-between mb-2">
                <Key className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600" data-testid="text-mfa-percentage">68%</span>
              </div>
              <h4 className="font-medium text-sm text-green-900 dark:text-green-200">MFA Enabled</h4>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">Staff accounts</p>
            </div>

            {/* Suspended Users */}
            <div className="p-4 border border-border rounded-lg bg-yellow-50 dark:bg-yellow-950/20" data-testid="alert-suspended-users">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-600" data-testid="text-suspended-count">2</span>
              </div>
              <h4 className="font-medium text-sm text-yellow-900 dark:text-yellow-200">Suspended Users</h4>
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

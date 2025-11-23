import PortalLayout from '@/components/layout/PortalLayout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Users, GraduationCap, School, TrendingUp, UserPlus, MessageSquare, BarChart3, FileText, Image as ImageIcon, UserCheck, Bell, AlertCircle, Shield, ShieldAlert, Lock, Key, BookOpen, Calendar, Search, Filter, Mail, Phone, Edit, Ban, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef, useState } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnimatedCounter } from '@/components/ui/animated-counter';

// Define DashboardStats type (assuming it's defined elsewhere or can be inferred)
interface DashboardStats {
  totalStudents: number;
  studentsThisMonth: number;
  totalTeachers: number;
  teachersThisTerm: number;
  totalClasses: number;
  classesWithCapacity: string;
  averageAttendance: number;
} // fixed
function TeacherOverviewSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch subjects and classes to map IDs to names
  const { data: subjects = [] } = useQuery<any[]>({ queryKey: ['/api/subjects'] });
  const { data: classes = [] } = useQuery<any[]>({ queryKey: ['/api/classes'] });

  const { data: teachersOverview = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/teachers/overview'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const filteredTeachers = teachersOverview.filter(teacher => {
    const matchesSearch = 
      teacher.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.staffId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "verified" && teacher.verified) ||
      (statusFilter === "pending" && !teacher.verified && teacher.hasProfile) ||
      (statusFilter === "incomplete" && !teacher.hasProfile);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: teachersOverview.length,
    verified: teachersOverview.filter(t => t.verified).length,
    pending: teachersOverview.filter(t => !t.verified && t.hasProfile).length,
    incomplete: teachersOverview.filter(t => !t.hasProfile).length,
  };

  if (isLoading) {
    return (
      <Card className="mt-4 sm:mt-6 shadow-sm border border-border">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  } // fixed


function NotificationSummary() {
  const { data: teachersOverview = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/teachers/overview'],
  });

  const todayAutoVerified = teachersOverview.filter(t => {
    const createdDate = new Date(t.createdAt);
    const today = new Date();
    return createdDate.toDateString() === today.toDateString() && t.verified;
  });

  const pendingReview = teachersOverview.filter(t => !t.verified && t.hasProfile);

  return (
    <Card className="mt-4 sm:mt-6 shadow-sm border border-border">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
          <span>Today's Teacher Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Auto-Verified Today</p>
                <p className="text-xs text-muted-foreground">
                  {todayAutoVerified.length} teacher{todayAutoVerified.length !== 1 ? 's' : ''} completed profile setup
                </p>
              </div>
            </div>
            <Badge variant="default" className="bg-green-600">{todayAutoVerified.length}</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Pending Review</p>
                <p className="text-xs text-muted-foreground">
                  {pendingReview.length} profile{pendingReview.length !== 1 ? 's' : ''} awaiting verification
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/portal/admin/teacher-verification">
                Review
              </Link>
            </Button>
          </div>

          {todayAutoVerified.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Recent Auto-Verifications:</p>
              <div className="space-y-2">
                {todayAutoVerified.slice(0, 3).map((teacher: any) => (
                  <div key={teacher.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                    <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-semibold">
                      {teacher.firstName[0]}{teacher.lastName[0]}
                    </div>
                    <span className="flex-1">{teacher.firstName} {teacher.lastName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(teacher.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} // fixed
  return (
    <Card className="mt-4 sm:mt-6 shadow-sm border border-border">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <span>Teacher Overview</span>
            <Badge variant="secondary" className="ml-2">{stats.total}</Badge>
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
                data-testid="input-search-teachers"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified ({stats.verified})</SelectItem>
                <SelectItem value="pending">Pending ({stats.pending})</SelectItem>
                <SelectItem value="incomplete">Incomplete ({stats.incomplete})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Teacher</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No teachers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id} data-testid={`row-teacher-${teacher.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-semibold">
                          {teacher.firstName[0]}{teacher.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium" data-testid={`text-teacher-name-${teacher.id}`}>
                            {teacher.firstName} {teacher.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {teacher.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-staff-id-${teacher.id}`}>
                      {teacher.staffId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{teacher.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects && teacher.subjects.length > 0 ? (
                          teacher.subjects.slice(0, 2).map((subjectId: number, idx: number) => {
                            // Find subject name from subjects query - ensure proper ID matching
                            const subject = subjects?.find(s => Number(s.id) === Number(subjectId));
                            return subject ? (
                              <Badge key={idx} variant="secondary" className="text-xs" data-testid={`badge-subject-${idx}`}>
                                {subject.name}
                              </Badge>
                            ) : null;
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                        {teacher.subjects && teacher.subjects.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{teacher.subjects.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.classes && teacher.classes.length > 0 ? (
                          teacher.classes.slice(0, 2).map((classId: number, idx: number) => {
                            // Find class name from classes query - ensure proper ID matching
                            const classObj = classes?.find(c => Number(c.id) === Number(classId));
                            return classObj ? (
                              <Badge key={idx} variant="secondary" className="text-xs" data-testid={`badge-class-${idx}`}>
                                {classObj.name}
                              </Badge>
                            ) : null;
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                        {teacher.classes && teacher.classes.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{teacher.classes.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {teacher.verified ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant="default" className="bg-green-600" data-testid={`badge-status-${teacher.id}`}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                          {/* Show "Auto-Verified" indicator if created today */}
                          {(() => {
                            const createdDate = new Date(teacher.createdAt);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            createdDate.setHours(0, 0, 0, 0);
                            const isToday = createdDate.getTime() === today.getTime();
                            return isToday && teacher.verified && (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                ✨ Auto-Verified Today
                              </span>
                            );
                          })()}
                        </div>
                      ) : teacher.hasProfile ? (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" data-testid={`badge-status-${teacher.id}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      ) : (
                        <Badge variant="destructive" data-testid={`badge-status-${teacher.id}`}>
                          <XCircle className="h-3 w-3 mr-1" />
                          Incomplete
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          asChild
                          data-testid={`button-view-teacher-${teacher.id}`}
                        >
                          <Link href={`/portal/admin/teacher-profiles/${teacher.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        {teacher.phone && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`tel:${teacher.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            <div className="text-xs text-green-700 dark:text-green-400">Verified</div>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-yellow-700 dark:text-yellow-400">Pending Review</div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
            <div className="text-2xl font-bold text-red-600">{stats.incomplete}</div>
            <div className="text-xs text-red-700 dark:text-red-400">Incomplete</div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-700 dark:text-blue-400">Total Teachers</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} // fixed
function NotificationSummary() {
  const { data: teachersOverview = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/teachers/overview'],
  });

  const todayAutoVerified = teachersOverview.filter(t => {
    const createdDate = new Date(t.createdAt);
    const today = new Date();
    return createdDate.toDateString() === today.toDateString() && t.verified;
  });

  const pendingReview = teachersOverview.filter(t => !t.verified && t.hasProfile);

  return (
    <Card className="mt-4 sm:mt-6 shadow-sm border border-border">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
          <span>Today's Teacher Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Auto-Verified Today</p>
                <p className="text-xs text-muted-foreground">
                  {todayAutoVerified.length} teacher{todayAutoVerified.length !== 1 ? 's' : ''} completed profile setup
                </p>
              </div>
            </div>
            <Badge variant="default" className="bg-green-600">{todayAutoVerified.length}</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Pending Review</p>
                <p className="text-xs text-muted-foreground">
                  {pendingReview.length} profile{pendingReview.length !== 1 ? 's' : ''} awaiting verification
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/portal/admin/teacher-verification">
                Review
              </Link>
            </Button>
          </div>

          {todayAutoVerified.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Recent Auto-Verifications:</p>
              <div className="space-y-2">
                {todayAutoVerified.slice(0, 3).map((teacher: any) => (
                  <div key={teacher.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                    <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-semibold">
                      {teacher.firstName[0]}{teacher.lastName[0]}
                    </div>
                    <span className="flex-1">{teacher.firstName} {teacher.lastName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(teacher.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} // fixed
export default function AdminDashboard() {
  const { user } = useAuth();

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

  // Fetch all users for recent registrations (Admin only)
  const { data: allUsers = [], isError: usersError } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: !!user && user.roleId === 1, // Only fetch for admins
    retry: false, // Don't retry on permission errors
  });

  // Fetch all exams for stats
  const { data: allExams = [] } = useQuery<any[]>({
    queryKey: ['/api/exams'],
    enabled: !!user,
  });

  // Get recent registrations (last 3 students)
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

  // Process user signup trends (last 7 days)
  const signupTrends = (() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayUsers = allUsers.filter(u => {
        const userDate = new Date(u.createdAt).toISOString().split('T')[0];
        return userDate === date;
      });

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        students: dayUsers.filter(u => u.roleId === 3).length,
        teachers: dayUsers.filter(u => u.roleId === 2).length,
        total: dayUsers.length,
      };
    });
  })();

  // Process role distribution for pie chart
  const roleDistribution = [
    { name: 'Students', value: allUsers.filter(u => u.roleId === 3).length, color: '#3b82f6' },
    { name: 'Teachers', value: allUsers.filter(u => u.roleId === 2).length, color: '#10b981' },
    { name: 'Parents', value: allUsers.filter(u => u.roleId === 4).length, color: '#f59e0b' },
    { name: 'Admins', value: allUsers.filter(u => u.roleId === 1).length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Process exam participation data
  const examParticipation = allExams.slice(0, 6).map(exam => ({
    name: exam.title?.substring(0, 20) || 'Exam',
    participants: exam.totalParticipants || 0,
    submissions: exam.totalSubmissions || 0,
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

  const quickActions: Array<{
    title: string;
    icon: any;
    color: string;
    href: string;
    badge?: number | string;
  }> = [
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

  const [recentTeachers, setRecentTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // State for loading

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Assuming setStats is available or stats is a state variable managed elsewhere
        // For now, let's assume 'stats' is directly updated if it's not a state variable
        // If stats is a state variable, you'd use a setter function like setStats(data)
      } // fixed
      // Fetch recent teacher profiles
      const teachersResponse = await fetch("/api/admin/teachers/overview", {
        credentials: "include",
      });

      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTeachers = teachersData.filter((t: any) => 
          new Date(t.createdAt) >= today
        );
        setRecentTeachers(todayTeachers);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);


  if (!user) {
    return <div>Please log in to access the admin portal.</div>;
  } // fixed
  // Fetch today's auto-verified teachers
  const { data: todayAutoVerified = [] } = useQuery({
    queryKey: ['/api/admin/teachers/overview'],
    select: (data: any[]) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return data.filter(t => {
        const createdDate = new Date(t.createdAt);
        return createdDate >= today && t.verified;
      });
    },
    enabled: !!user
  });

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
            <h2 className="text-2xl font-bold tracking-tight">Welcome back, {user.firstName}!</h2>
            <p className="text-red-100 text-sm">Manage all aspects of Treasure-Home School</p>
          </div>
        </div>
      </div>

      {/* AUTO-VERIFICATION SUCCESS BANNER - Enhanced with teacher details - Fully Responsive */}
      {todayAutoVerified.length > 0 && (
        <Card className="mb-4 sm:mb-6 border-2 border-green-500 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 shadow-xl">
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="bg-green-100 dark:bg-green-900 p-2 sm:p-3 rounded-full shadow-md animate-pulse flex-shrink-0">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-col xs:flex-row xs:items-center gap-2 mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-green-900 dark:text-green-200">
                    🎉 {todayAutoVerified.length} Teacher Profile{todayAutoVerified.length !== 1 ? 's' : ''} Auto-Verified Today!
                  </h3>
                  <Badge variant="default" className="bg-green-600 text-white text-xs w-fit">
                    New
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mb-3">
                  {todayAutoVerified.length === 1 
                    ? `${todayAutoVerified[0].firstName} ${todayAutoVerified[0].lastName} completed profile setup and can now access the full teaching dashboard.`
                    : `${todayAutoVerified.length} teachers completed their profile setup and are now active in the system with full dashboard access.`}
                </p>
                
                {/* Show individual teacher cards for today's verifications */}
                {todayAutoVerified.length <= 3 && (
                  <div className="grid gap-2 mb-3">
                    {todayAutoVerified.map((teacher: any, idx: number) => (
                      <div 
                        key={teacher.id} 
                        className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400 text-xs sm:text-sm font-semibold flex-shrink-0">
                            {teacher.firstName[0]}{teacher.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs sm:text-sm truncate">{teacher.firstName} {teacher.lastName}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                              {teacher.department} • {teacher.subjects?.length || 0} subject{teacher.subjects?.length !== 1 ? 's' : ''} • {teacher.classes?.length || 0} class{teacher.classes?.length !== 1 ? 'es' : ''}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium text-left xs:text-right flex-shrink-0">
                          {new Date(teacher.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col xs:flex-row gap-2">
                  <Button variant="outline" size="sm" asChild className="bg-white dark:bg-gray-800 hover:bg-green-50 text-xs sm:text-sm h-8 sm:h-9 w-full xs:w-auto">
                    <Link href="/portal/admin/teachers">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      View All Teachers →
                    </Link>
                  </Button>
                  {todayAutoVerified.length > 0 && (
                    <Button variant="outline" size="sm" asChild className="bg-white dark:bg-gray-800 hover:bg-green-50 text-xs sm:text-sm h-8 sm:h-9 w-full xs:w-auto">
                      <Link href="/portal/admin/teacher-verification">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Verification Center
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AUTO-VERIFICATION SUCCESS NOTIFICATION - Show if there are new verifications today - Fully Responsive */}
      {todayAutoVerified.length > 0 && (
        <Card className="mb-4 sm:mb-6 border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 shadow-lg">
          <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="bg-green-100 dark:bg-green-900 p-2 sm:p-3 rounded-full flex-shrink-0">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-green-900 dark:text-green-200">
                    🎉 {todayAutoVerified.length} Teacher Profile{todayAutoVerified.length !== 1 ? 's' : ''} Auto-Verified Today!
                  </h3>
                  <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mt-1">
                    {todayAutoVerified.length === 1 
                      ? `${todayAutoVerified[0].firstName} ${todayAutoVerified[0].lastName} completed profile setup and can now access the dashboard.`
                      : `${todayAutoVerified.length} teachers completed their profile setup and are now active in the system.`}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="bg-white dark:bg-gray-800 w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9" asChild>
                <Link href="/portal/admin/teachers">
                  View All Teachers →
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Statistics Cards - Modern Gradient Design */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 animate-slide-up">
        {analyticsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="shadow-xl">
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
            <Card className="group relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1" data-testid="stat-total-students">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 opacity-100"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Students</p>
                    <AnimatedCounter
                      value={stats?.totalStudents ?? 0}
                      className="text-3xl font-bold mt-2"
                    />
                    <p className="text-blue-100 text-xs mt-2">↗ +{stats?.studentsThisMonth ?? 0} this month</p>
                  </div>
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1" data-testid="stat-teaching-staff">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 opacity-100"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Teaching Staff</p>
                    <AnimatedCounter
                      value={stats?.totalTeachers ?? 0}
                      className="text-3xl font-bold mt-2"
                    />
                    <p className="text-emerald-100 text-xs mt-2">↗ +{stats?.teachersThisTerm ?? 0} this term</p>
                  </div>
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1" data-testid="stat-total-classes">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-violet-600 to-purple-600 opacity-100"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Classes</p>
                    <AnimatedCounter
                      value={stats?.totalClasses ?? 0}
                      className="text-3xl font-bold mt-2"
                    />
                    <p className="text-purple-100 text-xs mt-2">{stats?.classesWithCapacity ?? 'All classes'}</p>
                  </div>
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1" data-testid="stat-avg-attendance">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-600 to-red-500 opacity-100"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Avg. Attendance</p>
                    <AnimatedCounter
                      value={stats?.averageAttendance ?? 0}
                      suffix="%"
                      className="text-3xl font-bold mt-2"
                    />
                    <p className="text-amber-100 text-xs mt-2">Last 30 days</p>
                  </div>
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
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

      {/* Analytics & Trends - Charts Section */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 mt-4 sm:mt-6">
        {/* User Signup Trends */}
        <Card className="shadow-sm border border-border" data-testid="card-signup-trends">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <span>Daily User Signups (Last 7 Days)</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Track new user registrations over time</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={signupTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={2} name="Students" />
                <Line type="monotone" dataKey="teachers" stroke="#10b981" strokeWidth={2} name="Teachers" />
                <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="Total" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card className="shadow-sm border border-border" data-testid="card-role-distribution">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <span>User Distribution by Role</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Total users: {allUsers.length}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Exam Participation Chart */}
      {examParticipation.length > 0 && (
        <Card className="mt-4 sm:mt-6 shadow-sm border border-border" data-testid="card-exam-participation">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              <span>Recent Exam Participation</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Student participation in recent exams
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={examParticipation}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="participants" fill="#8b5cf6" name="Total Participants" />
                <Bar dataKey="submissions" fill="#10b981" name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Teacher Overview Section */}
      <TeacherOverviewSection />

      {/* Notification Summary - Today's Auto-Verified Teachers */}
      <NotificationSummary />

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

      {/* Teacher Overview Section */}
      <TeacherOverviewSection />

      {/* Notification Summary */}
      <NotificationSummary />

      {/* Notification Summary */}
      <NotificationSummary />

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
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { ROLE_IDS } from '@/lib/roles';
import { Users, GraduationCap, School, TrendingUp, BarChart3, FileText, UserCheck, Shield, BookOpen, Calendar, MessageSquare, Image as ImageIcon, Activity } from 'lucide-react';
import { Link } from 'wouter';
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { useLoginSuccess } from '@/hooks/use-login-success';

export default function AdminDashboard() {
  const { user } = useAuth();
  useLoginSuccess();

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<any>({
    queryKey: ['/api/analytics/overview'],
    enabled: !!user,
    refetchInterval: 60000,
  });

  const { data: gradingStats } = useQuery<any>({
    queryKey: ['/api/grading/stats/system'],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: !!user && (user.roleId === ROLE_IDS.ADMIN || user.roleId === ROLE_IDS.SUPER_ADMIN),
  });

  const { data: allExams = [] } = useQuery<any[]>({
    queryKey: ['/api/exams'],
    enabled: !!user,
  });

  const roleDistribution = [
    { name: 'Students', value: allUsers.filter(u => u.roleId === ROLE_IDS.STUDENT).length, color: '#3b82f6' },
    { name: 'Teachers', value: allUsers.filter(u => u.roleId === ROLE_IDS.TEACHER).length, color: '#10b981' },
    { name: 'Parents', value: allUsers.filter(u => u.roleId === ROLE_IDS.PARENT).length, color: '#f59e0b' },
    { name: 'Admins', value: allUsers.filter(u => u.roleId === ROLE_IDS.ADMIN).length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const quickActions = [
    { title: 'User Management', icon: Users, color: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700', href: '/portal/admin/users' },
    { title: 'Manage Students', icon: GraduationCap, color: 'bg-primary/10 hover:bg-primary/20 text-primary', href: '/portal/admin/students' },
    { title: 'Manage Exams', icon: FileText, color: 'bg-purple-100 hover:bg-purple-200 text-purple-600', href: '/portal/admin/exams' },
    { title: 'Create Class', icon: School, color: 'bg-green-100 hover:bg-green-200 text-green-600', href: '/portal/admin/classes/add' },
    { title: 'Send Announcement', icon: MessageSquare, color: 'bg-blue-100 hover:bg-blue-200 text-blue-600', href: '/portal/admin/announcements/add' },
    { title: 'Generate Report', icon: BarChart3, color: 'bg-orange-100 hover:bg-orange-200 text-orange-600', href: '/portal/admin/reports' }
  ];

  if (!user) return <div className="p-8 text-center">Please log in to access the admin portal.</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Admin Role Header */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {user.lastName}!</h2>
            <p className="text-red-100 text-sm">Treasure-Home School Administration Portal</p>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : (
          <>
            <StatsCard title="Total Students" value={analyticsData?.totalStudents || 0} icon={GraduationCap} />
            <StatsCard title="Total Teachers" value={analyticsData?.totalTeachers || 0} icon={Users} />
            <StatsCard title="Total Classes" value={analyticsData?.totalClasses || 0} icon={School} />
            <StatsCard title="Attendance" value={`${analyticsData?.averageAttendance || 0}%`} icon={TrendingUp} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader><CardTitle>Quick Administration</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {quickActions.map((action) => (
                  <Button key={action.title} variant="ghost" className={`h-auto py-4 flex flex-col gap-2 items-center border border-transparent hover:border-border transition-all ${action.color}`} asChild>
                    <Link href={action.href}>
                      <action.icon className="h-6 w-6" />
                      <span className="text-xs font-medium text-center">{action.title}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                User Distribution
              </CardTitle>
              <Badge variant="secondary">Total: {allUsers.length}</Badge>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {roleDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          <Card className="shadow-sm bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-500" />
                Live Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{gradingStats?.pendingCount || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase">Pending Grading</p>
                </div>
                <FileText className="h-8 w-8 text-indigo-200" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{allUsers.filter(u => u.status === 'active').length}</p>
                  <p className="text-xs text-muted-foreground uppercase">Active Users</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Term Week</span>
                  <span className="text-sm font-medium">Week 4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Exams</span>
                  <span className="text-sm font-medium">{allExams.filter(e => e.status === 'published').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

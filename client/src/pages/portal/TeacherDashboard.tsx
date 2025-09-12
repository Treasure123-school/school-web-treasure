import PortalLayout from '@/components/layout/PortalLayout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, BookOpen, MessageSquare, ClipboardCheck } from 'lucide-react';
import { Link } from 'wouter';

export default function TeacherDashboard() {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in to access the teacher portal.</div>;
  }

  // Mock data for demo - in real app this would come from API
  const mockSchedule = [
    {
      subject: 'Mathematics',
      class: 'Primary 5A',
      room: 'Room 204',
      students: 30,
      time: '8:00 - 9:00 AM',
      status: 'upcoming',
      color: 'border-primary'
    },
    {
      subject: 'Mathematics',
      class: 'Primary 5B',
      room: 'Room 204',
      students: 28,
      time: '10:30 - 11:30 AM',
      status: 'completed',
      color: 'border-green-500'
    },
    {
      subject: 'Free Period',
      class: 'Staff lounge',
      room: '',
      students: 0,
      time: '12:00 - 1:00 PM',
      status: 'upcoming',
      color: 'border-gray-300'
    }
  ];

  const mockActivities = [
    {
      icon: 'fas fa-check',
      title: 'Attendance recorded for Primary 5A',
      description: '28/30 students present • 2 hours ago',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: 'fas fa-edit',
      title: 'Math quiz grades updated',
      description: 'Primary 5B Mathematics • 1 day ago',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: 'fas fa-bullhorn',
      title: 'Sent homework reminder',
      description: 'To Primary 5 parents • 2 days ago',
      color: 'bg-yellow-100 text-yellow-600'
    }
  ];

  const quickActions = [
    {
      title: 'Take Attendance',
      icon: 'fas fa-calendar-check',
      color: 'bg-primary/10 hover:bg-primary/20 text-primary',
      href: '/portal/teacher/attendance'
    },
    {
      title: 'Record Grades',
      icon: 'fas fa-edit',
      color: 'bg-secondary/10 hover:bg-secondary/20 text-secondary',
      href: '/portal/teacher/grades'
    },
    {
      title: 'Manage Exams',
      icon: 'fas fa-file-alt',
      color: 'bg-purple-100 hover:bg-purple-200 text-purple-600',
      href: '/portal/teacher/exams'
    },
    {
      title: 'Send Announcement',
      icon: 'fas fa-bullhorn',
      color: 'bg-green-100 hover:bg-green-200 text-green-600',
      href: '/portal/teacher/announcements'
    },
    {
      title: 'View Reports',
      icon: 'fas fa-chart-bar',
      color: 'bg-blue-100 hover:bg-blue-200 text-blue-600',
      href: '/portal/teacher/reports'
    }
  ];

  return (
    <PortalLayout 
      userRole="teacher" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      {/* Header Actions */}
      <div className="flex justify-end mb-6">
        <Button className="bg-primary text-primary-foreground" asChild>
          <Link href="/portal/teacher/attendance" data-testid="button-take-attendance">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Take Attendance
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total Students"
          value="120"
          icon={Users}
          color="primary"
        />
        <StatsCard
          title="Classes"
          value="4"
          icon={BookOpen}
          color="secondary"
        />
        <StatsCard
          title="Avg. Attendance"
          value="92%"
          icon={Calendar}
          color="green"
          change="↗ +3% this week"
          changeType="positive"
        />
        <StatsCard
          title="Pending Grades"
          value="8"
          icon={MessageSquare}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border border-border" data-testid="card-schedule">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Today's Schedule</span>
                </CardTitle>
                <span className="text-sm text-muted-foreground">Monday, Dec 11</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSchedule.map((schedule, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-4 bg-muted/50 rounded-lg border-l-4 ${schedule.color}`}
                    data-testid={`schedule-item-${index}`}
                  >
                    <div>
                      <h3 className="font-medium" data-testid={`text-schedule-subject-${index}`}>
                        {schedule.subject} - {schedule.class}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid={`text-schedule-details-${index}`}>
                        {schedule.room} {schedule.students > 0 && `• ${schedule.students} students`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium" data-testid={`text-schedule-time-${index}`}>
                        {schedule.time}
                      </p>
                      {schedule.status === 'completed' ? (
                        <span className="text-green-600 text-sm" data-testid={`text-schedule-status-${index}`}>
                          ✓ Completed
                        </span>
                      ) : (
                        <Button variant="outline" size="sm" data-testid={`button-schedule-action-${index}`}>
                          {schedule.subject === 'Free Period' ? 'Free' : 'Take Attendance'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
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
              {quickActions.map((action, index) => (
                <Button 
                  key={index}
                  variant="ghost"
                  className={`w-full justify-start h-auto p-3 ${action.color} transition-colors`}
                  asChild
                >
                  <Link href={action.href} data-testid={`button-action-${index}`}>
                    <i className={`${action.icon} mr-3`}></i>
                    <span className="text-sm font-medium">{action.title}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-6 shadow-sm border border-border" data-testid="card-recent-activity">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <i className="fas fa-history"></i>
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockActivities.map((activity, index) => (
              <div 
                key={index}
                className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg"
                data-testid={`activity-item-${index}`}
              >
                <div className={`p-2 rounded-lg ${activity.color}`}>
                  <i className={activity.icon}></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" data-testid={`text-activity-title-${index}`}>
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`text-activity-description-${index}`}>
                    {activity.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Class Performance Overview */}
      <Card className="mt-6 shadow-sm border border-border" data-testid="card-class-performance">
        <CardHeader>
          <CardTitle>Class Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Primary 5A</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Score</span>
                  <span className="font-medium text-primary">85%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Attendance Rate</span>
                  <span className="font-medium text-green-600">93%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Students</span>
                  <span className="font-medium">30</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Primary 5B</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Score</span>
                  <span className="font-medium text-primary">82%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Attendance Rate</span>
                  <span className="font-medium text-green-600">91%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Students</span>
                  <span className="font-medium">28</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

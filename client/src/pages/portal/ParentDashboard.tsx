import PortalLayout from '@/components/layout/PortalLayout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, BookOpen, MessageSquare, TrendingUp, Heart } from 'lucide-react';
import { Link } from 'wouter';

export default function ParentDashboard() {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in to access the parent portal.</div>;
  }

  // Mock data for demo - in real app this would come from API
  const mockChildren = [
    {
      id: 1,
      name: 'John Smith',
      class: 'Primary 5A',
      admissionNumber: 'THS/2023/045',
      currentGPA: '3.85',
      attendance: '95%',
      lastAttendance: 'Present',
      initials: 'JS',
      color: 'bg-primary'
    },
    {
      id: 2,
      name: 'Jane Smith',
      class: 'JSS 2',
      admissionNumber: 'THS/2021/032',
      currentGPA: '3.92',
      attendance: '97%',
      lastAttendance: 'Present',
      initials: 'JS',
      color: 'bg-secondary'
    }
  ];

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

  // Calculate overall stats from children
  const totalAttendance = mockChildren.reduce((sum, child) => sum + parseInt(child.attendance), 0) / mockChildren.length;
  const avgGPA = mockChildren.reduce((sum, child) => sum + parseFloat(child.currentGPA), 0) / mockChildren.length;

  return (
    <PortalLayout 
      userRole="parent" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="My Children"
          value={mockChildren.length}
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

      {/* Children Overview */}
      <Card className="shadow-sm border border-border mb-6" data-testid="card-children-overview">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>My Children</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockChildren.map((child, index) => (
              <div 
                key={child.id}
                className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                data-testid={`child-card-${index}`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-12 h-12 ${child.color} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-medium">{child.initials}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold" data-testid={`text-child-name-${index}`}>
                      {child.name}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid={`text-child-class-${index}`}>
                      {child.class} • {child.admissionNumber}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">GPA</p>
                    <p className="font-semibold text-primary" data-testid={`text-child-gpa-${index}`}>
                      {child.currentGPA}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Attendance</p>
                    <p className="font-semibold text-green-600" data-testid={`text-child-attendance-${index}`}>
                      {child.attendance}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Today</p>
                    <p className="font-semibold text-green-600" data-testid={`text-child-today-${index}`}>
                      {child.lastAttendance}
                    </p>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <Card className="shadow-sm border border-border" data-testid="card-recent-grades">
          <CardHeader>
            <div className="flex items-center justify-between">
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
              {mockRecentGrades.map((grade, index) => (
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
              ))}
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
    </PortalLayout>
  );
}

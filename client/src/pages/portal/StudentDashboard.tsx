import PortalLayout from '@/components/layout/PortalLayout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Calendar, Trophy, MessageSquare, BookOpen } from 'lucide-react';
import { Link } from 'wouter';

export default function StudentDashboard() {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in to access the student portal.</div>;
  }

  // Mock data for demo - in real app this would come from API
  const mockGrades = [
    {
      subject: 'Mathematics',
      assessment: 'Mid-term Exam',
      score: '85/100',
      grade: 'A',
      color: 'border-primary'
    },
    {
      subject: 'English Language',
      assessment: 'Essay Assignment',
      score: '78/100',
      grade: 'B+',
      color: 'border-secondary'
    },
    {
      subject: 'Basic Science',
      assessment: 'Lab Report',
      score: '92/100',
      grade: 'A+',
      color: 'border-green-500'
    }
  ];

  const mockAnnouncements = [
    {
      id: 1,
      title: 'Parent-Teacher Conference',
      content: 'Scheduled for December 15th. Please ensure your parents register...',
      publishedAt: '2 hours ago',
      color: 'border-primary'
    },
    {
      id: 2,
      title: 'Inter-house Sports',
      content: 'Registration is now open for the annual inter-house sports...',
      publishedAt: '1 day ago',
      color: 'border-secondary'
    },
    {
      id: 3,
      title: 'Exam Timetable Released',
      content: 'End of term examination timetable is now available...',
      publishedAt: '3 days ago',
      color: 'border-green-500'
    }
  ];

  const mockAttendance = [
    { day: 'Mon', status: 'present' },
    { day: 'Tue', status: 'present' },
    { day: 'Wed', status: 'absent' },
    { day: 'Thu', status: 'present' },
    { day: 'Fri', status: 'late' },
    { day: 'Sat', status: null },
    { day: 'Sun', status: null }
  ];

  const getAttendanceIcon = (status: string | null) => {
    switch (status) {
      case 'present':
        return <i className="fas fa-check text-white text-xs"></i>;
      case 'absent':
        return <i className="fas fa-times text-white text-xs"></i>;
      case 'late':
        return <i className="fas fa-clock text-white text-xs"></i>;
      default:
        return null;
    }
  };

  const getAttendanceColor = (status: string | null) => {
    switch (status) {
      case 'present':
        return 'bg-green-500';
      case 'absent':
        return 'bg-red-500';
      case 'late':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <PortalLayout 
      userRole="student" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Current GPA"
          value="3.85"
          icon={TrendingUp}
          color="primary"
        />
        <StatsCard
          title="Attendance"
          value="95%"
          icon={Calendar}
          color="green"
          change="↗ +2% this week"
          changeType="positive"
        />
        <StatsCard
          title="Class Rank"
          value="5th"
          icon={Trophy}
          color="secondary"
        />
        <StatsCard
          title="Messages"
          value="3"
          icon={MessageSquare}
          color="blue"
        />
      </div>

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
                <Link href="/portal/student/grades" data-testid="link-view-all-grades">
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockGrades.map((grade, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-3 bg-muted/50 rounded-lg border-l-4 ${grade.color}`}
                  data-testid={`grade-item-${index}`}
                >
                  <div>
                    <p className="font-medium" data-testid={`text-grade-subject-${index}`}>
                      {grade.subject}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-grade-assessment-${index}`}>
                      {grade.assessment}
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
                <span>Latest Announcements</span>
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/portal/student/announcements" data-testid="link-view-all-announcements">
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

      {/* Attendance Chart */}
      <Card className="mt-6 shadow-sm border border-border" data-testid="card-attendance">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>This Week's Attendance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {mockAttendance.map((day, index) => (
              <div key={index} className="text-center" data-testid={`attendance-day-${index}`}>
                <p className="text-xs text-muted-foreground mb-2">{day.day}</p>
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${getAttendanceColor(day.status)}`}>
                  {getAttendanceIcon(day.status)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="bg-green-500 w-3 h-3 rounded-full"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-red-500 w-3 h-3 rounded-full"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-yellow-500 w-3 h-3 rounded-full"></div>
              <span>Late</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="mt-6 shadow-sm border border-border" data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
              <Link href="/portal/student/grades" data-testid="button-view-grades">
                <BookOpen className="h-6 w-6" />
                <span className="text-sm">View Grades</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
              <Link href="/portal/student/attendance" data-testid="button-check-attendance">
                <Calendar className="h-6 w-6" />
                <span className="text-sm">Check Attendance</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
              <Link href="/portal/student/messages" data-testid="button-messages">
                <MessageSquare className="h-6 w-6" />
                <span className="text-sm">Messages</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
              <Link href="/portal/student/profile" data-testid="button-profile">
                <i className="fas fa-user text-xl"></i>
                <span className="text-sm">Profile</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}

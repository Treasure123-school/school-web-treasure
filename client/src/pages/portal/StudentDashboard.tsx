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

  // Fetch real data from API
  const { data: examResults, isLoading: isLoadingGrades } = useQuery({
    queryKey: ['examResults', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/exam-results/${user.id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch exam results');
      return response.json();
    }
  });

  const { data: announcements, isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ['announcements', 'Student'],
    queryFn: async () => {
      const response = await fetch('/api/announcements?role=Student', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch announcements');
      return response.json();
    }
  });

  const { data: attendance, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['attendance', user.id],
    queryFn: async () => {
      const response = await fetch(`/api/attendance/${user.id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    }
  });

  // Calculate grade based on score
  const calculateGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    return 'F';
  };

  // Format exam results for display
  const formattedGrades = examResults?.map((result: any, index: number) => ({
    subject: result.subjectName || result.subject,
    assessment: result.examType || result.assessment || 'Assessment',
    score: `${result.score || result.marks}/${result.maxScore || result.totalMarks || 100}`,
    grade: result.grade || calculateGrade(result.score || result.marks),
    color: ['border-primary', 'border-secondary', 'border-green-500'][index % 3]
  })) || [];

  // Format announcements for display
  const formattedAnnouncements = announcements?.map((announcement: any, index: number) => ({
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    publishedAt: new Date(announcement.createdAt || announcement.publishedAt).toLocaleDateString(),
    color: ['border-primary', 'border-secondary', 'border-green-500'][index % 3]
  })) || [];

  // Format attendance for weekly view
  const formatAttendanceWeekly = (attendanceData: any[]) => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return daysOfWeek.map(day => {
      const attendanceRecord = attendanceData?.find(record => 
        new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' }) === day
      );
      return {
        day,
        status: attendanceRecord ? attendanceRecord.status : null
      };
    });
  };

  const formattedAttendance = formatAttendanceWeekly(attendance || []);

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
              {isLoadingGrades ? (
                <div className="text-center py-4">Loading grades...</div>
              ) : formattedGrades.length > 0 ? (
                formattedGrades.map((grade, index) => (
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
              ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">No grades available</div>
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
              {isLoadingAnnouncements ? (
                <div className="text-center py-4">Loading announcements...</div>
              ) : formattedAnnouncements.length > 0 ? (
                formattedAnnouncements.map((announcement, index) => (
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
              ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">No announcements yet</div>
              )}
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
            {isLoadingAttendance ? (
              <div className="col-span-7 text-center py-4">Loading attendance...</div>
            ) : (
              formattedAttendance.map((day, index) => (
                <div key={index} className="text-center" data-testid={`attendance-day-${index}`}>
                  <p className="text-xs text-muted-foreground mb-2">{day.day}</p>
                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${getAttendanceColor(day.status)}`}>
                    {getAttendanceIcon(day.status)}
                  </div>
                </div>
              ))
            )}
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

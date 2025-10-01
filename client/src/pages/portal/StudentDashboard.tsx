import PortalLayout from '@/components/layout/PortalLayout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Calendar, Trophy, MessageSquare, BookOpen, ClipboardList, Star, FileText, Play } from 'lucide-react';
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
    queryKey: ['/api/student/attendance'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/attendance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    }
  });

  // Fetch upcoming exams
  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await fetch('/api/exams', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch exams');
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Professional Welcome Banner */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome back, {user.firstName}! 🎓</h2>
                <p className="text-blue-100">Ready to continue your learning journey?</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{formattedGrades.length}</div>
                <div className="text-sm text-blue-100">Completed Assessments</div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                formattedGrades.map((grade: any, index: number) => (
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
                formattedAnnouncements.map((announcement: any, index: number) => (
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

      {/* Performance Analytics */}
      <Card className="mt-6 shadow-sm border border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Academic Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formattedGrades.filter((g: any) => g.grade === 'A' || g.grade === 'A+').length}
              </div>
              <div className="text-sm text-green-700">A Grades</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formattedGrades.length > 0 ? 
                  Math.round(formattedGrades.reduce((sum: number, g: any) => sum + parseInt(g.score.split('/')[0]), 0) / formattedGrades.length) : 0}%
              </div>
              <div className="text-sm text-blue-700">Average Score</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(formattedGrades.reduce((acc: any, g: any) => ({ ...acc, [g.subject]: true }), {})).length}
              </div>
              <div className="text-sm text-purple-700">Subjects</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Exams and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-6">
        {/* Upcoming Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="w-5 h-5 mr-2" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingExams ? (
              <div className="text-center py-6">Loading exams...</div>
            ) : exams.filter(exam => exam.isPublished && !exam.isCompleted).length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No upcoming exams scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exams.filter(exam => exam.isPublished && !exam.isCompleted).slice(0, 3).map((exam: any) => (
                  <div key={exam.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{exam.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(exam.date).toLocaleDateString()} • {exam.timeLimit} minutes
                      </p>
                    </div>
                    <Link to="/portal/student/exams">
                      <Button size="sm">
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    </Link>
                  </div>
                ))}
                {exams.filter(exam => exam.isPublished && !exam.isCompleted).length > 3 && (
                  <Link to="/portal/student/exams">
                    <Button variant="outline" className="w-full">
                      View All Exams
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/portal/student/exams">
              <Button className="w-full justify-start">
                <ClipboardList className="w-4 h-4 mr-2" />
                Take Exams
              </Button>
            </Link>
            <Link to="/portal/student/grades">
              <Button variant="outline" className="w-full justify-start">
                <Star className="w-4 h-4 mr-2" />
                View Grades
              </Button>
            </Link>
            <Link to="/portal/student/report-card">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Report Card
              </Button>
            </Link>
            <Link to="/portal/student/study-resources">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="w-4 h-4 mr-2" />
                Study Resources
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
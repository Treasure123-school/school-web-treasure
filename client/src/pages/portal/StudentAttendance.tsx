import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Calendar, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { Link } from 'wouter';
import { useState } from 'react';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  if (!user) {
    return <div>Please log in to access your attendance.</div>;
  }

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['/api/student/attendance', selectedMonth, selectedYear],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/attendance?month=${selectedMonth}&year=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    }
  });

  // Calculate attendance statistics
  const attendanceStats = attendance?.reduce((stats: any, record: any) => {
    stats.total++;
    switch (record.status) {
      case 'present':
        stats.present++;
        break;
      case 'absent':
        stats.absent++;
        break;
      case 'late':
        stats.late++;
        break;
    }
    return stats;
  }, { total: 0, present: 0, absent: 0, late: 0 }) || { total: 0, present: 0, absent: 0, late: 0 };

  const attendancePercentage = attendanceStats.total > 0 
    ? ((attendanceStats.present + attendanceStats.late) / attendanceStats.total * 100).toFixed(1)
    : 0;

  // Get attendance icon and color
  const getAttendanceDisplay = (status: string) => {
    switch (status) {
      case 'present':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          color: 'text-green-600 bg-green-50',
          label: 'Present'
        };
      case 'absent':
        return {
          icon: <XCircle className="h-5 w-5" />,
          color: 'text-red-600 bg-red-50',
          label: 'Absent'
        };
      case 'late':
        return {
          icon: <Clock className="h-5 w-5" />,
          color: 'text-yellow-600 bg-yellow-50',
          label: 'Late'
        };
      default:
        return {
          icon: <Calendar className="h-5 w-5" />,
          color: 'text-gray-600 bg-gray-50',
          label: 'No Record'
        };
    }
  };

  // Generate calendar view
  const generateCalendar = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendar = [];
    const today = new Date();

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedYear, selectedMonth, day);
      const dateString = currentDate.toISOString().split('T')[0];
      const attendanceRecord = attendance?.find((record: any) => 
        new Date(record.date).toISOString().split('T')[0] === dateString
      );

      const display = getAttendanceDisplay(attendanceRecord?.status);
      const isToday = currentDate.toDateString() === today.toDateString();
      const isFuture = currentDate > today;

      calendar.push(
        <div 
          key={day} 
          className={`p-2 border rounded-lg ${isToday ? 'ring-2 ring-primary' : ''} ${isFuture ? 'bg-gray-50' : 'bg-white'}`}
        >
          <div className="text-sm font-medium mb-1">{day}</div>
          {!isFuture && (
            <div className={`flex items-center justify-center p-1 rounded ${display.color}`}>
              {display.icon}
            </div>
          )}
        </div>
      );
    }

    return calendar;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <PortalLayout 
      userRole="student" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
            <p className="text-muted-foreground">
              Track your school attendance and view your attendance history
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Month/Year Selector */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => {
              if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
          >
            Previous
          </Button>
          <h2 className="text-xl font-semibold">
            {monthNames[selectedMonth]} {selectedYear}
          </h2>
          <Button 
            variant="outline"
            onClick={() => {
              if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
          >
            Next
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Present</p>
                  <p className="text-2xl font-bold">{attendanceStats.present}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Absent</p>
                  <p className="text-2xl font-bold">{attendanceStats.absent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Late</p>
                  <p className="text-2xl font-bold">{attendanceStats.late}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">{attendancePercentage}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Attendance Calendar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading attendance data...</div>
            ) : (
              <>
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-medium text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {generateCalendar()}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center space-x-6 mt-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <span>Present</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-100 rounded flex items-center justify-center">
                      <XCircle className="h-3 w-3 text-red-600" />
                    </div>
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-100 rounded flex items-center justify-center">
                      <Clock className="h-3 w-3 text-yellow-600" />
                    </div>
                    <span>Late</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Attendance */}
        {attendance && attendance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendance.slice(0, 10).map((record: any, index: number) => {
                  const display = getAttendanceDisplay(record.status);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${display.color}`}>
                          {display.icon}
                        </div>
                        <div>
                          <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">{display.label}</p>
                        </div>
                      </div>
                      {record.remarks && (
                        <p className="text-sm text-muted-foreground">{record.remarks}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Data State */}
        {!isLoading && (!attendance || attendance.length === 0) && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No attendance records</h3>
                <p className="text-muted-foreground mb-4">
                  Attendance records for {monthNames[selectedMonth]} {selectedYear} will appear here.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/portal/student">
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
}
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { Calendar, CheckCircle, XCircle, Clock, ArrowLeft, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { useState } from 'react';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  if (!user) {
    return <div>Please log in to access your attendance.</div>;
  }

  const { data: attendance = [], isLoading, error } = useQuery({
    queryKey: ['student-attendance', user.id, selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/student/attendance?month=${selectedMonth}&year=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    }
  });

  const getRoleName = (roleId: number): 'admin' | 'teacher' | 'parent' | 'student' => {
    const roleMap: { [key: number]: 'admin' | 'teacher' | 'parent' | 'student' } = {
      1: 'admin', 2: 'teacher', 3: 'student', 4: 'parent'
    };
    return roleMap[roleId] || 'student';
  };

  const getAttendanceIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <div className="h-5 w-5 bg-gray-300 rounded-full"></div>;
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'absent':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'late':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  // Calculate statistics
  const totalDays = attendance.length;
  const presentDays = attendance.filter((a: any) => a.status?.toLowerCase() === 'present').length;
  const absentDays = attendance.filter((a: any) => a.status?.toLowerCase() === 'absent').length;
  const lateDays = attendance.filter((a: any) => a.status?.toLowerCase() === 'late').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Group attendance by week
  const groupByWeek = (records: any[]) => {
    const weeks: any[][] = [];
    const sortedRecords = records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let currentWeek: any[] = [];
    let currentWeekStart = -1;

    sortedRecords.forEach(record => {
      const date = new Date(record.date);
      const weekStart = date.getDate() - date.getDay();
      
      if (weekStart !== currentWeekStart) {
        if (currentWeek.length > 0) {
          weeks.push(currentWeek);
        }
        currentWeek = [];
        currentWeekStart = weekStart;
      }
      
      currentWeek.push(record);
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const weeks = groupByWeek(attendance);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <PortalLayout 
      userRole={getRoleName(user.roleId)}
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/portal/student">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
              <p className="text-muted-foreground">
                Track your daily attendance and punctuality
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="p-2 border rounded"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="p-2 border rounded"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{attendanceRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Present Days</p>
                  <p className="text-2xl font-bold text-green-600">{presentDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Absent Days</p>
                  <p className="text-2xl font-bold text-red-600">{absentDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Late Days</p>
                  <p className="text-2xl font-bold text-yellow-600">{lateDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading attendance records...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-red-800">Unable to Load Attendance</h3>
                <p className="text-red-600 mb-4">
                  There was an issue loading your attendance records. Please try again later.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Calendar */}
        {!isLoading && !error && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Attendance Calendar - {months[selectedMonth]} {selectedYear}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.length > 0 ? (
                <div className="space-y-6">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Week {weekIndex + 1}
                      </h4>
                      <div className="grid grid-cols-7 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                            {day}
                          </div>
                        ))}
                        {week.map((record, index) => {
                          const date = new Date(record.date);
                          return (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border text-center ${getAttendanceColor(record.status)}`}
                            >
                              <div className="flex flex-col items-center space-y-1">
                                <div className="text-sm font-medium">{date.getDate()}</div>
                                {getAttendanceIcon(record.status)}
                                <div className="text-xs capitalize">{record.status}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No attendance records</h3>
                  <p className="text-muted-foreground">
                    No attendance records found for {months[selectedMonth]} {selectedYear}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Present</span>
              </div>
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm">Absent</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="text-sm">Late</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-gray-300 rounded-full"></div>
                <span className="text-sm">No Record</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  Download, 
  FileText, 
  Calendar,
  School,
  UserCheck
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportsManagement() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<string>('overview');
  const [dateRange, setDateRange] = useState<string>('30');

  // Fetch overview statistics
  const { data: overviewStats, isLoading: loadingOverview } = useQuery({
    queryKey: ['/api/reports/overview'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/reports/overview');
      return await response.json();
    },
  });

  // Fetch users data for demographics
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return await response.json();
    },
  });

  // Fetch classes data
  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/classes');
      return await response.json();
    },
  });

  // Fetch subjects data
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subjects');
      return await response.json();
    },
  });

  // Process data for charts
  const getUsersByRole = () => {
    const roleCounts = users.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(roleCounts).map(([role, count]) => ({
      name: role,
      value: count,
    }));
  };

  const getClassesData = () => {
    return classes.map((cls: any) => ({
      name: cls.name,
      capacity: cls.capacity || 0,
      level: cls.level || 'N/A',
    }));
  };

  const getMonthlyTrend = () => {
    // Mock data for monthly trend - in real app, this would come from API
    return [
      { month: 'Jan', students: 120, teachers: 15, classes: 12 },
      { month: 'Feb', students: 125, teachers: 16, classes: 12 },
      { month: 'Mar', students: 130, teachers: 16, classes: 13 },
      { month: 'Apr', students: 135, teachers: 17, classes: 13 },
      { month: 'May', students: 140, teachers: 18, classes: 14 },
      { month: 'Jun', students: 145, teachers: 18, classes: 14 },
    ];
  };

  const handleExport = (format: string) => {
    toast({
      title: "Export Started",
      description: `Generating ${format.toUpperCase()} report...`,
    });
    
    // In a real app, this would trigger a download
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `${format.toUpperCase()} report has been generated.`,
      });
    }, 2000);
  };

  const overviewData = [
    {
      title: "Total Students",
      value: users.filter((u: any) => u.role === 'Student').length,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Teachers", 
      value: users.filter((u: any) => u.role === 'Teacher').length,
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Classes",
      value: classes.length,
      icon: School,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Subjects",
      value: subjects.length,
      icon: BookOpen,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6" data-testid="reports-management">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => handleExport('pdf')}
            data-testid="button-export-pdf"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport('csv')}
            data-testid="button-export-csv"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <Card>
        <CardContent className="py-4">
          <div className="flex space-x-4 items-center">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger className="w-48" data-testid="select-report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview Dashboard</SelectItem>
                  <SelectItem value="students">Student Analytics</SelectItem>
                  <SelectItem value="teachers">Teacher Analytics</SelectItem>
                  <SelectItem value="classes">Class Analytics</SelectItem>
                  <SelectItem value="attendance">Attendance Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32" data-testid="select-date-range">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedReport === 'overview' && (
        <>
          {/* Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {overviewData.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} data-testid={`card-stat-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold" data-testid={`text-stat-value-${index}`}>
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Users by Role Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Users by Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getUsersByRole()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getUsersByRole().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Trend Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Monthly Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getMonthlyTrend()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="students" stroke="#8884d8" name="Students" />
                    <Line type="monotone" dataKey="teachers" stroke="#82ca9d" name="Teachers" />
                    <Line type="monotone" dataKey="classes" stroke="#ffc658" name="Classes" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Classes Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <School className="w-5 h-5 mr-2" />
                  Classes Overview
                </span>
                <Badge variant="secondary" data-testid="text-total-classes">
                  Total: {classes.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getClassesData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="capacity" fill="#8884d8" name="Capacity" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {selectedReport === 'students' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Student Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.filter((u: any) => u.role === 'Student').map((student: any) => (
                  <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                    <TableCell>
                      <div className="font-medium" data-testid={`text-student-name-${student.id}`}>
                        {student.firstName} {student.lastName}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-student-email-${student.id}`}>
                      {student.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">Active</Badge>
                    </TableCell>
                    <TableCell>
                      {student.createdAt ? 
                        new Date(student.createdAt).toLocaleDateString() : 
                        'Unknown'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedReport === 'teachers' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="w-5 h-5 mr-2" />
              Teacher Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.filter((u: any) => u.role === 'Teacher').map((teacher: any) => (
                  <TableRow key={teacher.id} data-testid={`row-teacher-${teacher.id}`}>
                    <TableCell>
                      <div className="font-medium" data-testid={`text-teacher-name-${teacher.id}`}>
                        {teacher.firstName} {teacher.lastName}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-teacher-email-${teacher.id}`}>
                      {teacher.email}
                    </TableCell>
                    <TableCell>
                      {teacher.department || 'Not specified'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">Active</Badge>
                    </TableCell>
                    <TableCell>
                      {teacher.createdAt ? 
                        new Date(teacher.createdAt).toLocaleDateString() : 
                        'Unknown'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedReport === 'classes' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <School className="w-5 h-5 mr-2" />
              Class Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Class Teacher</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls: any) => {
                  const teacher = users.find((u: any) => u.id === cls.classTeacherId);
                  return (
                    <TableRow key={cls.id} data-testid={`row-class-${cls.id}`}>
                      <TableCell>
                        <div className="font-medium" data-testid={`text-class-name-${cls.id}`}>
                          {cls.name}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-class-level-${cls.id}`}>
                        {cls.level || 'Not specified'}
                      </TableCell>
                      <TableCell data-testid={`text-class-capacity-${cls.id}`}>
                        {cls.capacity || 0}
                      </TableCell>
                      <TableCell>
                        {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Not assigned'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedReport === 'attendance' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="w-5 h-5 mr-2" />
              Attendance Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <UserCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Attendance Reports Coming Soon</h3>
              <p className="text-muted-foreground">
                Detailed attendance analytics and reports will be available once attendance tracking is fully implemented.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
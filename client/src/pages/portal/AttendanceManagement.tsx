import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Check, X, Clock, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import PortalLayout from '@/components/layout/PortalLayout';
import { useAuth } from '@/lib/auth';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export default function AttendanceManagement() {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/classes');
      return await response.json();
    },
  });

  // Fetch students for selected class
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['/api/students', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const response = await apiRequest('GET', `/api/students?classId=${selectedClass}`);
      return await response.json();
    },
    enabled: !!selectedClass,
  });

  // Fetch users to get student details
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return await response.json();
    },
  });

  // Fetch existing attendance for the selected date and class
  const { data: existingAttendance = [] } = useQuery({
    queryKey: ['/api/attendance', selectedClass, selectedDate],
    queryFn: async () => {
      if (!selectedClass || !selectedDate) return [];
      const response = await apiRequest('GET', `/api/attendance/class/${selectedClass}?date=${selectedDate}`);
      return await response.json();
    },
    enabled: !!selectedClass && !!selectedDate,
  });

  // Submit attendance mutation
  const submitAttendanceMutation = useMutation({
    mutationFn: async () => {
      const records = Object.values(attendanceRecords);
      if (records.length === 0) {
        throw new Error('No attendance records to submit');
      }

      // Submit each attendance record
      for (const record of records) {
        await apiRequest('POST', '/api/attendance', {
          studentId: record.studentId,
          classId: parseInt(selectedClass),
          termId: 1, // Current term
          date: selectedDate,
          status: record.status,
          remarks: record.remarks || null,
          recordedBy: '2', // Teacher user ID - in real app would come from auth context
        });
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Attendance recorded successfully',
      });
      setAttendanceRecords({});
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to record attendance',
        variant: 'destructive',
      });
    },
  });

  // Get student details with user info
  const enrichedStudents = students.map((student: any) => {
    const user = users.find((u: any) => u.id === student.id);
    const existingRecord = existingAttendance.find((a: any) => a.studentId === student.id);
    
    return {
      ...student,
      user,
      existingAttendance: existingRecord,
    };
  });

  const updateAttendance = (studentId: string, status: AttendanceStatus, remarks?: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        studentId,
        status,
        remarks,
      },
    }));
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'excused':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <Check className="h-4 w-4" />;
      case 'absent':
        return <X className="h-4 w-4" />;
      case 'late':
        return <Clock className="h-4 w-4" />;
      case 'excused':
        return <UserCheck className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const markAllPresent = () => {
    const records: Record<string, AttendanceRecord> = {};
    enrichedStudents.forEach((student: any) => {
      if (!student.existingAttendance) {
        records[student.id] = {
          studentId: student.id,
          status: 'present',
        };
      }
    });
    setAttendanceRecords(records);
  };

  const hasUnsavedChanges = Object.keys(attendanceRecords).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Attendance Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Record daily attendance for your classes</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">{format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}</span>
        </div>
      </div>

      {/* Class and Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class and Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="select-class">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name} ({cls.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="input-date"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={markAllPresent}
                disabled={!selectedClass || loadingStudents}
                variant="outline"
                data-testid="button-mark-all-present"
              >
                Mark All Present
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      {selectedClass && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Student Attendance - {classes.find((c: any) => c.id.toString() === selectedClass)?.name}
              </CardTitle>
              {hasUnsavedChanges && (
                <Button 
                  onClick={() => submitAttendanceMutation.mutate()}
                  disabled={submitAttendanceMutation.isPending}
                  data-testid="button-save-attendance"
                >
                  {submitAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="text-center py-8">Loading students...</div>
            ) : enrichedStudents.length === 0 ? (
              <div className="text-center py-8">No students found in this class</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Admission Number</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead>Mark Attendance</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedStudents.map((student: any) => {
                    const currentRecord = attendanceRecords[student.id];
                    const finalStatus = currentRecord?.status || student.existingAttendance?.status;
                    const isAlreadyRecorded = !!student.existingAttendance;

                    return (
                      <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {student.user?.firstName} {student.user?.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {student.user?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {student.admissionNumber}
                        </TableCell>
                        <TableCell>
                          {finalStatus && (
                            <Badge className={getStatusColor(finalStatus)}>
                              <span className="flex items-center space-x-1">
                                {getStatusIcon(finalStatus)}
                                <span className="capitalize">{finalStatus}</span>
                              </span>
                            </Badge>
                          )}
                          {isAlreadyRecorded && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Already recorded
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant={currentRecord?.status === 'present' ? 'default' : 'outline'}
                              onClick={() => updateAttendance(student.id, 'present')}
                              disabled={isAlreadyRecorded}
                              data-testid={`button-present-${student.id}`}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={currentRecord?.status === 'absent' ? 'destructive' : 'outline'}
                              onClick={() => updateAttendance(student.id, 'absent')}
                              disabled={isAlreadyRecorded}
                              data-testid={`button-absent-${student.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={currentRecord?.status === 'late' ? 'secondary' : 'outline'}
                              onClick={() => updateAttendance(student.id, 'late')}
                              disabled={isAlreadyRecorded}
                              data-testid={`button-late-${student.id}`}
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={currentRecord?.status === 'excused' ? 'secondary' : 'outline'}
                              onClick={() => updateAttendance(student.id, 'excused')}
                              disabled={isAlreadyRecorded}
                              data-testid={`button-excused-${student.id}`}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <input
                            type="text"
                            placeholder="Optional remarks..."
                            value={currentRecord?.remarks || ''}
                            onChange={(e) => updateAttendance(student.id, currentRecord?.status || 'present', e.target.value)}
                            disabled={isAlreadyRecorded}
                            className="w-full px-2 py-1 text-sm border border-input rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            data-testid={`input-remarks-${student.id}`}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {selectedClass && enrichedStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {enrichedStudents.filter((s: any) => {
                    const record = attendanceRecords[s.id] || s.existingAttendance;
                    return record?.status === 'present';
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {enrichedStudents.filter((s: any) => {
                    const record = attendanceRecords[s.id] || s.existingAttendance;
                    return record?.status === 'absent';
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Absent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {enrichedStudents.filter((s: any) => {
                    const record = attendanceRecords[s.id] || s.existingAttendance;
                    return record?.status === 'late';
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Late</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {enrichedStudents.filter((s: any) => {
                    const record = attendanceRecords[s.id] || s.existingAttendance;
                    return record?.status === 'excused';
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Excused</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
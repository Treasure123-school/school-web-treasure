import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createStudentSchema, type CreateStudentRequest } from '@shared/schema';
import { UserPlus, Edit, Search, Download, Trash2, Shield, ShieldOff, Upload, FileText, Key, AlertTriangle, AlertCircle } from 'lucide-react';
import PortalLayout from '@/components/layout/PortalLayout';
import { useAuth } from '@/lib/auth';

// Use shared schema to prevent frontend/backend drift
type StudentForm = CreateStudentRequest;

export default function StudentManagement() {
  const { toast } = useToast();
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in to access this page.</div>;
  }
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadedStudents, setUploadedStudents] = useState<any[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<StudentForm>({
    resolver: zodResolver(createStudentSchema),
  });

  // Edit form
  const { register: registerEdit, handleSubmit: handleEditSubmit, formState: { errors: editErrors }, setValue: setEditValue, reset: resetEdit } = useForm<StudentForm>({
    resolver: zodResolver(createStudentSchema.partial()),
  });

  // Fetch students
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['/api/students'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/students');
      return await response.json();
    },
  });

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/classes');
      return await response.json();
    },
  });

  // Fetch users (for parents)
  const { data: parents = [] } = useQuery({
    queryKey: ['/api/users', 'parent'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users?role=Parent');
      return await response.json();
    },
  });

  // Fetch all users to get student user info
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return await response.json();
    },
  });

  // Create student mutation
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);

  const createStudentMutation = useMutation({
    mutationFn: async (data: StudentForm) => {
      // Create student with all data in single API call
      // Email and password are optional - will be auto-generated
      const studentResponse = await apiRequest('POST', '/api/students', {
        // User fields (email and password now optional)
        email: data.email?.trim() || undefined,
        password: data.password || undefined,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone?.trim() || undefined,
        address: data.address?.trim() || undefined,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        // Student-specific fields
        admissionNumber: data.admissionNumber || undefined,
        classId: data.classId, // Already coerced to number by zod
        parentId: data.parentId || undefined,
        parentEmail: data.parentEmail?.trim() || undefined,
        parentPhone: data.parentPhone?.trim() || undefined,
        guardianName: data.guardianName?.trim() || undefined,
        emergencyContact: data.emergencyContact,
        medicalInfo: data.medicalInfo?.trim() || undefined,
        admissionDate: data.admissionDate, // Fixed field name
      });

      if (!studentResponse.ok) {
        const errorData = await studentResponse.json();
        throw new Error(errorData.message || 'Failed to create student');
      }

      return await studentResponse.json();
    },
    onSuccess: (data) => {
      // Store generated credentials to show to admin
      if (data.credentials) {
        setCreatedCredentials(data.credentials);
      }

      toast({
        title: 'Success',
        description: data.parentCreated 
          ? 'Student and Parent accounts created successfully!' 
          : 'Student created successfully with auto-generated credentials',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsDialogOpen(false);
      reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create student',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: StudentForm) => {
    createStudentMutation.mutate(data);
  };

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StudentForm> }) => {
      const response = await apiRequest('PATCH', `/api/students/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update student');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Student updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditDialogOpen(false);
      resetEdit();
      setEditingStudent(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update student',
        variant: 'destructive',
      });
    },
  });

  // Block/Unblock student mutation
  const blockStudentMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/students/${id}/block`, { isActive });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update student status');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update student status',
        variant: 'destructive',
      });
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/students/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete student');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete student',
        variant: 'destructive',
      });
    },
  });

  // CSV Upload mutation
  const csvUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/students/bulk-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload students');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Upload Successful',
        description: `Created ${data.students?.length || 0} students successfully`,
      });
      setUploadedStudents(data.students || []);
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Generate login slips mutation
  const generateLoginSlipsMutation = useMutation({
    mutationFn: async ({ studentIds, passwords }: { studentIds: string[], passwords?: Record<string, string> }) => {
      const studentsForSlips = enrichedStudents
        .filter((s: any) => studentIds.includes(s.id))
        .map((s: any) => ({
          firstName: s.user?.firstName || '',
          lastName: s.user?.lastName || '',
          roleId: 3,
          username: s.user?.username || '',
          password: passwords?.[s.id] || 'Contact Admin',
        }));

      const response = await fetch('/api/users/generate-login-slips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ users: studentsForSlips }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate login slips');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `THS-Login-Slips-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: 'Login Slips Generated',
        description: 'PDF downloaded successfully',
      });
      setSelectedStudents([]);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate login slips',
        variant: 'destructive',
      });
    },
  });

  const onEditSubmit = (data: Partial<StudentForm>) => {
    if (editingStudent) {
      updateStudentMutation.mutate({ id: editingStudent.id, data });
    }
  };

  const handleEditClick = (student: any) => {
    setEditingStudent(student);
    // Populate edit form with current student data
    resetEdit({
      email: student.user?.email || '',
      firstName: student.user?.firstName || '',
      lastName: student.user?.lastName || '',
      phone: student.user?.phone || '',
      address: student.user?.address || '',
      dateOfBirth: student.user?.dateOfBirth || '',
      gender: student.user?.gender || undefined,
      admissionNumber: student.admissionNumber || '',
      classId: student.classId || undefined,
      parentId: student.parentId || undefined,
      admissionDate: student.admissionDate || '',
      emergencyContact: student.emergencyContact || '',
      medicalInfo: student.medicalInfo || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleBlockToggle = (student: any) => {
    const newActiveStatus = !student.user?.isActive;
    blockStudentMutation.mutate({ id: student.id, isActive: newActiveStatus });
  };

  const handleDeleteStudent = (studentId: string) => {
    deleteStudentMutation.mutate(studentId);
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File',
          description: 'Please upload a CSV file',
          variant: 'destructive',
        });
        return;
      }
      csvUploadMutation.mutate(file);
      event.target.value = '';
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s: any) => s.id));
    }
  };

  const handleGenerateLoginSlips = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: 'No Students Selected',
        description: 'Please select at least one student',
        variant: 'destructive',
      });
      return;
    }
    generateLoginSlipsMutation.mutate({ studentIds: selectedStudents });
  };

  // Get student details with user info
  const enrichedStudents = students.map((student: any) => {
    const user = users.find((u: any) => u.id === student.id);
    const classInfo = classes.find((c: any) => c.id === student.classId);
    const parent = users.find((u: any) => u.id === student.parentId);

    return {
      ...student,
      user,
      class: classInfo,
      parent,
    };
  });

  // Filter students
  const filteredStudents = enrichedStudents.filter((student: any) => {
    const matchesSearch = !searchTerm || 
      student.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === 'all' || student.classId?.toString() === selectedClass;

    return matchesSearch && matchesClass;
  });

  return (
    <PortalLayout
      userRole="admin"
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Page Header - Fully Responsive */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Student Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage student enrollment and information</p>
          </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" data-testid="button-add-student">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm">First Name</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    data-testid="input-firstName"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    data-testid="input-lastName"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Key className="h-4 w-4 text-blue-700 dark:text-blue-300 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                      Credentials Auto-Generated
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      Username, password, and admission number will be automatically generated. 
                      Students login with USERNAME only (no email needed). You'll receive credentials to share with student and parent.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="admissionDate" className="text-sm">Date of Admission</Label>
                  <Input
                    id="admissionDate"
                    type="date"
                    {...register('admissionDate')}
                    data-testid="input-admissionDate"
                  />
                  {errors.admissionDate && (
                    <p className="text-red-500 text-sm">{errors.admissionDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="dateOfBirth" className="text-sm">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                    data-testid="input-dateOfBirth"
                  />
                  {errors.dateOfBirth && (
                    <p className="text-red-500 text-sm">{errors.dateOfBirth.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="gender" className="text-sm">Gender</Label>
                  <Select onValueChange={(value) => setValue('gender', value as 'Male' | 'Female' | 'Other')}>
                    <SelectTrigger data-testid="select-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-red-500 text-sm">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="classId" className="text-sm">Class</Label>
                  <Select onValueChange={(value) => setValue('classId', parseInt(value))}>
                    <SelectTrigger data-testid="select-class">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.name} ({cls.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.classId && (
                    <p className="text-red-500 text-sm">{errors.classId.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="admissionDate" className="text-sm">Admission Date</Label>
                  <Input
                    id="admissionDate"
                    type="date"
                    {...register('admissionDate')}
                    data-testid="input-admissionDate"
                  />
                  {errors.admissionDate && (
                    <p className="text-red-500 text-sm">{errors.admissionDate.message}</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 mt-2">
                <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Parent/Guardian Information
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Select an existing parent or provide email/phone to auto-create a new parent account
                </p>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="parentId" className="text-sm">Link to Existing Parent (Optional)</Label>
                    <Select onValueChange={(value) => setValue('parentId', value)}>
                      <SelectTrigger data-testid="select-parent">
                        <SelectValue placeholder="Select existing parent (or auto-create below)" />
                      </SelectTrigger>
                      <SelectContent>
                        {parents.map((parent: any) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.firstName} {parent.lastName} - {parent.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.parentId && (
                      <p className="text-red-500 text-sm">{errors.parentId.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="parentPhone" className="text-sm">Parent Phone (Optional - for auto-link/create)</Label>
                    <Input
                      id="parentPhone"
                      {...register('parentPhone')}
                      placeholder="+1234567890"
                      data-testid="input-parentPhone"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      If phone matches existing parent, student will be linked. Otherwise, new parent account will be created.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="guardianName" className="text-sm">Guardian Full Name (Optional)</Label>
                    <Input
                      id="guardianName"
                      {...register('guardianName')}
                      placeholder="Guardian's full name"
                      data-testid="input-guardianName"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="emergencyContact" className="text-sm">Emergency Contact (Optional)</Label>
                <Input
                  id="emergencyContact"
                  {...register('emergencyContact')}
                  placeholder="+1234567890"
                  data-testid="input-emergencyContact"
                />
                {errors.emergencyContact && (
                  <p className="text-red-500 text-sm">{errors.emergencyContact.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm">Phone (Optional)</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  data-testid="input-phone"
                />
              </div>

              <div>
                <Label htmlFor="address" className="text-sm">Address (Optional)</Label>
                <Input
                  id="address"
                  {...register('address')}
                  data-testid="input-address"
                />
              </div>

              <div>
                <Label htmlFor="medicalInfo" className="text-sm">Medical Information (Optional)</Label>
                <Input
                  id="medicalInfo"
                  {...register('medicalInfo')}
                  placeholder="Allergies, medical conditions, etc."
                  data-testid="input-medicalInfo"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createStudentMutation.isPending}
                  data-testid="button-submit-student"
                >
                  {createStudentMutation.isPending ? 'Creating...' : 'Create Student'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

          <div className="relative w-full sm:w-auto">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              id="csv-upload"
              data-testid="input-csv-upload"
            />
            <Button
              onClick={() => document.getElementById('csv-upload')?.click()}
              variant="outline"
              className="w-full sm:w-auto"
              disabled={csvUploadMutation.isPending}
              data-testid="button-bulk-upload"
            >
              <Upload className="h-4 w-4 mr-2" />
              {csvUploadMutation.isPending ? 'Uploading...' : 'Bulk Upload CSV'}
            </Button>
          </div>

          <Button
            onClick={handleGenerateLoginSlips}
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={selectedStudents.length === 0 || generateLoginSlipsMutation.isPending}
            data-testid="button-generate-slips"
          >
            <FileText className="h-4 w-4 mr-2" />
            {generateLoginSlipsMutation.isPending ? 'Generating...' : `Generate Login Slips (${selectedStudents.length})`}
          </Button>
        </div>

        {/* Generated Credentials Dialog - Enhanced with Parent Credentials */}
        <Dialog open={!!createdCredentials} onOpenChange={() => setCreatedCredentials(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5 text-green-600" />
                {createdCredentials?.parent ? 'Student & Parent Accounts Created!' : 'Student Created Successfully!'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Student Credentials */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Student Login Credentials:
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Username:</p>
                    <p className="font-mono text-sm font-bold">{createdCredentials?.student?.username}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Password:</p>
                    <p className="font-mono text-sm font-bold">{createdCredentials?.student?.password}</p>
                  </div>
                </div>
              </div>

              {/* Parent Credentials - Only show if parent was auto-created */}
              {createdCredentials?.parent && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-3 flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Parent Login Credentials (Auto-Created):
                  </p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Username:</p>
                      <p className="font-mono text-sm font-bold">{createdCredentials?.parent?.username}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Password:</p>
                      <p className="font-mono text-sm font-bold">{createdCredentials?.parent?.password}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-700 dark:text-yellow-300 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Important:</strong> Save these credentials immediately! The passwords will not be shown again. 
                    Both accounts must change their passwords on first login.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  onClick={() => {
                    // Copy all credentials to clipboard
                    let text = `=== STUDENT CREDENTIALS ===\nUsername: ${createdCredentials?.student?.username}\nPassword: ${createdCredentials?.student?.password}`;

                    if (createdCredentials?.parent) {
                      text += `\n\n=== PARENT CREDENTIALS ===\nUsername: ${createdCredentials?.parent?.username}\nPassword: ${createdCredentials?.parent?.password}`;
                    }

                    navigator.clipboard.writeText(text);
                    toast({
                      title: "Copied!",
                      description: "All credentials copied to clipboard",
                    });
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-copy-credentials"
                >
                  <FileText className="h-4 w-4" />
                  Copy All
                </Button>
                <Button
                  onClick={() => {
                    // Print/Download credentials as PDF
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>THS Portal Login Credentials</title>
                            <style>
                              body { font-family: Arial, sans-serif; padding: 40px; }
                              .header { text-align: center; margin-bottom: 30px; }
                              .section { margin: 20px 0; padding: 20px; border: 2px solid #ddd; border-radius: 8px; }
                              .student { border-color: #3b82f6; }
                              .parent { border-color: #22c55e; }
                              h1 { color: #1e40af; }
                              h2 { margin-top: 0; }
                              .credential { margin: 10px 0; }
                              .label { font-weight: bold; }
                              .value { font-family: monospace; font-size: 16px; }
                              .warning { background: #fef3c7; padding: 15px; border-radius: 5px; margin-top: 20px; }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <h1>Treasure-Home School Portal</h1>
                              <p>Login Credentials</p>
                            </div>

                            <div class="section student">
                              <h2>Student Login</h2>
                              <div class="credential">
                                <span class="label">Username:</span>
                                <div class="value">${createdCredentials?.student?.username}</div>
                              </div>
                              <div class="credential">
                                <span class="label">Password:</span>
                                <div class="value">${createdCredentials?.student?.password}</div>
                              </div>
                            </div>

                            ${createdCredentials?.parent ? `
                              <div class="section parent">
                                <h2>Parent/Guardian Login</h2>
                                <div class="credential">
                                  <span class="label">Username:</span>
                                  <div class="value">${createdCredentials?.parent?.username}</div>
                                </div>
                                <div class="credential">
                                  <span class="label">Password:</span>
                                  <div class="value">${createdCredentials?.parent?.password}</div>
                                </div>
                              </div>
                            ` : ''}

                            <div class="warning">
                              <strong>Important Notes:</strong>
                              <ul>
                                <li>Keep these credentials safe and secure</li>
                                <li>You must change your password on first login</li>
                                <li>Never share your password with anyone</li>
                                <li>Contact school administration if you forget your password</li>
                              </ul>
                            </div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-print-credentials"
                >
                  <Download className="h-4 w-4" />
                  Print/Download
                </Button>
                <Button onClick={() => setCreatedCredentials(null)} data-testid="button-close-credentials">
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Results Dialog */}
        <Dialog open={uploadedStudents.length > 0} onOpenChange={() => setUploadedStudents([])}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">Upload Results</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Successfully created {uploadedStudents.length} student(s)
              </p>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>Class</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadedStudents.map((student: any) => (
                      <TableRow key={student.username}>
                        <TableCell>{student.firstName} {student.lastName}</TableCell>
                        <TableCell className="font-mono text-sm">{student.username}</TableCell>
                        <TableCell className="font-mono text-sm">{student.password}</TableCell>
                        <TableCell>{student.class || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    const studentIds = uploadedStudents.map((s: any) => s.id).filter(Boolean);
                    const passwords: Record<string, string> = {};
                    uploadedStudents.forEach((s: any) => {
                      if (s.id && s.password) {
                        passwords[s.id] = s.password;
                      }
                    });
                    if (studentIds.length > 0) {
                      generateLoginSlipsMutation.mutate({ studentIds, passwords });
                      setUploadedStudents([]);
                    }
                  }}
                  data-testid="button-generate-uploaded-slips"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Login Slips
                </Button>
                <Button variant="outline" onClick={() => setUploadedStudents([])}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Student Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Edit Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="editFirstName" className="text-sm">First Name</Label>
                  <Input
                    id="editFirstName"
                    {...registerEdit('firstName')}
                    data-testid="input-edit-firstName"
                  />
                  {editErrors.firstName && (
                    <p className="text-red-500 text-sm">{editErrors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="editLastName" className="text-sm">Last Name</Label>
                  <Input
                    id="editLastName"
                    {...registerEdit('lastName')}
                    data-testid="input-edit-lastName"
                  />
                  {editErrors.lastName && (
                    <p className="text-red-500 text-sm">{editErrors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="editPassword" className="text-sm">Password (Optional - Leave blank to keep current)</Label>
                <Input
                  id="editPassword"
                  type="text"
                  {...registerEdit('password')}
                  placeholder="Enter new password to change"
                  data-testid="input-edit-password"
                />
                {editErrors.password && (
                  <p className="text-red-500 text-sm">{editErrors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Current password is hidden for security. Enter a new password only if you want to change it.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="editAdmissionNumber" className="text-sm">Admission Number</Label>
                  <Input
                    id="editAdmissionNumber"
                    {...registerEdit('admissionNumber')}
                    data-testid="input-edit-admissionNumber"
                  />
                  {editErrors.admissionNumber && (
                    <p className="text-red-500 text-sm">{editErrors.admissionNumber.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="editAdmissionDate" className="text-sm">Date of Admission</Label>
                  <Input
                    id="editAdmissionDate"
                    type="date"
                    {...registerEdit('admissionDate')}
                    data-testid="input-edit-admissionDate"
                  />
                  {editErrors.admissionDate && (
                    <p className="text-red-500 text-sm">{errors.admissionDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="editDateOfBirth" className="text-sm">Date of Birth</Label>
                  <Input
                    id="editDateOfBirth"
                    type="date"
                    {...registerEdit('dateOfBirth')}
                    data-testid="input-edit-dateOfBirth"
                  />
                  {editErrors.dateOfBirth && (
                    <p className="text-red-500 text-sm">{editErrors.dateOfBirth.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="editGender" className="text-sm">Gender</Label>
                  <Select 
                    value={editingStudent?.user?.gender ?? undefined} 
                    onValueChange={(value) => setEditValue('gender', value as 'Male' | 'Female' | 'Other')}
                  >
                    <SelectTrigger data-testid="select-edit-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {editErrors.gender && (
                    <p className="text-red-500 text-sm">{editErrors.gender.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="editClassId" className="text-sm">Class</Label>
                  <Select 
                    value={editingStudent?.classId ? editingStudent.classId.toString() : ''} 
                    onValueChange={(value) => setEditValue('classId', parseInt(value))}
                  >
                    <SelectTrigger data-testid="select-edit-class">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.name} ({cls.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editErrors.classId && (
                    <p className="text-red-500 text-sm">{editErrors.classId.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="editParentId" className="text-sm">Parent</Label>
                  <Select 
                    value={editingStudent?.parentId || 'none'} 
                    onValueChange={(value) => setEditValue('parentId', value === 'none' ? undefined : value)}
                  >
                    <SelectTrigger data-testid="select-edit-parent">
                      <SelectValue placeholder="Select parent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Parent</SelectItem>
                      {parents.map((parent: any) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.firstName} {parent.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editErrors.parentId && (
                    <p className="text-red-500 text-sm">{editErrors.parentId.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="editEmergencyContact" className="text-sm">Emergency Contact</Label>
                <Input
                  id="editEmergencyContact"
                  {...registerEdit('emergencyContact')}
                  data-testid="input-edit-emergencyContact"
                />
                {editErrors.emergencyContact && (
                  <p className="text-red-500 text-sm">{editErrors.emergencyContact.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="editPhone" className="text-sm">Phone (Optional)</Label>
                <Input
                  id="editPhone"
                  {...registerEdit('phone')}
                  data-testid="input-edit-phone"
                />
              </div>

              <div>
                <Label htmlFor="editAddress" className="text-sm">Address (Optional)</Label>
                <Input
                  id="editAddress"
                  {...registerEdit('address')}
                  data-testid="input-edit-address"
                />
              </div>

              <div>
                <Label htmlFor="editMedicalInfo" className="text-sm">Medical Information (Optional)</Label>
                <Input
                  id="editMedicalInfo"
                  {...registerEdit('medicalInfo')}
                  data-testid="input-edit-medicalInfo"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateStudentMutation.isPending}
                  data-testid="button-update-student"
                >
                  {updateStudentMutation.isPending ? 'Updating...' : 'Update Student'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filter and Search - Fully Responsive */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Filter Students</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 sm:pt-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm">Search</Label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-students"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="classFilter" className="text-sm">Filter by Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full mt-1.5" data-testid="select-class-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table - Fully Responsive */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <CardTitle className="text-base sm:text-lg">Students ({filteredStudents.length})</CardTitle>
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm" data-testid="button-export-students">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 sm:pt-0">
          {loadingStudents ? (
            <div className="text-center py-8 text-sm sm:text-base">Loading students...</div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredStudents.map((student: any) => (
                  <div 
                    key={student.id} 
                    className="border border-border rounded-lg p-4 bg-muted/30"
                    data-testid={`card-student-${student.id}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">
                            {student.user?.firstName} {student.user?.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {student.user?.email}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {student.admissionNumber}
                          </div>
                        </div>
                        <Badge variant={student.user?.isActive ? "default" : "secondary"} className="ml-2 text-xs">
                          {student.user?.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Class:</span>
                          <div className="font-medium mt-0.5">
                            <Badge variant="secondary" className="text-xs">
                              {student.class?.name || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Parent:</span>
                          <div className="font-medium mt-0.5 truncate">
                            {student.parent?.firstName ? `${student.parent.firstName} ${student.parent.lastName}` : 'N/A'}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Emergency:</span>
                          <div className="font-medium mt-0.5">{student.emergencyContact}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleEditClick(student)}
                          data-testid={`button-edit-${student.id}`}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleBlockToggle(student)}
                          data-testid={`button-block-${student.id}`}
                        >
                          {student.user?.isActive ? (
                            <>
                              <ShieldOff className="h-3.5 w-3.5 mr-1.5 text-orange-600" />
                              Block
                            </>
                          ) : (
                            <>
                              <Shield className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                              Activate
                            </>
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              data-testid={`button-delete-${student.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Student</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {student.user?.firstName} {student.user?.lastName}? 
                                This will deactivate the student account and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteStudent(student.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Student
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No students found
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4"
                          data-testid="checkbox-select-all"
                        />
                      </TableHead>
                      <TableHead className="text-xs lg:text-sm">Admission Number</TableHead>
                      <TableHead className="text-xs lg:text-sm">Name</TableHead>
                      <TableHead className="text-xs lg:text-sm">Class</TableHead>
                      <TableHead className="text-xs lg:text-sm">Parent</TableHead>
                      <TableHead className="text-xs lg:text-sm">Contact</TableHead>
                      <TableHead className="text-xs lg:text-sm">Status</TableHead>
                      <TableHead className="text-xs lg:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student: any) => (
                      <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleSelectStudent(student.id)}
                            className="h-4 w-4"
                            data-testid={`checkbox-student-${student.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-xs lg:text-sm">
                          {student.admissionNumber}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          <div>
                            <div className="font-medium">
                              {student.user?.firstName} {student.user?.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {student.user?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          <Badge variant="secondary" className="text-xs">
                            {student.class?.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">
                          {student.parent?.firstName} {student.parent?.lastName}
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm">{student.emergencyContact}</TableCell>
                        <TableCell>
                          {!student.user?.isActive ? (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          ) : student.user?.mustChangePassword && !student.user?.lastLoginAt ? (
                            <Badge variant="outline" className="text-xs border-orange-500 text-orange-700 dark:text-orange-300">
                              ⏳ Pending Login
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs bg-green-600">
                              ✅ Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditClick(student)}
                              data-testid={`button-edit-${student.id}`}
                              title="Edit student"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBlockToggle(student)}
                              data-testid={`button-block-${student.id}`}
                              title={student.user?.isActive ? "Block student" : "Activate student"}
                            >
                              {student.user?.isActive ? (
                                <ShieldOff className="h-4 w-4 text-orange-600" />
                              ) : (
                                <Shield className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-delete-${student.id}`}
                                  title="Delete student"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Student</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {student.user?.firstName} {student.user?.lastName}? 
                                    This will deactivate the student account and cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteStudent(student.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Student
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-sm">
                          No students found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
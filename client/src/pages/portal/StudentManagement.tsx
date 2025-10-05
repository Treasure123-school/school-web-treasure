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
import { UserPlus, Edit, Search, Download, Trash2, Shield, ShieldOff } from 'lucide-react';

// Use shared schema to prevent frontend/backend drift
type StudentForm = CreateStudentRequest;

export default function StudentManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');

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
  const createStudentMutation = useMutation({
    mutationFn: async (data: StudentForm) => {
      // Create student with all data in single API call
      const studentResponse = await apiRequest('POST', '/api/students', {
        // User fields
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone?.trim() || undefined,
        address: data.address?.trim() || undefined,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        // Student-specific fields
        admissionNumber: data.admissionNumber,
        classId: data.classId, // Already coerced to number by zod
        parentId: data.parentId || undefined,
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
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Student created successfully',
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
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header - Fully Responsive */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Student Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage student enrollment and information</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" data-testid="button-add-student">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
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
                  <Label htmlFor="lastName">Last Name</Label>
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

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  data-testid="input-email"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Minimum 6 characters"
                  data-testid="input-password"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="admissionNumber">Admission Number</Label>
                  <Input
                    id="admissionNumber"
                    {...register('admissionNumber')}
                    placeholder="THS/2024/001"
                    data-testid="input-admissionNumber"
                  />
                  {errors.admissionNumber && (
                    <p className="text-red-500 text-sm">{errors.admissionNumber.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="admissionDate">Date of Admission</Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
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
                  <Label htmlFor="gender">Gender</Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="classId">Class</Label>
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
                  <Label htmlFor="parentId">Parent</Label>
                  <Select onValueChange={(value) => setValue('parentId', value)}>
                    <SelectTrigger data-testid="select-parent">
                      <SelectValue placeholder="Select parent" />
                    </SelectTrigger>
                    <SelectContent>
                      {parents.map((parent: any) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.firstName} {parent.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.parentId && (
                    <p className="text-red-500 text-sm">{errors.parentId.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
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
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  data-testid="input-phone"
                />
              </div>

              <div>
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  {...register('address')}
                  data-testid="input-address"
                />
              </div>

              <div>
                <Label htmlFor="medicalInfo">Medical Information (Optional)</Label>
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

        {/* Edit Student Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">First Name</Label>
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
                  <Label htmlFor="editLastName">Last Name</Label>
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
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  {...registerEdit('email')}
                  data-testid="input-edit-email"
                />
                {editErrors.email && (
                  <p className="text-red-500 text-sm">{editErrors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="editPassword">New Password (Optional)</Label>
                <Input
                  id="editPassword"
                  type="password"
                  {...registerEdit('password')}
                  placeholder="Leave blank to keep current password"
                  data-testid="input-edit-password"
                />
                {editErrors.password && (
                  <p className="text-red-500 text-sm">{editErrors.password.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editAdmissionNumber">Admission Number</Label>
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
                  <Label htmlFor="editAdmissionDate">Date of Admission</Label>
                  <Input
                    id="editAdmissionDate"
                    type="date"
                    {...registerEdit('admissionDate')}
                    data-testid="input-edit-admissionDate"
                  />
                  {editErrors.admissionDate && (
                    <p className="text-red-500 text-sm">{editErrors.admissionDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editDateOfBirth">Date of Birth</Label>
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
                  <Label htmlFor="editGender">Gender</Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editClassId">Class</Label>
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
                  <Label htmlFor="editParentId">Parent</Label>
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
                <Label htmlFor="editEmergencyContact">Emergency Contact</Label>
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
                <Label htmlFor="editPhone">Phone (Optional)</Label>
                <Input
                  id="editPhone"
                  {...registerEdit('phone')}
                  data-testid="input-edit-phone"
                />
              </div>

              <div>
                <Label htmlFor="editAddress">Address (Optional)</Label>
                <Input
                  id="editAddress"
                  {...registerEdit('address')}
                  data-testid="input-edit-address"
                />
              </div>

              <div>
                <Label htmlFor="editMedicalInfo">Medical Information (Optional)</Label>
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
                          <Badge variant={student.user?.isActive ? "default" : "secondary"} className="text-xs">
                            {student.user?.isActive ? "Active" : "Inactive"}
                          </Badge>
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
    </div>
  );
}
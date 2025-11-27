import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSocketIORealtime } from '@/hooks/useSocketIORealtime';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Edit, Search, Mail, Phone, MapPin, GraduationCap, Trash2, Copy, CheckCircle } from 'lucide-react';
import PortalLayout from '@/components/layout/PortalLayout';
import { useAuth } from '@/lib/auth';
import { ROLE_IDS } from '@/lib/roles';

const teacherFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  roleId: z.number().default(ROLE_IDS.TEACHER), // Teacher role ID = 3
  employeeId: z.string().optional(),
  department: z.string().optional(),
  qualifications: z.string().optional(),
  dateOfJoining: z.string().optional(),
  salary: z.string().optional(),
});

type TeacherForm = z.infer<typeof teacherFormSchema>;

export default function TeachersManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<any>(null);
  const [credentialsDialog, setCredentialsDialog] = useState<{
    open: boolean;
    username: string;
    password: string;
    email: string;
  }>({ open: false, username: '', password: '', email: '' });

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<TeacherForm>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      roleId: ROLE_IDS.TEACHER, // Teacher role = 3
    }
  });

  // Fetch teachers
  const { data: teachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['/api/users', 'Teacher'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users?role=Teacher');
      return await response.json();
    },
  });

  useSocketIORealtime({ 
    table: 'users', 
    queryKey: ['/api/users', 'Teacher']
  });

  // Create teacher mutation
  const createTeacherMutation = useMutation({
    mutationFn: async (teacherData: TeacherForm) => {
      // Generate a temporary password for the teacher
      const currentYear = new Date().getFullYear();
      const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
      const tempPassword = `THS@${currentYear}#${randomString}`;
      
      const response = await apiRequest('POST', '/api/users', {
        ...teacherData,
        password: tempPassword,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create teacher');
      }
      return response.json();
    },
    onMutate: async (newTeacher) => {
      await queryClient.cancelQueries({ queryKey: ['/api/users', 'Teacher'] });
      const previousData = queryClient.getQueryData(['/api/users', 'Teacher']);
      
      queryClient.setQueryData(['/api/users', 'Teacher'], (old: any) => {
        const tempTeacher = { ...newTeacher, id: 'temp-' + Date.now(), createdAt: new Date(), role: { id: ROLE_IDS.TEACHER, name: 'Teacher' } };
        if (!old) return [tempTeacher];
        return [tempTeacher, ...old];
      });
      
      return { previousData };
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Teacher created successfully. Login credentials are displayed below.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users', 'Teacher'] });
      setIsDialogOpen(false);
      reset();
      
      // Show credentials dialog
      setCredentialsDialog({
        open: true,
        username: data.username || '',
        password: data.temporaryPassword || '',
        email: data.email || ''
      });
    },
    onError: (error: any, newTeacher, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(['/api/users', 'Teacher'], context.previousData);
      }
      toast({
        title: "Error", 
        description: error.message || "Failed to create teacher",
        variant: "destructive",
      });
    },
  });

  // Update teacher mutation
  const updateTeacherMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<TeacherForm> }) => {
      const response = await apiRequest('PUT', `/api/users/${id}`, data);
      if (!response.ok) throw new Error('Failed to update teacher');
      return response.json();
    },
    onMutate: async ({ id, data }: { id: string, data: Partial<TeacherForm> }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/users', 'Teacher'] });
      const previousData = queryClient.getQueryData(['/api/users', 'Teacher']);
      
      queryClient.setQueryData(['/api/users', 'Teacher'], (old: any) => {
        if (!old) return old;
        return old.map((teacher: any) => 
          teacher.id === id ? { ...teacher, ...data } : teacher
        );
      });
      
      toast({ title: "Updating...", description: "Saving teacher information" });
      return { previousData };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users', 'Teacher'] });
      setIsDialogOpen(false);
      setEditingTeacher(null);
      reset();
    },
    onError: (error: any, variables: any, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(['/api/users', 'Teacher'], context.previousData);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update teacher", 
        variant: "destructive",
      });
    },
  });

  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/users/${id}`);
      if (!response.ok) throw new Error('Failed to delete teacher');
      return response.status === 204 ? null : response.json();
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['/api/users', 'Teacher'] });
      const previousData = queryClient.getQueryData(['/api/users', 'Teacher']);
      
      queryClient.setQueryData(['/api/users', 'Teacher'], (old: any) => {
        if (!old) return old;
        return old.filter((teacher: any) => teacher.id !== id);
      });
      
      toast({ title: "Deleting...", description: "Removing teacher from system" });
      return { previousData };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users', 'Teacher'] });
      setTeacherToDelete(null);
    },
    onError: (error: any, id: string, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(['/api/users', 'Teacher'], context.previousData);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete teacher",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TeacherForm) => {
    if (editingTeacher) {
      updateTeacherMutation.mutate({ id: editingTeacher.id, data });
    } else {
      createTeacherMutation.mutate(data);
    }
  };

  const handleEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    
    // Populate form with teacher data
    setValue('firstName', teacher.firstName);
    setValue('lastName', teacher.lastName);
    setValue('email', teacher.email);
    setValue('phone', teacher.phone || '');
    setValue('address', teacher.address || '');
    setValue('dateOfBirth', teacher.dateOfBirth || '');
    setValue('gender', teacher.gender || 'Male');
    setValue('employeeId', teacher.employeeId || '');
    setValue('department', teacher.department || '');
    setValue('qualifications', teacher.qualifications || '');
    setValue('dateOfJoining', teacher.dateOfJoining || '');
    setValue('salary', teacher.salary || '');
    
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTeacher(null);
    reset();
  };

  // Filter teachers based on search and department
  const filteredTeachers = teachers.filter((teacher: any) => {
    const matchesSearch = !searchTerm || 
      `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.employeeId && teacher.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = selectedDepartment === 'all' || 
      (teacher.department && teacher.department === selectedDepartment);
    
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments for filter
  const departments = Array.from(new Set(teachers.map((t: any) => t.department).filter(Boolean))) as string[];

  return (
    <div className="space-y-6" data-testid="teachers-management">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Teachers Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-teacher">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {!editingTeacher && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Quick Setup:</strong> Just enter the teacher's basic information. They can complete their profile when they log in.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input 
                    id="firstName" 
                    {...register('firstName')} 
                    data-testid="input-first-name"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input 
                    id="lastName" 
                    {...register('lastName')} 
                    data-testid="input-last-name"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  {...register('email')} 
                  data-testid="input-email"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              {editingTeacher && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone" 
                        {...register('phone')} 
                        data-testid="input-phone"
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input 
                        id="employeeId" 
                        {...register('employeeId')} 
                        placeholder="e.g., EMP/2024/001"
                        data-testid="input-employee-id"
                      />
                      {errors.employeeId && (
                        <p className="text-sm text-red-500 mt-1">{errors.employeeId.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      {...register('address')} 
                      data-testid="input-address"
                    />
                    {errors.address && (
                      <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input 
                        id="dateOfBirth" 
                        type="date" 
                        {...register('dateOfBirth')} 
                        data-testid="input-date-of-birth"
                      />
                      {errors.dateOfBirth && (
                        <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select onValueChange={(value) => setValue('gender', value as any)}>
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
                        <p className="text-sm text-red-500 mt-1">{errors.gender.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input 
                        id="department" 
                        {...register('department')} 
                        placeholder="e.g., Mathematics"
                        data-testid="input-department"
                      />
                      {errors.department && (
                        <p className="text-sm text-red-500 mt-1">{errors.department.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="dateOfJoining">Date of Joining</Label>
                      <Input 
                        id="dateOfJoining" 
                        type="date" 
                        {...register('dateOfJoining')} 
                        data-testid="input-date-of-joining"
                      />
                      {errors.dateOfJoining && (
                        <p className="text-sm text-red-500 mt-1">{errors.dateOfJoining.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="qualifications">Qualifications</Label>
                    <Input 
                      id="qualifications" 
                      {...register('qualifications')} 
                      placeholder="e.g., B.Ed Mathematics, M.Sc Mathematics"
                      data-testid="input-qualifications"
                    />
                    {errors.qualifications && (
                      <p className="text-sm text-red-500 mt-1">{errors.qualifications.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="salary">Salary</Label>
                    <Input 
                      id="salary" 
                      {...register('salary')} 
                      placeholder="e.g., 50000"
                      data-testid="input-salary"
                    />
                    {errors.salary && (
                      <p className="text-sm text-red-500 mt-1">{errors.salary.message}</p>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTeacherMutation.isPending || updateTeacherMutation.isPending}
                  data-testid="button-save-teacher"
                >
                  {createTeacherMutation.isPending || updateTeacherMutation.isPending ? 'Saving...' : 
                   editingTeacher ? 'Update Teacher' : 'Add Teacher'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teachers by name, email, or employee ID..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48" data-testid="select-department-filter">
                <SelectValue placeholder="Filter by Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept: string) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Teachers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Teachers ({filteredTeachers.length})</span>
            <Badge variant="secondary" data-testid="text-total-teachers">
              Total: {teachers.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTeachers ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Loading teachers...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher: any) => (
                    <TableRow key={teacher.id} data-testid={`row-teacher-${teacher.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium" data-testid={`text-teacher-name-${teacher.id}`}>
                              {teacher.firstName} {teacher.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {teacher.qualifications || 'No qualifications listed'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-employee-id-${teacher.id}`}>
                        <Badge variant="outline">
                          {teacher.employeeId || 'Not assigned'}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-department-${teacher.id}`}>
                        <div className="flex items-center">
                          <GraduationCap className="w-4 h-4 mr-1 text-muted-foreground" />
                          {teacher.department || 'Not assigned'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="w-3 h-3 mr-1 text-muted-foreground" />
                            {teacher.email}
                          </div>
                          {teacher.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="w-3 h-3 mr-1" />
                              {teacher.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-joining-date-${teacher.id}`}>
                        {teacher.dateOfJoining ? 
                          new Date(teacher.dateOfJoining).toLocaleDateString() : 
                          'Not specified'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={teacher.isActive ? "default" : "secondary"}>
                          {teacher.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(teacher)}
                            data-testid={`button-edit-teacher-${teacher.id}`}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setTeacherToDelete(teacher)}
                            data-testid={`button-delete-teacher-${teacher.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No teachers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {teacherToDelete && (
        <Dialog open={!!teacherToDelete} onOpenChange={() => setTeacherToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Are you sure you want to delete <strong>{teacherToDelete.firstName} {teacherToDelete.lastName}</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setTeacherToDelete(null)}
                  data-testid="button-cancel-delete"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => deleteTeacherMutation.mutate(teacherToDelete.id)}
                  disabled={deleteTeacherMutation.isPending}
                  data-testid="button-confirm-delete"
                >
                  {deleteTeacherMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Login Credentials Dialog */}
      <Dialog open={credentialsDialog.open} onOpenChange={(open) => setCredentialsDialog({ ...credentialsDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Teacher Created Successfully
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                Please share these login credentials with the teacher. An email has also been sent to <strong>{credentialsDialog.email}</strong>.
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                ⚠️ These credentials will only be shown once. Make sure to save them.
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <Label className="text-xs text-muted-foreground">Username</Label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-sm font-mono font-semibold" data-testid="text-teacher-username">
                    {credentialsDialog.username}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(credentialsDialog.username);
                      toast({ title: "Copied!", description: "Username copied to clipboard" });
                    }}
                    data-testid="button-copy-username"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <Label className="text-xs text-muted-foreground">Temporary Password</Label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-sm font-mono font-semibold" data-testid="text-teacher-password">
                    {credentialsDialog.password}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(credentialsDialog.password);
                      toast({ title: "Copied!", description: "Password copied to clipboard" });
                    }}
                    data-testid="button-copy-password"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> The teacher will be required to change their password on first login.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setCredentialsDialog({ open: false, username: '', password: '', email: '' })}
                data-testid="button-close-credentials"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
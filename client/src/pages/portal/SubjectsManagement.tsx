import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Search, BookOpen, Trash2 } from 'lucide-react';

const subjectFormSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  description: z.string().optional(),
});

type SubjectForm = z.infer<typeof subjectFormSchema>;

export default function SubjectsManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<any>(null);

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<SubjectForm>({
    resolver: zodResolver(subjectFormSchema),
  });

  // Fetch subjects
  const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['/api/subjects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subjects');
      return await response.json();
    },
  });

  // Create subject mutation
  const createSubjectMutation = useMutation({
    mutationFn: async (subjectData: SubjectForm) => {
      const response = await apiRequest('POST', '/api/subjects', subjectData);
      if (!response.ok) throw new Error('Failed to create subject');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      setIsDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to create subject",
        variant: "destructive",
      });
    },
  });

  // Update subject mutation
  const updateSubjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<SubjectForm> }) => {
      const response = await apiRequest('PUT', `/api/subjects/${id}`, data);
      if (!response.ok) throw new Error('Failed to update subject');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      setIsDialogOpen(false);
      setEditingSubject(null);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subject", 
        variant: "destructive",
      });
    },
  });

  // Delete subject mutation
  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/subjects/${id}`);
      if (!response.ok) throw new Error('Failed to delete subject');
      return response.status === 204 ? null : response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      setSubjectToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subject",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubjectForm) => {
    if (editingSubject) {
      updateSubjectMutation.mutate({ id: editingSubject.id, data });
    } else {
      createSubjectMutation.mutate(data);
    }
  };

  const handleEdit = (subject: any) => {
    setEditingSubject(subject);
    
    // Populate form with subject data
    setValue('name', subject.name);
    setValue('code', subject.code);
    setValue('description', subject.description || '');
    
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSubject(null);
    reset();
  };

  // Filter subjects based on search
  const filteredSubjects = subjects.filter((subject: any) => {
    return !searchTerm || 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subject.description && subject.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="space-y-6" data-testid="subjects-management">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Subjects Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-subject">
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Subject Name *</Label>
                <Input 
                  id="name" 
                  {...register('name')} 
                  placeholder="e.g., Mathematics"
                  data-testid="input-subject-name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="code">Subject Code *</Label>
                <Input 
                  id="code" 
                  {...register('code')} 
                  placeholder="e.g., MATH101"
                  data-testid="input-subject-code"
                />
                {errors.code && (
                  <p className="text-sm text-red-500 mt-1">{errors.code.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  {...register('description')} 
                  placeholder="Brief description of the subject"
                  data-testid="input-description"
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createSubjectMutation.isPending || updateSubjectMutation.isPending}
                  data-testid="button-save-subject"
                >
                  {createSubjectMutation.isPending || updateSubjectMutation.isPending ? 'Saving...' : 
                   editingSubject ? 'Update Subject' : 'Add Subject'}
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
                  placeholder="Search subjects by name, code, or description..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Subjects ({filteredSubjects.length})</span>
            <Badge variant="secondary" data-testid="text-total-subjects">
              Total: {subjects.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSubjects ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Loading subjects...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((subject: any) => (
                    <TableRow key={subject.id} data-testid={`row-subject-${subject.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium" data-testid={`text-subject-name-${subject.id}`}>
                              {subject.name}
                            </div>
                            {subject.description && (
                              <div className="text-sm text-muted-foreground">
                                {subject.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-subject-code-${subject.id}`}>
                        <Badge variant="outline">
                          {subject.code}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-created-${subject.id}`}>
                        {subject.createdAt ? 
                          new Date(subject.createdAt).toLocaleDateString() : 
                          'Unknown'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(subject)}
                            data-testid={`button-edit-subject-${subject.id}`}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setSubjectToDelete(subject)}
                            data-testid={`button-delete-subject-${subject.id}`}
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
                    <TableCell colSpan={4} className="text-center py-8">
                      No subjects found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {subjectToDelete && (
        <Dialog open={!!subjectToDelete} onOpenChange={() => setSubjectToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Are you sure you want to delete <strong>{subjectToDelete.name}</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSubjectToDelete(null)}
                  data-testid="button-cancel-delete"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => deleteSubjectMutation.mutate(subjectToDelete.id)}
                  disabled={deleteSubjectMutation.isPending}
                  data-testid="button-confirm-delete"
                >
                  {deleteSubjectMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
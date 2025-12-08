
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Plus, Calendar, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useSocketIORealtime } from '@/hooks/useSocketIORealtime';

export default function AcademicTermsManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    startDate: '',
    endDate: '',
    isCurrent: false
  });

  const { data: terms = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/terms'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/terms');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Failed to fetch terms');
      }
      const data = await response.json();
      return data;
    },
    retry: 3,
    retryDelay: 1000,
  });

  useSocketIORealtime({ 
    table: 'academic_terms', 
    queryKey: ['/api/terms']
  });

  const createTermMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/terms', data);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create term');
      }
      return response.json();
    },
    onMutate: async (newTerm) => {
      await queryClient.cancelQueries({ queryKey: ['/api/terms'] });
      const previousTerms = queryClient.getQueryData(['/api/terms']);
      
      queryClient.setQueryData(['/api/terms'], (old: any) => {
        const tempTerm = { ...newTerm, id: 'temp-' + Date.now(), createdAt: new Date() };
        if (!old) return [tempTerm];
        return [tempTerm, ...old];
      });
      
      return { previousTerms };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Academic term created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/terms'] });
      setIsDialogOpen(false);
      setEditingTerm(null);
      setFormData({ name: '', year: '', startDate: '', endDate: '', isCurrent: false });
      refetch();
    },
    onError: (error: any, newTerm, context: any) => {
      if (context?.previousTerms) {
        queryClient.setQueryData(['/api/terms'], context.previousTerms);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create term",
        variant: "destructive",
      });
    },
  });

  const updateTermMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/terms/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update term' }));
        throw new Error(errorData.message || 'Failed to update term');
      }
      return response.json();
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/terms'] });
      const previousTerms = queryClient.getQueryData(['/api/terms']);
      
      queryClient.setQueryData(['/api/terms'], (old: any) => {
        if (!old) return old;
        return old.map((term: any) => 
          term.id === id ? { ...term, ...data } : term
        );
      });
      
      return { previousTerms };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Academic term updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/terms'] });
      setIsDialogOpen(false);
      setEditingTerm(null);
      setFormData({ name: '', year: '', startDate: '', endDate: '', isCurrent: false });
      refetch();
    },
    onError: (error: any, variables, context: any) => {
      if (context?.previousTerms) {
        queryClient.setQueryData(['/api/terms'], context.previousTerms);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update term",
        variant: "destructive",
      });
    },
  });

  const deleteTermMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/terms/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete term' }));
        throw new Error(errorData.message || 'Failed to delete term');
      }
      return response.json();
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['/api/terms'] });
      const previousTerms = queryClient.getQueryData(['/api/terms']);
      
      queryClient.setQueryData(['/api/terms'], (old: any) => {
        if (!old) return old;
        return old.filter((term: any) => term.id !== id);
      });
      
      return { previousTerms };
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Academic term deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/terms'] });
      refetch();
    },
    onError: (error: any, id: number, context: any) => {
      if (context?.previousTerms) {
        queryClient.setQueryData(['/api/terms'], context.previousTerms);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete term",
        variant: "destructive",
      });
    },
  });

  const markAsCurrentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PUT', `/api/terms/${id}/mark-current`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to mark term as current');
      }
      return response.json();
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['/api/terms'] });
      const previousTerms = queryClient.getQueryData(['/api/terms']);
      
      queryClient.setQueryData(['/api/terms'], (old: any) => {
        if (!old) return old;
        return old.map((term: any) => ({
          ...term,
          isCurrent: term.id === id
        }));
      });
      
      return { previousTerms };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Term marked as current successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/terms'] });
      refetch();
    },
    onError: (error: any, id: number, context: any) => {
      if (context?.previousTerms) {
        queryClient.setQueryData(['/api/terms'], context.previousTerms);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to mark term as current",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTerm) {
      updateTermMutation.mutate({ id: editingTerm.id, data: formData });
    } else {
      createTermMutation.mutate(formData);
    }
  };

  const handleEdit = (term: any) => {
    setEditingTerm(term);
    setFormData({
      name: term.name,
      year: term.year,
      startDate: term.startDate,
      endDate: term.endDate,
      isCurrent: term.isCurrent
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteTermMutation.mutate(id);
  };

  const handleMarkAsCurrent = (id: number) => {
    markAsCurrentMutation.mutate(id);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTerm(null);
    setFormData({ name: '', year: '', startDate: '', endDate: '', isCurrent: false });
  };

  // Map roleId to role name - matches ROLE_IDS in lib/roles.ts
  const getRoleName = (roleId: number): 'admin' | 'teacher' | 'parent' | 'student' => {
    const roleMap: { [key: number]: 'admin' | 'teacher' | 'parent' | 'student' } = {
      1: 'admin',     // Super Admin
      2: 'admin',     // Admin
      3: 'teacher',   // Teacher
      4: 'student',   // Student
      5: 'parent'     // Parent
    };
    return roleMap[roleId] || 'admin';
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Please log in</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Academic Terms</h1>
            <p className="text-muted-foreground">Manage school academic terms and sessions</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-term">
                <Plus className="w-4 h-4 mr-2" />
                Create Term
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTerm ? 'Edit Academic Term' : 'Create Academic Term'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Term Name</Label>
                  <Input
                    id="name"
                    data-testid="input-term-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., First Term, Second Term"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="year">Academic Year</Label>
                  <Input
                    id="year"
                    data-testid="input-term-year"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="e.g., 2024/2025"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      data-testid="input-term-start-date"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      data-testid="input-term-end-date"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    data-testid="switch-term-current"
                    checked={formData.isCurrent}
                    onCheckedChange={(checked) => setFormData({ ...formData, isCurrent: checked })}
                  />
                  <Label>Set as current term</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTermMutation.isPending || updateTermMutation.isPending} data-testid="button-submit-term">
                    {createTermMutation.isPending || updateTermMutation.isPending ? (editingTerm ? 'Updating...' : 'Creating...') : (editingTerm ? 'Update Term' : 'Create Term')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Academic Terms</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading academic terms...
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">Failed to load academic terms. Please try again.</p>
                <Button onClick={() => refetch()} variant="outline" data-testid="button-retry">
                  Retry
                </Button>
              </div>
            ) : !terms || terms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No academic terms found. Create your first term to get started.</p>
                <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-term">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Term
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term Name</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terms.map((term: any) => (
                    <TableRow key={term.id} data-testid={`row-term-${term.id}`}>
                      <TableCell className="font-medium" data-testid={`text-term-name-${term.id}`}>{term.name}</TableCell>
                      <TableCell data-testid={`text-term-year-${term.id}`}>{term.year}</TableCell>
                      <TableCell data-testid={`text-term-start-${term.id}`}>{new Date(term.startDate).toLocaleDateString()}</TableCell>
                      <TableCell data-testid={`text-term-end-${term.id}`}>{new Date(term.endDate).toLocaleDateString()}</TableCell>
                      <TableCell data-testid={`badge-term-status-${term.id}`}>
                        {term.isCurrent ? (
                          <Badge>Current</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {!term.isCurrent && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleMarkAsCurrent(term.id)}
                              disabled={markAsCurrentMutation.isPending}
                              data-testid={`button-mark-current-${term.id}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(term)}
                            data-testid={`button-edit-${term.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" data-testid={`button-delete-${term.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Academic Term</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{term.name} ({term.year})"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-testid={`button-cancel-delete-${term.id}`}>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(term.id)}
                                  disabled={deleteTermMutation.isPending}
                                  data-testid={`button-confirm-delete-${term.id}`}
                                >
                                  {deleteTermMutation.isPending ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

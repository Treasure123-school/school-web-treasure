import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Search, Megaphone, Calendar, Users, Trash2 } from 'lucide-react';

const announcementFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  authorId: z.string().min(1, 'Author is required'),
  targetRoles: z.array(z.string()).default(['All']),
  isPublished: z.boolean().default(false),
});

type AnnouncementForm = z.infer<typeof announcementFormSchema>;

export default function AnnouncementsManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<any>(null);

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      targetRoles: ['All'],
      isPublished: false,
    },
  });

  // Fetch announcements
  const { data: announcements = [], isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['/api/announcements'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/announcements');
      return await response.json();
    },
  });

  // Fetch users for author selection
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users', 'Admin'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users?role=Admin');
      return await response.json();
    },
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcementData: AnnouncementForm) => {
      const response = await apiRequest('POST', '/api/announcements', announcementData);
      if (!response.ok) throw new Error('Failed to create announcement');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      setIsDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      });
    },
  });

  // Update announcement mutation
  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<AnnouncementForm> }) => {
      const response = await apiRequest('PUT', `/api/announcements/${id}`, data);
      if (!response.ok) throw new Error('Failed to update announcement');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      setIsDialogOpen(false);
      setEditingAnnouncement(null);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update announcement", 
        variant: "destructive",
      });
    },
  });

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/announcements/${id}`);
      if (!response.ok) throw new Error('Failed to delete announcement');
      return response.status === 204 ? null : response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      setAnnouncementToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete announcement",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AnnouncementForm) => {
    if (editingAnnouncement) {
      updateAnnouncementMutation.mutate({ id: editingAnnouncement.id, data });
    } else {
      createAnnouncementMutation.mutate(data);
    }
  };

  const handleEdit = (announcement: any) => {
    setEditingAnnouncement(announcement);
    
    // Populate form with announcement data
    setValue('title', announcement.title);
    setValue('content', announcement.content);
    setValue('authorId', announcement.authorId || '');
    setValue('targetRoles', announcement.targetRoles || ['All']);
    setValue('isPublished', announcement.isPublished || false);
    
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAnnouncement(null);
    reset();
  };

  // Filter announcements based on search and role
  const filteredAnnouncements = announcements.filter((announcement: any) => {
    const matchesSearch = !searchTerm || 
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || 
      (announcement.targetRoles && announcement.targetRoles.includes(selectedRole));
    
    return matchesSearch && matchesRole;
  });

  const availableRoles = ['All', 'Student', 'Teacher', 'Parent', 'Admin'];

  return (
    <div className="space-y-6" data-testid="announcements-management">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Announcements Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-announcement">
              <Plus className="w-4 h-4 mr-2" />
              Add Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input 
                  id="title" 
                  {...register('title')} 
                  placeholder="e.g., School Holiday Notice"
                  data-testid="input-title"
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea 
                  id="content" 
                  {...register('content')} 
                  placeholder="Write your announcement content here..."
                  rows={5}
                  data-testid="textarea-content"
                />
                {errors.content && (
                  <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="authorId">Author *</Label>
                <select
                  id="authorId"
                  {...register('authorId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="select-author"
                >
                  <option value="">Select author</option>
                  {users.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
                {errors.authorId && (
                  <p className="text-sm text-red-500 mt-1">{errors.authorId.message}</p>
                )}
              </div>

              <div>
                <Label>Target Roles</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {availableRoles.map((role) => (
                    <label key={role} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={role}
                        onChange={(e) => {
                          const currentRoles = [...(editingAnnouncement?.targetRoles || ['All'])];
                          if (e.target.checked) {
                            setValue('targetRoles', [...currentRoles, role]);
                          } else {
                            setValue('targetRoles', currentRoles.filter(r => r !== role));
                          }
                        }}
                        defaultChecked={(editingAnnouncement?.targetRoles || ['All']).includes(role)}
                        data-testid={`checkbox-role-${role.toLowerCase()}`}
                      />
                      <span className="text-sm">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  {...register('isPublished')}
                  data-testid="checkbox-is-published"
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isPublished" className="text-sm font-normal">
                  Publish this announcement immediately
                </Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}
                  data-testid="button-save-announcement"
                >
                  {createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending ? 'Saving...' : 
                   editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
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
                  placeholder="Search announcements by title or content..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="select-role-filter"
            >
              <option value="all">All Roles</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Announcements ({filteredAnnouncements.length})</span>
            <Badge variant="secondary" data-testid="text-total-announcements">
              Total: {announcements.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAnnouncements ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Loading announcements...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Announcement</TableHead>
                  <TableHead>Target Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map((announcement: any) => {
                    const author = users.find((u: any) => u.id === announcement.authorId);
                    return (
                      <TableRow key={announcement.id} data-testid={`row-announcement-${announcement.id}`}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Megaphone className="w-4 h-4 text-primary" />
                            </div>
                            <div className="max-w-md">
                              <div className="font-medium" data-testid={`text-announcement-title-${announcement.id}`}>
                                {announcement.title}
                              </div>
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {announcement.content}
                              </div>
                              {author && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  by {author.firstName} {author.lastName}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-roles-${announcement.id}`}>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1 text-muted-foreground" />
                            <div className="flex flex-wrap gap-1">
                              {(announcement.targetRoles || ['All']).map((role: string) => (
                                <Badge key={role} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={announcement.isPublished ? "default" : "secondary"}>
                            {announcement.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-created-${announcement.id}`}>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1 text-muted-foreground" />
                            {announcement.createdAt ? 
                              new Date(announcement.createdAt).toLocaleDateString() : 
                              'Unknown'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(announcement)}
                              data-testid={`button-edit-announcement-${announcement.id}`}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setAnnouncementToDelete(announcement)}
                              data-testid={`button-delete-announcement-${announcement.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No announcements found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {announcementToDelete && (
        <Dialog open={!!announcementToDelete} onOpenChange={() => setAnnouncementToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Are you sure you want to delete <strong>{announcementToDelete.title}</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setAnnouncementToDelete(null)}
                  data-testid="button-cancel-delete"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => deleteAnnouncementMutation.mutate(announcementToDelete.id)}
                  disabled={deleteAnnouncementMutation.isPending}
                  data-testid="button-confirm-delete"
                >
                  {deleteAnnouncementMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Trash2, Upload, Edit, Save, X, Image as ImageIcon } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { getApiUrl } from '@/config/api';
import PortalLayout from '@/components/layout/PortalLayout';
import { useAuth } from '@/lib/auth';
import type { HomePageContent } from '@shared/schema';

export default function HomepageManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [editingItem, setEditingItem] = useState<HomePageContent | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Form state for new uploads
  const [newContent, setNewContent] = useState({
    contentType: '',
    altText: '',
    caption: '',
    displayOrder: 0
  });

  // Fetch home page content
  const { data: homePageContent = [], isLoading } = useQuery<HomePageContent[]>({
    queryKey: ['/api/homepage-content'],
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, data }: { file: File; data: any }) => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      const formData = new FormData();
      formData.append('homePageImage', file);
      formData.append('contentType', data.contentType);
      formData.append('altText', data.altText);
      formData.append('caption', data.caption);
      formData.append('displayOrder', data.displayOrder.toString());

      const response = await fetch(getApiUrl('/api/upload/homepage'), {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/homepage-content'] });
      toast({
        title: "Success",
        description: "Home page image uploaded successfully",
      });
      setUploadFile(null);
      setNewContent({ contentType: '', altText: '', caption: '', displayOrder: 0 });
      setShowUploadForm(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<HomePageContent> }) => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      const response = await fetch(getApiUrl(`/api/homepage-content/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMessage = 'Update failed';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/homepage-content'] });
      const previousContent = queryClient.getQueryData(['/api/homepage-content']);
      
      queryClient.setQueryData(['/api/homepage-content'], (old: any) => {
        if (!old) return old;
        return old.map((item: any) => 
          item.id === id ? { ...item, ...data } : item
        );
      });
      
      return { previousContent };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/homepage-content'] });
      toast({
        title: "Success",
        description: "Home page content updated successfully",
      });
      setEditingItem(null);
    },
    onError: (error: Error, variables, context: any) => {
      if (context?.previousContent) {
        queryClient.setQueryData(['/api/homepage-content'], context.previousContent);
      }
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      const response = await fetch(getApiUrl(`/api/homepage-content/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMessage = 'Delete failed';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['/api/homepage-content'] });
      const previousContent = queryClient.getQueryData(['/api/homepage-content']);
      
      queryClient.setQueryData(['/api/homepage-content'], (old: any) => {
        if (!old) return old;
        return old.filter((item: any) => item.id !== id);
      });
      
      return { previousContent };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/homepage-content'] });
      toast({
        title: "Success",
        description: "Home page content deleted successfully",
      });
    },
    onError: (error: Error, id: number, context: any) => {
      if (context?.previousContent) {
        queryClient.setQueryData(['/api/homepage-content'], context.previousContent);
      }
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!uploadFile || !newContent.contentType) {
      toast({
        title: "Validation Error",
        description: "Please select a file and content type",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate({
      file: uploadFile,
      data: newContent
    });
  };

  const handleUpdate = (item: HomePageContent) => {
    if (!editingItem) return;
    
    updateMutation.mutate({
      id: item.id,
      data: {
        altText: editingItem.altText,
        caption: editingItem.caption,
        displayOrder: editingItem.displayOrder,
        isActive: editingItem.isActive
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this home page content?')) {
      deleteMutation.mutate(id);
    }
  };

  const contentTypes = [
    { value: 'hero_image', label: 'Hero Image' },
    { value: 'gallery_preview_1', label: 'Gallery Preview 1' },
    { value: 'gallery_preview_2', label: 'Gallery Preview 2' },
    { value: 'gallery_preview_3', label: 'Gallery Preview 3' },
    { value: 'about_section', label: 'About Section' },
    { value: 'featured_content', label: 'Featured Content' }
  ];

  if (!user) {
    return <div>Loading...</div>;
  }
  return (
    <PortalLayout 
      userRole="admin" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">Home Page Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage images and content for the school website homepage</p>
          </div>
          <Button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-primary text-primary-foreground"
            data-testid="button-add-content"
          >
            <Upload className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Upload New Home Page Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select
                    value={newContent.contentType}
                    onValueChange={(value) => setNewContent(prev => ({ ...prev, contentType: value }))}
                  >
                    <SelectTrigger data-testid="select-content-type">
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={newContent.displayOrder}
                    onChange={(e) => setNewContent(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                    data-testid="input-display-order"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Image File</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  data-testid="input-image-file"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="altText">Alt Text</Label>
                <Input
                  id="altText"
                  value={newContent.altText}
                  onChange={(e) => setNewContent(prev => ({ ...prev, altText: e.target.value }))}
                  placeholder="Descriptive text for accessibility"
                  data-testid="input-alt-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Caption (Optional)</Label>
                <Textarea
                  id="caption"
                  value={newContent.caption}
                  onChange={(e) => setNewContent(prev => ({ ...prev, caption: e.target.value }))}
                  placeholder="Optional caption for the image"
                  data-testid="textarea-caption"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending || !uploadFile || !newContent.contentType}
                  data-testid="button-upload"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadForm(false);
                    setUploadFile(null);
                    setNewContent({ contentType: '', altText: '', caption: '', displayOrder: 0 });
                  }}
                  data-testid="button-cancel-upload"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content List */}
        <Card>
          <CardHeader>
            <CardTitle>Current Home Page Content</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading home page content...</div>
            ) : homePageContent.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No home page content found. Upload some images to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {homePageContent.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 flex items-center gap-4" data-testid={`content-item-${item.id}`}>
                    {/* Image Preview */}
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.altText || 'Home page content'}
                          className="w-full h-full object-cover"
                          data-testid={`img-preview-${item.id}`}
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjEgMTlWNWMwLTEuMS0uOS0yLTItMkg1Yy0xLjEgMC0yIC45LTIgMnYxNGMwIDEuMS45IDIgMiAyaDE0YzEuMSAwIDItLjkgMi0yem0tMTAtN2wtNC01djE0aDJsNC00IDQgNGgyVjZsLTgtOHoiIGZpbGw9IiM5Y2E' +
                              'zYWYiLz48L3N2Zz4=';
                          }}
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1">
                      {editingItem?.id === item.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input
                              value={editingItem.altText || ''}
                              onChange={(e) => setEditingItem(prev => prev ? { ...prev, altText: e.target.value } : null)}
                              placeholder="Alt text"
                              data-testid={`input-edit-alt-${item.id}`}
                            />
                            <Input
                              type="number"
                              value={editingItem.displayOrder || 0}
                              onChange={(e) => setEditingItem(prev => prev ? { ...prev, displayOrder: parseInt(e.target.value) || 0 } : null)}
                              placeholder="Display order"
                              data-testid={`input-edit-order-${item.id}`}
                            />
                          </div>
                          <Textarea
                            value={editingItem.caption || ''}
                            onChange={(e) => setEditingItem(prev => prev ? { ...prev, caption: e.target.value } : null)}
                            placeholder="Caption"
                            data-testid={`textarea-edit-caption-${item.id}`}
                          />
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editingItem.isActive}
                              onCheckedChange={(checked) => setEditingItem(prev => prev ? { ...prev, isActive: checked } : null)}
                              data-testid={`switch-active-${item.id}`}
                            />
                            <Label>Active</Label>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-semibold text-lg" data-testid={`text-content-type-${item.id}`}>
                            {contentTypes.find(type => type.value === item.contentType)?.label || item.contentType}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`text-alt-text-${item.id}`}>
                            Alt Text: {item.altText || 'Not provided'}
                          </p>
                          {item.caption && (
                            <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`text-caption-${item.id}`}>
                              Caption: {item.caption}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                            <span data-testid={`text-order-${item.id}`}>Order: {item.displayOrder}</span>
                            <span data-testid={`text-status-${item.id}`} className={item.isActive ? 'text-green-600' : 'text-red-600'}>
                              {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {editingItem?.id === item.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(item)}
                            disabled={updateMutation.isPending}
                            data-testid={`button-save-${item.id}`}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingItem(null)}
                            data-testid={`button-cancel-edit-${item.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingItem(item)}
                            data-testid={`button-edit-${item.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
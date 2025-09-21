import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useState } from 'react';
import { Download, FileText, Search, Filter, BookOpen, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StudyResource, Subject } from '@shared/schema';

export default function StudentStudyResources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('');

  if (!user) {
    return <div>Please log in to access study resources.</div>;
  }

  // Fetch study resources
  const { data: studyResources = [], isLoading: loadingResources, error: resourcesError } = useQuery<StudyResource[]>({
    queryKey: ['/api/study-resources', { 
      subjectId: selectedSubject || undefined, 
      resourceType: selectedResourceType || undefined 
    }]
  });

  // Fetch subjects for filtering
  const { data: subjects = [], isLoading: loadingSubjects, error: subjectsError } = useQuery<Subject[]>({
    queryKey: ['/api/subjects']
  });

  // Filter resources based on search term
  const filteredResources = studyResources.filter((resource: StudyResource) =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle resource download
  const downloadMutation = useMutation({
    mutationFn: async ({ resourceId, fileName }: { resourceId: number; fileName: string }) => {
      const response = await fetch(`/api/study-resources/${resourceId}/download`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return fileName;
    },
    onSuccess: (fileName) => {
      toast({
        title: "Download started",
        description: `Downloading ${fileName}`,
      });
      // Invalidate and refetch study resources to update download counts
      queryClient.invalidateQueries({ queryKey: ['/api/study-resources'] });
    },
    onError: () => {
      toast({
        title: "Download failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleDownload = (resourceId: number, fileName: string) => {
    downloadMutation.mutate({ resourceId, fileName });
  };

  // Get resource type badge variant
  const getResourceTypeBadge = (type: string) => {
    switch (type) {
      case 'past_paper':
        return 'default' as const;
      case 'study_guide':
        return 'secondary' as const;
      case 'notes':
        return 'outline' as const;
      case 'assignment':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format resource type display
  const formatResourceType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Show error state if there are errors
  if (resourcesError || subjectsError) {
    return (
      <PortalLayout 
        userRole="student" 
        userName={`${user.firstName} ${user.lastName}`}
        userInitials={`${user.firstName[0]}${user.lastName[0]}`}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold">Error Loading Study Resources</h3>
              <p className="text-gray-600">
                {resourcesError?.message || subjectsError?.message || 'Something went wrong'}
              </p>
            </div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout 
      userRole="student" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Study Resources</h1>
              <p className="text-gray-600">Access study materials, past papers, and more</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter Resources</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  data-testid="input-search"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Subject Filter */}
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger data-testid="select-subject">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Subjects</SelectItem>
                  {loadingSubjects ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Resource Type Filter */}
              <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
                <SelectTrigger data-testid="select-resource-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="past_paper">Past Papers</SelectItem>
                  <SelectItem value="study_guide">Study Guides</SelectItem>
                  <SelectItem value="notes">Notes</SelectItem>
                  <SelectItem value="assignment">Assignments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loadingResources && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex justify-between items-center pt-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingResources && filteredResources.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No Study Resources Found</h3>
            <p className="mt-2 text-gray-600">
              {searchTerm || selectedSubject || selectedResourceType 
                ? "Try adjusting your search or filter criteria." 
                : "No study resources are currently available."}
            </p>
          </div>
        )}

        {/* Resources Grid */}
        {!loadingResources && filteredResources.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => {
              const badgeVariant = getResourceTypeBadge(resource.resourceType);
              const subject = subjects.find(s => s.id === resource.subjectId);
              
              return (
                <Card key={resource.id} className="hover:shadow-lg transition-shadow" data-testid={`card-resource-${resource.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2" data-testid={`text-title-${resource.id}`}>
                          {resource.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant={badgeVariant} data-testid={`badge-type-${resource.id}`}>
                            {formatResourceType(resource.resourceType)}
                          </Badge>
                          {subject && (
                            <Badge variant="outline" className="text-xs" data-testid={`badge-subject-${resource.id}`}>
                              <BookOpen className="h-3 w-3 mr-1" />
                              {subject.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {resource.description && (
                        <p className="text-sm text-gray-600 line-clamp-3" data-testid={`text-description-${resource.id}`}>
                          {resource.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span data-testid={`text-file-size-${resource.id}`}>
                          {resource.fileSize ? formatFileSize(resource.fileSize) : 'Unknown size'}
                        </span>
                        <span data-testid={`text-downloads-${resource.id}`}>
                          {resource.downloads} downloads
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-gray-400" data-testid={`text-date-${resource.id}`}>
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(resource.createdAt).toLocaleDateString()}
                        </span>
                        <Button
                          data-testid={`button-download-${resource.id}`}
                          size="sm"
                          onClick={() => handleDownload(resource.id, resource.fileName)}
                          disabled={downloadMutation.isPending}
                          className="flex items-center space-x-1"
                        >
                          <Download className="h-4 w-4" />
                          <span>
                            {downloadMutation.isPending ? 'Downloading...' : 'Download'}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {!loadingResources && (
          <div className="text-center text-sm text-gray-500" data-testid="text-summary">
            Showing {filteredResources.length} of {studyResources.length} resources
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
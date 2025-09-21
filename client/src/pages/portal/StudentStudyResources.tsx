import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Download, FileText, Search, Filter, BookOpen, Calendar, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StudyResource {
  id: number;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  resourceType: string;
  subjectId?: number;
  classId?: number;
  termId?: number;
  uploadedBy: string;
  downloads: number;
  createdAt: string;
}

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
  const { data: studyResources = [], isLoading: loadingResources } = useQuery({
    queryKey: ['study-resources', selectedSubject, selectedResourceType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSubject) params.append('subjectId', selectedSubject);
      if (selectedResourceType) params.append('resourceType', selectedResourceType);
      
      const response = await fetch(`/api/study-resources?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch study resources');
      return response.json();
    }
  });

  // Fetch subjects for filtering
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await fetch('/api/subjects', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch subjects');
      return response.json();
    }
  });

  // Filter resources based on search term
  const filteredResources = studyResources.filter((resource: StudyResource) =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle resource download
  const handleDownload = async (resourceId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/study-resources/${resourceId}/download`, {
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
      
      toast({
        title: "Download started",
        description: `Downloading ${fileName}`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get resource type badge color
  const getResourceTypeBadge = (type: string) => {
    switch (type) {
      case 'past_paper':
        return { variant: 'default' as const, color: 'bg-blue-100 text-blue-800' };
      case 'study_guide':
        return { variant: 'secondary' as const, color: 'bg-green-100 text-green-800' };
      case 'notes':
        return { variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-800' };
      case 'assignment':
        return { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' };
      default:
        return { variant: 'default' as const, color: 'bg-gray-100 text-gray-800' };
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

  return (
    <PortalLayout 
      userRole="student" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Study Resources</h1>
            <p className="text-muted-foreground">
              Access past papers, study guides, and learning materials for your subjects
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{filteredResources.length} Resources</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-study-resources"
                />
              </div>

              {/* Subject Filter */}
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger data-testid="filter-subject">
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Subjects</SelectItem>
                  {subjects.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Resource Type Filter */}
              <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
                <SelectTrigger data-testid="filter-resource-type">
                  <SelectValue placeholder="Filter by type" />
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

        {/* Resources Grid */}
        {loadingResources ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource: StudyResource) => {
              const badgeInfo = getResourceTypeBadge(resource.resourceType);
              const subject = subjects.find((s: any) => s.id === resource.subjectId);
              
              return (
                <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold line-clamp-2" title={resource.title}>
                        {resource.title}
                      </h3>
                      <Badge className={badgeInfo.color}>
                        {formatResourceType(resource.resourceType)}
                      </Badge>
                    </div>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Resource Info */}
                    <div className="space-y-2 text-sm">
                      {subject && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          <span>{subject.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{resource.fileName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        <span>{formatFileSize(resource.fileSize)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Download Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{resource.downloads} downloads</span>
                    </div>

                    {/* Download Button */}
                    <Button 
                      onClick={() => handleDownload(resource.id, resource.fileName)}
                      className="w-full"
                      data-testid={`download-resource-${resource.id}`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Study Resources Found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchTerm || selectedSubject || selectedResourceType 
                  ? "No resources match your current filters. Try adjusting your search criteria."
                  : "No study resources have been uploaded yet. Check back later for learning materials."
                }
              </p>
              {(searchTerm || selectedSubject || selectedResourceType) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSubject('');
                    setSelectedResourceType('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
}
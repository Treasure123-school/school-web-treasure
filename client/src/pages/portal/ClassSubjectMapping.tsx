import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Save, Loader2, GraduationCap, BookMarked, Palette, Briefcase, Check, X } from 'lucide-react';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { useSocketIORealtime } from '@/hooks/useSocketIORealtime';

const CATEGORY_CONFIG = {
  general: { label: 'General', icon: BookMarked, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  science: { label: 'Science', icon: GraduationCap, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  art: { label: 'Art', icon: Palette, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  commercial: { label: 'Commercial', icon: Briefcase, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
};

export default function ClassSubjectMapping() {
  const { toast } = useToast();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [pendingChanges, setPendingChanges] = useState<Map<number, boolean>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/classes');
      return await response.json();
    },
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['/api/subjects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subjects');
      return await response.json();
    },
  });

  const { data: currentMappings = [], isLoading: mappingsLoading, refetch: refetchMappings } = useQuery({
    queryKey: ['/api/class-subject-mappings', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const response = await apiRequest('GET', `/api/class-subject-mappings/${selectedClassId}`);
      return await response.json();
    },
    enabled: !!selectedClassId,
  });

  useSocketIORealtime({
    table: 'class_subject_mappings',
    queryKey: ['/api/class-subject-mappings', selectedClassId],
    enabled: !!selectedClassId,
  });

  const createMappingMutation = useMutation({
    mutationFn: async ({ classId, subjectId, isCompulsory }: { classId: number; subjectId: number; isCompulsory: boolean }) => {
      const response = await apiRequest('POST', '/api/class-subject-mappings', {
        classId,
        subjectId,
        isCompulsory,
      });
      return await response.json();
    },
    onSuccess: () => {
      refetchMappings();
    },
  });

  const deleteMappingMutation = useMutation({
    mutationFn: async (mappingId: number) => {
      const response = await apiRequest('DELETE', `/api/class-subject-mappings/${mappingId}`);
      return await response.json();
    },
    onSuccess: () => {
      refetchMappings();
    },
  });

  const selectedClass = classes.find((c: any) => c.id.toString() === selectedClassId);
  const isSeniorSecondary = selectedClass?.name?.startsWith('SS');
  const mappedSubjectIds = new Set(currentMappings.map((m: any) => m.subjectId));

  const getFilteredSubjects = () => {
    if (!selectedClass) return [];
    
    return subjects.filter((subject: any) => {
      const category = (subject.category || 'general').toLowerCase();
      if (isSeniorSecondary) {
        return true;
      } else {
        return category === 'general';
      }
    });
  };

  const handleSubjectToggle = (subjectId: number, isCurrentlyMapped: boolean) => {
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      if (newMap.has(subjectId)) {
        newMap.delete(subjectId);
      } else {
        newMap.set(subjectId, !isCurrentlyMapped);
      }
      return newMap;
    });
  };

  const isSubjectChecked = (subjectId: number) => {
    if (pendingChanges.has(subjectId)) {
      return pendingChanges.get(subjectId);
    }
    return mappedSubjectIds.has(subjectId);
  };

  const handleSaveChanges = async () => {
    if (pendingChanges.size === 0 || !selectedClassId) return;
    
    setIsSaving(true);
    try {
      const promises: Promise<any>[] = [];
      
      for (const [subjectId, shouldBeAssigned] of pendingChanges) {
        const existingMapping = currentMappings.find((m: any) => m.subjectId === subjectId);
        
        if (shouldBeAssigned && !existingMapping) {
          promises.push(
            createMappingMutation.mutateAsync({
              classId: parseInt(selectedClassId),
              subjectId,
              isCompulsory: false,
            })
          );
        } else if (!shouldBeAssigned && existingMapping) {
          promises.push(deleteMappingMutation.mutateAsync(existingMapping.id));
        }
      }
      
      await Promise.all(promises);
      
      toast({
        title: 'Changes Saved',
        description: `Successfully updated subject mappings for ${selectedClass?.name}`,
      });
      
      setPendingChanges(new Map());
      queryClient.invalidateQueries({ queryKey: ['/api/class-subject-mappings'] });
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAll = () => {
    const filteredSubjects = getFilteredSubjects();
    const newChanges = new Map<number, boolean>();
    
    filteredSubjects.forEach((subject: any) => {
      if (!mappedSubjectIds.has(subject.id)) {
        newChanges.set(subject.id, true);
      }
    });
    
    setPendingChanges(newChanges);
  };

  const handleDeselectAll = () => {
    const newChanges = new Map<number, boolean>();
    
    currentMappings.forEach((mapping: any) => {
      newChanges.set(mapping.subjectId, false);
    });
    
    setPendingChanges(newChanges);
  };

  const groupedSubjects = getFilteredSubjects().reduce((acc: any, subject: any) => {
    const category = subject.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(subject);
    return acc;
  }, {});

  return (
    <SuperAdminLayout>
      <div className="space-y-6" data-testid="class-subject-mapping">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Class Subject Mapping</h1>
            <p className="text-muted-foreground mt-1">Assign subjects to each class level</p>
          </div>
          {pendingChanges.size > 0 && (
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving}
              data-testid="button-save-changes"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes ({pendingChanges.size})
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Select Class
            </CardTitle>
            <CardDescription>Choose a class to configure its subject mappings</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedClassId} onValueChange={(value) => {
              setSelectedClassId(value);
              setPendingChanges(new Map());
            }}>
              <SelectTrigger className="w-full sm:w-80" data-testid="select-class">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()} data-testid={`option-class-${c.id}`}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedClassId && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div>
                  <CardTitle>Subjects for {selectedClass?.name}</CardTitle>
                  <CardDescription>
                    {isSeniorSecondary 
                      ? 'Senior Secondary class - All subject categories available'
                      : 'Junior class - Only General subjects available'}
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={handleSelectAll} data-testid="button-select-all">
                    <Check className="w-4 h-4 mr-1" />
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll} data-testid="button-deselect-all">
                    <X className="w-4 h-4 mr-1" />
                    Deselect All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(subjectsLoading || mappingsLoading) ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-6">
                    {Object.entries(groupedSubjects).map(([category, categorySubjects]: [string, any]) => {
                      const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.general;
                      const CategoryIcon = config.icon;
                      
                      return (
                        <div key={category} className="space-y-3">
                          <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
                            <CategoryIcon className="w-5 h-5" />
                            <h3 className="font-semibold text-lg capitalize">{config.label} Subjects</h3>
                            <Badge variant="secondary">{categorySubjects.length}</Badge>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {categorySubjects.map((subject: any) => {
                              const isChecked = isSubjectChecked(subject.id);
                              const hasPendingChange = pendingChanges.has(subject.id);
                              
                              return (
                                <div
                                  key={subject.id}
                                  className={`
                                    flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors
                                    ${hasPendingChange ? 'ring-2 ring-primary ring-offset-1' : ''}
                                    ${isChecked ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'}
                                  `}
                                  onClick={() => handleSubjectToggle(subject.id, mappedSubjectIds.has(subject.id))}
                                  data-testid={`subject-toggle-${subject.id}`}
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => handleSubjectToggle(subject.id, mappedSubjectIds.has(subject.id))}
                                    data-testid={`checkbox-subject-${subject.id}`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{subject.name}</div>
                                    <div className="text-sm text-muted-foreground">{subject.code}</div>
                                  </div>
                                  <Badge className={config.color} variant="secondary">
                                    {config.label}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedClassId && !classesLoading && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a Class</p>
                <p className="text-sm">Choose a class from the dropdown above to manage its subjects</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SuperAdminLayout>
  );
}

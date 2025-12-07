import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, Save, Loader2, GraduationCap, BookMarked, Palette, Briefcase, 
  Info, Check, X, Settings2, FileText, School, Users
} from 'lucide-react';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { useSocketIORealtime } from '@/hooks/useSocketIORealtime';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CATEGORY_CONFIG = {
  general: { label: 'General', icon: BookMarked, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  science: { label: 'Science', icon: GraduationCap, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  art: { label: 'Art', icon: Palette, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  commercial: { label: 'Commercial', icon: Briefcase, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
};

const DEPARTMENTS = [
  { value: 'science', label: 'Science', icon: GraduationCap, color: 'bg-blue-500' },
  { value: 'art', label: 'Art', icon: Palette, color: 'bg-purple-500' },
  { value: 'commercial', label: 'Commercial', icon: Briefcase, color: 'bg-amber-500' },
];

const JSS_CLASSES = ['JSS1', 'JSS2', 'JSS3'];
const SS_CLASSES = ['SS1', 'SS2', 'SS3'];

export default function ClassLevelSubjectAssignment() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'jss' | 'sss'>('jss');
  const [activeDepartment, setActiveDepartment] = useState('science');
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
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

  const jssClasses = classes.filter((c: any) => JSS_CLASSES.some(jss => c.name.startsWith(jss)));
  const ssClasses = classes.filter((c: any) => SS_CLASSES.some(ss => c.name.startsWith(ss)));

  const { data: allMappings = [], isLoading: mappingsLoading, refetch: refetchMappings } = useQuery({
    queryKey: ['/api/class-subject-mappings-all', activeTab, activeDepartment],
    queryFn: async () => {
      const targetClasses = activeTab === 'jss' ? jssClasses : ssClasses;
      const allMappingsData: any[] = [];
      
      for (const classObj of targetClasses) {
        try {
          const url = activeTab === 'sss' 
            ? `/api/class-subject-mappings/${classObj.id}?department=${activeDepartment}`
            : `/api/class-subject-mappings/${classObj.id}`;
          const response = await apiRequest('GET', url);
          const mappings = await response.json();
          allMappingsData.push(...mappings.map((m: any) => ({ ...m, classId: classObj.id, className: classObj.name })));
        } catch (e) {
          console.error('Error fetching mappings:', e);
        }
      }
      return allMappingsData;
    },
    enabled: (activeTab === 'jss' ? jssClasses : ssClasses).length > 0,
  });

  useSocketIORealtime({
    table: 'class_subject_mappings',
    queryKey: ['/api/class-subject-mappings-all', activeTab, activeDepartment],
  });

  const createMappingMutation = useMutation({
    mutationFn: async ({ classId, subjectId, department }: { classId: number; subjectId: number; department?: string }) => {
      const response = await apiRequest('POST', '/api/class-subject-mappings', {
        classId,
        subjectId,
        department: department || null,
        isCompulsory: false,
      });
      return await response.json();
    },
  });

  const deleteMappingMutation = useMutation({
    mutationFn: async (mappingId: number) => {
      const response = await apiRequest('DELETE', `/api/class-subject-mappings/${mappingId}`);
      return await response.json();
    },
  });

  const targetClasses = activeTab === 'jss' ? jssClasses : ssClasses;
  const classLabels = activeTab === 'jss' ? JSS_CLASSES : SS_CLASSES;

  const generalSubjects = subjects.filter((s: any) => (s.category || 'general').toLowerCase() === 'general');
  const departmentSpecificSubjects = subjects.filter((s: any) => {
    const cat = (s.category || 'general').toLowerCase();
    return cat === activeDepartment;
  });

  const getMappingKey = (classId: number, subjectId: number) => `${classId}-${subjectId}`;
  const mappingSet = new Set(allMappings.map((m: any) => getMappingKey(m.classId, m.subjectId)));

  const handleSubjectToggle = (classId: number, subjectId: number) => {
    const key = getMappingKey(classId, subjectId);
    const isCurrentlyMapped = mappingSet.has(key);
    
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      if (newMap.has(key)) {
        newMap.delete(key);
      } else {
        newMap.set(key, !isCurrentlyMapped);
      }
      return newMap;
    });
  };

  const isSubjectChecked = (classId: number, subjectId: number) => {
    const key = getMappingKey(classId, subjectId);
    if (pendingChanges.has(key)) {
      return pendingChanges.get(key);
    }
    return mappingSet.has(key);
  };

  const handleSaveChanges = async () => {
    if (pendingChanges.size === 0) return;
    
    setIsSaving(true);
    try {
      const promises: Promise<any>[] = [];
      
      for (const [key, shouldBeAssigned] of pendingChanges) {
        const [classIdStr, subjectIdStr] = key.split('-');
        const classId = parseInt(classIdStr);
        const subjectId = parseInt(subjectIdStr);
        
        const existingMapping = allMappings.find(
          (m: any) => m.classId === classId && m.subjectId === subjectId
        );
        
        if (shouldBeAssigned && !existingMapping) {
          promises.push(
            createMappingMutation.mutateAsync({
              classId,
              subjectId,
              department: activeTab === 'sss' ? activeDepartment : undefined,
            })
          );
        } else if (!shouldBeAssigned && existingMapping) {
          promises.push(deleteMappingMutation.mutateAsync(existingMapping.id));
        }
      }
      
      await Promise.all(promises);
      
      toast({
        title: 'Changes Saved',
        description: `Successfully updated subject assignments for ${activeTab === 'jss' ? 'Junior Secondary' : `SS ${activeDepartment} department`}`,
      });
      
      setPendingChanges(new Map());
      refetchMappings();
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

  const handleSelectAllForSubject = (subjectId: number) => {
    const newChanges = new Map(pendingChanges);
    targetClasses.forEach((classObj: any) => {
      const key = getMappingKey(classObj.id, subjectId);
      if (!mappingSet.has(key)) {
        newChanges.set(key, true);
      }
    });
    setPendingChanges(newChanges);
  };

  const handleDeselectAllForSubject = (subjectId: number) => {
    const newChanges = new Map(pendingChanges);
    targetClasses.forEach((classObj: any) => {
      const key = getMappingKey(classObj.id, subjectId);
      const existingMapping = allMappings.find(
        (m: any) => m.classId === classObj.id && m.subjectId === subjectId
      );
      if (existingMapping) {
        newChanges.set(key, false);
      } else if (newChanges.has(key) && newChanges.get(key)) {
        newChanges.delete(key);
      }
    });
    setPendingChanges(newChanges);
  };

  const SubjectGrid = ({ subjectList, title, icon: Icon }: { subjectList: any[]; title: string; icon: any }) => {
    if (subjectList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Icon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No subjects in this category</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <h3 className="font-semibold text-lg">{title}</h3>
          <Badge variant="secondary">{subjectList.length}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium min-w-[200px]">Subject</th>
                {classLabels.map((classLabel: string) => (
                  <th key={classLabel} className="text-center p-2 font-medium min-w-[80px]">
                    {classLabel}
                  </th>
                ))}
                <th className="text-center p-2 font-medium min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjectList.map((subject: any) => {
                const config = CATEGORY_CONFIG[(subject.category || 'general').toLowerCase() as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.general;
                
                return (
                  <tr key={subject.id} className="border-b hover:bg-muted/30" data-testid={`row-subject-${subject.id}`}>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium" data-testid={`text-subject-name-${subject.id}`}>{subject.name}</div>
                          <div className="text-xs text-muted-foreground">{subject.code}</div>
                        </div>
                        <Badge className={config.color} variant="secondary">
                          {config.label}
                        </Badge>
                      </div>
                    </td>
                    {classLabels.map((classLabel: string) => {
                      const classObj = targetClasses.find((c: any) => c.name.startsWith(classLabel));
                      if (!classObj) return <td key={classLabel} className="text-center p-2">-</td>;
                      
                      const isChecked = isSubjectChecked(classObj.id, subject.id);
                      const key = getMappingKey(classObj.id, subject.id);
                      const hasPendingChange = pendingChanges.has(key);
                      
                      return (
                        <td key={classLabel} className="text-center p-2">
                          <div className={`inline-flex ${hasPendingChange ? 'ring-2 ring-primary ring-offset-1 rounded' : ''}`}>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleSubjectToggle(classObj.id, subject.id)}
                              data-testid={`checkbox-${classLabel}-${subject.id}`}
                            />
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-center p-2">
                      <div className="flex gap-1 justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSelectAllForSubject(subject.id)}
                          title="Select all classes"
                          data-testid={`button-select-all-${subject.id}`}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeselectAllForSubject(subject.id)}
                          title="Deselect all classes"
                          data-testid={`button-deselect-all-${subject.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const isLoading = classesLoading || subjectsLoading || mappingsLoading;

  return (
    <SuperAdminLayout>
      <div className="space-y-6" data-testid="class-level-subject-assignment">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Settings2 className="w-7 h-7" />
              Class-Level Subject Assignment
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure which subjects are available for each class level - the single source of truth for all portals
            </p>
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

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Single Source of Truth</AlertTitle>
          <AlertDescription>
            This configuration determines which subjects appear in:
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li><FileText className="w-3 h-3 inline mr-1" />Report cards - Only assigned subjects will appear</li>
              <li><School className="w-3 h-3 inline mr-1" />Exam creation - Teachers can only create exams for assigned subjects</li>
              <li><Users className="w-3 h-3 inline mr-1" />Student portal - Students will only see subjects assigned to their class/department</li>
              <li><BookOpen className="w-3 h-3 inline mr-1" />Teacher assignments - Subject options filtered by this configuration</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            setActiveTab(value as 'jss' | 'sss');
            setPendingChanges(new Map());
          }}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="jss" className="gap-2" data-testid="tab-jss">
              <School className="w-4 h-4" />
              <span>Junior Secondary (JSS1-JSS3)</span>
            </TabsTrigger>
            <TabsTrigger value="sss" className="gap-2" data-testid="tab-sss">
              <GraduationCap className="w-4 h-4" />
              <span>Senior Secondary (SS1-SS3)</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jss">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="w-5 h-5" />
                  Junior Secondary Subject Configuration
                </CardTitle>
                <CardDescription>
                  Configure general subjects for JSS1, JSS2, and JSS3 classes. Junior students only take general subjects.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-8 pr-4">
                      <SubjectGrid 
                        subjectList={generalSubjects} 
                        title="General Subjects" 
                        icon={BookMarked} 
                      />
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sss">
            <div className="space-y-4">
              <Tabs 
                value={activeDepartment} 
                onValueChange={(value) => {
                  setActiveDepartment(value);
                  setPendingChanges(new Map());
                }}
              >
                <TabsList className="grid w-full grid-cols-3">
                  {DEPARTMENTS.map(dept => {
                    const DeptIcon = dept.icon;
                    return (
                      <TabsTrigger
                        key={dept.value}
                        value={dept.value}
                        className="gap-2"
                        data-testid={`tab-dept-${dept.value}`}
                      >
                        <DeptIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">{dept.label}</span>
                        <span className="sm:hidden capitalize">{dept.value}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {DEPARTMENTS.map(dept => (
                  <TabsContent key={dept.value} value={dept.value}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <dept.icon className="w-5 h-5" />
                          {dept.label} Department - Subject Configuration
                        </CardTitle>
                        <CardDescription>
                          Configure which subjects are available for {dept.label.toLowerCase()} students in SS1, SS2, and SS3.
                          General subjects are shared across all departments.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                              <Skeleton key={i} className="h-16 w-full" />
                            ))}
                          </div>
                        ) : (
                          <ScrollArea className="h-[500px]">
                            <div className="space-y-8 pr-4">
                              <SubjectGrid 
                                subjectList={generalSubjects} 
                                title="General Subjects (All Departments)" 
                                icon={BookMarked} 
                              />
                              <SubjectGrid 
                                subjectList={departmentSpecificSubjects} 
                                title={`${dept.label} Specific Subjects`} 
                                icon={dept.icon} 
                              />
                            </div>
                          </ScrollArea>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>

        {targetClasses.length === 0 && !isLoading && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <School className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Classes Found</p>
                <p className="text-sm">
                  {activeTab === 'jss' 
                    ? 'No JSS classes (JSS1, JSS2, JSS3) found in the system.' 
                    : 'No SS classes (SS1, SS2, SS3) found in the system.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SuperAdminLayout>
  );
}

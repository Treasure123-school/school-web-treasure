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
import { Building, Save, Loader2, GraduationCap, Palette, Briefcase, BookMarked, Info } from 'lucide-react';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { useSocketIORealtime } from '@/hooks/useSocketIORealtime';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const DEPARTMENTS = [
  { value: 'science', label: 'Science Department', icon: GraduationCap, color: 'bg-blue-500' },
  { value: 'art', label: 'Art Department', icon: Palette, color: 'bg-purple-500' },
  { value: 'commercial', label: 'Commercial Department', icon: Briefcase, color: 'bg-amber-500' },
];

const SS_CLASSES = ['SS1', 'SS2', 'SS3'];

export default function DepartmentSubjectMapping() {
  const { toast } = useToast();
  const [activeDepartment, setActiveDepartment] = useState('science');
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  const { data: classes = [] } = useQuery({
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

  const ssClasses = classes.filter((c: any) => SS_CLASSES.some(ss => c.name.startsWith(ss)));

  const { data: departmentMappings = [], isLoading: mappingsLoading, refetch: refetchMappings } = useQuery({
    queryKey: ['/api/department-subject-mappings', activeDepartment],
    queryFn: async () => {
      const allMappings: any[] = [];
      for (const ssClass of ssClasses) {
        try {
          const response = await apiRequest('GET', `/api/class-subject-mappings/${ssClass.id}?department=${activeDepartment}`);
          const mappings = await response.json();
          allMappings.push(...mappings.map((m: any) => ({ ...m, classId: ssClass.id, className: ssClass.name })));
        } catch (e) {
        }
      }
      return allMappings;
    },
    enabled: ssClasses.length > 0,
  });

  useSocketIORealtime({
    table: 'class_subject_mappings',
    queryKey: ['/api/department-subject-mappings', activeDepartment],
  });

  const createMappingMutation = useMutation({
    mutationFn: async ({ classId, subjectId, department }: { classId: number; subjectId: number; department: string }) => {
      const response = await apiRequest('POST', '/api/class-subject-mappings', {
        classId,
        subjectId,
        department,
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

  const departmentSubjects = subjects.filter((s: any) => {
    const category = (s.category || 'general').toLowerCase();
    return category === activeDepartment || category === 'general';
  });

  const generalSubjects = subjects.filter((s: any) => (s.category || 'general').toLowerCase() === 'general');
  const specificSubjects = subjects.filter((s: any) => (s.category || 'general').toLowerCase() === activeDepartment);

  const getMappingKey = (classId: number, subjectId: number) => `${classId}-${subjectId}`;
  const mappingSet = new Set(departmentMappings.map((m: any) => getMappingKey(m.classId, m.subjectId)));

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
        
        const existingMapping = departmentMappings.find(
          (m: any) => m.classId === classId && m.subjectId === subjectId
        );
        
        if (shouldBeAssigned && !existingMapping) {
          promises.push(
            createMappingMutation.mutateAsync({
              classId,
              subjectId,
              department: activeDepartment,
            })
          );
        } else if (!shouldBeAssigned && existingMapping) {
          promises.push(deleteMappingMutation.mutateAsync(existingMapping.id));
        }
      }
      
      await Promise.all(promises);
      
      toast({
        title: 'Changes Saved',
        description: `Successfully updated ${activeDepartment} department mappings`,
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

  const SubjectGrid = ({ subjectList, title, icon: Icon }: { subjectList: any[]; title: string; icon: any }) => (
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
              <th className="text-left p-2 font-medium">Subject</th>
              {ssClasses.map((ssClass: string) => {
                const classObj = classes.find((c: any) => c.name.startsWith(ssClass));
                return (
                  <th key={ssClass} className="text-center p-2 font-medium min-w-[80px]">
                    {ssClass}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {subjectList.map((subject: any) => (
              <tr key={subject.id} className="border-b hover:bg-muted/50" data-testid={`row-subject-${subject.id}`}>
                <td className="p-2">
                  <div className="font-medium" data-testid={`text-subject-name-${subject.id}`}>{subject.name}</div>
                  <div className="text-xs text-muted-foreground">{subject.code}</div>
                </td>
                {ssClasses.map((ssClass: string) => {
                  const classObj = classes.find((c: any) => c.name.startsWith(ssClass));
                  if (!classObj) return <td key={ssClass} className="text-center p-2">-</td>;
                  
                  const isChecked = isSubjectChecked(classObj.id, subject.id);
                  const key = getMappingKey(classObj.id, subject.id);
                  const hasPendingChange = pendingChanges.has(key);
                  
                  return (
                    <td key={ssClass} className="text-center p-2">
                      <div className={`inline-flex ${hasPendingChange ? 'ring-2 ring-primary ring-offset-1 rounded' : ''}`}>
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleSubjectToggle(classObj.id, subject.id)}
                          data-testid={`checkbox-${ssClass}-${subject.id}`}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6" data-testid="department-subject-mapping">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Department Subject Mapping</h1>
            <p className="text-muted-foreground mt-1">Configure subjects for SS1-SS3 departments</p>
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
          <AlertTitle>Department Subject Configuration</AlertTitle>
          <AlertDescription>
            Configure which subjects are available for each department in Senior Secondary (SS1-SS3) classes. 
            General subjects apply to all departments, while department-specific subjects are only shown for students in that department.
          </AlertDescription>
        </Alert>

        <Tabs value={activeDepartment} onValueChange={(value) => {
          setActiveDepartment(value);
          setPendingChanges(new Map());
        }}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {DEPARTMENTS.map(dept => {
              const DeptIcon = dept.icon;
              return (
                <TabsTrigger
                  key={dept.value}
                  value={dept.value}
                  className="gap-2"
                  data-testid={`tab-${dept.value}`}
                >
                  <DeptIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{dept.label}</span>
                  <span className="sm:hidden">{dept.value}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {DEPARTMENTS.map(dept => (
            <TabsContent key={dept.value} value={dept.value}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    {dept.label} - Subject Configuration
                  </CardTitle>
                  <CardDescription>
                    Select which subjects should be available for {dept.label.toLowerCase()} students in each SS class
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(subjectsLoading || mappingsLoading) ? (
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
                          subjectList={specificSubjects} 
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
    </SuperAdminLayout>
  );
}

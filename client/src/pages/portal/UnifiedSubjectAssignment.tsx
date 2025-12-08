import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Loader2, 
  BookMarked, 
  GraduationCap, 
  Palette, 
  Briefcase, 
  Info, 
  CheckCircle2,
  School,
  Users,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import SuperAdminLayout from '@/components/SuperAdminLayout';

const JSS_CLASSES = ['JSS1', 'JSS2', 'JSS3'];
const SSS_CLASSES = ['SS1', 'SS2', 'SS3'];
const DEPARTMENTS = ['science', 'art', 'commercial'] as const;

const CATEGORY_CONFIG = {
  general: { label: 'General', icon: BookMarked, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', description: 'Core subjects for all students' },
  science: { label: 'Science', icon: GraduationCap, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', description: 'Science department subjects' },
  art: { label: 'Art', icon: Palette, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', description: 'Art department subjects' },
  commercial: { label: 'Commercial', icon: Briefcase, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', description: 'Commercial department subjects' },
};

const DEPARTMENT_CONFIG = {
  science: { label: 'Science Department', icon: GraduationCap, color: 'bg-blue-500', bgLight: 'bg-blue-50 dark:bg-blue-950' },
  art: { label: 'Art Department', icon: Palette, color: 'bg-purple-500', bgLight: 'bg-purple-50 dark:bg-purple-950' },
  commercial: { label: 'Commercial Department', icon: Briefcase, color: 'bg-amber-500', bgLight: 'bg-amber-50 dark:bg-amber-950' },
};

interface Subject {
  id: number;
  name: string;
  code: string;
  category: string;
  isActive: boolean;
}

interface ClassInfo {
  id: number;
  name: string;
  level: string;
}

interface SubjectAssignment {
  classId: number;
  subjectId: number;
  department: string | null;
  isCompulsory: boolean;
}

export default function UnifiedSubjectAssignment() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'jss' | 'sss'>('jss');
  const [pendingChanges, setPendingChanges] = useState<Map<string, SubjectAssignment>>(new Map());
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subjects');
      return await response.json();
    },
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery<ClassInfo[]>({
    queryKey: ['/api/classes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/classes');
      return await response.json();
    },
  });

  const { data: currentAssignments = [], isLoading: assignmentsLoading, refetch: refetchAssignments } = useQuery<SubjectAssignment[]>({
    queryKey: ['/api/unified-subject-assignments'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/unified-subject-assignments');
      return await response.json();
    },
  });

  const activeSubjects = useMemo(() => subjects.filter(s => s.isActive), [subjects]);
  
  const generalSubjects = useMemo(() => activeSubjects.filter(s => s.category === 'general'), [activeSubjects]);
  const scienceSubjects = useMemo(() => activeSubjects.filter(s => s.category === 'science'), [activeSubjects]);
  const artSubjects = useMemo(() => activeSubjects.filter(s => s.category === 'art'), [activeSubjects]);
  const commercialSubjects = useMemo(() => activeSubjects.filter(s => s.category === 'commercial'), [activeSubjects]);

  const jssClasses = useMemo(() => 
    classes.filter(c => JSS_CLASSES.some(jss => c.name.startsWith(jss))).sort((a, b) => a.name.localeCompare(b.name)),
    [classes]
  );

  const sssClasses = useMemo(() => 
    classes.filter(c => SSS_CLASSES.some(sss => c.name.startsWith(sss))).sort((a, b) => a.name.localeCompare(b.name)),
    [classes]
  );

  const getAssignmentKey = (classId: number, subjectId: number, department: string | null) => 
    `${classId}-${subjectId}-${department || 'null'}`;

  const isSubjectAssigned = (classId: number, subjectId: number, department: string | null = null): boolean => {
    const key = getAssignmentKey(classId, subjectId, department);
    
    if (pendingRemovals.has(key)) return false;
    if (pendingChanges.has(key)) return true;
    
    return currentAssignments.some(a => 
      a.classId === classId && 
      a.subjectId === subjectId && 
      (department === null ? a.department === null : a.department === department)
    );
  };

  const toggleSubjectAssignment = (classId: number, subjectId: number, department: string | null = null, checked?: boolean | 'indeterminate') => {
    if (checked === 'indeterminate') return;
    
    const key = getAssignmentKey(classId, subjectId, department);
    const isCurrentlyAssigned = isSubjectAssigned(classId, subjectId, department);
    
    const shouldAssign = checked === true ? true : checked === false ? false : !isCurrentlyAssigned;
    
    if (!shouldAssign) {
      const existsInDB = currentAssignments.some(a => 
        a.classId === classId && 
        a.subjectId === subjectId && 
        (department === null ? a.department === null : a.department === department)
      );
      
      if (existsInDB) {
        setPendingRemovals(prev => new Set([...prev, key]));
        setPendingChanges(prev => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      } else {
        setPendingChanges(prev => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }
    } else {
      setPendingRemovals(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setPendingChanges(prev => new Map(prev).set(key, {
        classId,
        subjectId,
        department,
        isCompulsory: false
      }));
    }
  };

  const toggleAllJSSSubjects = (subjectId: number, checked: boolean | 'indeterminate') => {
    if (checked === 'indeterminate') return;
    
    jssClasses.forEach(cls => {
      const key = getAssignmentKey(cls.id, subjectId, null);
      const isCurrentlyAssigned = isSubjectAssigned(cls.id, subjectId, null);
      
      if (checked && !isCurrentlyAssigned) {
        setPendingRemovals(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        setPendingChanges(prev => new Map(prev).set(key, {
          classId: cls.id,
          subjectId,
          department: null,
          isCompulsory: false
        }));
      } else if (!checked && isCurrentlyAssigned) {
        const existsInDB = currentAssignments.some(a => 
          a.classId === cls.id && a.subjectId === subjectId && a.department === null
        );
        if (existsInDB) {
          setPendingRemovals(prev => new Set([...prev, key]));
        }
        setPendingChanges(prev => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }
    });
  };

  const toggleAllSSSSubjectsForDept = (subjectId: number, department: string, checked: boolean | 'indeterminate') => {
    if (checked === 'indeterminate') return;
    
    sssClasses.forEach(cls => {
      const key = getAssignmentKey(cls.id, subjectId, department);
      const isCurrentlyAssigned = isSubjectAssigned(cls.id, subjectId, department);
      
      if (checked && !isCurrentlyAssigned) {
        setPendingRemovals(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        setPendingChanges(prev => new Map(prev).set(key, {
          classId: cls.id,
          subjectId,
          department,
          isCompulsory: false
        }));
      } else if (!checked && isCurrentlyAssigned) {
        const existsInDB = currentAssignments.some(a => 
          a.classId === cls.id && a.subjectId === subjectId && a.department === department
        );
        if (existsInDB) {
          setPendingRemovals(prev => new Set([...prev, key]));
        }
        setPendingChanges(prev => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }
    });
  };

  const areAllJSSAssigned = (subjectId: number): boolean => {
    return jssClasses.every(cls => isSubjectAssigned(cls.id, subjectId, null));
  };

  const areAllSSSAssignedForDept = (subjectId: number, department: string): boolean => {
    return sssClasses.every(cls => isSubjectAssigned(cls.id, subjectId, department));
  };

  const hasPendingChanges = pendingChanges.size > 0 || pendingRemovals.size > 0;

  const saveChanges = async () => {
    if (!hasPendingChanges) return;
    
    setIsSaving(true);
    try {
      const additions = Array.from(pendingChanges.values());
      const removals = Array.from(pendingRemovals).map(key => {
        const [classId, subjectId, department] = key.split('-');
        return {
          classId: parseInt(classId),
          subjectId: parseInt(subjectId),
          department: department === 'null' ? null : department
        };
      });

      await apiRequest('PUT', '/api/unified-subject-assignments', {
        additions,
        removals
      });

      toast({
        title: 'Changes saved',
        description: `${additions.length} assignments added, ${removals.length} removed.`,
      });

      setPendingChanges(new Map());
      setPendingRemovals(new Set());
      
      await queryClient.invalidateQueries({ queryKey: ['/api/unified-subject-assignments'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/class-subject-mappings'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      
      await refetchAssignments();
    } catch (error: any) {
      toast({
        title: 'Error saving changes',
        description: error.message || 'Failed to save subject assignments',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    setPendingChanges(new Map());
    setPendingRemovals(new Set());
    toast({
      title: 'Changes discarded',
      description: 'All pending changes have been reverted.',
    });
  };

  const isLoading = subjectsLoading || classesLoading || assignmentsLoading;

  const getJSSAssignmentCount = () => {
    let count = 0;
    jssClasses.forEach(cls => {
      activeSubjects.forEach(subj => {
        if (isSubjectAssigned(cls.id, subj.id, null)) count++;
      });
    });
    return count;
  };

  const getSSSAssignmentCount = (department: string) => {
    let count = 0;
    sssClasses.forEach(cls => {
      activeSubjects.forEach(subj => {
        if (isSubjectAssigned(cls.id, subj.id, department)) count++;
      });
    });
    return count;
  };

  const renderSubjectCheckbox = (subject: Subject, classId: number, department: string | null = null) => {
    const isAssigned = isSubjectAssigned(classId, subject.id, department);
    const key = getAssignmentKey(classId, subject.id, department);
    const isPending = pendingChanges.has(key) || pendingRemovals.has(key);
    const config = CATEGORY_CONFIG[subject.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.general;

    return (
      <div 
        key={`${classId}-${subject.id}-${department}`}
        className={`flex items-center gap-2 p-2 rounded-md transition-colors ${isPending ? 'bg-yellow-50 dark:bg-yellow-950/30' : ''} ${isSaving ? 'opacity-70' : ''}`}
      >
        <Checkbox
          id={key}
          checked={isAssigned}
          disabled={isSaving}
          onCheckedChange={(checked) => toggleSubjectAssignment(classId, subject.id, department, checked)}
          data-testid={`checkbox-subject-${subject.id}-class-${classId}${department ? `-dept-${department}` : ''}`}
        />
        <label htmlFor={key} className={`flex items-center gap-2 text-sm flex-1 ${isSaving ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <span>{subject.name}</span>
          <Badge className={`text-xs ${config.color}`}>{subject.code}</Badge>
          {isPending && <Badge variant="outline" className="text-xs text-yellow-600">Pending</Badge>}
        </label>
      </div>
    );
  };

  const renderSubjectCategory = (
    title: string,
    subjects: Subject[],
    classId: number,
    department: string | null = null,
    icon: React.ReactNode
  ) => {
    if (subjects.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          <span>{title}</span>
          <Badge variant="secondary" className="text-xs">{subjects.length} subjects</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {subjects.map(subject => renderSubjectCheckbox(subject, classId, department))}
        </div>
      </div>
    );
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <School className="h-6 w-6" />
              Class-Level & Department Subject Assignment
            </h1>
            <p className="text-muted-foreground mt-1">
              Centralized configuration for all subject visibility across the school portal
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasPendingChanges && (
              <>
                <Button 
                  variant="outline" 
                  onClick={discardChanges}
                  disabled={isSaving}
                  data-testid="button-discard-changes"
                >
                  Discard
                </Button>
                <Button 
                  onClick={saveChanges}
                  disabled={isSaving}
                  data-testid="button-save-changes"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes ({pendingChanges.size + pendingRemovals.size})
                    </>
                  )}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchAssignments()}
              disabled={isLoading}
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Single Source of Truth</AlertTitle>
          <AlertDescription>
            This configuration controls subject visibility across the entire system: report cards, exam creation, 
            student portals, and teacher assignments. Changes apply instantly to all areas.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'jss' | 'sss')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="jss" className="flex items-center gap-2" data-testid="tab-jss">
                <Users className="w-4 h-4" />
                Junior Secondary (JSS1-JSS3)
                <Badge variant="secondary" className="text-xs">{getJSSAssignmentCount()}</Badge>
              </TabsTrigger>
              <TabsTrigger value="sss" className="flex items-center gap-2" data-testid="tab-sss">
                <GraduationCap className="w-4 h-4" />
                Senior Secondary (SS1-SS3)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="jss" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    JSS Subject Assignments
                  </CardTitle>
                  <CardDescription>
                    Configure which subjects are visible to Junior Secondary School students (JSS1, JSS2, JSS3).
                    All JSS students see the same subjects regardless of department.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-3">Quick Actions - Assign to All JSS Classes</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <BookMarked className="w-4 h-4" /> General Subjects
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {generalSubjects.map(subject => (
                            <div key={subject.id} className="flex items-center gap-2 p-2 bg-background rounded-md border">
                              <Checkbox
                                id={`jss-all-${subject.id}`}
                                checked={areAllJSSAssigned(subject.id)}
                                onCheckedChange={(checked) => toggleAllJSSSubjects(subject.id, checked)}
                                data-testid={`checkbox-jss-all-${subject.id}`}
                              />
                              <label htmlFor={`jss-all-${subject.id}`} className="text-sm cursor-pointer">
                                {subject.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Accordion type="multiple" defaultValue={jssClasses.map(c => c.id.toString())}>
                    {jssClasses.map(cls => (
                      <AccordionItem key={cls.id} value={cls.id.toString()}>
                        <AccordionTrigger className="hover:no-underline" data-testid={`accordion-class-${cls.id}`}>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{cls.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {activeSubjects.filter(s => isSubjectAssigned(cls.id, s.id, null)).length} subjects
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <ScrollArea className="h-auto max-h-[400px]">
                            <div className="space-y-6 pr-4">
                              {renderSubjectCategory('General Subjects', generalSubjects, cls.id, null, <BookMarked className="w-4 h-4" />)}
                              {renderSubjectCategory('Science Subjects', scienceSubjects, cls.id, null, <GraduationCap className="w-4 h-4" />)}
                              {renderSubjectCategory('Art Subjects', artSubjects, cls.id, null, <Palette className="w-4 h-4" />)}
                              {renderSubjectCategory('Commercial Subjects', commercialSubjects, cls.id, null, <Briefcase className="w-4 h-4" />)}
                            </div>
                          </ScrollArea>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sss" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    SSS Subject Assignments by Department
                  </CardTitle>
                  <CardDescription>
                    Configure subjects for each department. SSS students see subjects based on their assigned department 
                    (Science, Art, or Commercial). General subjects can be shared across departments.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="science">
                    <TabsList className="grid w-full grid-cols-3">
                      {DEPARTMENTS.map(dept => {
                        const config = DEPARTMENT_CONFIG[dept];
                        const Icon = config.icon;
                        return (
                          <TabsTrigger key={dept} value={dept} className="flex items-center gap-2" data-testid={`tab-dept-${dept}`}>
                            <Icon className="w-4 h-4" />
                            {config.label}
                            <Badge variant="secondary" className="text-xs">{getSSSAssignmentCount(dept)}</Badge>
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>

                    {DEPARTMENTS.map(dept => {
                      const config = DEPARTMENT_CONFIG[dept];
                      const Icon = config.icon;
                      const deptSubjects = activeSubjects.filter(s => s.category === dept);

                      return (
                        <TabsContent key={dept} value={dept} className="space-y-4">
                          <div className={`p-4 rounded-lg ${config.bgLight}`}>
                            <h3 className="font-medium mb-3 flex items-center gap-2">
                              <Icon className="w-5 h-5" />
                              Quick Actions - Assign to All SSS Classes ({config.label})
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">General Subjects</h4>
                                <div className="flex flex-wrap gap-2">
                                  {generalSubjects.map(subject => (
                                    <div key={subject.id} className="flex items-center gap-2 p-2 bg-background rounded-md border">
                                      <Checkbox
                                        id={`sss-${dept}-all-general-${subject.id}`}
                                        checked={areAllSSSAssignedForDept(subject.id, dept)}
                                        onCheckedChange={(checked) => toggleAllSSSSubjectsForDept(subject.id, dept, checked)}
                                        data-testid={`checkbox-sss-${dept}-all-${subject.id}`}
                                      />
                                      <label htmlFor={`sss-${dept}-all-general-${subject.id}`} className="text-sm cursor-pointer">
                                        {subject.name}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">{config.label} Specific Subjects</h4>
                                <div className="flex flex-wrap gap-2">
                                  {deptSubjects.map(subject => (
                                    <div key={subject.id} className="flex items-center gap-2 p-2 bg-background rounded-md border">
                                      <Checkbox
                                        id={`sss-${dept}-all-${subject.id}`}
                                        checked={areAllSSSAssignedForDept(subject.id, dept)}
                                        onCheckedChange={(checked) => toggleAllSSSSubjectsForDept(subject.id, dept, checked)}
                                        data-testid={`checkbox-sss-${dept}-all-specific-${subject.id}`}
                                      />
                                      <label htmlFor={`sss-${dept}-all-${subject.id}`} className="text-sm cursor-pointer">
                                        {subject.name}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <Accordion type="multiple" defaultValue={sssClasses.map(c => c.id.toString())}>
                            {sssClasses.map(cls => (
                              <AccordionItem key={cls.id} value={cls.id.toString()}>
                                <AccordionTrigger className="hover:no-underline" data-testid={`accordion-class-${cls.id}-dept-${dept}`}>
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium">{cls.name}</span>
                                    <Badge className={config.color}>{config.label}</Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {activeSubjects.filter(s => isSubjectAssigned(cls.id, s.id, dept)).length} subjects
                                    </Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4">
                                  <ScrollArea className="h-auto max-h-[400px]">
                                    <div className="space-y-6 pr-4">
                                      {renderSubjectCategory('General Subjects', generalSubjects, cls.id, dept, <BookMarked className="w-4 h-4" />)}
                                      {renderSubjectCategory(`${config.label} Subjects`, deptSubjects, cls.id, dept, <Icon className="w-4 h-4" />)}
                                    </div>
                                  </ScrollArea>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {hasPendingChanges && (
          <div className="fixed bottom-4 right-4 z-50">
            <Card className="shadow-lg border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <Info className="w-5 h-5" />
                  <span className="font-medium">
                    {pendingChanges.size + pendingRemovals.size} unsaved changes
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={discardChanges} disabled={isSaving}>
                    Discard
                  </Button>
                  <Button size="sm" onClick={saveChanges} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}

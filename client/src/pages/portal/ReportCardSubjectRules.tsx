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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileText, Save, Loader2, BookMarked, GraduationCap, Palette, Briefcase, Info, Settings, CheckCircle2 } from 'lucide-react';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CLASS_GROUPS = [
  { id: 'junior', label: 'Junior Classes (KG1-JSS3)', classes: ['KG1', 'KG2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'JSS1', 'JSS2', 'JSS3'] },
  { id: 'senior', label: 'Senior Classes (SS1-SS3)', classes: ['SS1', 'SS2', 'SS3'] },
];

const CATEGORY_CONFIG = {
  general: { label: 'General', icon: BookMarked, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  science: { label: 'Science', icon: GraduationCap, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  art: { label: 'Art', icon: Palette, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  commercial: { label: 'Commercial', icon: Briefcase, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
};

export default function ReportCardSubjectRules() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('junior');
  const [pendingChanges, setPendingChanges] = useState<Map<string, any>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['/api/subjects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subjects');
      return await response.json();
    },
  });

  const { data: reportRules = {}, isLoading: rulesLoading, refetch: refetchRules } = useQuery({
    queryKey: ['/api/report-card-rules'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/settings?key=report_card_subject_rules');
        const data = await response.json();
        return data.value ? JSON.parse(data.value) : getDefaultRules();
      } catch (e) {
        return getDefaultRules();
      }
    },
  });

  const getDefaultRules = () => {
    const rules: any = {
      junior: {
        showGeneralSubjects: true,
        showDepartmentSubjects: false,
        subjectVisibility: {},
      },
      senior: {
        showGeneralSubjects: true,
        showDepartmentSubjects: true,
        respectStudentDepartment: true,
        subjectVisibility: {},
      },
    };
    return rules;
  };

  const saveRulesMutation = useMutation({
    mutationFn: async (rules: any) => {
      const response = await apiRequest('PUT', '/api/settings', {
        key: 'report_card_subject_rules',
        value: JSON.stringify(rules),
        description: 'Report card subject visibility rules',
        dataType: 'json',
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Rules Saved',
        description: 'Report card subject rules have been updated',
      });
      refetchRules();
      queryClient.invalidateQueries({ queryKey: ['/api/report-card-rules'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save rules',
        variant: 'destructive',
      });
    },
  });

  const getCurrentRules = () => {
    const baseRules = reportRules || getDefaultRules();
    const mergedRules = { ...baseRules };
    
    for (const [key, value] of pendingChanges) {
      const [section, field, subjectId] = key.split('.');
      if (subjectId) {
        if (!mergedRules[section]) mergedRules[section] = {};
        if (!mergedRules[section].subjectVisibility) mergedRules[section].subjectVisibility = {};
        mergedRules[section].subjectVisibility[subjectId] = value;
      } else {
        if (!mergedRules[section]) mergedRules[section] = {};
        mergedRules[section][field] = value;
      }
    }
    
    return mergedRules;
  };

  const handleToggle = (section: string, field: string, value: boolean, subjectId?: string) => {
    const key = subjectId ? `${section}.${field}.${subjectId}` : `${section}.${field}`;
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      newMap.set(key, value);
      return newMap;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveRulesMutation.mutateAsync(getCurrentRules());
      setPendingChanges(new Map());
    } finally {
      setIsSaving(false);
    }
  };

  const isSubjectVisible = (section: string, subjectId: number) => {
    const rules = getCurrentRules();
    const sectionRules = rules[section] || {};
    
    if (sectionRules.subjectVisibility && sectionRules.subjectVisibility[subjectId] !== undefined) {
      return sectionRules.subjectVisibility[subjectId];
    }
    
    return true;
  };

  const generalSubjects = subjects.filter((s: any) => (s.category || 'general').toLowerCase() === 'general');
  const departmentSubjects = subjects.filter((s: any) => ['science', 'art', 'commercial'].includes((s.category || 'general').toLowerCase()));

  const currentRules = getCurrentRules();

  return (
    <SuperAdminLayout>
      <div className="space-y-6" data-testid="report-card-rules">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Report Card Subject Rules</h1>
            <p className="text-muted-foreground mt-1">Configure which subjects appear on student report cards</p>
          </div>
          {pendingChanges.size > 0 && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              data-testid="button-save-rules"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          )}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Report Card Configuration</AlertTitle>
          <AlertDescription>
            These rules determine which subjects appear on student report cards based on their class level and department.
            Junior classes (KG1-JSS3) typically show only General subjects, while Senior classes (SS1-SS3) show both General and department-specific subjects.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="junior" className="gap-2" data-testid="tab-junior">
              <GraduationCap className="w-4 h-4" />
              Junior Classes (KG1-JSS3)
            </TabsTrigger>
            <TabsTrigger value="senior" className="gap-2" data-testid="tab-senior">
              <FileText className="w-4 h-4" />
              Senior Classes (SS1-SS3)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="junior">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Junior Classes Configuration
                </CardTitle>
                <CardDescription>
                  Configure report card settings for KG1 through JSS3
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Show General Subjects</Label>
                    <p className="text-sm text-muted-foreground">
                      Display General category subjects on junior class report cards
                    </p>
                  </div>
                  <Switch
                    checked={currentRules.junior?.showGeneralSubjects ?? true}
                    onCheckedChange={(checked) => handleToggle('junior', 'showGeneralSubjects', checked)}
                    data-testid="switch-junior-general"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-5 h-5" />
                    <h3 className="font-semibold">General Subjects Visibility</h3>
                    <Badge variant="secondary">{generalSubjects.length} subjects</Badge>
                  </div>
                  
                  {subjectsLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : (
                    <ScrollArea className="h-[300px] border rounded-md p-4">
                      <div className="space-y-2">
                        {generalSubjects.map((subject: any) => (
                          <div
                            key={subject.id}
                            className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50"
                            data-testid={`subject-junior-${subject.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isSubjectVisible('junior', subject.id)}
                                onCheckedChange={(checked) => handleToggle('junior', 'subjectVisibility', !!checked, subject.id.toString())}
                                data-testid={`checkbox-junior-subject-${subject.id}`}
                              />
                              <div>
                                <div className="font-medium">{subject.name}</div>
                                <div className="text-sm text-muted-foreground">{subject.code}</div>
                              </div>
                            </div>
                            {isSubjectVisible('junior', subject.id) && (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="senior">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Senior Classes Configuration
                </CardTitle>
                <CardDescription>
                  Configure report card settings for SS1 through SS3
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Show General Subjects</Label>
                      <p className="text-sm text-muted-foreground">
                        Display General category subjects on senior class report cards
                      </p>
                    </div>
                    <Switch
                      checked={currentRules.senior?.showGeneralSubjects ?? true}
                      onCheckedChange={(checked) => handleToggle('senior', 'showGeneralSubjects', checked)}
                      data-testid="switch-senior-general"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Show Department Subjects</Label>
                      <p className="text-sm text-muted-foreground">
                        Display department-specific subjects (Science, Art, Commercial) on report cards
                      </p>
                    </div>
                    <Switch
                      checked={currentRules.senior?.showDepartmentSubjects ?? true}
                      onCheckedChange={(checked) => handleToggle('senior', 'showDepartmentSubjects', checked)}
                      data-testid="switch-senior-department"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Respect Student Department</Label>
                      <p className="text-sm text-muted-foreground">
                        Only show department subjects that match the student's assigned department
                      </p>
                    </div>
                    <Switch
                      checked={currentRules.senior?.respectStudentDepartment ?? true}
                      onCheckedChange={(checked) => handleToggle('senior', 'respectStudentDepartment', checked)}
                      data-testid="switch-respect-department"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-5 h-5" />
                    <h3 className="font-semibold">General Subjects</h3>
                    <Badge variant="secondary">{generalSubjects.length}</Badge>
                  </div>
                  
                  <ScrollArea className="h-[200px] border rounded-md p-4">
                    <div className="space-y-2">
                      {generalSubjects.map((subject: any) => (
                        <div
                          key={subject.id}
                          className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50"
                          data-testid={`subject-senior-general-${subject.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSubjectVisible('senior', subject.id)}
                              onCheckedChange={(checked) => handleToggle('senior', 'subjectVisibility', !!checked, subject.id.toString())}
                              data-testid={`checkbox-senior-general-${subject.id}`}
                            />
                            <div>
                              <div className="font-medium">{subject.name}</div>
                              <div className="text-sm text-muted-foreground">{subject.code}</div>
                            </div>
                          </div>
                          {isSubjectVisible('senior', subject.id) && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    <h3 className="font-semibold">Department Subjects</h3>
                    <Badge variant="secondary">{departmentSubjects.length}</Badge>
                  </div>
                  
                  <ScrollArea className="h-[200px] border rounded-md p-4">
                    <div className="space-y-2">
                      {departmentSubjects.map((subject: any) => {
                        const config = CATEGORY_CONFIG[subject.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.general;
                        return (
                          <div
                            key={subject.id}
                            className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50"
                            data-testid={`subject-senior-dept-${subject.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isSubjectVisible('senior', subject.id)}
                                onCheckedChange={(checked) => handleToggle('senior', 'subjectVisibility', !!checked, subject.id.toString())}
                                data-testid={`checkbox-senior-dept-${subject.id}`}
                              />
                              <div>
                                <div className="font-medium">{subject.name}</div>
                                <div className="text-sm text-muted-foreground">{subject.code}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={config.color}>{config.label}</Badge>
                              {isSubjectVisible('senior', subject.id) && (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}

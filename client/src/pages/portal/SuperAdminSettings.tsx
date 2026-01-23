import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, AlertTriangle, GraduationCap, BarChart3, Settings2, FileText, Eye, Trash2 } from "lucide-react";
import { GRADING_SCALES, getGradeColor, getGradeBgColor, type GradingConfig } from "@shared/grading-utils";

interface SettingsData {
  schoolName: string;
  schoolMotto: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolAddress: string;
  maintenanceMode: boolean;
  maintenanceModeMessage: string;
  enableSmsNotifications: boolean;
  enableEmailNotifications: boolean;
  enableExamsModule: boolean;
  enableAttendanceModule: boolean;
  enableResultsModule: boolean;
  themeColor: string;
  hideAdminAccountsFromAdmins: boolean;
  testWeight: number;
  examWeight: number;
  defaultGradingScale: string;
  autoCreateReportCard: boolean;
  scoreAggregationMode: string;
  showGradeBreakdown: boolean;
  allowTeacherOverrides: boolean;
  deletedUserRetentionDays: number;
}

export default function SuperAdminSettings() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: settings, refetch } = useQuery<SettingsData>({
    queryKey: ["/api/superadmin/settings"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchInterval: 5000, // Added polling for real-time updates
  });

  const [formData, setFormData] = useState<SettingsData>({
    schoolName: "",
    schoolMotto: "",
    schoolEmail: "",
    schoolPhone: "",
    schoolAddress: "",
    maintenanceMode: false,
    maintenanceModeMessage: "",
    enableSmsNotifications: false,
    enableEmailNotifications: true,
    enableExamsModule: true,
    enableAttendanceModule: true,
    enableResultsModule: true,
    themeColor: "blue",
    hideAdminAccountsFromAdmins: true,
    testWeight: 40,
    examWeight: 60,
    defaultGradingScale: "standard",
    autoCreateReportCard: true,
    scoreAggregationMode: "last",
    showGradeBreakdown: true,
    allowTeacherOverrides: true,
    deletedUserRetentionDays: 30,
  });

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        ...settings,
        testWeight: settings.testWeight ?? 40,
        examWeight: settings.examWeight ?? 60,
        defaultGradingScale: settings.defaultGradingScale ?? "standard",
        autoCreateReportCard: settings.autoCreateReportCard ?? true,
        scoreAggregationMode: settings.scoreAggregationMode ?? "last",
        showGradeBreakdown: settings.showGradeBreakdown ?? true,
        allowTeacherOverrides: settings.allowTeacherOverrides ?? true,
        deletedUserRetentionDays: settings.deletedUserRetentionDays ?? 30,
      }));
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: SettingsData) => {
      return apiRequest("PUT", "/api/superadmin/settings", data);
    },
    onSuccess: (updatedSettings: any) => {
      toast({ title: "Success", description: "Settings saved successfully" });
      
      // Update the cache immediately with the returned data
      queryClient.setQueryData(["/api/superadmin/settings"], updatedSettings);
      queryClient.setQueryData(["/api/public/settings"], updatedSettings);
      
      // Invalidate all related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grading-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api", "public", "homepage-content"] });
      
      // Force a refetch to be absolutely sure
      queryClient.refetchQueries({ queryKey: ["/api/superadmin/settings"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    },
  });

  const handleSave = () => {
    if (formData.testWeight + formData.examWeight !== 100) {
      toast({
        title: "Validation Error",
        description: "Test Weight and Exam Weight must add up to 100%",
        variant: "destructive",
      });
      return;
    }
    
    // Create a clean object to send, ensuring no extra fields that might cause issues
    const dataToSave = {
      schoolName: formData.schoolName,
      schoolMotto: formData.schoolMotto,
      schoolEmail: formData.schoolEmail,
      schoolPhone: formData.schoolPhone,
      schoolAddress: formData.schoolAddress,
      maintenanceMode: formData.maintenanceMode,
      maintenanceModeMessage: formData.maintenanceModeMessage,
      enableSmsNotifications: formData.enableSmsNotifications,
      enableEmailNotifications: formData.enableEmailNotifications,
      enableExamsModule: formData.enableExamsModule,
      enableAttendanceModule: formData.enableAttendanceModule,
      enableResultsModule: formData.enableResultsModule,
      themeColor: formData.themeColor,
      hideAdminAccountsFromAdmins: formData.hideAdminAccountsFromAdmins,
      testWeight: formData.testWeight,
      examWeight: formData.examWeight,
      defaultGradingScale: formData.defaultGradingScale,
      autoCreateReportCard: formData.autoCreateReportCard,
      scoreAggregationMode: formData.scoreAggregationMode,
      showGradeBreakdown: formData.showGradeBreakdown,
      allowTeacherOverrides: formData.allowTeacherOverrides,
      deletedUserRetentionDays: formData.deletedUserRetentionDays,
    };

    saveSettingsMutation.mutate(dataToSave, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  const handleTestWeightChange = (value: string) => {
    const testWeight = Math.min(100, Math.max(0, parseInt(value) || 0));
    const examWeight = 100 - testWeight;
    setFormData({ ...formData, testWeight, examWeight });
  };

  const handleExamWeightChange = (value: string) => {
    const examWeight = Math.min(100, Math.max(0, parseInt(value) || 0));
    const testWeight = 100 - examWeight;
    setFormData({ ...formData, testWeight, examWeight });
  };

  const weightsValid = formData.testWeight + formData.examWeight === 100;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold dark:text-white" data-testid="text-page-title">
              System Settings
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
              Configure global system settings
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    if (settings) setFormData({ ...formData, ...settings });
                  }}
                  data-testid="button-cancel-settings"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saveSettingsMutation.isPending || !weightsValid}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-save-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setIsEditing(true)}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-edit-settings"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Edit Settings
              </Button>
            )}
          </div>
        </div>

        <div className={`grid gap-6 ${!isEditing ? "opacity-90 pointer-events-none select-none" : ""}`}>
          {/* School Information */}
          <Card className="dark:bg-slate-800 dark:border-slate-700 shadow-sm">
            <CardHeader>
              <CardTitle className="dark:text-white">School Information</CardTitle>
              <CardDescription className="dark:text-slate-400">
                Basic information about your school
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schoolName" className="dark:text-slate-200">School Name</Label>
                  <Input
                    id="schoolName"
                    data-testid="input-school-name"
                    value={formData.schoolName}
                    readOnly={!isEditing}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolMotto" className="dark:text-slate-200">School Motto</Label>
                  <Input
                    id="schoolMotto"
                    data-testid="input-school-motto"
                    value={formData.schoolMotto}
                    readOnly={!isEditing}
                    onChange={(e) => setFormData({ ...formData, schoolMotto: e.target.value })}
                    className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolEmail" className="dark:text-slate-200">School Email</Label>
                  <Input
                    id="schoolEmail"
                    type="email"
                    data-testid="input-school-email"
                    value={formData.schoolEmail}
                    readOnly={!isEditing}
                    onChange={(e) => setFormData({ ...formData, schoolEmail: e.target.value })}
                    className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolPhone" className="dark:text-slate-200">School Phone</Label>
                  <Input
                    id="schoolPhone"
                    data-testid="input-school-phone"
                    value={formData.schoolPhone}
                    readOnly={!isEditing}
                    onChange={(e) => setFormData({ ...formData, schoolPhone: e.target.value })}
                    className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolAddress" className="dark:text-slate-200">School Address</Label>
                <Textarea
                  id="schoolAddress"
                  data-testid="input-school-address"
                  value={formData.schoolAddress}
                  readOnly={!isEditing}
                  onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                  className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Grading Configuration */}
          <Card className="dark:bg-slate-800 dark:border-slate-700 border-green-200 dark:border-green-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <GraduationCap className="h-5 w-5" />
                Grading Configuration
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                Configure how grades and report cards are calculated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Weights */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium dark:text-slate-200">Score Weights</Label>
                </div>
                
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="testWeight" className="text-sm dark:text-slate-300">
                      Test Weight (%)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="testWeight"
                        type="number"
                        min="0"
                        max="100"
                        data-testid="input-test-weight"
                        value={formData.testWeight}
                        readOnly={!isEditing}
                        onChange={(e) => handleTestWeightChange(e.target.value)}
                        className="w-24 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                      <div className="flex-1">
                        <Progress value={formData.testWeight} className="h-2" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="examWeight" className="text-sm dark:text-slate-300">
                      Exam Weight (%)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="examWeight"
                        type="number"
                        min="0"
                        max="100"
                        data-testid="input-exam-weight"
                        value={formData.examWeight}
                        readOnly={!isEditing}
                        onChange={(e) => handleExamWeightChange(e.target.value)}
                        className="w-24 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                      <div className="flex-1">
                        <Progress value={formData.examWeight} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validation indicator */}
                <div className={`flex items-center gap-2 text-sm ${weightsValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {weightsValid ? (
                    <span>Test ({formData.testWeight}%) + Exam ({formData.examWeight}%) = 100%</span>
                  ) : (
                    <span>Weights must add up to 100% (currently {formData.testWeight + formData.examWeight}%)</span>
                  )}
                </div>
              </div>

              {/* Grading Scale */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gradingScale" className="text-sm dark:text-slate-300">
                    Default Grading Scale
                  </Label>
                  <Select 
                    disabled={!isEditing}
                    value={formData.defaultGradingScale} 
                    onValueChange={(value) => setFormData({ ...formData, defaultGradingScale: value })}
                  >
                    <SelectTrigger className="w-full md:w-64 dark:bg-slate-900 dark:border-slate-700" data-testid="select-grading-scale">
                      <SelectValue placeholder="Select grading scale" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (A-F)</SelectItem>
                      <SelectItem value="waec">WAEC (A1-F9)</SelectItem>
                      <SelectItem value="percentage">Percentage Based</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This determines how percentage scores are converted to letter grades
                  </p>
                </div>

                {/* Grading Scale Preview */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium dark:text-slate-200">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    Grade Scale Preview
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Score Range</TableHead>
                          <TableHead className="text-xs">Grade</TableHead>
                          <TableHead className="text-xs">Points</TableHead>
                          <TableHead className="text-xs">Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(GRADING_SCALES[formData.defaultGradingScale] || GRADING_SCALES.standard).ranges.map((range, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs font-medium">
                              {range.min} - {range.max}%
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`${getGradeColor(range.grade)} ${getGradeBgColor(range.grade)} border-0`}
                              >
                                {range.grade}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{range.points.toFixed(1)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{range.remarks}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Score Aggregation Mode */}
              <div className="space-y-2">
                <Label htmlFor="scoreAggregationMode" className="text-sm dark:text-slate-300">
                  Score Aggregation Mode
                </Label>
                <Select 
                  disabled={!isEditing}
                  value={formData.scoreAggregationMode} 
                  onValueChange={(value) => setFormData({ ...formData, scoreAggregationMode: value })}
                >
                  <SelectTrigger className="w-full md:w-64 dark:bg-slate-900 dark:border-slate-700" data-testid="select-aggregation-mode">
                    <SelectValue placeholder="Select aggregation mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last">Use Last Score</SelectItem>
                    <SelectItem value="best">Use Best Score</SelectItem>
                    <SelectItem value="average">Use Average Score</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  When a student has multiple test/exam scores, this determines which one is used
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Report Card Behavior */}
          <Card className="dark:bg-slate-800 dark:border-slate-700 border-purple-200 dark:border-purple-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <FileText className="h-5 w-5" />
                Report Card Behavior
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                Configure how report cards are generated and displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base dark:text-slate-200">Auto-Create Report Cards</Label>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Automatically create a report card when a student takes their first exam in a term
                  </p>
                </div>
                <Switch
                  disabled={!isEditing}
                  checked={formData.autoCreateReportCard}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, autoCreateReportCard: checked })
                  }
                  data-testid="switch-auto-create-report"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base dark:text-slate-200">Show Grade Breakdown</Label>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Display test and exam scores separately on report cards
                  </p>
                </div>
                <Switch
                  disabled={!isEditing}
                  checked={formData.showGradeBreakdown}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, showGradeBreakdown: checked })
                  }
                  data-testid="switch-show-breakdown"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base dark:text-slate-200">Allow Teacher Score Overrides</Label>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Allow teachers to manually override auto-calculated scores
                  </p>
                </div>
                <Switch
                  disabled={!isEditing}
                  checked={formData.allowTeacherOverrides}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allowTeacherOverrides: checked })
                  }
                  data-testid="switch-allow-overrides"
                />
              </div>
            </CardContent>
          </Card>

          {/* Module Management */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Settings2 className="h-5 w-5" />
                Module Management
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                Enable or disable system modules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base dark:text-slate-200">Exams Module</Label>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Enable exam creation and management
                  </p>
                </div>
                <Switch
                  disabled={!isEditing}
                  checked={formData.enableExamsModule}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableExamsModule: checked })
                  }
                  data-testid="switch-exams-module"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base dark:text-slate-200">Attendance Module</Label>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Enable attendance tracking
                  </p>
                </div>
                <Switch
                  disabled={!isEditing}
                  checked={formData.enableAttendanceModule}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableAttendanceModule: checked })
                  }
                  data-testid="switch-attendance-module"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base dark:text-slate-200">Results Module</Label>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Enable results and report cards
                  </p>
                </div>
                <Switch
                  disabled={!isEditing}
                  checked={formData.enableResultsModule}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableResultsModule: checked })
                  }
                  data-testid="switch-results-module"
                />
              </div>
            </CardContent>
          </Card>

          {/* User Management Settings */}
          <Card className="dark:bg-slate-800 dark:border-slate-700 border-blue-200 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="dark:text-white">User Management Settings</CardTitle>
              <CardDescription className="dark:text-slate-400">
                Control user visibility, access permissions, and data retention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base dark:text-slate-200">Hide Admin Accounts from Admins</Label>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    When enabled, regular Admins cannot see or manage Super Admin and Admin accounts. Only Super Admins have full access.
                  </p>
                </div>
                <Switch
                  disabled={!isEditing}
                  checked={formData.hideAdminAccountsFromAdmins}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, hideAdminAccountsFromAdmins: checked })
                  }
                  data-testid="switch-hide-admins"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retentionDays" className="text-sm dark:text-slate-300">Deleted User Retention (Days)</Label>
                <Input
                  id="retentionDays"
                  type="number"
                  min="1"
                  max="365"
                  data-testid="input-retention-days"
                  value={formData.deletedUserRetentionDays}
                  readOnly={!isEditing}
                  onChange={(e) => setFormData({ ...formData, deletedUserRetentionDays: parseInt(e.target.value) || 30 })}
                  className="w-full md:w-32 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
                <p className="text-xs text-muted-foreground">
                  Number of days to keep deleted user data before permanent removal
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

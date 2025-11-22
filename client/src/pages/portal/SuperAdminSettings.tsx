import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, AlertTriangle } from "lucide-react";

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
}

export default function SuperAdminSettings() {
  const { toast } = useToast();

  const { data: settings } = useQuery<SettingsData>({
    queryKey: ["/api/superadmin/settings"],
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
  });

  // Update form when data loads
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: SettingsData) => {
      return apiRequest("PUT", "/api/superadmin/settings", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Settings saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/settings"] });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(formData);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white" data-testid="text-page-title">
            System Settings
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
            Configure global system settings
          </p>
        </div>

        <div className="grid gap-6">
          {/* School Information */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
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
                  onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                  className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Module Management */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Module Management</CardTitle>
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
                Control user visibility and access permissions
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
                  checked={formData.hideAdminAccountsFromAdmins}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, hideAdminAccountsFromAdmins: checked })
                  }
                  data-testid="switch-hide-admin-accounts"
                />
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Mode */}
          <Card className="dark:bg-slate-800 dark:border-slate-700 border-orange-200 dark:border-orange-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                Maintenance Mode
              </CardTitle>
              <CardDescription className="dark:text-slate-400">
                Temporarily lock down all portals for system updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base dark:text-slate-200">Enable Maintenance Mode</Label>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Users won't be able to access the system
                  </p>
                </div>
                <Switch
                  checked={formData.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, maintenanceMode: checked })
                  }
                  data-testid="switch-maintenance-mode"
                />
              </div>
              {formData.maintenanceMode && (
                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage" className="dark:text-slate-200">
                    Maintenance Message
                  </Label>
                  <Textarea
                    id="maintenanceMessage"
                    data-testid="input-maintenance-message"
                    placeholder="System is under maintenance. Please check back later."
                    value={formData.maintenanceModeMessage}
                    onChange={(e) =>
                      setFormData({ ...formData, maintenanceModeMessage: e.target.value })
                    }
                    className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending}
              data-testid="button-save-settings"
              className="w-full sm:w-auto"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

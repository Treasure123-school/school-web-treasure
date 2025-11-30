import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Settings, 
  School, 
  Shield, 
  Bell, 
  Database, 
  Users,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  GraduationCap,
  Scale,
  Info,
  Loader2
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger 
} from '@/components/ui/tooltip';

const schoolSettingsSchema = z.object({
  schoolName: z.string().min(1, 'School name is required'),
  schoolAddress: z.string().min(1, 'School address is required'),
  phoneNumber: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  website: z.string().optional(),
  academicYear: z.string().min(1, 'Academic year is required'),
  schoolLogo: z.string().optional(),
});

const securitySettingsSchema = z.object({
  passwordMinLength: z.number().min(6, 'Minimum 6 characters required'),
  sessionTimeout: z.number().min(15, 'Minimum 15 minutes required'),
  twoFactorAuth: z.boolean(),
  loginAttempts: z.number().min(3, 'Minimum 3 attempts required'),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  attendanceAlerts: z.boolean(),
  gradeAlerts: z.boolean(),
  announcementNotifications: z.boolean(),
});

const gradingSettingsSchema = z.object({
  testWeight: z.number().min(0).max(100),
  examWeight: z.number().min(0).max(100),
  defaultGradingScale: z.string().min(1, 'Grading scale is required'),
}).refine(data => data.testWeight + data.examWeight === 100, {
  message: 'Test and exam weights must add up to 100%',
  path: ['testWeight'],
});

type SchoolSettings = z.infer<typeof schoolSettingsSchema>;
type SecuritySettings = z.infer<typeof securitySettingsSchema>;
type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
type GradingSettings = z.infer<typeof gradingSettingsSchema>;

interface GradingConfigResponse {
  testWeight: number;
  examWeight: number;
  defaultGradingScale: string;
  gradingScales: Record<string, {
    name: string;
    ranges: Array<{
      grade: string;
      minScore: number;
      maxScore: number;
      gpa: number;
      remark: string;
    }>;
  }>;
}

export default function SettingsManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('school');

  // Form handlers for different settings categories
  const schoolForm = useForm<SchoolSettings>({
    resolver: zodResolver(schoolSettingsSchema),
    defaultValues: {
      schoolName: 'Treasure-Home School',
      schoolAddress: '123 Education Street, Learning City, ED 12345',
      phoneNumber: '+1 (555) 123-4567',
      email: 'info@treasurehome.edu',
      website: 'https://treasurehome.edu',
      academicYear: '2024-2025',
    },
  });

  const securityForm = useForm<SecuritySettings>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      passwordMinLength: 8,
      sessionTimeout: 60,
      twoFactorAuth: false,
      loginAttempts: 5,
    },
  });

  const notificationForm = useForm<NotificationSettings>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: false,
      attendanceAlerts: true,
      gradeAlerts: true,
      announcementNotifications: true,
    },
  });

  // State for grading weight slider
  const [testWeight, setTestWeight] = useState(40);
  const [selectedScale, setSelectedScale] = useState('standard');

  // Fetch grading config from API
  const { data: gradingConfig, isLoading: isLoadingGrading } = useQuery<GradingConfigResponse>({
    queryKey: ['/api/grading-config'],
  });

  // Update local state when config is fetched
  useState(() => {
    if (gradingConfig) {
      setTestWeight(gradingConfig.testWeight);
      setSelectedScale(gradingConfig.defaultGradingScale);
    }
  });

  // Effect to update state when grading config loads
  if (gradingConfig && testWeight === 40 && selectedScale === 'standard') {
    if (gradingConfig.testWeight !== 40 || gradingConfig.defaultGradingScale !== 'standard') {
      setTestWeight(gradingConfig.testWeight);
      setSelectedScale(gradingConfig.defaultGradingScale);
    }
  }

  // Mock settings state (in real app, this would come from API)
  const [systemStatus] = useState({
    database: 'Connected',
    storage: 'Healthy',
    cache: 'Active',
    backups: 'Up to date',
  });

  // Save settings mutations with instant feedback
  const saveSchoolSettingsMutation = useMutation({
    mutationFn: async (data: SchoolSettings) => {
      // Mock API call - in real app, would save to backend
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onMutate: () => {
      // INSTANT FEEDBACK: Show saving toast immediately
      toast({
        title: "Saving...",
        description: "Updating school settings",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "School settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update school settings",
        variant: "destructive",
      });
    },
  });

  const saveSecuritySettingsMutation = useMutation({
    mutationFn: async (data: SecuritySettings) => {
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onMutate: () => {
      // INSTANT FEEDBACK: Show saving toast immediately
      toast({
        title: "Saving...",
        description: "Updating security settings",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Security settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update security settings",
        variant: "destructive",
      });
    },
  });

  const saveNotificationSettingsMutation = useMutation({
    mutationFn: async (data: NotificationSettings) => {
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onMutate: () => {
      // INSTANT FEEDBACK: Show saving toast immediately
      toast({
        title: "Saving...",
        description: "Updating notification settings",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    },
  });

  const onSchoolSubmit = (data: SchoolSettings) => {
    saveSchoolSettingsMutation.mutate(data);
  };

  const onSecuritySubmit = (data: SecuritySettings) => {
    saveSecuritySettingsMutation.mutate(data);
  };

  const onNotificationSubmit = (data: NotificationSettings) => {
    saveNotificationSettingsMutation.mutate(data);
  };

  const handleDatabaseBackup = () => {
    toast({
      title: "Backup Started",
      description: "Database backup has been initiated...",
    });
  };

  const handleSystemMaintenance = () => {
    toast({
      title: "Maintenance Mode",
      description: "System maintenance mode activated",
    });
  };

  return (
    <div className="space-y-6" data-testid="settings-management">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleDatabaseBackup}
            data-testid="button-backup"
          >
            <Database className="w-4 h-4 mr-2" />
            Backup Database
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSystemMaintenance}
            data-testid="button-maintenance"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Maintenance
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5" data-testid="tabs-settings">
          <TabsTrigger value="school" data-testid="tab-school">
            <School className="w-4 h-4 mr-2" />
            School
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system">
            <Database className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-user-management">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="school" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <School className="w-5 h-5 mr-2" />
                School Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={schoolForm.handleSubmit(onSchoolSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="schoolName">School Name *</Label>
                    <Input 
                      id="schoolName" 
                      {...schoolForm.register('schoolName')}
                      data-testid="input-school-name"
                    />
                    {schoolForm.formState.errors.schoolName && (
                      <p className="text-sm text-red-500 mt-1">
                        {schoolForm.formState.errors.schoolName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="academicYear">Academic Year *</Label>
                    <Input 
                      id="academicYear" 
                      {...schoolForm.register('academicYear')}
                      data-testid="input-academic-year"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="schoolAddress">School Address *</Label>
                  <Textarea 
                    id="schoolAddress" 
                    {...schoolForm.register('schoolAddress')}
                    rows={3}
                    data-testid="textarea-school-address"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input 
                      id="phoneNumber" 
                      {...schoolForm.register('phoneNumber')}
                      data-testid="input-phone-number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      {...schoolForm.register('email')}
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website" 
                      {...schoolForm.register('website')}
                      data-testid="input-website"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={saveSchoolSettingsMutation.isPending}
                    data-testid="button-save-school"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveSchoolSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="passwordMinLength">Password Minimum Length</Label>
                    <Input 
                      id="passwordMinLength" 
                      type="number"
                      {...securityForm.register('passwordMinLength', { valueAsNumber: true })}
                      data-testid="input-password-min-length"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input 
                      id="sessionTimeout" 
                      type="number"
                      {...securityForm.register('sessionTimeout', { valueAsNumber: true })}
                      data-testid="input-session-timeout"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="loginAttempts">Maximum Login Attempts</Label>
                    <Input 
                      id="loginAttempts" 
                      type="number"
                      {...securityForm.register('loginAttempts', { valueAsNumber: true })}
                      data-testid="input-login-attempts"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch 
                      id="twoFactorAuth"
                      {...securityForm.register('twoFactorAuth')}
                      data-testid="switch-two-factor"
                    />
                    <Label htmlFor="twoFactorAuth">Enable Two-Factor Authentication</Label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={saveSecuritySettingsMutation.isPending}
                    data-testid="button-save-security"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveSecuritySettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications" className="text-base font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch 
                      id="emailNotifications"
                      {...notificationForm.register('emailNotifications')}
                      data-testid="switch-email-notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="smsNotifications" className="text-base font-medium">
                        SMS Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Switch 
                      id="smsNotifications"
                      {...notificationForm.register('smsNotifications')}
                      data-testid="switch-sms-notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="attendanceAlerts" className="text-base font-medium">
                        Attendance Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about attendance issues
                      </p>
                    </div>
                    <Switch 
                      id="attendanceAlerts"
                      {...notificationForm.register('attendanceAlerts')}
                      data-testid="switch-attendance-alerts"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="gradeAlerts" className="text-base font-medium">
                        Grade Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about grade updates
                      </p>
                    </div>
                    <Switch 
                      id="gradeAlerts"
                      {...notificationForm.register('gradeAlerts')}
                      data-testid="switch-grade-alerts"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="announcementNotifications" className="text-base font-medium">
                        Announcement Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about new announcements
                      </p>
                    </div>
                    <Switch 
                      id="announcementNotifications"
                      {...notificationForm.register('announcementNotifications')}
                      data-testid="switch-announcement-notifications"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={saveNotificationSettingsMutation.isPending}
                    data-testid="button-save-notifications"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveNotificationSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Database</p>
                    <p className="text-sm text-muted-foreground">PostgreSQL Connection</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      {systemStatus.database}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Storage</p>
                    <p className="text-sm text-muted-foreground">File System Health</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      {systemStatus.storage}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Cache</p>
                    <p className="text-sm text-muted-foreground">Redis Cache Status</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      {systemStatus.cache}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Backups</p>
                    <p className="text-sm text-muted-foreground">Last Backup Status</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      {systemStatus.backups}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                User Management Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Default User Roles</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure default permissions for new user registrations
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">Students</div>
                      <div className="text-sm text-muted-foreground">View Only</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">Teachers</div>
                      <div className="text-sm text-muted-foreground">Read/Write</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">Parents</div>
                      <div className="text-sm text-muted-foreground">View Children</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">Admin</div>
                      <div className="text-sm text-muted-foreground">Full Access</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Registration Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Allow self-registration for students</span>
                      <Switch defaultChecked={true} data-testid="switch-student-registration" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Require admin approval for teacher accounts</span>
                      <Switch defaultChecked={true} data-testid="switch-teacher-approval" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Enable parent portal registration</span>
                      <Switch defaultChecked={true} data-testid="switch-parent-registration" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
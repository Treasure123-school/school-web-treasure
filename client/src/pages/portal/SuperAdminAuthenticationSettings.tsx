import { useState } from "react";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Key, 
  Shield, 
  Lock, 
  Users, 
  UserCog, 
  GraduationCap, 
  UserCheck,
  AlertTriangle,
  Clock,
  RefreshCw,
  Save,
  Eye,
  EyeOff
} from "lucide-react";

interface CredentialTemplate {
  roleId: number;
  roleName: string;
  prefix: string;
  code: string;
  format: string;
  example: string;
  icon: any;
  description: string;
}

const credentialTemplates: CredentialTemplate[] = [
  {
    roleId: 1,
    roleName: "Super Admin",
    prefix: "THS",
    code: "SUP",
    format: "THS-SUP-###",
    example: "THS-SUP-001",
    icon: Shield,
    description: "Super Administrators with full system access and configuration rights"
  },
  {
    roleId: 2,
    roleName: "Admin",
    prefix: "THS",
    code: "ADM",
    format: "THS-ADM-###",
    example: "THS-ADM-001",
    icon: UserCog,
    description: "Administrative staff with system management access"
  },
  {
    roleId: 3,
    roleName: "Teacher",
    prefix: "THS",
    code: "TCH",
    format: "THS-TCH-###",
    example: "THS-TCH-001",
    icon: Users,
    description: "Teaching staff with class and student management access"
  },
  {
    roleId: 4,
    roleName: "Student",
    prefix: "THS",
    code: "STU",
    format: "THS-STU-###",
    example: "THS-STU-001",
    icon: GraduationCap,
    description: "Students with access to learning resources and grades"
  },
  {
    roleId: 5,
    roleName: "Parent",
    prefix: "THS",
    code: "PAR",
    format: "THS-PAR-###",
    example: "THS-PAR-001",
    icon: UserCheck,
    description: "Parents/Guardians with access to child's information"
  }
];

export default function SuperAdminAuthenticationSettings() {
  const { toast } = useToast();
  const [showPasswordFormat, setShowPasswordFormat] = useState(false);
  
  const [securitySettings, setSecuritySettings] = useState({
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    sessionTimeout: 60,
    requirePasswordChange: true,
    passwordMinLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
    passwordExpiryDays: 90,
    enableTwoFactor: false,
    enableCaptcha: false
  });

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Authentication settings have been updated successfully.",
    });
  };

  const passwordFormat = "THS@{YEAR}#{RAND4}";
  const passwordExample = `THS@${new Date().getFullYear()}#${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
            Authentication Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure login security, credential generation rules, and authentication policies
          </p>
        </div>

        <Tabs defaultValue="credentials" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
            <TabsTrigger value="credentials" className="gap-2" data-testid="tab-credentials">
              <Key className="h-4 w-4" />
              Credential Rules
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2" data-testid="tab-security">
              <Shield className="h-4 w-4" />
              Login Security
            </TabsTrigger>
            <TabsTrigger value="password" className="gap-2" data-testid="tab-password">
              <Lock className="h-4 w-4" />
              Password Policy
            </TabsTrigger>
            <TabsTrigger value="lockout" className="gap-2" data-testid="tab-lockout">
              <AlertTriangle className="h-4 w-4" />
              Account Lockout
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  Credential Generation Rules
                </CardTitle>
                <CardDescription>
                  Configure automatic username generation formats for each user role.
                  Usernames are auto-generated when creating new accounts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  {credentialTemplates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <Card key={template.roleId} className="bg-gray-50 dark:bg-gray-800/50">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex items-center gap-3 min-w-[140px]">
                              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {template.roleName}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Role ID: {template.roleId}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label className="text-xs text-gray-500 dark:text-gray-400">Format</Label>
                                <div className="font-mono text-sm bg-white dark:bg-gray-900 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700">
                                  {template.format}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 dark:text-gray-400">Example</Label>
                                <Badge variant="secondary" className="font-mono text-sm">
                                  {template.example}
                                </Badge>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 dark:text-gray-400">Auto-increment</Label>
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                  001 → 002 → 003...
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                            {template.description}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                          Important Notes
                        </h4>
                        <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1 list-disc list-inside">
                          <li>Usernames are automatically generated and cannot be manually changed</li>
                          <li>The sequence number (###) auto-increments for each new user</li>
                          <li>Credentials are generated atomically to prevent duplicates</li>
                          <li>Super Admins can only be created by other Super Admins</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                            Temporary Password Format
                          </h4>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowPasswordFormat(!showPasswordFormat)}
                            data-testid="button-toggle-password-format"
                          >
                            {showPasswordFormat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {showPasswordFormat && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-blue-700 dark:text-blue-300">Format:</span>
                              <Badge variant="outline" className="font-mono">{passwordFormat}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-blue-700 dark:text-blue-300">Example:</span>
                              <Badge variant="secondary" className="font-mono">{passwordExample}</Badge>
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              Users must change this password on first login
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Login Security Settings
                </CardTitle>
                <CardDescription>
                  Configure security rules for user authentication and session management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts" className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Maximum Failed Login Attempts
                    </Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings(prev => ({
                        ...prev,
                        maxLoginAttempts: parseInt(e.target.value) || 5
                      }))}
                      min={1}
                      max={10}
                      data-testid="input-max-login-attempts"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Account will be locked after this many failed attempts
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lockoutDuration" className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Lockout Duration (minutes)
                    </Label>
                    <Input
                      id="lockoutDuration"
                      type="number"
                      value={securitySettings.lockoutDuration}
                      onChange={(e) => setSecuritySettings(prev => ({
                        ...prev,
                        lockoutDuration: parseInt(e.target.value) || 15
                      }))}
                      min={1}
                      max={60}
                      data-testid="input-lockout-duration"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      How long the account stays locked after too many failed attempts
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout" className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-green-500" />
                      Session Timeout (minutes)
                    </Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings(prev => ({
                        ...prev,
                        sessionTimeout: parseInt(e.target.value) || 60
                      }))}
                      min={15}
                      max={480}
                      data-testid="input-session-timeout"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      User session expires after this period of inactivity
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="flex items-center gap-2">
                          Enable Two-Factor Authentication
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Require 2FA for all users (optional)
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.enableTwoFactor}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({
                          ...prev,
                          enableTwoFactor: checked
                        }))}
                        data-testid="switch-two-factor"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="flex items-center gap-2">
                          Enable CAPTCHA on Login
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Show CAPTCHA after failed login attempts
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.enableCaptcha}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({
                          ...prev,
                          enableCaptcha: checked
                        }))}
                        data-testid="switch-captcha"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Password Policy
                </CardTitle>
                <CardDescription>
                  Define password strength requirements and expiration rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings(prev => ({
                        ...prev,
                        passwordMinLength: parseInt(e.target.value) || 8
                      }))}
                      min={6}
                      max={32}
                      data-testid="input-password-min-length"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordExpiryDays">Password Expiry (days)</Label>
                    <Input
                      id="passwordExpiryDays"
                      type="number"
                      value={securitySettings.passwordExpiryDays}
                      onChange={(e) => setSecuritySettings(prev => ({
                        ...prev,
                        passwordExpiryDays: parseInt(e.target.value) || 90
                      }))}
                      min={0}
                      max={365}
                      data-testid="input-password-expiry"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Set to 0 to disable password expiry
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Password Requirements</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Label>Require Uppercase Letter (A-Z)</Label>
                      <Switch
                        checked={securitySettings.requireUppercase}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({
                          ...prev,
                          requireUppercase: checked
                        }))}
                        data-testid="switch-require-uppercase"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Label>Require Lowercase Letter (a-z)</Label>
                      <Switch
                        checked={securitySettings.requireLowercase}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({
                          ...prev,
                          requireLowercase: checked
                        }))}
                        data-testid="switch-require-lowercase"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Label>Require Number (0-9)</Label>
                      <Switch
                        checked={securitySettings.requireNumber}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({
                          ...prev,
                          requireNumber: checked
                        }))}
                        data-testid="switch-require-number"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Label>Require Special Character (@#$%)</Label>
                      <Switch
                        checked={securitySettings.requireSpecialChar}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({
                          ...prev,
                          requireSpecialChar: checked
                        }))}
                        data-testid="switch-require-special"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg md:col-span-2">
                      <div>
                        <Label>Force Password Change on First Login</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          New users must change their temporary password
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.requirePasswordChange}
                        onCheckedChange={(checked) => setSecuritySettings(prev => ({
                          ...prev,
                          requirePasswordChange: checked
                        }))}
                        data-testid="switch-require-password-change"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lockout" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Account Lockout Management
                </CardTitle>
                <CardDescription>
                  Configure automatic account lockout policies and manage locked accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-3">
                        Auto-Lock Rules
                      </h4>
                      <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-2">
                        <li className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                            {securitySettings.maxLoginAttempts} attempts
                          </Badge>
                          <span>triggers account lock</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                            {securitySettings.lockoutDuration} min
                          </Badge>
                          <span>lockout duration</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                            3 violations
                          </Badge>
                          <span>triggers account suspension</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">
                        Auto-Unlock Rules
                      </h4>
                      <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
                        <li className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Automatic unlock after lockout duration expires</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <UserCog className="h-4 w-4" />
                          <span>Super Admin can manually unlock any account</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          <span>Password reset clears lockout status</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lockout Workflow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                        <Badge variant="secondary">1</Badge>
                        <span>Failed login attempt</span>
                      </div>
                      <span className="hidden md:block text-gray-400">→</span>
                      <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-2 rounded-lg">
                        <Badge variant="secondary">2</Badge>
                        <span>Counter increments</span>
                      </div>
                      <span className="hidden md:block text-gray-400">→</span>
                      <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 px-3 py-2 rounded-lg">
                        <Badge variant="secondary">3</Badge>
                        <span>Max attempts reached</span>
                      </div>
                      <span className="hidden md:block text-gray-400">→</span>
                      <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-lg">
                        <Badge variant="destructive">4</Badge>
                        <span>Account locked</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                          Security Notifications
                        </h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
                          <li>Users receive notification when their account is locked</li>
                          <li>Admins are alerted when suspicious login patterns are detected</li>
                          <li>Super Admins receive reports of repeated lockout violations</li>
                          <li>All lockout events are logged in the audit trail</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} className="gap-2" data-testid="button-save-settings">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

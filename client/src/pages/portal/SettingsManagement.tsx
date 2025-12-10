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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
  Loader2,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface GradingBoundary {
  id: number;
  name: string;
  grade: string;
  minScore: number;
  maxScore: number;
  remark?: string;
  gradePoint?: number;
  isDefault: boolean;
}

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

function GradingBoundariesSection() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBoundary, setEditingBoundary] = useState<GradingBoundary | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [boundaryToDelete, setBoundaryToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: 'Standard',
    grade: '',
    minScore: 0,
    maxScore: 100,
    remark: '',
    gradePoint: 0,
    isDefault: true,
  });

  const { data: boundaries = [], isLoading } = useQuery<GradingBoundary[]>({
    queryKey: ['/api/grading-boundaries'],
  });

  const createBoundaryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('POST', '/api/grading-boundaries', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grading-boundaries'] });
      toast({ title: 'Success', description: 'Grading boundary created successfully' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create grading boundary', variant: 'destructive' });
    },
  });

  const updateBoundaryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      return apiRequest('PATCH', `/api/grading-boundaries/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grading-boundaries'] });
      toast({ title: 'Success', description: 'Grading boundary updated successfully' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update grading boundary', variant: 'destructive' });
    },
  });

  const deleteBoundaryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/grading-boundaries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grading-boundaries'] });
      toast({ title: 'Success', description: 'Grading boundary deleted successfully' });
      setDeleteConfirmOpen(false);
      setBoundaryToDelete(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete grading boundary', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: 'Standard',
      grade: '',
      minScore: 0,
      maxScore: 100,
      remark: '',
      gradePoint: 0,
      isDefault: true,
    });
    setEditingBoundary(null);
  };

  const handleSubmit = () => {
    if (!formData.grade) {
      toast({ title: 'Error', description: 'Grade letter is required', variant: 'destructive' });
      return;
    }
    if (formData.minScore > formData.maxScore) {
      toast({ title: 'Error', description: 'Minimum score cannot be greater than maximum score', variant: 'destructive' });
      return;
    }
    if (editingBoundary) {
      updateBoundaryMutation.mutate({ id: editingBoundary.id, data: formData });
    } else {
      createBoundaryMutation.mutate(formData);
    }
  };

  const handleEdit = (boundary: GradingBoundary) => {
    setFormData({
      name: boundary.name,
      grade: boundary.grade,
      minScore: boundary.minScore,
      maxScore: boundary.maxScore,
      remark: boundary.remark || '',
      gradePoint: boundary.gradePoint || 0,
      isDefault: boundary.isDefault,
    });
    setEditingBoundary(boundary);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setBoundaryToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (boundaryToDelete) {
      deleteBoundaryMutation.mutate(boundaryToDelete);
    }
  };

  const defaultBoundaries = [
    { grade: 'A+', minScore: 90, maxScore: 100, remark: 'Excellent', gradePoint: 4.0 },
    { grade: 'A', minScore: 80, maxScore: 89, remark: 'Very Good', gradePoint: 3.7 },
    { grade: 'B+', minScore: 70, maxScore: 79, remark: 'Good', gradePoint: 3.3 },
    { grade: 'B', minScore: 60, maxScore: 69, remark: 'Credit', gradePoint: 3.0 },
    { grade: 'C', minScore: 50, maxScore: 59, remark: 'Pass', gradePoint: 2.0 },
    { grade: 'D', minScore: 40, maxScore: 49, remark: 'Fair', gradePoint: 1.0 },
    { grade: 'F', minScore: 0, maxScore: 39, remark: 'Fail', gradePoint: 0.0 },
  ];

  const createDefaultBoundariesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/grading-boundaries/bulk', {
        name: 'Standard',
        isDefault: true,
        boundaries: defaultBoundaries,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grading-boundaries'] });
      toast({ title: 'Success', description: 'Default grading boundaries created' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create default boundaries', variant: 'destructive' });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center">
          <GraduationCap className="w-5 h-5 mr-2" />
          Grading Boundaries
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          {boundaries.length === 0 && (
            <Button
              variant="outline"
              onClick={() => createDefaultBoundariesMutation.mutate()}
              disabled={createDefaultBoundariesMutation.isPending}
              data-testid="button-create-defaults"
            >
              {createDefaultBoundariesMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Default Scale
            </Button>
          )}
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} data-testid="button-add-boundary">
            <Plus className="w-4 h-4 mr-2" />
            Add Boundary
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : boundaries.length === 0 ? (
          <div className="text-center py-8">
            <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No grading boundaries configured yet.</p>
            <p className="text-sm text-muted-foreground">Click "Create Default Scale" to set up the standard A-F grading scale, or add custom boundaries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Score Range</TableHead>
                  <TableHead>Grade Point</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead>Scale Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boundaries.map((boundary) => (
                  <TableRow key={boundary.id} data-testid={`row-boundary-${boundary.id}`}>
                    <TableCell className="font-semibold">
                      <Badge variant="outline">{boundary.grade}</Badge>
                    </TableCell>
                    <TableCell>{boundary.minScore} - {boundary.maxScore}%</TableCell>
                    <TableCell>{boundary.gradePoint?.toFixed(1) || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{boundary.remark || '-'}</TableCell>
                    <TableCell>
                      {boundary.name}
                      {boundary.isDefault && <Badge className="ml-2" variant="secondary">Default</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(boundary)}
                          data-testid={`button-edit-boundary-${boundary.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(boundary.id)}
                          data-testid={`button-delete-boundary-${boundary.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBoundary ? 'Edit Grading Boundary' : 'Add Grading Boundary'}</DialogTitle>
            <DialogDescription>
              Define the score range for this grade level.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grade">Grade Letter</Label>
                <Input
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value.toUpperCase() })}
                  placeholder="e.g., A+"
                  data-testid="input-grade"
                />
              </div>
              <div>
                <Label htmlFor="gradePoint">Grade Point</Label>
                <Input
                  id="gradePoint"
                  type="number"
                  step="0.1"
                  value={formData.gradePoint}
                  onChange={(e) => setFormData({ ...formData, gradePoint: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 4.0"
                  data-testid="input-grade-point"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minScore">Minimum Score (%)</Label>
                <Input
                  id="minScore"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.minScore}
                  onChange={(e) => setFormData({ ...formData, minScore: parseInt(e.target.value) || 0 })}
                  data-testid="input-min-score"
                />
              </div>
              <div>
                <Label htmlFor="maxScore">Maximum Score (%)</Label>
                <Input
                  id="maxScore"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 100 })}
                  data-testid="input-max-score"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="remark">Remark</Label>
              <Input
                id="remark"
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="e.g., Excellent, Very Good, Pass"
                data-testid="input-remark"
              />
            </div>
            <div>
              <Label htmlFor="name">Scale Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard, Custom"
                data-testid="input-scale-name"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                data-testid="switch-is-default"
              />
              <Label htmlFor="isDefault">Set as default grading scale</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createBoundaryMutation.isPending || updateBoundaryMutation.isPending} 
              data-testid="button-save-boundary"
            >
              {(createBoundaryMutation.isPending || updateBoundaryMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingBoundary ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this grading boundary? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteBoundaryMutation.isPending} data-testid="button-confirm-delete">
              {deleteBoundaryMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ClassPositionSettings() {
  const { toast } = useToast();
  const [positioningMethod, setPositioningMethod] = useState('average');
  const [isLoading, setIsLoading] = useState(true);

  const { data: settings } = useQuery<{ positioningMethod: string }>({
    queryKey: ['/api/settings/positioning-method'],
  });

  useEffect(() => {
    if (settings) {
      setPositioningMethod(settings.positioningMethod || 'average');
      setIsLoading(false);
    }
  }, [settings]);

  const savePositioningMethodMutation = useMutation({
    mutationFn: async (method: string) => {
      return apiRequest('PATCH', '/api/settings/positioning-method', { positioningMethod: method });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/positioning-method'] });
      toast({ title: 'Success', description: 'Class position calculation method updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update positioning method', variant: 'destructive' });
    },
  });

  const handleSave = () => {
    savePositioningMethodMutation.mutate(positioningMethod);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Scale className="w-5 h-5 mr-2" />
          Class Position Calculation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="positioningMethod">Position Calculation Method</Label>
          <p className="text-sm text-muted-foreground">
            Choose how student class positions are calculated. This affects ranking on report cards.
          </p>
          <Select
            value={positioningMethod}
            onValueChange={setPositioningMethod}
            disabled={isLoading}
          >
            <SelectTrigger data-testid="select-positioning-method">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="average" data-testid="option-average">
                Average Score (Recommended)
              </SelectItem>
              <SelectItem value="total" data-testid="option-total">
                Total Marks
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-muted/50 rounded-md p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div className="text-sm">
              {positioningMethod === 'average' ? (
                <div>
                  <p className="font-medium">Average Score Method</p>
                  <p className="text-muted-foreground">
                    Students are ranked by their average percentage score. This is fair when students in different departments take different numbers of subjects.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Total Marks Method</p>
                  <p className="text-muted-foreground">
                    Students are ranked by their total marks obtained. This may not be fair when students take different numbers of subjects.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={savePositioningMethodMutation.isPending}
            data-testid="button-save-positioning"
          >
            {savePositioningMethodMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
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
        <TabsList className="grid w-full grid-cols-6" data-testid="tabs-settings">
          <TabsTrigger value="school" data-testid="tab-school">
            <School className="w-4 h-4 mr-2" />
            School
          </TabsTrigger>
          <TabsTrigger value="grading" data-testid="tab-grading">
            <GraduationCap className="w-4 h-4 mr-2" />
            Grading
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

        <TabsContent value="grading" className="space-y-4">
          <ClassPositionSettings />
          <GradingBoundariesSection />
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
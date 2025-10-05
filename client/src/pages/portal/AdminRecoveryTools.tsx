
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Key, Mail, AlertCircle, CheckCircle, UserCog } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function AdminRecoveryTools() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [resetUserId, setResetUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forceChange, setForceChange] = useState(true);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryUserId, setRecoveryUserId] = useState('');

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { userId: string; newPassword: string; forceChange: boolean }) => {
      const response = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to reset password');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Password Reset Successful',
        description: 'User password has been reset. They will receive an email notification.',
      });
      setResetUserId('');
      setNewPassword('');
      queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Password Reset Failed',
        description: error.message || 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Recovery email update mutation
  const updateRecoveryEmailMutation = useMutation({
    mutationFn: async (data: { userId: string; recoveryEmail: string }) => {
      const response = await fetch('/api/admin/update-recovery-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update recovery email');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: '✅ Recovery Email Updated',
        description: 'User recovery email has been updated successfully.',
      });
      setRecoveryUserId('');
      setRecoveryEmail('');
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Update Failed',
        description: error.message || 'Failed to update recovery email.',
        variant: 'destructive',
      });
    },
  });

  const handleResetPassword = () => {
    if (!resetUserId || !newPassword) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both user ID and new password.',
        variant: 'destructive',
      });
      return;
    }
    resetPasswordMutation.mutate({ userId: resetUserId, newPassword, forceChange });
  };

  const handleUpdateRecoveryEmail = () => {
    if (!recoveryUserId || !recoveryEmail) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both user ID and recovery email.',
        variant: 'destructive',
      });
      return;
    }
    updateRecoveryEmailMutation.mutate({ userId: recoveryUserId, recoveryEmail });
  };

  return (
    <PortalLayout
      userRole="admin"
      userName={`${user?.firstName} ${user?.lastName}`}
      userInitials={`${user?.firstName[0]}${user?.lastName[0]}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Admin Recovery Tools
              </h2>
              <p className="text-red-100 text-sm">Master recovery powers for account management</p>
            </div>
          </div>
        </div>

        {/* Security Warning */}
        <Card className="border-2 border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                  ⚠️ High-Security Zone
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  These tools provide master access to user accounts. All actions are logged in the audit trail. Use responsibly and only when necessary.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Password Reset Tool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                Reset User Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reset-user-id">User ID or Username</Label>
                <Input
                  id="reset-user-id"
                  value={resetUserId}
                  onChange={(e) => setResetUserId(e.target.value)}
                  placeholder="Enter user ID or username"
                />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong password (min 8 characters)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="force-change"
                  checked={forceChange}
                  onChange={(e) => setForceChange(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="force-change" className="text-sm cursor-pointer">
                  Force password change at next login
                </Label>
              </div>
              <Button
                onClick={handleResetPassword}
                disabled={resetPasswordMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </CardContent>
          </Card>

          {/* Recovery Email Tool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                Update Recovery Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="recovery-user-id">User ID or Username</Label>
                <Input
                  id="recovery-user-id"
                  value={recoveryUserId}
                  onChange={(e) => setRecoveryUserId(e.target.value)}
                  placeholder="Enter user ID or username"
                />
              </div>
              <div>
                <Label htmlFor="recovery-email">Recovery Email Address</Label>
                <Input
                  id="recovery-email"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="parent@example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For students: parent/guardian email. For staff: alternate contact.
                </p>
              </div>
              <Button
                onClick={handleUpdateRecoveryEmail}
                disabled={updateRecoveryEmailMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {updateRecoveryEmailMutation.isPending ? 'Updating...' : 'Update Recovery Email'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Recovery Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Password Reset:</strong> Always enable "Force password change" for security. User will be notified via email.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Recovery Email:</strong> Must be a valid, accessible email for password reset links.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Audit Trail:</strong> All recovery actions are logged with your admin ID and timestamp.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Master Recovery:</strong> Contact system administrator if you are locked out of your admin account.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

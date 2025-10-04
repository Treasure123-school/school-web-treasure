import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  User, 
  ShieldAlert, 
  ShieldCheck, 
  RotateCcw,
  Filter,
  MoreVertical,
  Trash2,
  KeyRound,
  UserCog
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  roleId: number;
  roleName?: string;
  googleId: string | null;
  profileImageUrl: string | null;
  createdVia: string | null;
  status: 'pending' | 'active' | 'suspended' | 'disabled';
  createdAt: Date | null;
  authProvider: string;
}

interface Role {
  id: number;
  name: string;
}

type ActionType = 'approve' | 'suspend' | 'unsuspend' | 'unverify' | 'disable' | 'delete' | 'resetPassword' | 'changeRole';

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [forceChange, setForceChange] = useState(true);
  
  const [changeRoleDialog, setChangeRoleDialog] = useState(false);
  const [newRoleId, setNewRoleId] = useState<number | null>(null);

  // Fetch all users
  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch pending users for count
  const { data: pendingUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users/pending'],
  });

  // Fetch roles for role change dialog
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
  });

  // Filter users by status
  const filteredUsers = statusFilter === 'all' 
    ? allUsers 
    : allUsers.filter(u => u.status === statusFilter);

  // Approve user mutation
  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/users/${userId}/approve`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>User Approved</span>
          </div>
        ),
        description: data?.message || "The user has been approved and can now log in.",
        className: "border-green-500 bg-green-50",
      });
      setSelectedUser(null);
      setActionType(null);
    },
    onError: (error: any) => {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>Approval Failed</span>
          </div>
        ),
        description: error.message || "Failed to approve user. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
    },
  });

  // Change status mutation
  const changeStatusMutation = useMutation({
    mutationFn: async ({ userId, status, reason }: { userId: string; status: string; reason: string }) => {
      return await apiRequest('POST', `/api/users/${userId}/status`, {
        status,
        reason
      });
    },
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Status Updated</span>
          </div>
        ),
        description: data?.message || `User status has been updated to ${variables.status}`,
        className: "border-green-500 bg-green-50",
      });
      setSelectedUser(null);
      setActionType(null);
    },
    onError: (error: any) => {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>Status Update Failed</span>
          </div>
        ),
        description: error.message || "Failed to update user status. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>User Deleted</span>
          </div>
        ),
        description: data?.message || "The user has been permanently removed from the system.",
        className: "border-green-500 bg-green-50",
      });
      setSelectedUser(null);
      setActionType(null);
    },
    onError: (error: any) => {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>Deletion Failed</span>
          </div>
        ),
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword, forceChange }: { userId: string; newPassword: string; forceChange: boolean }) => {
      return await apiRequest('POST', `/api/users/${userId}/reset-password`, {
        newPassword,
        forceChange
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Password Reset</span>
          </div>
        ),
        description: data?.message || "User password has been reset successfully.",
        className: "border-green-500 bg-green-50",
      });
      setResetPasswordDialog(false);
      setNewPassword('');
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>Password Reset Failed</span>
          </div>
        ),
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
    },
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: number }) => {
      return await apiRequest('POST', `/api/users/${userId}/role`, {
        roleId
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Role Changed</span>
          </div>
        ),
        description: data?.message || "User role has been updated successfully.",
        className: "border-green-500 bg-green-50",
      });
      setChangeRoleDialog(false);
      setNewRoleId(null);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>Role Change Failed</span>
          </div>
        ),
        description: error.message || "Failed to change user role. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
    },
  });

  const handleAction = (user: User, action: ActionType) => {
    setSelectedUser(user);
    if (action === 'resetPassword') {
      setResetPasswordDialog(true);
    } else if (action === 'changeRole') {
      setNewRoleId(user.roleId);
      setChangeRoleDialog(true);
    } else {
      setActionType(action);
    }
  };

  const confirmAction = () => {
    if (!selectedUser || !actionType) return;

    if (actionType === 'approve') {
      approveMutation.mutate(selectedUser.id);
    } else if (actionType === 'suspend') {
      changeStatusMutation.mutate({
        userId: selectedUser.id,
        status: 'suspended',
        reason: 'Suspended by admin'
      });
    } else if (actionType === 'unsuspend') {
      changeStatusMutation.mutate({
        userId: selectedUser.id,
        status: 'active',
        reason: 'Unsuspended by admin'
      });
    } else if (actionType === 'unverify') {
      changeStatusMutation.mutate({
        userId: selectedUser.id,
        status: 'pending',
        reason: 'Moved back to pending for re-verification'
      });
    } else if (actionType === 'disable') {
      changeStatusMutation.mutate({
        userId: selectedUser.id,
        status: 'disabled',
        reason: 'Disabled by admin'
      });
    } else if (actionType === 'delete') {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const handleResetPassword = () => {
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>Validation Error</span>
          </div>
        ),
        description: "Password must be at least 6 characters long",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
      return;
    }
    resetPasswordMutation.mutate({
      userId: selectedUser.id,
      newPassword,
      forceChange
    });
  };

  const handleChangeRole = () => {
    if (!selectedUser || !newRoleId) {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>Validation Error</span>
          </div>
        ),
        description: "Please select a role",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
      return;
    }
    changeRoleMutation.mutate({
      userId: selectedUser.id,
      roleId: newRoleId
    });
  };

  if (!user) {
    return <div>Please log in to access the admin portal.</div>;
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const badgeConfigs: Record<string, { variant: any; label: string; icon: React.ReactNode }> = {
      'pending': { 
        variant: 'secondary', 
        label: 'Unverified', 
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      'active': { 
        variant: 'default', 
        label: 'Verified', 
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      'suspended': { 
        variant: 'destructive', 
        label: 'Suspended', 
        icon: <ShieldAlert className="h-3 w-3 mr-1" />
      },
      'disabled': { 
        variant: 'outline', 
        label: 'Disabled', 
        icon: <XCircle className="h-3 w-3 mr-1" />
      }
    };
    
    const badgeConfig = badgeConfigs[status] || { 
      variant: 'outline', 
      label: status,
      icon: null
    };
    
    return (
      <Badge 
        variant={badgeConfig.variant as any}
        className="font-medium"
        data-testid={`badge-status-${status}`}
      >
        <div className="flex items-center">
          {badgeConfig.icon}
          <span>{badgeConfig.label}</span>
        </div>
      </Badge>
    );
  };

  const getActionButtons = (targetUser: User) => {
    const buttons = [];
    
    if (targetUser.status === 'pending') {
      buttons.push(
        <Button
          key="approve"
          size="sm"
          variant="default"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => handleAction(targetUser, 'approve')}
          disabled={approveMutation.isPending || changeStatusMutation.isPending}
          data-testid={`button-approve-${targetUser.id}`}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Verify & Approve
        </Button>
      );
    }
    
    if (targetUser.status === 'active') {
      buttons.push(
        <Button
          key="suspend"
          size="sm"
          variant="outline"
          className="border-orange-500 text-orange-700 hover:bg-orange-50"
          onClick={() => handleAction(targetUser, 'suspend')}
          disabled={approveMutation.isPending || changeStatusMutation.isPending}
          data-testid={`button-suspend-${targetUser.id}`}
        >
          <ShieldAlert className="h-4 w-4 mr-1" />
          Suspend Access
        </Button>
      );
    }
    
    if (targetUser.status === 'suspended') {
      buttons.push(
        <Button
          key="unsuspend"
          size="sm"
          variant="default"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => handleAction(targetUser, 'unsuspend')}
          disabled={approveMutation.isPending || changeStatusMutation.isPending}
          data-testid={`button-unsuspend-${targetUser.id}`}
        >
          <ShieldCheck className="h-4 w-4 mr-1" />
          Restore Access
        </Button>
      );
    }
    
    // More Actions Dropdown
    buttons.push(
      <DropdownMenu key="more-actions">
        <DropdownMenuTrigger asChild>
          <Button 
            size="sm" 
            variant="ghost"
            data-testid={`button-more-actions-${targetUser.id}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" data-testid={`menu-actions-${targetUser.id}`}>
          <DropdownMenuLabel>Admin Powers</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {targetUser.authProvider !== 'google' && (
            <DropdownMenuItem 
              onClick={() => handleAction(targetUser, 'resetPassword')}
              data-testid={`menu-item-reset-password-${targetUser.id}`}
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Reset Password
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={() => handleAction(targetUser, 'changeRole')}
            data-testid={`menu-item-change-role-${targetUser.id}`}
          >
            <UserCog className="h-4 w-4 mr-2" />
            Change Role
          </DropdownMenuItem>
          
          {(targetUser.status === 'active' || targetUser.status === 'pending') && (
            <DropdownMenuItem 
              onClick={() => handleAction(targetUser, 'unverify')}
              data-testid={`menu-item-unverify-${targetUser.id}`}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Mark as Unverified
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => handleAction(targetUser, 'delete')}
            className="text-destructive focus:text-destructive"
            data-testid={`menu-item-delete-${targetUser.id}`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    
    return buttons;
  };

  const UserList = ({ users }: { users: User[] }) => (
    <div className="space-y-4">
      {users.map((targetUser) => (
        <div
          key={targetUser.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          data-testid={`user-card-${targetUser.id}`}
        >
          <div className="flex items-center gap-4 flex-1">
            <Avatar className="h-12 w-12">
              {targetUser.profileImageUrl && (
                <AvatarImage src={targetUser.profileImageUrl} alt={`${targetUser.firstName} ${targetUser.lastName}`} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(targetUser.firstName, targetUser.lastName)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h3 className="font-semibold" data-testid={`text-user-name-${targetUser.id}`}>
                {targetUser.firstName} {targetUser.lastName}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1" data-testid={`text-user-email-${targetUser.id}`}>
                  <Mail className="h-3 w-3" />
                  {targetUser.email}
                </span>
                <span className="flex items-center gap-1" data-testid={`text-user-username-${targetUser.id}`}>
                  <User className="h-3 w-3" />
                  {targetUser.username}
                </span>
              </div>
            </div>

            <div className="text-right space-y-2">
              <div className="flex items-center gap-2 justify-end">
                <Badge variant="outline" data-testid={`badge-role-${targetUser.id}`}>
                  {targetUser.roleName || 'Unknown'}
                </Badge>
                {getStatusBadge(targetUser.status)}
              </div>
              <div className="text-xs text-muted-foreground" data-testid={`text-auth-method-${targetUser.id}`}>
                {targetUser.authProvider === 'google' ? 'Google Sign-in' : 'Password Login'}
              </div>
              <div className="text-xs text-muted-foreground" data-testid={`text-created-date-${targetUser.id}`}>
                Joined: {formatDate(targetUser.createdAt)}
              </div>
            </div>
          </div>

          <div className="flex gap-2 ml-4 flex-wrap justify-end max-w-xs">
            {getActionButtons(targetUser)}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <PortalLayout 
      userRole="admin" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
              User Management
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-page-description">
              Manage user accounts, approvals, and access control
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-base px-3 py-1" data-testid="badge-pending-count">
              {pendingUsers.length} Pending
            </Badge>
            <Badge variant="outline" className="text-base px-3 py-1" data-testid="badge-total-count">
              {allUsers.length} Total
            </Badge>
          </div>
        </div>

        {/* Tabs for different user status views */}
        <Tabs defaultValue="all" className="space-y-4" onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-users">
              All Users ({allUsers.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending-users">
              Pending ({allUsers.filter(u => u.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active-users">
              Active ({allUsers.filter(u => u.status === 'active').length})
            </TabsTrigger>
            <TabsTrigger value="suspended" data-testid="tab-suspended-users">
              Suspended ({allUsers.filter(u => u.status === 'suspended').length})
            </TabsTrigger>
            <TabsTrigger value="disabled" data-testid="tab-disabled-users">
              Disabled ({allUsers.filter(u => u.status === 'disabled').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="space-y-4">
            <Card data-testid="card-users-list">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  {statusFilter === 'all' ? 'All Users' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Users`}
                </CardTitle>
                <CardDescription>
                  {statusFilter === 'pending' && 'New users awaiting admin approval'}
                  {statusFilter === 'active' && 'Users with active access to the system'}
                  {statusFilter === 'suspended' && 'Users whose access has been temporarily suspended'}
                  {statusFilter === 'disabled' && 'Users whose accounts have been disabled'}
                  {statusFilter === 'all' && 'All users in the system regardless of status'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-loading">
                    Loading users...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-users">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No users found</p>
                    <p className="text-sm">
                      {statusFilter === 'all' ? 'No users in the system' : `No ${statusFilter} users`}
                    </p>
                  </div>
                ) : (
                  <UserList users={filteredUsers} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedUser && !!actionType} onOpenChange={(open) => {
        if (!open) {
          setSelectedUser(null);
          setActionType(null);
        }
      }}>
        <AlertDialogContent data-testid="dialog-confirm-action">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-dialog-title">
              {actionType === 'approve' && 'Approve User?'}
              {actionType === 'suspend' && 'Suspend User?'}
              {actionType === 'unsuspend' && 'Unsuspend User?'}
              {actionType === 'unverify' && 'Unverify User?'}
              {actionType === 'disable' && 'Disable User?'}
              {actionType === 'delete' && '⚠️ Delete Account Permanently?'}
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="text-dialog-description">
              {actionType === 'approve' && (
                <>
                  Are you sure you want to approve <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>? 
                  They will be able to log in immediately.
                </>
              )}
              {actionType === 'suspend' && (
                <>
                  Are you sure you want to suspend <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>? 
                  They will not be able to log in until unsuspended.
                </>
              )}
              {actionType === 'unsuspend' && (
                <>
                  Are you sure you want to unsuspend <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>? 
                  They will be able to log in again immediately.
                </>
              )}
              {actionType === 'unverify' && (
                <>
                  Are you sure you want to move <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong> back to pending? 
                  They will need admin approval again before they can log in.
                </>
              )}
              {actionType === 'disable' && (
                <>
                  Are you sure you want to disable <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>? 
                  Their account will be permanently disabled.
                </>
              )}
              {actionType === 'delete' && (
                <>
                  <strong className="text-destructive">Warning: This action cannot be undone!</strong>
                  <br /><br />
                  Are you sure you want to permanently delete <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>? 
                  All user data, records, and history will be permanently removed from the system.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              className={(actionType === 'disable' || actionType === 'suspend' || actionType === 'delete') ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              data-testid="button-confirm"
            >
              {actionType === 'approve' && 'Approve'}
              {actionType === 'suspend' && 'Suspend'}
              {actionType === 'unsuspend' && 'Unsuspend'}
              {actionType === 'unverify' && 'Unverify'}
              {actionType === 'disable' && 'Disable'}
              {actionType === 'delete' && 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
        <DialogContent data-testid="dialog-reset-password">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                data-testid="input-new-password"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="force-change"
                checked={forceChange}
                onChange={(e) => setForceChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                data-testid="checkbox-force-change"
              />
              <Label htmlFor="force-change" className="text-sm font-normal">
                Force user to change password on next login
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setResetPasswordDialog(false);
                setNewPassword('');
                setSelectedUser(null);
              }}
              data-testid="button-cancel-reset"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
              data-testid="button-confirm-reset"
            >
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={changeRoleDialog} onOpenChange={setChangeRoleDialog}>
        <DialogContent data-testid="dialog-change-role">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-role">Select New Role</Label>
              <Select 
                value={newRoleId?.toString()} 
                onValueChange={(value) => setNewRoleId(parseInt(value))}
              >
                <SelectTrigger data-testid="select-new-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()} data-testid={`role-option-${role.id}`}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Current role: <strong>{selectedUser?.roleName}</strong>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setChangeRoleDialog(false);
                setNewRoleId(null);
                setSelectedUser(null);
              }}
              data-testid="button-cancel-role-change"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleChangeRole}
              disabled={changeRoleMutation.isPending}
              data-testid="button-confirm-role-change"
            >
              {changeRoleMutation.isPending ? 'Changing...' : 'Change Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}

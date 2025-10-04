import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  User, 
  ShieldAlert, 
  ShieldCheck, 
  RotateCcw,
  Filter
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

type ActionType = 'approve' | 'suspend' | 'unsuspend' | 'unverify' | 'disable';

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch all users
  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch pending users for count
  const { data: pendingUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users/pending'],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      toast({
        title: "User Approved",
        description: "The user has been approved and can now log in.",
      });
      setSelectedUser(null);
      setActionType(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve user",
        variant: "destructive",
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      
      const statusMessages: Record<string, string> = {
        'suspended': 'User has been suspended',
        'active': 'User has been unsuspended',
        'pending': 'User has been moved back to pending approval',
        'disabled': 'User account has been disabled'
      };
      
      toast({
        title: "Status Updated",
        description: statusMessages[variables.status] || "User status has been updated",
      });
      setSelectedUser(null);
      setActionType(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const handleAction = (user: User, action: ActionType) => {
    setSelectedUser(user);
    setActionType(action);
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
    }
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
    const badges: Record<string, { variant: any; label: string }> = {
      'pending': { variant: 'secondary', label: 'Pending' },
      'active': { variant: 'default', label: 'Active' },
      'suspended': { variant: 'destructive', label: 'Suspended' },
      'disabled': { variant: 'outline', label: 'Disabled' }
    };
    
    const badgeConfig = badges[status] || { variant: 'outline', label: status };
    return <Badge variant={badgeConfig.variant as any}>{badgeConfig.label}</Badge>;
  };

  const getActionButtons = (targetUser: User) => {
    const buttons = [];
    
    if (targetUser.status === 'pending') {
      buttons.push(
        <Button
          key="approve"
          size="sm"
          variant="default"
          onClick={() => handleAction(targetUser, 'approve')}
          disabled={approveMutation.isPending || changeStatusMutation.isPending}
          data-testid={`button-approve-${targetUser.id}`}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Approve
        </Button>
      );
    }
    
    if (targetUser.status === 'active') {
      buttons.push(
        <Button
          key="suspend"
          size="sm"
          variant="outline"
          onClick={() => handleAction(targetUser, 'suspend')}
          disabled={approveMutation.isPending || changeStatusMutation.isPending}
          data-testid={`button-suspend-${targetUser.id}`}
        >
          <ShieldAlert className="h-4 w-4 mr-1" />
          Suspend
        </Button>
      );
      buttons.push(
        <Button
          key="unverify"
          size="sm"
          variant="outline"
          onClick={() => handleAction(targetUser, 'unverify')}
          disabled={approveMutation.isPending || changeStatusMutation.isPending}
          data-testid={`button-unverify-${targetUser.id}`}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Unverify
        </Button>
      );
    }
    
    if (targetUser.status === 'suspended') {
      buttons.push(
        <Button
          key="unsuspend"
          size="sm"
          variant="default"
          onClick={() => handleAction(targetUser, 'unsuspend')}
          disabled={approveMutation.isPending || changeStatusMutation.isPending}
          data-testid={`button-unsuspend-${targetUser.id}`}
        >
          <ShieldCheck className="h-4 w-4 mr-1" />
          Unsuspend
        </Button>
      );
    }
    
    if (targetUser.status === 'pending' || targetUser.status === 'active') {
      buttons.push(
        <Button
          key="disable"
          size="sm"
          variant="destructive"
          onClick={() => handleAction(targetUser, 'disable')}
          disabled={approveMutation.isPending || changeStatusMutation.isPending}
          data-testid={`button-disable-${targetUser.id}`}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Disable
        </Button>
      );
    }
    
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
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              className={(actionType === 'disable' || actionType === 'suspend') ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              data-testid="button-confirm"
            >
              {actionType === 'approve' && 'Approve'}
              {actionType === 'suspend' && 'Suspend'}
              {actionType === 'unsuspend' && 'Unsuspend'}
              {actionType === 'unverify' && 'Unverify'}
              {actionType === 'disable' && 'Disable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
}

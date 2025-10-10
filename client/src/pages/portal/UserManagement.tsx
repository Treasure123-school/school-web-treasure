import { useState, useEffect } from "react";
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
  UserCog,
  Shield,
  Users,
  Ban,
  Eye,
  AlertCircle
} from "lucide-react";
import { Textarea } from '@/components/ui/textarea';
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
  recoveryEmail?: string | null;
}

interface Role {
  id: number;
  name: string;
}

type ActionType = 'approve' | 'suspend' | 'unsuspend' | 'verify' | 'unverify' | 'disable' | 'delete' | 'resetPassword' | 'changeRole' | 'updateRecoveryEmail' | 'viewLogs';

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [forceChange, setForceChange] = useState(true);

  const [changeRoleDialog, setChangeRoleDialog] = useState(false);
  const [newRoleId, setNewRoleId] = useState<number | null>(null);

  const [recoveryEmailDialog, setRecoveryEmailDialog] = useState(false);
  const [newRecoveryEmail, setNewRecoveryEmail] = useState('');

  // New states for suspend and delete dialogs
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);

  // Fetch all users with BALANCED refresh settings
  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 3000, // 3 seconds - avoid excessive refetches
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnMount: true, // Fetch on component mount
  });

  // Fetch pending users for count with BALANCED refresh settings
  const { data: pendingUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users/pending'],
    staleTime: 3000, // 3 seconds - avoid excessive refetches
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch roles for role change dialog with LONG cache (roles don't change often)
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
    staleTime: 30 * 60 * 1000, // 30 minutes - roles change rarely
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });

  // Filter users by status
  const filteredUsers = statusFilter === 'all' 
    ? allUsers 
    : allUsers.filter(u => u.status === statusFilter);

  // Approve user mutation with OPTIMISTIC UPDATES for instant feedback
  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/users/${userId}/approve`);
    },
    onMutate: async (userId: string) => {
      // INSTANT FEEDBACK: Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/users'] });
      await queryClient.cancelQueries({ queryKey: ['/api/users/pending'] });

      // INSTANT FEEDBACK: Snapshot previous values
      const previousUsers = queryClient.getQueryData(['/api/users']);
      const previousPendingUsers = queryClient.getQueryData(['/api/users/pending']);

      // INSTANT FEEDBACK: Optimistically update user status in main list
      queryClient.setQueryData(['/api/users'], (old: any) => {
        if (!old) return old;
        return old.map((user: any) => 
          user.id === userId ? { ...user, status: 'active' } : user
        );
      });

      // INSTANT FEEDBACK: Optimistically remove from pending list
      queryClient.setQueryData(['/api/users/pending'], (old: any) => {
        if (!old) return old;
        return old.filter((user: any) => user.id !== userId);
      });

      return { previousUsers, previousPendingUsers };
    },
    onSuccess: async (data: any) => {
      // AGGRESSIVE REFETCH: Force immediate background refetch for guaranteed consistency
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['/api/users/pending'], refetchType: 'active' })
      ]);

      toast({
        title: "✓ User Approved",
        description: data?.message || "The user has been approved and can now log in.",
        className: "border-green-500 bg-green-50",
      });
      setSelectedUser(null);
      setActionType(null);
    },
    onError: (error: any, userId: string, context: any) => {
      // ROLLBACK: Restore previous state on error
      if (context?.previousUsers) {
        queryClient.setQueryData(['/api/users'], context.previousUsers);
      }
      if (context?.previousPendingUsers) {
        queryClient.setQueryData(['/api/users/pending'], context.previousPendingUsers);
      }
      toast({
        title: "✗ Approval Failed",
        description: error.message || "Failed to approve user. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
    },
  });

  // Change status mutation with OPTIMISTIC UPDATES
  const changeStatusMutation = useMutation({
    mutationFn: async ({ userId, status, reason }: { userId: string; status: string; reason: string }) => {
      return await apiRequest('POST', `/api/users/${userId}/status`, {
        status,
        reason
      });
    },
    onMutate: async ({ userId, status }) => {
      // INSTANT FEEDBACK: Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/users'] });
      await queryClient.cancelQueries({ queryKey: ['/api/users/pending'] });

      // INSTANT FEEDBACK: Snapshot previous values
      const previousUsers = queryClient.getQueryData(['/api/users']);
      const previousPendingUsers = queryClient.getQueryData(['/api/users/pending']);

      // INSTANT FEEDBACK: Optimistically update status in both caches
      queryClient.setQueryData(['/api/users'], (old: any) => {
        if (!old) return old;
        return old.map((user: any) => 
          user.id === userId ? { ...user, status } : user
        );
      });

      queryClient.setQueryData(['/api/users/pending'], (old: any) => {
        if (!old) return old;
        if (status === 'active') {
          return old.filter((user: any) => user.id !== userId);
        }
        return old.map((user: any) => 
          user.id === userId ? { ...user, status } : user
        );
      });

      return { previousUsers, previousPendingUsers };
    },
    onSuccess: async (data: any, variables) => {
      // AGGRESSIVE REFETCH: Force immediate background refetch for guaranteed consistency
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['/api/users/pending'], refetchType: 'active' })
      ]);

      toast({
        title: "✓ Status Updated",
        description: data?.message || `User status has been updated to ${variables.status}`,
        className: "border-green-500 bg-green-50",
      });
      setSelectedUser(null);
      setActionType(null);
    },
    onError: (error: any, variables, context: any) => {
      // ROLLBACK: Restore previous state on error
      if (context?.previousUsers) {
        queryClient.setQueryData(['/api/users'], context.previousUsers);
      }
      if (context?.previousPendingUsers) {
        queryClient.setQueryData(['/api/users/pending'], context.previousPendingUsers);
      }
      toast({
        title: "✗ Status Update Failed",
        description: error.message || "Failed to update user status. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
    },
  });

  // Delete user mutation with OPTIMISTIC UPDATES + AGGRESSIVE REFETCH
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      setDeletingUserId(userId); // Mark user as being deleted
      return await apiRequest('DELETE', `/api/users/${userId}`);
    },
    onMutate: async (userId: string) => {
      // INSTANT FEEDBACK: Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/users'] });
      await queryClient.cancelQueries({ queryKey: ['/api/users/pending'] });

      // INSTANT FEEDBACK: Snapshot previous values for rollback
      const previousUsers = queryClient.getQueryData(['/api/users']);
      const previousPendingUsers = queryClient.getQueryData(['/api/users/pending']);

      // INSTANT FEEDBACK: Optimistically remove user from both caches
      queryClient.setQueryData(['/api/users'], (old: any) => {
        if (!old) return old;
        return old.filter((user: any) => user.id !== userId);
      });

      queryClient.setQueryData(['/api/users/pending'], (old: any) => {
        if (!old) return old;
        return old.filter((user: any) => user.id !== userId);
      });

      return { previousUsers, previousPendingUsers };
    },
    onSuccess: async (data: any, userId) => {
      console.log(`✅ User ${userId} deleted successfully. Forcing cache refresh...`);

      // AGGRESSIVE REFETCH: Force immediate background refetch for guaranteed consistency
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['/api/users/pending'], refetchType: 'active' })
      ]);

      toast({
        title: <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>User Deleted</span></div>,
        description: data?.message || "User has been deleted successfully.",
        className: "border-green-500 bg-green-50",
      });

      setDeletingUserId(null); // Clear deleting state
      setDeleteDialog(false);
      setSelectedUser(null);
      setActionType(null);
    },
    onError: (error: any, userId: string, context: any) => {
      console.error(`❌ Failed to delete user ${userId}:`, error);

      setDeletingUserId(null); // Clear deleting state

      // ROLLBACK: Restore previous state on error
      if (context?.previousUsers) {
        queryClient.setQueryData(['/api/users'], context.previousUsers);
      }
      if (context?.previousPendingUsers) {
        queryClient.setQueryData(['/api/users/pending'], context.previousPendingUsers);
      }

      // If user was already deleted (404), treat as success and clear cache
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        console.log(`⚠️ User ${userId} already deleted. Forcing cache refresh...`);

        // Force immediate refetch to get accurate state
        queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'active' });
        queryClient.invalidateQueries({ queryKey: ['/api/users/pending'], refetchType: 'active' });

        toast({
          title: <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>User Already Deleted</span></div>,
          description: "This user has already been removed from the system.",
          className: "border-green-500 bg-green-50",
        });

        setDeleteDialog(false);
        setSelectedUser(null);
        setActionType(null);
        return;
      }

      // Handle other errors
      let errorMessage = error.message || "Failed to delete user. Please try again.";

      if (error.message?.includes('foreign key constraint') || error.message?.includes('associated')) {
        errorMessage = "Cannot delete user: This account has associated records (exams, grades, etc.). Please disable the account instead.";
      }

      toast({
        title: "Deletion Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Reset password mutation with OPTIMISTIC UPDATES
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword, forceChange }: { userId: string; newPassword: string; forceChange: boolean }) => {
      const response = await apiRequest('POST', `/api/users/${userId}/reset-password`, {
        newPassword,
        forceChange
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }
      return await response.json();
    },
    onMutate: async ({ userId }) => {
      // INSTANT FEEDBACK: Show immediate success message
      toast({
        title: "↻ Resetting Password...",
        description: "Password reset in progress",
        className: "border-blue-500 bg-blue-50",
      });

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/users'] });

      // Snapshot previous values
      const previousUsers = queryClient.getQueryData(['/api/users']);

      return { previousUsers };
    },
    onSuccess: async (data: any) => {
      // AGGRESSIVE REFETCH: Force immediate background refetch
      await queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'active' });

      toast({
        title: "✓ Password Reset",
        description: data?.message || "User password has been reset successfully.",
        className: "border-green-500 bg-green-50",
      });
      setResetPasswordDialog(false);
      setNewPassword('');
      setSelectedUser(null);
    },
    onError: (error: any, variables, context: any) => {
      toast({
        title: "✗ Password Reset Failed",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
    },
  });

  // Change role mutation with OPTIMISTIC UPDATES
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: number }) => {
      const response = await apiRequest('POST', `/api/users/${userId}/role`, {
        roleId
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change role');
      }
      return await response.json();
    },
    onMutate: async ({ userId, roleId }) => {
      // INSTANT FEEDBACK: Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/users'] });

      // INSTANT FEEDBACK: Snapshot previous values
      const previousUsers = queryClient.getQueryData(['/api/users']);

      // INSTANT FEEDBACK: Optimistically update role
      queryClient.setQueryData(['/api/users'], (old: any) => {
        if (!old) return old;
        return old.map((user: any) => 
          user.id === userId ? { ...user, roleId } : user
        );
      });

      return { previousUsers };
    },
    onSuccess: async (data: any) => {
      // AGGRESSIVE REFETCH: Force immediate background refetch
      await queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'active' });

      toast({
        title: "✓ Role Changed",
        description: data?.message || "User role has been updated successfully.",
        className: "border-green-500 bg-green-50",
      });
      setChangeRoleDialog(false);
      setNewRoleId(null);
      setSelectedUser(null);
    },
    onError: (error: any, variables, context: any) => {
      // ROLLBACK: Restore previous state on error
      if (context?.previousUsers) {
        queryClient.setQueryData(['/api/users'], context.previousUsers);
      }
      toast({
        title: "✗ Role Change Failed",
        description: error.message || "Failed to change user role. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
    },
  });

  // Update recovery email mutation with OPTIMISTIC UPDATES
  const updateRecoveryEmailMutation = useMutation({
    mutationFn: async ({ userId, recoveryEmail }: { userId: string; recoveryEmail: string }) => {
      const response = await apiRequest('POST', `/api/users/${userId}/recovery-email`, {
        recoveryEmail
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update recovery email');
      }
      return await response.json();
    },
    onMutate: async ({ userId, recoveryEmail }) => {
      // INSTANT FEEDBACK: Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/users'] });

      // INSTANT FEEDBACK: Snapshot previous values
      const previousUsers = queryClient.getQueryData(['/api/users']);

      // INSTANT FEEDBACK: Optimistically update recovery email
      queryClient.setQueryData(['/api/users'], (old: any) => {
        if (!old) return old;
        return old.map((user: any) => 
          user.id === userId ? { ...user, recoveryEmail } : user
        );
      });

      return { previousUsers };
    },
    onSuccess: async (data: any) => {
      // AGGRESSIVE REFETCH: Force immediate background refetch
      await queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'active' });

      toast({
        title: "✓ Recovery Email Updated",
        description: data?.message || "Recovery email has been updated successfully.",
        className: "border-green-500 bg-green-50",
      });
      setRecoveryEmailDialog(false);
      setNewRecoveryEmail('');
      setSelectedUser(null);
    },
    onError: (error: any, variables, context: any) => {
      // ROLLBACK: Restore previous state on error
      if (context?.previousUsers) {
        queryClient.setQueryData(['/api/users'], context.previousUsers);
      }
      toast({
        title: "✗ Update Failed",
        description: error.message || "Failed to update recovery email. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
    },
  });

  // Verify/Unverify mutation with OPTIMISTIC UPDATES for instant feedback
  const verifyMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'verify' | 'unverify' }) => {
      return await apiRequest('POST', `/api/users/${userId}/${action}`);
    },
    onMutate: async ({ userId, action }) => {
      // INSTANT FEEDBACK: Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/users'] });
      await queryClient.cancelQueries({ queryKey: ['/api/users/pending'] });

      // INSTANT FEEDBACK: Snapshot previous values
      const previousUsers = queryClient.getQueryData(['/api/users']);
      const previousPendingUsers = queryClient.getQueryData(['/api/users/pending']);

      const newStatus = action === 'verify' ? 'active' : 'pending';

      // INSTANT FEEDBACK: Optimistically update status in main list
      queryClient.setQueryData(['/api/users'], (old: any) => {
        if (!old) return old;
        return old.map((user: any) => 
          user.id === userId ? { ...user, status: newStatus } : user
        );
      });

      // INSTANT FEEDBACK: Update pending list
      if (action === 'verify') {
        queryClient.setQueryData(['/api/users/pending'], (old: any) => {
          if (!old) return old;
          return old.filter((user: any) => user.id !== userId);
        });
      } else {
        queryClient.setQueryData(['/api/users/pending'], (old: any) => {
          if (!old) return old;
          const user = (queryClient.getQueryData(['/api/users']) as any)?.find((u: any) => u.id === userId);
          return user && !old.some((u: any) => u.id === userId) ? [...old, user] : old;
        });
      }

      return { previousUsers, previousPendingUsers };
    },
    onSuccess: async (data: any, variables) => {
      // AGGRESSIVE REFETCH: Force immediate background refetch for guaranteed consistency
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['/api/users/pending'], refetchType: 'active' })
      ]);

      toast({
        title: <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>User Status Updated</span></div>,
        description: data?.message || `User has been ${variables.action === 'verify' ? 'verified' : 'unverified'}.`,
        className: "border-green-500 bg-green-50",
      });
      setSelectedUser(null);
      setActionType(null);
    },
    onError: (error: any, variables, context: any) => {
      // ROLLBACK: Restore previous state on error
      if (context?.previousUsers) {
        queryClient.setQueryData(['/api/users'], context.previousUsers);
      }
      if (context?.previousPendingUsers) {
        queryClient.setQueryData(['/api/users/pending'], context.previousPendingUsers);
      }
      toast({
        title: <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-600" /><span>Update Failed</span></div>,
        description: error.message || `Failed to ${variables.action} user.`,
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, action, reason }: { userId: string; action: 'suspend' | 'unsuspend'; reason?: string }) => {
      return await apiRequest('POST', `/api/users/${userId}/${action}`, { reason });
    },
    onMutate: async ({ userId, action }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/users'] });
      const previousUsers = queryClient.getQueryData(['/api/users']);
      queryClient.setQueryData(['/api/users'], (old: any) => 
        old?.map((user: any) => 
          user.id === userId ? { ...user, status: action === 'suspend' ? 'suspended' : 'active' } : user
        )
      );
      return { previousUsers };
    },
    onSuccess: async (data: any, variables) => {
      // AGGRESSIVE REFETCH: Force immediate background refetch for guaranteed consistency
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['/api/users/pending'], refetchType: 'active' })
      ]);

      toast({
        title: <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>User Status Updated</span></div>,
        description: data?.message || `User has been ${variables.action}ed.`,
        className: "border-green-500 bg-green-50",
      });
      setSuspendDialog(false);
      setSuspendReason('');
      setSelectedUser(null);
      setActionType(null);
    },
    onError: (error: any, variables, context: any) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(['/api/users'], context.previousUsers);
      }
      toast({
        title: <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-600" /><span>Update Failed</span></div>,
        description: error.message || `Failed to ${variables.action} user.`,
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
    },
  });

  const handleAction = (user: User, action: ActionType) => {
    setSelectedUser(user);
    setActionType(action);

    switch (action) {
      case 'verify':
        verifyMutation.mutate({ userId: user.id, action: 'verify' });
        break;
      case 'unverify':
        // Show confirmation dialog only
        break;
      case 'suspend':
        setSuspendDialog(true);
        break;
      case 'unsuspend':
        suspendMutation.mutate({ userId: user.id, action: 'unsuspend' });
        break;
      case 'resetPassword':
        setNewPassword('');
        setForceChange(true);
        setResetPasswordDialog(true);
        break;
      case 'changeRole':
        setNewRoleId(user.roleId);
        setChangeRoleDialog(true);
        break;
      case 'updateRecoveryEmail':
        setNewRecoveryEmail(user.recoveryEmail || '');
        setRecoveryEmailDialog(true);
        break;
      case 'delete':
        setDeleteDialog(true);
        break;
      case 'viewLogs':
        window.location.href = `/portal/admin/audit-logs?userId=${user.id}`;
        break;
      default:
        break;
    }
  };

  const confirmUnverify = () => {
    if (!selectedUser) return;

    changeStatusMutation.mutate({
      userId: selectedUser.id,
      status: 'pending',
      reason: 'Account verification pending. Await Admin approval.'
    });
  };

  const handleResetPassword = () => {
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      toast({
        title: "✗ Validation Error",
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
        title: "✗ Validation Error",
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

  const handleUpdateRecoveryEmail = () => {
    if (!selectedUser || !newRecoveryEmail) {
      toast({
        title: "✗ Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newRecoveryEmail)) {
      toast({
        title: "✗ Invalid Email Format",
        description: "Please enter a valid email address (e.g., parent@example.com)",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
      return;
    }

    updateRecoveryEmailMutation.mutate({
      userId: selectedUser.id,
      recoveryEmail: newRecoveryEmail
    });
  };

  if (!user) {
    return <div>Please log in to access the admin portal.</div>;
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string, userId?: string) => {
    const badgeConfigs: Record<string, { variant: any; label: string; icon: React.ReactNode; className?: string }> = {
      'pending': { 
        variant: 'secondary', 
        label: 'Unverified', 
        icon: <Clock className="h-3 w-3 mr-1" />,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      },
      'active': { 
        variant: 'default', 
        label: 'Verified', 
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        className: 'bg-green-100 text-green-800 border-green-300'
      },
      'suspended': { 
        variant: 'destructive', 
        label: 'Suspended', 
        icon: <ShieldAlert className="h-3 w-3 mr-1" />,
        className: 'bg-red-100 text-red-800 border-red-300'
      },
      'disabled': { 
        variant: 'outline', 
        label: 'Disabled', 
        icon: <XCircle className="h-3 w-3 mr-1" />,
        className: 'bg-gray-100 text-gray-800 border-gray-300'
      }
    };

    const badgeConfig = badgeConfigs[status] || { 
      variant: 'outline', 
      label: status,
      icon: null,
      className: ''
    };

    return (
      <Badge 
        variant={badgeConfig.variant as any}
        className={`font-medium text-xs sm:text-sm ${badgeConfig.className}`}
        data-testid={`badge-status-${status}-${userId || ''}`}
      >
        <div className="flex items-center">
          {badgeConfig.icon}
          <span>{badgeConfig.label}</span>
        </div>
      </Badge>
    );
  };

  // Suspend Dialog
  const renderSuspendDialog = () => (
    <Dialog open={suspendDialog} onOpenChange={(open) => {
      if (!open) {
        setSuspendDialog(false);
        setSuspendReason('');
        setSelectedUser(null);
        setActionType(null);
      }
    }}>
      <DialogContent data-testid="dialog-suspend-account">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-orange-600" />
            Suspend Account
          </DialogTitle>
          <DialogDescription>
            Temporarily block access for <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>. 
            They will see this message when trying to log in: 
            <br/><span className="font-semibold text-foreground mt-2 block">"Your account is suspended. Please contact the Admin."</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="suspendReason">Reason for Suspension (Optional)</Label>
            <Textarea
              id="suspendReason"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g., Misconduct, pending review, policy violation..."
              rows={3}
              data-testid="textarea-suspend-reason"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setSuspendDialog(false);
                setSuspendReason('');
                setSelectedUser(null);
                setActionType(null);
              }}
              data-testid="button-cancel-suspend"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUser) {
                  suspendMutation.mutate({ 
                    userId: selectedUser.id, 
                    action: 'suspend', 
                    reason: suspendReason || 'Account suspended by Admin'
                  });
                }
              }}
              disabled={suspendMutation.isPending}
              data-testid="button-confirm-suspend"
            >
              {suspendMutation.isPending ? 'Suspending...' : 'Suspend Account'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Delete Dialog
  const renderDeleteDialog = () => (
    <Dialog open={deleteDialog} onOpenChange={(open) => {
      if (!open) {
        setDeleteDialog(false);
        setSelectedUser(null);
        setActionType(null);
      }
    }}>
      <DialogContent data-testid="dialog-delete-account">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Account Permanently
          </DialogTitle>
          <DialogDescription>
            Permanently remove <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>'s account from the system. 
            All exam data will be preserved for records, but the user account will be removed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>⚠️ Warning:</strong> This action cannot be undone. The user will no longer be able to access the portal.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialog(false);
                setSelectedUser(null);
                setActionType(null);
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUser) {
                  console.log(`🗑️ Confirm delete clicked for user ${selectedUser.id}`);
                  deleteUserMutation.mutate(selectedUser.id);
                }
              }}
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );


  const UserList = ({ users }: { users: User[] }) => (
    <div className="space-y-3">
      {users.map((userData) => {
        const isDeleting = deletingUserId === userData.id;
        return (
        <div
          key={userData.id}
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg transition-colors gap-3 ${
            isDeleting ? 'opacity-50 pointer-events-none bg-muted/30' : 'hover:bg-muted/50'
          }`}
          data-testid={`user-card-${userData.id}`}
        >
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
              {userData.profileImageUrl && (
                <AvatarImage src={userData.profileImageUrl} alt={`${userData.firstName} ${userData.lastName}`} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                {getInitials(userData.firstName, userData.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base truncate" data-testid={`text-user-name-${userData.id}`}>
                {userData.firstName} {userData.lastName}
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1 truncate" data-testid={`text-user-email-${userData.id}`}>
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{userData.email}</span>
                </span>
                <span className="flex items-center gap-1 truncate" data-testid={`text-user-username-${userData.id}`}>
                  <User className="h-3 w-3 flex-shrink-0" />
                  {userData.username}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-xs" data-testid={`badge-role-${userData.id}`}>
                  {userData.roleName || 'Unknown'}
                </Badge>
                {getStatusBadge(userData.status, userData.id)}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0" data-testid={`button-actions-${userData.id}`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-testid={`menu-actions-${userData.id}`}>
              <DropdownMenuLabel>Admin Powers</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {userData.authProvider !== 'google' && (
                <DropdownMenuItem 
                  onClick={() => handleAction(userData, 'resetPassword')}
                  data-testid={`menu-item-reset-password-${userData.id}`}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Reset Password
                </DropdownMenuItem>
              )}

              <DropdownMenuItem 
                onClick={() => handleAction(userData, 'changeRole')}
                data-testid={`menu-item-change-role-${userData.id}`}
              >
                <UserCog className="h-4 w-4 mr-2" />
                Change Role
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleAction(userData, 'updateRecoveryEmail')}
                data-testid={`menu-item-recovery-email-${userData.id}`}
              >
                <Mail className="h-4 w-4 mr-2" />
                Update Recovery Email
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => handleAction(userData, 'viewLogs')}
                data-testid={`menu-item-view-logs-${userData.id}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Activity Logs
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {userData.status === 'active' && (
                <DropdownMenuItem 
                  onClick={() => handleAction(userData, 'suspend')}
                  className="text-orange-600 focus:text-orange-600"
                  data-testid={`menu-item-suspend-${userData.id}`}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Suspend Access
                </DropdownMenuItem>
              )}

              {userData.status === 'suspended' && (
                <DropdownMenuItem 
                  onClick={() => handleAction(userData, 'unsuspend')}
                  className="text-green-600 focus:text-green-600"
                  data-testid={`menu-item-unsuspend-${userData.id}`}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Unsuspend Access
                </DropdownMenuItem>
              )}

              {userData.status === 'pending' && (
                <DropdownMenuItem 
                  onClick={() => handleAction(userData, 'approve')}
                  className="text-green-600 focus:text-green-600"
                  data-testid={`menu-item-approve-${userData.id}`}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify / Activate
                </DropdownMenuItem>
              )}

              {(userData.status === 'active' || userData.status === 'pending') && (
                <DropdownMenuItem 
                  onClick={() => handleAction(userData, 'unverify')}
                  data-testid={`menu-item-unverify-${userData.id}`}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Unverify / Deactivate
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem 
                onClick={() => handleAction(userData, 'delete')}
                className="text-destructive focus:text-destructive"
                data-testid={`menu-item-delete-${userData.id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
      })}
    </div>
  );

  return (
    <PortalLayout 
      userRole="admin" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2" data-testid="text-page-title">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8" />
              User Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1" data-testid="text-page-description">
              Manage user accounts, permissions, and security settings
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs for different user status views */}
        <Tabs defaultValue="all" className="space-y-4" onValueChange={setStatusFilter}>
          <TabsList className="flex flex-wrap justify-center sm:justify-start h-auto py-2">
            <TabsTrigger value="all" data-testid="tab-all-users" className="px-4 py-2">
              All Users ({allUsers.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending-users" className="px-4 py-2">
              Pending ({allUsers.filter(u => u.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active-users" className="px-4 py-2">
              Active ({allUsers.filter(u => u.status === 'active').length})
            </TabsTrigger>
            <TabsTrigger value="suspended" data-testid="tab-suspended-users" className="px-4 py-2">
              Suspended ({allUsers.filter(u => u.status === 'suspended').length})
            </TabsTrigger>
            <TabsTrigger value="disabled" data-testid="tab-disabled-users" className="px-4 py-2">
              Disabled ({allUsers.filter(u => u.status === 'disabled').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="space-y-4">
            <Card data-testid="card-users-list">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  {statusFilter === 'all' ? 'All Users' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Users`}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
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

      {/* Unverify Confirmation Dialog */}
      <AlertDialog open={!!selectedUser && actionType === 'unverify'} onOpenChange={(open) => {
        if (!open) {
          setSelectedUser(null);
          setActionType(null);
        }
      }}>
        <AlertDialogContent data-testid="dialog-confirm-unverify">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-dialog-title">
              Unverify / Deactivate User?
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="text-dialog-description">
              Move <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong> back to pending verification? 
              They will need admin approval again before they can log in and will see: 
              <br/><span className="font-semibold text-foreground mt-2 block">"Account verification pending. Await Admin approval."</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-unverify">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmUnverify}
              data-testid="button-confirm-unverify"
            >
              Unverify
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

      {/* Update Recovery Email Dialog */}
      <Dialog open={recoveryEmailDialog} onOpenChange={(open) => {
        if (!open) {
          setRecoveryEmailDialog(false);
          setNewRecoveryEmail('');
          setSelectedUser(null);
        }
      }}>
        <DialogContent data-testid="dialog-recovery-email" className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Change Recovery Email
            </DialogTitle>
            <DialogDescription>
              Update the recovery email for <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">Current Recovery Email:</p>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                {selectedUser?.recoveryEmail || selectedUser?.email || 'Not set'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recovery-email" className="text-sm font-medium">New Recovery Email Address</Label>
              <Input
                id="recovery-email"
                type="email"
                value={newRecoveryEmail}
                onChange={(e) => setNewRecoveryEmail(e.target.value)}
                placeholder="e.g., parent@email.com or admin@ths.edu"
                data-testid="input-recovery-email"
                className="text-sm"
              />
              <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="space-y-0.5 ml-3 list-disc">
                    <li>This email will receive password reset links</li>
                    <li>Students: Use parent/guardian email</li>
                    <li>Teachers: Use their official Google email</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRecoveryEmailDialog(false);
                setNewRecoveryEmail('');
                setSelectedUser(null);
              }}
              data-testid="button-cancel-recovery-email"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRecoveryEmail}
              disabled={updateRecoveryEmailMutation.isPending || !newRecoveryEmail}
              data-testid="button-confirm-recovery-email"
            >
              {updateRecoveryEmailMutation.isPending ? 'Updating...' : 'Update Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {renderSuspendDialog()}
      {renderDeleteDialog()}
    </PortalLayout>
  );
}
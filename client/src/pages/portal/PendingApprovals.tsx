import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Clock, Mail, User, Filter, Search, CheckSquare, UserCheck, Calendar, Shield, Lock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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

interface PendingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  roleId: number;
  roleName: string;
  googleId: string | null;
  profileImageUrl: string | null;
  createdVia: string | null;
  status: string;
  createdAt: Date | null;
}

export default function PendingApprovals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'bulkApprove' | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [signupMethodFilter, setSignupMethodFilter] = useState<string>("all");

  // Fetch pending users with INSTANT REFRESH settings
  const { data: pendingUsers = [], isLoading } = useQuery<PendingUser[]>({
    queryKey: ['/api/users/pending'],
    staleTime: 0, // Always fresh - no stale data allowed
    refetchOnWindowFocus: true,
    refetchOnMount: 'always', // Always refetch on mount
  });

  // Approve user mutation with OPTIMISTIC UPDATES
  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/users/${userId}/approve`);
    },
    onMutate: async (userId: string) => {
      // INSTANT FEEDBACK: Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/users/pending'] });
      await queryClient.cancelQueries({ queryKey: ['/api/users'] });

      // INSTANT FEEDBACK: Snapshot previous values
      const previousPendingUsers = queryClient.getQueryData(['/api/users/pending']);

      // INSTANT FEEDBACK: Optimistically remove from pending list
      queryClient.setQueryData(['/api/users/pending'], (old: any) => {
        if (!old) return old;
        return old.filter((user: any) => user.id !== userId);
      });

      return { previousPendingUsers };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
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

  // Reject user mutation with OPTIMISTIC UPDATES
  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/users/${userId}/status`, {
        status: 'disabled',
        reason: 'Rejected during approval process'
      });
    },
    onMutate: async (userId: string) => {
      // INSTANT FEEDBACK: Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/users/pending'] });
      await queryClient.cancelQueries({ queryKey: ['/api/users'] });

      // INSTANT FEEDBACK: Snapshot previous values
      const previousPendingUsers = queryClient.getQueryData(['/api/users/pending']);

      // INSTANT FEEDBACK: Optimistically remove from pending list
      queryClient.setQueryData(['/api/users/pending'], (old: any) => {
        if (!old) return old;
        return old.filter((user: any) => user.id !== userId);
      });

      return { previousPendingUsers };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "✓ User Rejected",
        description: data?.message || "The user account has been rejected successfully.",
        className: "border-green-500 bg-green-50",
      });
      setSelectedUser(null);
      setActionType(null);
    },
    onError: (error: any, userId: string, context: any) => {
      // ROLLBACK: Restore previous state on error
      if (context?.previousPendingUsers) {
        queryClient.setQueryData(['/api/users/pending'], context.previousPendingUsers);
      }
      toast({
        title: "✗ Rejection Failed",
        description: error.message || "Failed to reject user. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
    },
  });

  // Bulk approve mutation with OPTIMISTIC UPDATES and PARTIAL SUCCESS handling
  const bulkApproveMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      // Use allSettled to track individual successes/failures with correct index mapping
      const results = await Promise.allSettled(
        userIds.map(async (id, index) => {
          const result = await apiRequest('POST', `/api/users/${id}/approve`);
          return { id, index, result };
        })
      );
      
      const succeeded: string[] = [];
      const failed: Array<{ id: string; error: any }> = [];
      
      results.forEach((r, index) => {
        if (r.status === 'fulfilled') {
          succeeded.push(r.value.id);
        } else {
          failed.push({ id: userIds[index], error: r.reason });
        }
      });
      
      if (failed.length > 0) {
        throw { succeeded, failed, isPartialFailure: succeeded.length > 0 };
      }
      
      return { succeeded, failed: [] };
    },
    onMutate: async (userIds: string[]) => {
      // INSTANT FEEDBACK: Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/users/pending'] });
      await queryClient.cancelQueries({ queryKey: ['/api/users'] });

      // INSTANT FEEDBACK: Snapshot previous values
      const previousPendingUsers = queryClient.getQueryData(['/api/users/pending']);

      // INSTANT FEEDBACK: Optimistically remove all approved users from pending list
      queryClient.setQueryData(['/api/users/pending'], (old: any) => {
        if (!old) return old;
        return old.filter((user: any) => !userIds.includes(user.id));
      });

      return { previousPendingUsers };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "✓ Bulk Approval Complete",
        description: `Successfully approved ${data.succeeded.length} user(s).`,
        className: "border-green-500 bg-green-50",
      });
      setSelectedUsers(new Set());
      setActionType(null);
    },
    onError: (error: any, userIds: string[], context: any) => {
      // ROLLBACK: Restore previous state before refetching
      if (context?.previousPendingUsers) {
        queryClient.setQueryData(['/api/users/pending'], context.previousPendingUsers);
      }
      
      // Then refetch to reconcile with actual server state
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // ALWAYS clear selection to prevent confusion
      setSelectedUsers(new Set());
      setActionType(null);
      
      if (error.isPartialFailure) {
        // Partial success: some approved, some failed
        toast({
          title: "⚠ Partial Success",
          description: `Approved ${error.succeeded.length} user(s). Failed to approve ${error.failed.length} user(s). Please retry the failed ones.`,
          className: "border-yellow-500 bg-yellow-50",
        });
      } else {
        // Complete failure
        toast({
          title: "✗ Bulk Approval Failed",
          description: error.message || "Failed to approve users. Please try again.",
          variant: "destructive",
          className: "border-red-500 bg-red-50",
        });
      }
    },
  });

  const handleApprove = (user: PendingUser) => {
    setSelectedUser(user);
    setActionType('approve');
  };

  const handleReject = (user: PendingUser) => {
    setSelectedUser(user);
    setActionType('reject');
  };

  const confirmAction = () => {
    if (actionType === 'bulkApprove' && selectedUsers.size > 0) {
      bulkApproveMutation.mutate(Array.from(selectedUsers));
      return;
    }

    if (!selectedUser) return;

    if (actionType === 'approve') {
      approveMutation.mutate(selectedUser.id);
    } else if (actionType === 'reject') {
      rejectMutation.mutate(selectedUser.id);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleBulkApprove = () => {
    if (selectedUsers.size === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to approve.",
        variant: "destructive",
      });
      return;
    }
    setActionType('bulkApprove');
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

  const getRelativeTime = (date: Date | null) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  // Filter users based on search, role, and signup method
  const filteredUsers = pendingUsers.filter(pendingUser => {
    const matchesSearch = searchQuery === "" || 
      pendingUser.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pendingUser.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pendingUser.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pendingUser.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || pendingUser.roleName === roleFilter;

    const signupMethod = pendingUser.googleId ? 'google' : (pendingUser.createdVia || 'direct');
    const matchesSignupMethod = signupMethodFilter === "all" || signupMethod === signupMethodFilter;

    return matchesSearch && matchesRole && matchesSignupMethod;
  });

  return (
    <PortalLayout 
      userRole="admin" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2" data-testid="text-page-title">
                <UserCheck className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                Pending Approvals
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1" data-testid="text-page-description">
                Review and approve new user registrations
              </p>
            </div>
            <Badge variant="secondary" className="text-sm sm:text-lg px-3 py-1.5 sm:px-4 sm:py-2 w-fit" data-testid="badge-pending-count">
              {pendingUsers.length} Pending
            </Badge>
          </div>

          {/* Filters and Search */}
          {pendingUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-role-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Parent">Parent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={signupMethodFilter} onValueChange={setSignupMethodFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-signup-filter">
                  <SelectValue placeholder="Signup method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="google">Google Sign-in</SelectItem>
                  <SelectItem value="invite">Via Invite</SelectItem>
                  <SelectItem value="direct">Direct Signup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Bulk Actions Bar */}
          {selectedUsers.size > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-3 px-3 sm:px-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base">{selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      size="sm" 
                      onClick={handleBulkApprove}
                      disabled={bulkApproveMutation.isPending}
                      data-testid="button-bulk-approve"
                      className="flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Approve Selected
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setSelectedUsers(new Set())}
                      data-testid="button-clear-selection"
                      className="flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pending Users List */}
        <Card data-testid="card-pending-users">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              <Lock className="w-5 h-5 text-amber-600" />
              Awaiting Approval
            </CardTitle>
            <CardDescription>
              New users who have signed up and are waiting for admin approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-loading">
                Loading pending users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-pending">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">
                  {pendingUsers.length === 0 ? 'No pending approvals' : 'No matching users'}
                </p>
                <p className="text-sm">
                  {pendingUsers.length === 0 ? 'All accounts have been reviewed' : 'Try adjusting your filters'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Select All Option */}
                {filteredUsers.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                    <Checkbox
                      checked={selectedUsers.size === filteredUsers.length}
                      onCheckedChange={toggleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                    <span className="text-sm font-medium">
                      Select all {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {filteredUsers.map((pendingUser) => (
                  <div
                    key={pendingUser.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border rounded-lg transition-all ${
                      selectedUsers.has(pendingUser.id) 
                        ? 'bg-primary/5 border-primary/30' 
                        : 'hover:bg-muted/50'
                    }`}
                    data-testid={`pending-user-${pendingUser.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedUsers.has(pendingUser.id)}
                        onCheckedChange={() => toggleUserSelection(pendingUser.id)}
                        data-testid={`checkbox-user-${pendingUser.id}`}
                      />
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        {pendingUser.profileImageUrl && (
                          <AvatarImage src={pendingUser.profileImageUrl} alt={`${pendingUser.firstName} ${pendingUser.lastName}`} />
                        )}
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {getInitials(pendingUser.firstName, pendingUser.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate" data-testid={`text-user-name-${pendingUser.id}`}>
                            {pendingUser.firstName} {pendingUser.lastName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1 truncate" data-testid={`text-user-email-${pendingUser.id}`}>
                              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{pendingUser.email}</span>
                            </span>
                            <span className="flex items-center gap-1" data-testid={`text-user-username-${pendingUser.id}`}>
                              <User className="h-3.5 w-3.5 flex-shrink-0" />
                              {pendingUser.username}
                            </span>
                            <span className="flex items-center gap-1" data-testid={`text-signup-time-${pendingUser.id}`}>
                              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                              {getRelativeTime(pendingUser.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Badge 
                            variant="outline" 
                            className={`${
                              pendingUser.roleName === 'Admin' ? 'border-red-500 text-red-700' :
                              pendingUser.roleName === 'Teacher' ? 'border-blue-500 text-blue-700' :
                              pendingUser.roleName === 'Student' ? 'border-green-500 text-green-700' :
                              'border-purple-500 text-purple-700'
                            }`}
                            data-testid={`badge-role-${pendingUser.id}`}
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            {pendingUser.roleName}
                          </Badge>
                          <Badge 
                            variant="secondary"
                            className="text-xs"
                            data-testid={`badge-signup-method-${pendingUser.id}`}
                          >
                            <Lock className="h-3 w-3 mr-1" />
                            {pendingUser.googleId ? 'Google' : 
                             pendingUser.createdVia === 'invite' ? 'Via Invite' : 'Direct Signup'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 sm:ml-4 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(pendingUser)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        data-testid={`button-approve-${pendingUser.id}`}
                        className="flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(pendingUser)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        data-testid={`button-reject-${pendingUser.id}`}
                        className="flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!actionType && (!!selectedUser || actionType === 'bulkApprove')} onOpenChange={(open) => {
        if (!open) {
          setSelectedUser(null);
          setActionType(null);
        }
      }}>
        <AlertDialogContent data-testid="dialog-confirm-action">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-dialog-title">
              {actionType === 'bulkApprove' ? `Approve ${selectedUsers.size} User${selectedUsers.size !== 1 ? 's' : ''}?` :
               actionType === 'approve' ? 'Approve User?' : 'Reject User?'}
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="text-dialog-description">
              {actionType === 'bulkApprove' ? (
                <>
                  Are you sure you want to approve <strong>{selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''}</strong>? 
                  They will all be able to log in immediately.
                </>
              ) : actionType === 'approve' ? (
                <>
                  Are you sure you want to approve <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>? 
                  They will be able to log in immediately.
                </>
              ) : (
                <>
                  Are you sure you want to reject <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>? 
                  Their account will be disabled and they won't be able to log in.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              className={actionType === 'reject' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              data-testid="button-confirm"
            >
              {actionType === 'bulkApprove' ? `Approve ${selectedUsers.size}` :
               actionType === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
}
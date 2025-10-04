import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Clock, Mail, User } from "lucide-react";
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
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  // Fetch pending users
  const { data: pendingUsers = [], isLoading } = useQuery<PendingUser[]>({
    queryKey: ['/api/users/pending'],
  });

  // Approve user mutation
  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/users/${userId}/approve`);
    },
    onSuccess: (data: any) => {
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

  // Reject user mutation
  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', `/api/users/${userId}/status`, {
        status: 'disabled',
        reason: 'Rejected during approval process'
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/pending'] });
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>User Rejected</span>
          </div>
        ),
        description: data?.message || "The user account has been rejected successfully.",
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
            <span>Rejection Failed</span>
          </div>
        ),
        description: error.message || "Failed to reject user. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50",
      });
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
    if (!selectedUser) return;

    if (actionType === 'approve') {
      approveMutation.mutate(selectedUser.id);
    } else if (actionType === 'reject') {
      rejectMutation.mutate(selectedUser.id);
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
              Pending Approvals
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-page-description">
              Review and approve new user accounts
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2" data-testid="badge-pending-count">
            {pendingUsers.length} Pending
          </Badge>
        </div>

        {/* Pending Users List */}
        <Card data-testid="card-pending-users">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
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
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-pending">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No pending approvals</p>
                <p className="text-sm">All accounts have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((pendingUser) => (
                  <div
                    key={pendingUser.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    data-testid={`pending-user-${pendingUser.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        {pendingUser.profileImageUrl && (
                          <AvatarImage src={pendingUser.profileImageUrl} alt={`${pendingUser.firstName} ${pendingUser.lastName}`} />
                        )}
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(pendingUser.firstName, pendingUser.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold" data-testid={`text-user-name-${pendingUser.id}`}>
                          {pendingUser.firstName} {pendingUser.lastName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1" data-testid={`text-user-email-${pendingUser.id}`}>
                            <Mail className="h-3 w-3" />
                            {pendingUser.email}
                          </span>
                          <span className="flex items-center gap-1" data-testid={`text-user-username-${pendingUser.id}`}>
                            <User className="h-3 w-3" />
                            {pendingUser.username}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge variant="outline" className="mb-2" data-testid={`badge-role-${pendingUser.id}`}>
                          {pendingUser.roleName}
                        </Badge>
                        <div className="text-xs text-muted-foreground" data-testid={`text-signup-method-${pendingUser.id}`}>
                          {pendingUser.googleId ? 'Google Sign-in' : pendingUser.createdVia || 'Direct'}
                        </div>
                        <div className="text-xs text-muted-foreground" data-testid={`text-created-date-${pendingUser.id}`}>
                          {formatDate(pendingUser.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(pendingUser)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        data-testid={`button-approve-${pendingUser.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(pendingUser)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        data-testid={`button-reject-${pendingUser.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
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
      <AlertDialog open={!!selectedUser && !!actionType} onOpenChange={(open) => {
        if (!open) {
          setSelectedUser(null);
          setActionType(null);
        }
      }}>
        <AlertDialogContent data-testid="dialog-confirm-action">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-dialog-title">
              {actionType === 'approve' ? 'Approve User?' : 'Reject User?'}
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="text-dialog-description">
              {actionType === 'approve' ? (
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
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
}

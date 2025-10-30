import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { UserPlus, Search, Ban, RefreshCw, Trash2, Key, Copy, CheckCircle2, MoreVertical, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User } from "@shared/schema";

const addAdminSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

const editAdminSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

type AddAdminFormData = z.infer<typeof addAdminSchema>;
type EditAdminFormData = z.infer<typeof editAdminSchema>;

interface GeneratedCredentials {
  username: string;
  password: string;
  role: string;
  fullName: string;
}

export default function SuperAdminManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredentials | null>(null);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const form = useForm<AddAdminFormData>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const editForm = useForm<EditAdminFormData>({
    resolver: zodResolver(editAdminSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      newPassword: "",
    },
  });

  const { data: admins, isLoading } = useQuery<User[]>({
    queryKey: ["/api/superadmin/admins"],
  });

  useSupabaseRealtime({ 
    table: 'users', 
    queryKey: ["/api/superadmin/admins"]
  });

  const suspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/users/${userId}/suspend`, { reason: "Suspended by Super Admin" });
    },
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/superadmin/admins"] });
      const previousData = queryClient.getQueryData(["/api/superadmin/admins"]);
      
      queryClient.setQueryData(["/api/superadmin/admins"], (old: any) => {
        if (!old) return old;
        return old.map((user: any) => 
          user.id === userId ? { ...user, status: 'suspended' } : user
        );
      });
      
      toast({ title: "Suspending...", description: "Updating admin status" });
      return { previousData };
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Admin suspended successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/admins"] });
    },
    onError: (error: any, userId: string, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(["/api/superadmin/admins"], context.previousData);
      }
      toast({
        title: "Error",
        description: error?.message || "Failed to suspend admin",
        variant: "destructive",
      });
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/users/${userId}/unsuspend`, {});
    },
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/superadmin/admins"] });
      const previousData = queryClient.getQueryData(["/api/superadmin/admins"]);
      
      queryClient.setQueryData(["/api/superadmin/admins"], (old: any) => {
        if (!old) return old;
        return old.map((user: any) => 
          user.id === userId ? { ...user, status: 'active' } : user
        );
      });
      
      toast({ title: "Unsuspending...", description: "Updating admin status" });
      return { previousData };
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Admin unsuspended successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/admins"] });
    },
    onError: (error: any, userId: string, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(["/api/superadmin/admins"], context.previousData);
      }
      toast({
        title: "Error",
        description: error?.message || "Failed to unsuspend admin",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/users/${userId}/reset-password`, {});
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to reset password");
      }
      
      return result;
    },
    onSuccess: (data) => {
      if (data.temporaryPassword) {
        toast({
          title: "Password Reset Successfully",
          description: `New temporary password: ${data.temporaryPassword}`,
          duration: 10000,
        });
      } else {
        toast({
          title: "Password Reset",
          description: "Password has been reset successfully",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/admins"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const addAdminMutation = useMutation({
    mutationFn: async (data: AddAdminFormData) => {
      const response = await apiRequest("POST", "/api/superadmin/admins", data);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to create admin");
      }
      
      return result;
    },
    onSuccess: (data) => {
      if (data.credentials) {
        setGeneratedCredentials({
          username: data.credentials.username,
          password: data.credentials.password,
          role: data.credentials.role || "Admin",
          fullName: `${form.getValues("firstName")} ${form.getValues("lastName")}`,
        });
        setIsCredentialsDialogOpen(true);
      }
      toast({
        title: "✓ Admin Created Successfully",
        description: "System-generated credentials have been created.",
        className: "border-green-500 bg-green-50",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/admins"] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create admin",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to delete user");
      }
      return response;
    },
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/superadmin/admins"] });
      const previousData = queryClient.getQueryData(["/api/superadmin/admins"]);
      
      queryClient.setQueryData(["/api/superadmin/admins"], (old: any) => {
        if (!old) return old;
        return old.filter((user: any) => user.id !== userId);
      });
      
      toast({ title: "Deleting...", description: "Removing admin account" });
      return { previousData };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin account has been permanently deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/admins"] });
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any, userId: string, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(["/api/superadmin/admins"], context.previousData);
      }
      toast({
        title: "Error",
        description: error?.message || "Failed to delete user",
        variant: "destructive",
      });
      setDeleteConfirmOpen(false);
    },
  });

  const editAdminMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: EditAdminFormData }) => {
      const updateData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      };
      
      // Only include password if it's provided
      if (data.newPassword && data.newPassword.trim().length > 0) {
        updateData.password = data.newPassword;
      }
      
      const response = await apiRequest("PUT", `/api/users/${id}`, updateData);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to update admin");
      }
      return response.json();
    },
    onMutate: async ({ id, data }: { id: string, data: EditAdminFormData }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/superadmin/admins"] });
      const previousData = queryClient.getQueryData(["/api/superadmin/admins"]);
      
      queryClient.setQueryData(["/api/superadmin/admins"], (old: any) => {
        if (!old) return old;
        return old.map((user: any) => 
          user.id === id ? { ...user, firstName: data.firstName, lastName: data.lastName, email: data.email } : user
        );
      });
      
      toast({ title: "Updating...", description: "Saving admin information" });
      return { previousData };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin account updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/admins"] });
      setIsEditDialogOpen(false);
      setEditingAdmin(null);
      editForm.reset();
    },
    onError: (error: any, variables: any, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(["/api/superadmin/admins"], context.previousData);
      }
      toast({
        title: "Error",
        description: error?.message || "Failed to update admin",
        variant: "destructive",
      });
    },
  });

  const handleAddAdmin = (data: AddAdminFormData) => {
    addAdminMutation.mutate(data);
  };

  const handleEditAdmin = (data: EditAdminFormData) => {
    if (editingAdmin) {
      editAdminMutation.mutate({ id: editingAdmin.id, data });
    }
  };

  const openEditDialog = (admin: User) => {
    setEditingAdmin(admin);
    editForm.setValue("firstName", admin.firstName);
    editForm.setValue("lastName", admin.lastName);
    editForm.setValue("email", admin.email);
    editForm.setValue("newPassword", "");
    setIsEditDialogOpen(true);
  };

  const filteredAdmins = (admins || []).filter((admin: User) =>
    `${admin.firstName} ${admin.lastName} ${admin.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold dark:text-white" data-testid="text-page-title">
              Admin Management
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
              Manage all system administrators
            </p>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            data-testid="button-add-admin"
            className="w-full sm:w-auto"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            <span className="sm:inline">Add New Admin</span>
          </Button>
        </div>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search admins by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 dark:bg-slate-900 dark:border-slate-700"
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">Loading...</div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-slate-700">
                        <TableHead className="dark:text-slate-300 whitespace-nowrap">Name</TableHead>
                        <TableHead className="dark:text-slate-300 whitespace-nowrap">Email</TableHead>
                        <TableHead className="dark:text-slate-300 whitespace-nowrap">Status</TableHead>
                        <TableHead className="dark:text-slate-300 whitespace-nowrap hidden sm:table-cell">Role</TableHead>
                        <TableHead className="text-right dark:text-slate-300 whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAdmins.map((admin: User) => (
                        <TableRow key={admin.id} className="dark:border-slate-700" data-testid={`row-admin-${admin.id}`}>
                          <TableCell className="font-medium dark:text-slate-200 whitespace-nowrap">
                            {admin.firstName} {admin.lastName}
                          </TableCell>
                          <TableCell className="dark:text-slate-300 max-w-[150px] truncate">{admin.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={admin.status === "active" ? "default" : "destructive"}
                              data-testid={`badge-status-${admin.id}`}
                              className="whitespace-nowrap"
                            >
                              {admin.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="dark:text-slate-300 hidden sm:table-cell">Admin</TableCell>
                          <TableCell className="text-right">
                            {/* Desktop: Show icon buttons */}
                            <div className="hidden md:flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(admin)}
                                data-testid={`button-edit-${admin.id}`}
                                title="Edit Admin"
                                className="h-9 w-9 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {admin.status === "active" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => suspendMutation.mutate(admin.id)}
                                  data-testid={`button-suspend-${admin.id}`}
                                  title="Suspend"
                                  className="h-9 w-9 p-0"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => unsuspendMutation.mutate(admin.id)}
                                  data-testid={`button-unsuspend-${admin.id}`}
                                  title="Unsuspend"
                                  className="h-9 w-9 p-0"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resetPasswordMutation.mutate(admin.id)}
                                data-testid={`button-reset-password-${admin.id}`}
                                title="Reset Password"
                                className="h-9 w-9 p-0"
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setUserToDelete(admin);
                                  setDeleteConfirmOpen(true);
                                }}
                                data-testid={`button-delete-${admin.id}`}
                                title="Delete Account"
                                aria-label="Delete admin account"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 h-9 w-9 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Mobile: Show dropdown menu */}
                            <div className="md:hidden flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 w-10 p-0"
                                    data-testid={`button-actions-${admin.id}`}
                                  >
                                    <MoreVertical className="h-5 w-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 dark:bg-slate-800 dark:border-slate-700">
                                  <DropdownMenuItem
                                    onClick={() => openEditDialog(admin)}
                                    data-testid={`menu-edit-${admin.id}`}
                                    className="dark:text-slate-200 dark:hover:bg-slate-700"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Admin
                                  </DropdownMenuItem>
                                  {admin.status === "active" ? (
                                    <DropdownMenuItem
                                      onClick={() => suspendMutation.mutate(admin.id)}
                                      data-testid={`menu-suspend-${admin.id}`}
                                      className="dark:text-slate-200 dark:hover:bg-slate-700"
                                    >
                                      <Ban className="h-4 w-4 mr-2" />
                                      Suspend Admin
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => unsuspendMutation.mutate(admin.id)}
                                      data-testid={`menu-unsuspend-${admin.id}`}
                                      className="dark:text-slate-200 dark:hover:bg-slate-700"
                                    >
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Unsuspend Admin
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => resetPasswordMutation.mutate(admin.id)}
                                    data-testid={`menu-reset-password-${admin.id}`}
                                    className="dark:text-slate-200 dark:hover:bg-slate-700"
                                  >
                                    <Key className="h-4 w-4 mr-2" />
                                    Reset Password
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setUserToDelete(admin);
                                      setDeleteConfirmOpen(true);
                                    }}
                                    data-testid={`menu-delete-${admin.id}`}
                                    className="text-red-600 dark:text-red-400 dark:hover:bg-red-950 focus:text-red-600 dark:focus:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Account
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="dark:bg-slate-800 dark:border-slate-700 max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Add New Admin</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Create a new administrator account with full access to the admin portal.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddAdmin)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-slate-200">First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John"
                          className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                          data-testid="input-first-name"
                        />
                      </FormControl>
                      <FormMessage className="dark:text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-slate-200">Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Doe"
                          className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                          data-testid="input-last-name"
                        />
                      </FormControl>
                      <FormMessage className="dark:text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-slate-200">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="admin@example.com"
                          className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage className="dark:text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Auto-Generated Credentials:</strong> Username and temporary password will be automatically generated and displayed after creation.
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      form.reset();
                    }}
                    className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addAdminMutation.isPending}
                    data-testid="button-create-admin"
                  >
                    {addAdminMutation.isPending ? "Creating..." : "Create Admin"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
          <DialogContent className="dark:bg-slate-800 dark:border-slate-700 max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                <DialogTitle className="dark:text-white">Account Successfully Created</DialogTitle>
              </div>
              <DialogDescription className="dark:text-slate-400">
                System-generated credentials for the new admin account
              </DialogDescription>
            </DialogHeader>

            {generatedCredentials && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{generatedCredentials.role}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{generatedCredentials.fullName}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">System-Generated Username</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCredentials.username);
                        toast({ title: "Copied!", description: "Username copied to clipboard" });
                      }}
                      data-testid="button-copy-username"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-300 dark:border-slate-700">
                    <p className="text-base font-mono font-bold text-blue-600 dark:text-blue-400" data-testid="text-generated-username">
                      {generatedCredentials.username}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Temporary Password</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCredentials.password);
                        toast({ title: "Copied!", description: "Password copied to clipboard" });
                      }}
                      data-testid="button-copy-password"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-md border border-slate-300 dark:border-slate-700">
                    <p className="text-base font-mono font-bold text-blue-600 dark:text-blue-400" data-testid="text-generated-password">
                      {generatedCredentials.password}
                    </p>
                  </div>
                </div>

                <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 p-3 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>⚠️ Important:</strong> This password will only be shown once. The user must change it after their first login.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={() => setIsCredentialsDialogOpen(false)}
                data-testid="button-close-credentials"
                className="w-full"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="dark:bg-slate-800 dark:border-slate-700 max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Edit Admin Account</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Update administrator information. Leave password empty to keep current password.
              </DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditAdmin)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-slate-200">First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John"
                          className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                          data-testid="input-edit-first-name"
                        />
                      </FormControl>
                      <FormMessage className="dark:text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-slate-200">Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Doe"
                          className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                          data-testid="input-edit-last-name"
                        />
                      </FormControl>
                      <FormMessage className="dark:text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-slate-200">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="admin@example.com"
                          className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                          data-testid="input-edit-email"
                        />
                      </FormControl>
                      <FormMessage className="dark:text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="dark:text-slate-200">New Password (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Leave empty to keep current password"
                          className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                          data-testid="input-edit-password"
                        />
                      </FormControl>
                      <FormMessage className="dark:text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Only fill in the password field if you want to change the current password.
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingAdmin(null);
                      editForm.reset();
                    }}
                    className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
                    data-testid="button-edit-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editAdminMutation.isPending}
                    data-testid="button-edit-save"
                  >
                    {editAdminMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="dark:bg-slate-800 dark:border-slate-700 max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="dark:text-white flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                Confirm Delete Account
              </DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                This action cannot be undone. This will permanently delete the admin account and all associated data.
              </DialogDescription>
            </DialogHeader>

            {userToDelete && (
              <div className="space-y-4">
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                    You are about to delete:
                  </p>
                  <p className="text-base font-semibold text-red-900 dark:text-red-100">
                    {userToDelete.firstName} {userToDelete.lastName}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {userToDelete.email}
                  </p>
                </div>

                <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 p-3 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>⚠️ Warning:</strong> This will permanently remove the user and all their data from the system.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setUserToDelete(null);
                }}
                data-testid="button-cancel-delete"
                className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (userToDelete) {
                    deleteMutation.mutate(userToDelete.id);
                  }
                }}
                disabled={deleteMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}

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
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { UserPlus, Search, Ban, RefreshCw, Trash2, Key, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const addAdminSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type AddAdminFormData = z.infer<typeof addAdminSchema>;

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
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredentials | null>(null);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);

  const form = useForm<AddAdminFormData>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const { data: admins, isLoading } = useQuery({
    queryKey: ["/api/superadmin/admins"],
  });

  const suspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/users/${userId}/suspend`, { reason: "Suspended by Super Admin" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Admin suspended successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/admins"] });
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/users/${userId}/unsuspend`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Admin unsuspended successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/admins"] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/users/${userId}/reset-password`, { newPassword: "TempPass@123" });
    },
    onSuccess: () => {
      toast({
        title: "Password Reset",
        description: "Temporary password: TempPass@123",
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

  const handleAddAdmin = (data: AddAdminFormData) => {
    addAdminMutation.mutate(data);
  };

  const filteredAdmins = (admins || []).filter((admin: any) =>
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
                      {filteredAdmins.map((admin: any) => (
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
                            <div className="flex justify-end gap-1 flex-wrap">
                              {admin.status === "active" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => suspendMutation.mutate(admin.id)}
                                  data-testid={`button-suspend-${admin.id}`}
                                  title="Suspend"
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
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resetPasswordMutation.mutate(admin.id)}
                                data-testid={`button-reset-password-${admin.id}`}
                                className="hidden lg:inline-flex"
                              >
                                Reset Password
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resetPasswordMutation.mutate(admin.id)}
                                data-testid={`button-reset-password-mobile-${admin.id}`}
                                className="lg:hidden"
                                title="Reset Password"
                              >
                                <Key className="h-4 w-4" />
                              </Button>
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
      </div>
    </SuperAdminLayout>
  );
}

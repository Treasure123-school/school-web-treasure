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
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { UserPlus, Search, Ban, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SuperAdminManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredAdmins = (admins || []).filter((admin: any) =>
    `${admin.firstName} ${admin.lastName} ${admin.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold dark:text-white" data-testid="text-page-title">
              Admin Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage all system administrators
            </p>
          </div>
          <Button data-testid="button-add-admin">
            <UserPlus className="mr-2 h-4 w-4" />
            Add New Admin
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
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-slate-700">
                    <TableHead className="dark:text-slate-300">Name</TableHead>
                    <TableHead className="dark:text-slate-300">Email</TableHead>
                    <TableHead className="dark:text-slate-300">Status</TableHead>
                    <TableHead className="dark:text-slate-300">Role</TableHead>
                    <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin: any) => (
                    <TableRow key={admin.id} className="dark:border-slate-700" data-testid={`row-admin-${admin.id}`}>
                      <TableCell className="font-medium dark:text-slate-200">
                        {admin.firstName} {admin.lastName}
                      </TableCell>
                      <TableCell className="dark:text-slate-300">{admin.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={admin.status === "active" ? "default" : "destructive"}
                          data-testid={`badge-status-${admin.id}`}
                        >
                          {admin.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="dark:text-slate-300">Admin</TableCell>
                      <TableCell className="text-right space-x-2">
                        {admin.status === "active" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => suspendMutation.mutate(admin.id)}
                            data-testid={`button-suspend-${admin.id}`}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unsuspendMutation.mutate(admin.id)}
                            data-testid={`button-unsuspend-${admin.id}`}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetPasswordMutation.mutate(admin.id)}
                          data-testid={`button-reset-password-${admin.id}`}
                        >
                          Reset Password
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}

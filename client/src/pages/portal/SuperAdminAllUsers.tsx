
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { Search, Download, Ban, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { formatDistance } from "date-fns";

export default function SuperAdminAllUsers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const suspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/users/${userId}/suspend`, { reason: "Suspended by Super Admin" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User suspended successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/users/${userId}/unsuspend`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User unsuspended successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const exportUsers = () => {
    if (!users) return;
    
    const csv = [
      ["ID", "Name", "Email", "Role", "Status", "Created At", "Last Login"].join(","),
      ...users.map(u => [
        u.id,
        `"${u.firstName} ${u.lastName}"`,
        u.email,
        u.roleId,
        u.status,
        u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
        u.lastLoginAt ? formatDistance(u.lastLoginAt, new Date()) + ' ago' : 'Never'
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast({ title: "Success", description: "Users exported successfully" });
  };

  const filteredUsers = (users || []).filter((user: User) => {
    const matchesSearch = `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.roleId.toString() === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleName = (roleId: number) => {
    const roles: Record<number, string> = {
      0: "Super Admin",
      1: "Admin",
      2: "Teacher",
      3: "Student",
      4: "Parent"
    };
    return roles[roleId] || "Unknown";
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold dark:text-white" data-testid="text-page-title">
              All System Users
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
              Comprehensive overview of all users across all roles
            </p>
          </div>
          <Button
            onClick={exportUsers}
            data-testid="button-export-users"
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 dark:bg-slate-900 dark:border-slate-700"
                  data-testid="input-search"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[200px] dark:bg-slate-900 dark:border-slate-700">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="0">Super Admin</SelectItem>
                  <SelectItem value="1">Admin</SelectItem>
                  <SelectItem value="2">Teacher</SelectItem>
                  <SelectItem value="3">Student</SelectItem>
                  <SelectItem value="4">Parent</SelectItem>
                </SelectContent>
              </Select>
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
                        <TableHead className="dark:text-slate-300 whitespace-nowrap">Role</TableHead>
                        <TableHead className="dark:text-slate-300 whitespace-nowrap">Status</TableHead>
                        <TableHead className="dark:text-slate-300 whitespace-nowrap hidden lg:table-cell">Created</TableHead>
                        <TableHead className="dark:text-slate-300 whitespace-nowrap hidden xl:table-cell">Last Login</TableHead>
                        <TableHead className="text-right dark:text-slate-300 whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user: User) => (
                        <TableRow key={user.id} className="dark:border-slate-700" data-testid={`row-user-${user.id}`}>
                          <TableCell className="font-medium dark:text-slate-200 whitespace-nowrap">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell className="dark:text-slate-300 max-w-[200px] truncate">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="whitespace-nowrap">
                              {getRoleName(user.roleId)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.status === "active" ? "default" : "destructive"}
                              className="whitespace-nowrap"
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="dark:text-slate-300 hidden lg:table-cell">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell className="dark:text-slate-300 hidden xl:table-cell">
                            {user.lastLoginAt ? formatDistance(user.lastLoginAt, new Date()) + ' ago' : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            {user.roleId !== 0 && ( // Don't allow actions on Super Admin accounts
                              <div className="flex justify-end gap-2">
                                {user.status === "active" ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => suspendMutation.mutate(user.id)}
                                    data-testid={`button-suspend-${user.id}`}
                                    title="Suspend User"
                                    className="h-9 w-9 p-0"
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => unsuspendMutation.mutate(user.id)}
                                    data-testid={`button-unsuspend-${user.id}`}
                                    title="Unsuspend User"
                                    className="h-9 w-9 p-0"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm dark:text-slate-300">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{users?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm dark:text-slate-300">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {users?.filter(u => u.status === "active").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm dark:text-slate-300">Suspended</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {users?.filter(u => u.status === "suspended").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm dark:text-slate-300">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {users?.filter(u => u.status === "pending").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

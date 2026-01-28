import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
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
  ShieldCheck, 
  RotateCcw,
  MoreVertical,
  Trash2,
  KeyRound,
  UserCog,
  Shield,
  Users,
  Ban,
  Eye,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSocketIORealtime } from '@/hooks/useSocketIORealtime';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLE_IDS, getRoleNameById } from "@/lib/roles";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  roleId: number;
  roleName?: string;
  profileImageUrl: string | null;
  status: 'pending' | 'active' | 'suspended' | 'disabled';
  lastLoginAt?: Date | null;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  useSocketIORealtime({ 
    table: 'users', 
    queryKey: ['/api/users']
  });

  const filteredUsers = allUsers.filter(u => {
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    
    return matchesStatus && (
      fullName.includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.username?.toLowerCase().includes(searchLower)
    );
  });

  const activeCount = allUsers.filter(u => u.status === 'active').length;
  const pendingCount = allUsers.filter(u => u.status === 'pending').length;
  const suspendedCount = allUsers.filter(u => u.status === 'suspended').length;
  const disabledCount = allUsers.filter(u => u.status === 'disabled').length;

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => apiRequest('POST', `/api/users/${userId}/approve`),
    onSuccess: () => {
      toast({ title: "User Approved", description: "Account activated successfully." });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-blue-600" />
          User Management
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage and monitor all school accounts from a professional dashboard.
        </p>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
            <div className="bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-1">
                {[
                  { id: 'all', label: 'All Users', count: allUsers.length, icon: Users, color: 'blue' },
                  { id: 'active', label: 'Active', count: activeCount, icon: CheckCircle, color: 'green' },
                  { id: 'pending', label: 'Pending', count: pendingCount, icon: Clock, color: 'amber' },
                  { id: 'suspended', label: 'Suspended', count: suspendedCount, icon: Ban, color: 'orange' },
                  { id: 'disabled', label: 'Disabled', count: disabledCount, icon: XCircle, color: 'red' },
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id} 
                    className="flex-1 rounded-xl px-4 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm data-[state=active]:text-blue-600 transition-all"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <tab.icon className="h-4 w-4 opacity-70" />
                      <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
                      <span className="text-lg font-black">{tab.count}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          <div className="lg:col-span-4 h-full flex flex-col justify-end">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Search by name, email, or ID (THS-XXX)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-[76px] text-lg rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        <TabsContent value={statusFilter} className="m-0 focus-visible:ring-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <RotateCcw className="h-12 w-12 text-blue-500 animate-spin" />
              <p className="text-slate-500 font-bold tracking-widest uppercase text-sm">Synchronizing Database...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <Card 
                  key={user.id} 
                  className="group overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-xl relative bg-white dark:bg-slate-900"
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${
                    user.status === 'active' ? 'bg-green-500' :
                    user.status === 'pending' ? 'bg-amber-500' :
                    user.status === 'suspended' ? 'bg-orange-500' : 'bg-red-500'
                  }`} />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <Avatar className="h-16 w-16 border-4 border-slate-50 dark:border-slate-800 shadow-inner ring-1 ring-slate-200 dark:ring-slate-700">
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl">
                            {user.firstName[0]}{user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-black text-slate-900 dark:text-slate-100 truncate text-xl leading-tight group-hover:text-blue-600 transition-colors">
                            {user.firstName} {user.lastName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-[10px] font-mono font-bold border-slate-200 dark:border-slate-700">
                              {user.username}
                            </Badge>
                            <Badge className={`${
                              user.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                              user.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                              'bg-red-100 text-red-700 border-red-200'
                            } font-black text-[9px] uppercase tracking-tighter h-5 px-1.5`}>
                              {user.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            <MoreVertical className="h-6 w-6 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-2xl p-2">
                          <DropdownMenuLabel className="px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-400">Security Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="rounded-xl py-3 cursor-pointer flex items-center gap-3">
                            <Eye className="h-5 w-5 text-blue-500" />
                            <span className="font-bold text-sm">View User Profile</span>
                          </DropdownMenuItem>
                          {user.status === 'pending' && (
                            <DropdownMenuItem 
                              className="rounded-xl py-3 cursor-pointer flex items-center gap-3 text-green-600"
                              onClick={() => approveMutation.mutate(user.id)}
                            >
                              <CheckCircle className="h-5 w-5" />
                              <span className="font-bold text-sm">Verify & Activate</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="rounded-xl py-3 cursor-pointer flex items-center gap-3">
                            <KeyRound className="h-5 w-5 text-amber-500" />
                            <span className="font-bold text-sm">Force Password Reset</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl py-3 cursor-pointer flex items-center gap-3">
                            <UserCog className="h-5 w-5 text-purple-500" />
                            <span className="font-bold text-sm">Modify Role Access</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="rounded-xl py-3 cursor-pointer flex items-center gap-3 text-red-600 font-black">
                            <Trash2 className="h-5 w-5" />
                            <span className="text-sm">Terminate Account</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                            {getRoleNameById(user.roleId)}
                          </span>
                        </div>
                        <Button variant="link" className="h-auto p-0 text-xs font-bold text-blue-600">
                          Account Logs
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="bg-white dark:bg-slate-950 p-8 rounded-full shadow-lg mb-6">
                <Users className="h-16 w-16 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2 italic">Database Empty</h3>
              <p className="text-slate-500 max-w-sm text-center font-medium">
                No users found matching your search parameters. Try adjusting your filters.
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery("")}
                  className="mt-6 rounded-xl font-black uppercase tracking-widest px-8"
                >
                  Clear Database Filter
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

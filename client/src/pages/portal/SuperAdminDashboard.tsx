import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, Activity, Database, TrendingUp, UserPlus, Settings, Award, ChevronRight } from "lucide-react";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/superadmin/stats"],
  });

  const statCards = [
    {
      title: "Total Admins",
      value: stats?.totalAdmins || 0,
      icon: Shield,
      description: "System administrators",
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-500/10",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: "All platform users",
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-500/10",
    },
    {
      title: "Active Sessions",
      value: stats?.activeSessions || 0,
      icon: Activity,
      description: "Currently online",
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-500/10",
    },
    {
      title: "Total Exams",
      value: stats?.totalExams || 0,
      icon: Database,
      description: "Exams in system",
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-500/10",
    },
  ];

  const quickActions = [
    {
      title: "Admin Management",
      icon: Shield,
      color: "from-blue-500 to-blue-600",
      href: "/portal/superadmin/admins",
      description: "Manage system admins"
    },
    {
      title: "System Logs",
      icon: Activity,
      color: "from-purple-500 to-purple-600",
      href: "/portal/superadmin/logs",
      description: "View activity logs"
    },
    {
      title: "Settings",
      icon: Settings,
      color: "from-green-500 to-green-600",
      href: "/portal/superadmin/settings",
      description: "Configure system"
    },
    {
      title: "Profile",
      icon: UserPlus,
      color: "from-orange-500 to-orange-600",
      href: "/portal/superadmin/profile",
      description: "Manage profile"
    },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Modern Welcome Header */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white shadow-lg" data-testid="superadmin-dashboard-header">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                Super Admin Dashboard
              </h1>
              <p className="text-blue-100 text-sm">
                Complete system control and management
              </p>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card 
              key={stat.title} 
              className="relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDuration: `${500 + index * 200}ms` }}
              data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bgGradient} to-transparent rounded-full -mr-16 -mt-16`}></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <div className="flex items-baseline gap-2">
                      {isLoading ? (
                        <Skeleton className="h-10 w-20" />
                      ) : (
                        <AnimatedCounter 
                          value={stat.value}
                          className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Card 
                  className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDuration: `${700 + index * 200}ms` }}
                  data-testid={`action-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} text-white shadow-lg`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* System Overview Card */}
        <Card className="shadow-lg border-none animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>System Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Welcome to the Super Admin Portal. You have complete control over the school management system.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Admin Management
                </h4>
                <p className="text-sm text-muted-foreground">
                  Create, edit, and manage system administrators with different permission levels.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-600" />
                  Activity Monitoring
                </h4>
                <p className="text-sm text-muted-foreground">
                  Track all system activities, monitor user sessions, and review security logs.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border border-green-200 dark:border-green-800">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-green-600" />
                  System Configuration
                </h4>
                <p className="text-sm text-muted-foreground">
                  Configure global settings, manage integrations, and customize system behavior.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border border-orange-200 dark:border-orange-800">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Database className="h-4 w-4 text-orange-600" />
                  Data Management
                </h4>
                <p className="text-sm text-muted-foreground">
                  Manage system-wide content, announcements, and data across all user types.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}

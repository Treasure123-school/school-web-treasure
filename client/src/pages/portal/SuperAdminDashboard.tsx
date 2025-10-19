import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, Activity, Database } from "lucide-react";
import SuperAdminLayout from "@/components/SuperAdminLayout";

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
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: "All platform users",
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Active Sessions",
      value: stats?.activeSessions || 0,
      icon: Activity,
      description: "Currently online",
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Total Exams",
      value: stats?.totalExams || 0,
      icon: Database,
      description: "Exams in system",
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold dark:text-white" data-testid="text-dashboard-title">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            System overview and analytics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-slate-200">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold dark:text-white" data-testid={`text-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value.toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {stat.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Welcome to Super Admin Portal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 dark:text-slate-300">
            <p>
              You have full control over the system. Use the navigation sidebar to access different management areas.
            </p>
            <div className="space-y-2">
              <h3 className="font-semibold dark:text-white">Quick Actions:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Manage all system administrators</li>
                <li>Monitor system activity and logs</li>
                <li>Configure global settings</li>
                <li>View and manage all content</li>
                <li>Send system-wide announcements</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}

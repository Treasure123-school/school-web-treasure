import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Search } from "lucide-react";
import { format } from "date-fns";

export default function SuperAdminLogs() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["/api/superadmin/logs"],
  });

  const filteredLogs = (logs || []).filter((log: any) =>
    `${log.action} ${log.reason}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      login: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      logout: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      user_created: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      user_suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      user_deleted: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      settings_updated: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    return colors[action] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold dark:text-white" data-testid="text-page-title">
            System Logs
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            View system activity and audit trail
          </p>
        </div>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search logs by action or reason..."
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
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                No logs found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-slate-700">
                    <TableHead className="dark:text-slate-300">Date & Time</TableHead>
                    <TableHead className="dark:text-slate-300">Action</TableHead>
                    <TableHead className="dark:text-slate-300">User</TableHead>
                    <TableHead className="dark:text-slate-300">Details</TableHead>
                    <TableHead className="dark:text-slate-300">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log: any) => (
                    <TableRow key={log.id} className="dark:border-slate-700" data-testid={`row-log-${log.id}`}>
                      <TableCell className="dark:text-slate-300">
                        {log.createdAt
                          ? format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getActionColor(log.action)}
                          variant="outline"
                          data-testid={`badge-action-${log.id}`}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="dark:text-slate-300">{log.userEmail || "System"}</TableCell>
                      <TableCell className="dark:text-slate-300 max-w-md truncate">
                        {log.reason || log.entityType || "—"}
                      </TableCell>
                      <TableCell className="dark:text-slate-300">{log.ipAddress || "—"}</TableCell>
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

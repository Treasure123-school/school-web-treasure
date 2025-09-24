import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Timer, 
  Target, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Database,
  Server
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

interface PerformanceMetrics {
  totalEvents: number;
  goalAchievementRate: number;
  averageDuration: number;
  slowSubmissions: number;
  eventsByType: Record<string, number>;
}

interface PerformanceAlert {
  id: number;
  sessionId: number | null;
  eventType: string;
  duration: number;
  goalAchieved: boolean;
  metadata: string | null;
  clientSide: boolean;
  userId: string | null;
  createdAt: string;
}

export default function PerformanceMonitoring() {
  const [timeRange, setTimeRange] = useState('24');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in to access the performance monitoring.</div>;
  }

  // Fetch performance metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<PerformanceMetrics>({
    queryKey: ['/api/admin/performance-metrics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/performance-metrics?hours=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics');
      }
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds
  });

  // Fetch performance alerts
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery<PerformanceAlert[]>({
    queryKey: ['/api/admin/performance-alerts', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/performance-alerts?hours=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch performance alerts');
      }
      const data = await response.json();
      // API returns { alerts, summary } but we only need the alerts array
      return data.alerts || data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Manual refresh
  const handleRefresh = () => {
    refetchMetrics();
    refetchAlerts();
    toast({
      title: "Data Refreshed",
      description: "Performance metrics updated successfully",
    });
  };

  // Get status color based on goal achievement rate
  const getStatusColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get status badge variant
  const getStatusBadge = (rate: number) => {
    if (rate >= 95) return 'default';
    if (rate >= 80) return 'secondary';
    return 'destructive';
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Format event type for display
  const formatEventType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <PortalLayout 
      userRole="admin" 
      userName={`${user.firstName} ${user.lastName}`}
      userInitials={`${user.firstName[0]}${user.lastName[0]}`}
    >
      <div className="space-y-6" data-testid="performance-monitoring-page">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
              Performance Monitoring
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Real-time system performance metrics and alerts
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40" data-testid="time-range-selector">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 1 hour</SelectItem>
                <SelectItem value="6">Last 6 hours</SelectItem>
                <SelectItem value="24">Last 24 hours</SelectItem>
                <SelectItem value="168">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              data-testid="auto-refresh-toggle"
            >
              <Activity className="mr-2 h-4 w-4" />
              Auto Refresh
            </Button>
            <Button onClick={handleRefresh} data-testid="refresh-button">
              <TrendingUp className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Status Overview */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card data-testid="total-events-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="total-events-value">
                  {metrics.totalEvents}
                </div>
                <p className="text-xs text-muted-foreground">
                  Performance events logged
                </p>
              </CardContent>
            </Card>

            <Card data-testid="goal-achievement-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Goal Achievement</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getStatusColor(metrics.goalAchievementRate)}`} data-testid="goal-achievement-value">
                  {metrics.goalAchievementRate}%
                </div>
                <div className="mt-2">
                  <Progress value={metrics.goalAchievementRate} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Sub-2 second target achievement
                </p>
              </CardContent>
            </Card>

            <Card data-testid="average-duration-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="average-duration-value">
                  {formatDuration(metrics.averageDuration)}
                </div>
                <Badge variant={metrics.averageDuration <= 2000 ? "default" : "destructive"} className="mt-2">
                  {metrics.averageDuration <= 2000 ? "Within Target" : "Above Target"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: &lt; 2000ms
                </p>
              </CardContent>
            </Card>

            <Card data-testid="slow-submissions-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Slow Submissions</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="slow-submissions-value">
                  {metrics.slowSubmissions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Submissions &gt; 2000ms
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Event Types Breakdown */}
        {metrics && (
          <Card data-testid="event-types-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="mr-2 h-5 w-5" />
                Event Types Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(metrics.eventsByType).map(([type, count]) => (
                  <div key={type} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" data-testid={`event-type-${type}`}>
                    <div className="text-2xl font-bold text-primary">{count}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatEventType(type)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Alerts */}
        <Card data-testid="performance-alerts-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Recent Performance Alerts
              {alerts && alerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alerts.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="text-center py-8">Loading alerts...</div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.slice(0, 10).map((alert) => (
                  <div 
                    key={alert.id} 
                    className="flex items-center justify-between p-4 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    data-testid={`alert-${alert.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <div className="font-medium">
                          {formatEventType(alert.eventType)} - {formatDuration(alert.duration)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {alert.clientSide ? 'Client-side' : 'Server-side'} event
                          {alert.sessionId && ` • Session #${alert.sessionId}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
                {alerts.length > 10 && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Showing 10 of {alerts.length} alerts
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <div className="text-lg font-medium text-green-600">All Systems Optimal</div>
                <div className="text-sm text-gray-500 mt-2">
                  No performance alerts in the selected time range
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Recommendations */}
        {metrics && metrics.goalAchievementRate < 95 && (
          <Alert data-testid="system-recommendations">
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Performance Recommendations:</strong>
              <ul className="mt-2 space-y-1">
                {metrics.goalAchievementRate < 80 && (
                  <li>• Consider increasing database connection pool size</li>
                )}
                {metrics.averageDuration > 2000 && (
                  <li>• Review slow database queries and add appropriate indexes</li>
                )}
                {metrics.slowSubmissions > 5 && (
                  <li>• Investigate exam submission pipeline for bottlenecks</li>
                )}
                <li>• Monitor system resources during peak usage periods</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Real-time Status */}
        <div className="text-center text-sm text-gray-500">
          <Clock className="inline mr-1 h-4 w-4" />
          {autoRefresh ? 'Auto-refreshing every 30 seconds' : 'Auto-refresh disabled'} • 
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </PortalLayout>
  );
}
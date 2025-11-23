import { useEffect, useState } from 'react';
import { realtimeHealthMonitor, type RealtimeHealthStatus } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, CheckCircle, Radio, FlaskConical } from 'lucide-react';
import { runFallbackTestSuite } from '@/lib/test-realtime-fallback';

export function RealtimeHealthMonitor() {
  const [health, setHealth] = useState<RealtimeHealthStatus>(realtimeHealthMonitor.getStatus());
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(realtimeHealthMonitor.getStatus());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRunTests = () => {
    setIsRunningTests(true);
    
    try {
      const results = runFallbackTestSuite();
      alert(`Test suite completed!\n\n${results.passed}/${results.total} tests passed (${results.passRate}%)\n\nCheck the browser console for detailed results.`);
    } catch (error) {
      alert('Test suite encountered an error. Check the browser console for details.');
    } finally {
      setIsRunningTests(false);
      // Refresh status after tests
      setHealth(realtimeHealthMonitor.getStatus());
    }
  };

  const getStatusBadge = () => {
    if (health.isRecovering) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          <Activity className="w-3 h-3 mr-1 animate-pulse" />
          Recovering...
        </Badge>
      );
    }
    if (health.isInFallbackMode) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Radio className="w-3 h-3 mr-1" />
          Polling Mode
        </Badge>
      );
    }
    if (health.isConnected) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Real-time Active
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Disconnected
      </Badge>
    );
  };

  const getConnectionRate = () => {
    if (health.totalConnections === 0) return '0%';
    const rate = ((health.totalConnections - health.failedConnections) / health.totalConnections * 100).toFixed(1);
    return `${rate}%`;
  };

  return (
    <Card data-testid="card-realtime-health">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <CardTitle>Real-time Connection Health</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunTests}
              disabled={isRunningTests}
              data-testid="button-run-fallback-tests"
              className="gap-2"
            >
              <FlaskConical className="w-4 h-4" />
              {isRunningTests ? 'Testing...' : 'Test Fallback'}
            </Button>
          </div>
        </div>
        <CardDescription>
          Monitor Supabase real-time connection status and performance. Use the test button to verify fallback behavior.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Total Connections</div>
            <div className="text-2xl font-bold" data-testid="text-total-connections">{health.totalConnections}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Failed Connections</div>
            <div className="text-2xl font-bold text-red-600" data-testid="text-failed-connections">{health.failedConnections}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Connection Errors</div>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-connection-errors">{health.connectionErrors}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
            <div className="text-2xl font-bold text-green-600" data-testid="text-success-rate">{getConnectionRate()}</div>
          </div>
        </div>
        
        {health.lastErrorTime && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <div className="text-sm font-medium text-orange-800">Last Error</div>
            <div className="text-xs text-orange-700" data-testid="text-last-error">
              {new Date(health.lastErrorTime).toLocaleString()}
            </div>
          </div>
        )}

        {health.isRecovering && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0 animate-pulse" />
              <div>
                <div className="text-sm font-medium text-blue-800">Recovery in Progress</div>
                <div className="text-xs text-blue-700 mt-1" data-testid="text-recovery-message">
                  Attempting to restore real-time connections. The system will automatically return to 
                  real-time mode if successful.
                </div>
              </div>
            </div>
          </div>
        )}

        {health.isInFallbackMode && !health.isRecovering && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-yellow-800">Fallback Mode Active</div>
                <div className="text-xs text-yellow-700 mt-1" data-testid="text-fallback-message">
                  The system has detected connection limits and automatically switched to polling mode. 
                  All features continue to work normally with slightly delayed updates (30 seconds).
                  The system will automatically attempt to recover after 1 minute.
                  Consider upgrading your Supabase plan for more concurrent connections.
                </div>
              </div>
            </div>
          </div>
        )}

        {health.lastRecoveryAttempt && (
          <div className="mt-2 text-xs text-muted-foreground" data-testid="text-last-recovery">
            Last recovery attempt: {new Date(health.lastRecoveryAttempt).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
}
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export const isRealtimeEnabled = () => !!supabase;

export interface RealtimeHealthStatus {
  isConnected: boolean;
  connectionErrors: number;
  lastErrorTime: number | null;
  totalConnections: number;
  failedConnections: number;
  isInFallbackMode: boolean;
  isRecovering: boolean;
  lastRecoveryAttempt: number | null;
}
class RealtimeHealthMonitor {
  private status: RealtimeHealthStatus = {
    isConnected: true,
    connectionErrors: 0,
    lastErrorTime: null,
    totalConnections: 0,
    failedConnections: 0,
    isInFallbackMode: false,
    isRecovering: false,
    lastRecoveryAttempt: null,
  };

  private readonly ERROR_THRESHOLD = 3;
  private readonly RECOVERY_TIME = 60000; // 1 minute
  private readonly MAX_WARNINGS_PER_HOUR = 5;
  private readonly RECOVERY_CHECK_INTERVAL = 10000; // Check every 10 seconds
  
  private warningCount = 0;
  private lastWarningReset = Date.now();
  private recoveryCheckTimer: NodeJS.Timeout | null = null;
  private recoveryCallbacks: Set<() => void> = new Set();

  constructor() {
    // Start recovery check timer
    this.startRecoveryCheck();
  }
  private startRecoveryCheck() {
    if (this.recoveryCheckTimer) return;
    
    this.recoveryCheckTimer = setInterval(() => {
      if (this.shouldAttemptRecovery()) {
        this.attemptRecovery();
      }
    }, this.RECOVERY_CHECK_INTERVAL);
  }
  private shouldAttemptRecovery(): boolean {
    if (!this.status.isInFallbackMode) return false;
    if (!this.status.lastErrorTime) return false;
    
    const timeSinceError = Date.now() - this.status.lastErrorTime;
    return timeSinceError >= this.RECOVERY_TIME;
  }
  private attemptRecovery() {
    this.status.isRecovering = true;
    this.status.lastRecoveryAttempt = Date.now();
    
    // Clear fallback state to allow reconnection attempts
    this.status.isInFallbackMode = false;
    this.status.connectionErrors = 0;
    
    // Notify all subscribers to retry connection
    this.notifyRecoveryAttempt();
    
  }
  registerRecoveryCallback(callback: () => void) {
    this.recoveryCallbacks.add(callback);
    return () => this.recoveryCallbacks.delete(callback);
  }
  private notifyRecoveryAttempt() {
    this.recoveryCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
      }
    });
  }
  recordConnection() {
    this.status.totalConnections++;
  }
  recordError(error: any) {
    this.status.connectionErrors++;
    this.status.failedConnections++;
    this.status.lastErrorTime = Date.now();
    this.status.isRecovering = false;

    const now = Date.now();
    if (now - this.lastWarningReset > 3600000) {
      this.warningCount = 0;
      this.lastWarningReset = now;
    }
    if (this.status.connectionErrors >= this.ERROR_THRESHOLD && !this.status.isInFallbackMode) {
      this.enterFallbackMode(error);
    }
    if (this.warningCount < this.MAX_WARNINGS_PER_HOUR) {
        errorCount: this.status.connectionErrors,
        failedConnections: this.status.failedConnections,
        totalConnections: this.status.totalConnections,
        error: error?.message || error
      });
      this.warningCount++;
    }
  }

  recordSuccess() {
    this.status.isConnected = true;
    this.status.isRecovering = false;
    
    // If we were in fallback mode and now have a successful connection, we've recovered
    if (this.status.isInFallbackMode) {
      this.status.isInFallbackMode = false;
      this.status.connectionErrors = 0;
    }
    // Normal error decay for non-fallback scenarios
    if (this.status.lastErrorTime && (Date.now() - this.status.lastErrorTime) > this.RECOVERY_TIME) {
      this.status.connectionErrors = Math.max(0, this.status.connectionErrors - 1);
    }
  }

  private enterFallbackMode(error: any) {
    this.status.isInFallbackMode = true;
    this.status.isConnected = false;

    const errorMessage = error?.message || String(error);
    const isLimitError = errorMessage.includes('limit') || 
                        errorMessage.includes('capacity') || 
                        errorMessage.includes('quota') ||
                        errorMessage.includes('too many');

    if (isLimitError) {
        totalAttempts: this.status.totalConnections,
        failedConnections: this.status.failedConnections,
        errorCount: this.status.connectionErrors
      });
    } else {
    }
  }

  getStatus(): RealtimeHealthStatus {
    return { ...this.status };
  }
  shouldUseFallback(): boolean {
    return this.status.isInFallbackMode;
  }
  // Reset method for testing
  reset() {
    this.status = {
      isConnected: true,
      connectionErrors: 0,
      lastErrorTime: null,
      totalConnections: 0,
      failedConnections: 0,
      isInFallbackMode: false,
      isRecovering: false,
      lastRecoveryAttempt: null,
    };
    this.warningCount = 0;
    this.lastWarningReset = Date.now();
    
    // Notify subscribers to reconnect
    this.notifyRecoveryAttempt();
  }
  cleanup() {
    if (this.recoveryCheckTimer) {
      clearInterval(this.recoveryCheckTimer);
      this.recoveryCheckTimer = null;
    }
    this.recoveryCallbacks.clear();
  }
}

export const realtimeHealthMonitor = new RealtimeHealthMonitor();

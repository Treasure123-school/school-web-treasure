import { useEffect, useRef, useState } from 'react';
import { supabase, isRealtimeEnabled, realtimeHealthMonitor } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseSupabaseRealtimeOptions {
  table: string;
  queryKey: string | string[];
  enabled?: boolean;
  fallbackPollingInterval?: number; // in milliseconds, default 30000 (30 seconds)
} // fixed
export function useSupabaseRealtime({ 
  table, 
  queryKey, 
  enabled = true,
  fallbackPollingInterval = 30000
}: UseSupabaseRealtimeOptions) {
  // Use refs to track channel and subscription state
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastQueryKeyRef = useRef<string>('');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0); // State to trigger reconnection attempts
  const subscriptionAttempts = useRef(0);
  const maxRetries = 3;

  // Polling fallback function
  const startPolling = () => {
    if (pollingIntervalRef.current) return; // Already polling

    setIsFallbackMode(true);

    const filteredQueryKey = Array.isArray(queryKey) 
      ? queryKey.filter(key => key !== undefined && key !== null)
      : [queryKey];

    pollingIntervalRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: filteredQueryKey });
    }, fallbackPollingInterval);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsFallbackMode(false);
    }
  };

  const attemptRealtimeConnection = () => {
    // Skip if real-time is not enabled globally or disabled for this subscription
    if (!enabled || !isRealtimeEnabled()) {
      return false;
    } // fixed
    // Check if we should use fallback mode immediately
    if (realtimeHealthMonitor.shouldUseFallback()) {
      return false;
    } // fixed
    // Create filtered query key array (remove undefined/null values)
    const filteredQueryKey = Array.isArray(queryKey) 
      ? queryKey.filter(key => key !== undefined && key !== null)
      : [queryKey];

    // Skip if filtered key is empty (waiting for filters to be set)
    if (filteredQueryKey.length === 0 || (filteredQueryKey.length === 1 && !filteredQueryKey[0])) {
      return false;
    } // fixed
    // Create stable string representation for comparison
    const queryKeyString = filteredQueryKey.join(':');

    // Skip if already subscribed to the same key
    if (lastQueryKeyRef.current === queryKeyString && channelRef.current) {
      return true; // Already connected
    } // fixed
    // Update tracking ref
    lastQueryKeyRef.current = queryKeyString;

    // Clean up previous channel if it exists
    if (channelRef.current) {
      supabase!.removeChannel(channelRef.current);
      channelRef.current = null;
    } // fixed
    // Stop polling if we're attempting a real-time connection
    stopPolling();

    // Create unique channel name
    const channelName = `realtime:${table}:${queryKeyString}`;
    

    // Record connection attempt
    realtimeHealthMonitor.recordConnection();
    subscriptionAttempts.current++;

    // Set up new subscription
    channelRef.current = supabase!
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          
          // Record successful update
          realtimeHealthMonitor.recordSuccess();
          
          // Invalidate using the filtered query key (guaranteed to have no undefined values)
          queryClient.invalidateQueries({ queryKey: filteredQueryKey });
        }
      )
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
          realtimeHealthMonitor.recordSuccess();
          subscriptionAttempts.current = 0; // Reset attempts on success
          setIsFallbackMode(false);
        } else if (status === 'CHANNEL_ERROR') {
          realtimeHealthMonitor.recordError(error || new Error('Channel error'));
          
          // After max retries, switch to polling
          if (subscriptionAttempts.current >= maxRetries || realtimeHealthMonitor.shouldUseFallback()) {
            if (channelRef.current) {
              supabase!.removeChannel(channelRef.current);
              channelRef.current = null;
            }
            lastQueryKeyRef.current = ''; // Allow reconnection later
            startPolling();
          }
        } else if (status === 'TIMED_OUT') {
          realtimeHealthMonitor.recordError(new Error('Subscription timeout'));
          
          // Switch to polling on timeout
          if (subscriptionAttempts.current >= maxRetries || realtimeHealthMonitor.shouldUseFallback()) {
            if (channelRef.current) {
              supabase!.removeChannel(channelRef.current);
              channelRef.current = null;
            }
            lastQueryKeyRef.current = ''; // Allow reconnection later
            startPolling();
          }
        } else if (status === 'CLOSED') {
          lastQueryKeyRef.current = ''; // Allow reconnection
          // If closed unexpectedly and we're in fallback mode, start polling
          if (realtimeHealthMonitor.shouldUseFallback() && enabled) {
            startPolling();
          }
        }
      });

    return true;
  };

  useEffect(() => {
    // Skip if real-time is not enabled globally or disabled for this subscription
    if (!enabled || !isRealtimeEnabled()) {
      // Clean up channel if it exists when disabled
      if (channelRef.current) {
        supabase!.removeChannel(channelRef.current);
        channelRef.current = null;
        lastQueryKeyRef.current = '';
      }
      stopPolling();
      return;
    } // fixed
    // Attempt to establish realtime connection
    const connected = attemptRealtimeConnection();
    
    // If connection failed, use polling
    if (!connected && enabled) {
      startPolling();
    } // fixed
    // Register for recovery notifications
    const unregister = realtimeHealthMonitor.registerRecoveryCallback(() => {
      subscriptionAttempts.current = 0; // Reset retry counter
      lastQueryKeyRef.current = ''; // Clear to allow new connection
      setRetryTrigger(prev => prev + 1); // Trigger reconnection by updating state
    });

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase!.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      stopPolling();
      unregister();
    };
  }, [table, enabled, fallbackPollingInterval, retryTrigger, JSON.stringify(Array.isArray(queryKey) ? queryKey : [queryKey])]);

  // Return the current mode for debugging
  return { isFallbackMode };
}

import { useEffect, useRef, useState } from 'react';
import { supabase, isRealtimeEnabled, realtimeHealthMonitor } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseSupabaseRealtimeOptions {
  table: string;
  queryKey: string | string[];
  enabled?: boolean;
  fallbackPollingInterval?: number; // in milliseconds, default 30000 (30 seconds)
}

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

    console.log(`🔄 Starting polling fallback for ${table} (interval: ${fallbackPollingInterval}ms)`);
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
      console.log(`⏸️ Stopping polling fallback for ${table}`);
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsFallbackMode(false);
    }
  };

  const attemptRealtimeConnection = () => {
    // Skip if real-time is not enabled globally or disabled for this subscription
    if (!enabled || !isRealtimeEnabled()) {
      return false;
    }

    // Check if we should use fallback mode immediately
    if (realtimeHealthMonitor.shouldUseFallback()) {
      return false;
    }

    // Create filtered query key array (remove undefined/null values)
    const filteredQueryKey = Array.isArray(queryKey) 
      ? queryKey.filter(key => key !== undefined && key !== null)
      : [queryKey];

    // Skip if filtered key is empty (waiting for filters to be set)
    if (filteredQueryKey.length === 0 || (filteredQueryKey.length === 1 && !filteredQueryKey[0])) {
      return false;
    }

    // Create stable string representation for comparison
    const queryKeyString = filteredQueryKey.join(':');

    // Skip if already subscribed to the same key
    if (lastQueryKeyRef.current === queryKeyString && channelRef.current) {
      return true; // Already connected
    }

    // Update tracking ref
    lastQueryKeyRef.current = queryKeyString;

    // Clean up previous channel if it exists
    if (channelRef.current) {
      console.log(`🔌 Unsubscribing from previous ${table} channel`);
      supabase!.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Stop polling if we're attempting a real-time connection
    stopPolling();

    // Create unique channel name
    const channelName = `realtime:${table}:${queryKeyString}`;
    
    console.log(`🔗 Setting up realtime for ${table} with key:`, filteredQueryKey);

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
          console.log(`🔄 Realtime update for ${table}:`, payload.eventType);
          
          // Record successful update
          realtimeHealthMonitor.recordSuccess();
          
          // Invalidate using the filtered query key (guaranteed to have no undefined values)
          queryClient.invalidateQueries({ queryKey: filteredQueryKey });
        }
      )
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to realtime updates for table: ${table}`);
          realtimeHealthMonitor.recordSuccess();
          subscriptionAttempts.current = 0; // Reset attempts on success
          setIsFallbackMode(false);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Error subscribing to ${table} realtime updates`, error);
          realtimeHealthMonitor.recordError(error || new Error('Channel error'));
          
          // After max retries, switch to polling
          if (subscriptionAttempts.current >= maxRetries || realtimeHealthMonitor.shouldUseFallback()) {
            console.log(`🔄 Switching ${table} to polling mode after ${subscriptionAttempts.current} failed attempts`);
            if (channelRef.current) {
              supabase!.removeChannel(channelRef.current);
              channelRef.current = null;
            }
            lastQueryKeyRef.current = ''; // Allow reconnection later
            startPolling();
          }
        } else if (status === 'TIMED_OUT') {
          console.warn(`⏱️ Subscription to ${table} timed out`);
          realtimeHealthMonitor.recordError(new Error('Subscription timeout'));
          
          // Switch to polling on timeout
          if (subscriptionAttempts.current >= maxRetries || realtimeHealthMonitor.shouldUseFallback()) {
            console.log(`🔄 Switching ${table} to polling mode after timeout`);
            if (channelRef.current) {
              supabase!.removeChannel(channelRef.current);
              channelRef.current = null;
            }
            lastQueryKeyRef.current = ''; // Allow reconnection later
            startPolling();
          }
        } else if (status === 'CLOSED') {
          console.log(`🔌 Channel closed for ${table}`);
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
        console.log(`🔌 Unsubscribing from ${table} (disabled)`);
        supabase!.removeChannel(channelRef.current);
        channelRef.current = null;
        lastQueryKeyRef.current = '';
      }
      stopPolling();
      return;
    }

    // Attempt to establish realtime connection
    const connected = attemptRealtimeConnection();
    
    // If connection failed, use polling
    if (!connected && enabled) {
      startPolling();
    }

    // Register for recovery notifications
    const unregister = realtimeHealthMonitor.registerRecoveryCallback(() => {
      console.log(`🔄 Recovery triggered for ${table} - attempting to reconnect...`);
      subscriptionAttempts.current = 0; // Reset retry counter
      lastQueryKeyRef.current = ''; // Clear to allow new connection
      setRetryTrigger(prev => prev + 1); // Trigger reconnection by updating state
    });

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log(`🔌 Unsubscribing from ${table} realtime updates`);
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

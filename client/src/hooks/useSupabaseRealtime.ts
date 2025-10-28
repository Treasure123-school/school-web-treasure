import { useEffect, useRef } from 'react';
import { supabase, isRealtimeEnabled } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseSupabaseRealtimeOptions {
  table: string;
  queryKey: string | string[];
  enabled?: boolean;
}

export function useSupabaseRealtime({ 
  table, 
  queryKey, 
  enabled = true 
}: UseSupabaseRealtimeOptions) {
  // Use refs to track channel and subscription state
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastQueryKeyRef = useRef<string>('');

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
      return;
    }

    // Create filtered query key array (remove undefined/null values)
    const filteredQueryKey = Array.isArray(queryKey) 
      ? queryKey.filter(key => key !== undefined && key !== null)
      : [queryKey];

    // Skip if filtered key is empty (waiting for filters to be set)
    if (filteredQueryKey.length === 0 || (filteredQueryKey.length === 1 && !filteredQueryKey[0])) {
      return;
    }

    // Create stable string representation for comparison
    const queryKeyString = filteredQueryKey.join(':');

    // Skip if already subscribed to the same key
    if (lastQueryKeyRef.current === queryKeyString && channelRef.current) {
      return;
    }

    // Update tracking ref
    lastQueryKeyRef.current = queryKeyString;

    // Clean up previous channel if it exists
    if (channelRef.current) {
      console.log(`🔌 Unsubscribing from previous ${table} channel`);
      supabase!.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create unique channel name
    const channelName = `realtime:${table}:${queryKeyString}`;
    
    console.log(`🔗 Setting up realtime for ${table} with key:`, filteredQueryKey);

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
          
          // Invalidate using the filtered query key (guaranteed to have no undefined values)
          queryClient.invalidateQueries({ queryKey: filteredQueryKey });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to realtime updates for table: ${table}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Error subscribing to ${table} realtime updates`);
        } else if (status === 'TIMED_OUT') {
          console.warn(`⏱️ Subscription to ${table} timed out`);
        }
      });

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log(`🔌 Unsubscribing from ${table} realtime updates`);
        supabase!.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, enabled, JSON.stringify(Array.isArray(queryKey) ? queryKey : [queryKey])]);
}

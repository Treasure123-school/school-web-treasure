// DEPRECATED: Supabase realtime has been removed
// This stub maintains compatibility while real-time features are migrated to Socket.IO
// TODO: Implement Socket.IO-based real-time hooks for frontend

interface UseSupabaseRealtimeOptions {
  table: string;
  queryKey: string | string[];
  enabled?: boolean;
  fallbackPollingInterval?: number;
}

export function useSupabaseRealtime(_options: UseSupabaseRealtimeOptions) {
  // Stub that maintains interface compatibility
  // Real-time updates temporarily disabled - pages will use polling via React Query
  return {
    isConnected: false,
    status: 'disabled' as const,
    error: null,
  };
}

// DEPRECATED: Supabase realtime has been removed
// This is a stub to prevent import errors
// Real-time functionality is now handled by Socket.IO on the backend

interface UseSupabaseRealtimeOptions {
  table: string;
  queryKey: string | string[];
  enabled?: boolean;
  fallbackPollingInterval?: number;
}

export function useSupabaseRealtime(_options: UseSupabaseRealtimeOptions) {
  // No-op stub - Socket.IO handles real-time updates on backend
  // Frontend uses React Query's built-in cache invalidation
  return null;
}

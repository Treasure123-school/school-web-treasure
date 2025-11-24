// DEPRECATED: Supabase realtime has been removed
// This stub maintains compatibility while real-time features are migrated to Socket.IO
// TODO: Implement Socket.IO-based real-time hooks for frontend

export function useGlobalRealtime() {
  // Stub that maintains interface compatibility
  // Real-time updates temporarily disabled - pages will use polling via React Query
  return {
    isEnabled: false,
    tableCount: 0,
    status: 'disabled' as const,
    error: null,
  };
}

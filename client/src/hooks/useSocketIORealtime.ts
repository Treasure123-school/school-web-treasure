import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { queryClient } from '@/lib/queryClient';

interface UseSocketIORealtimeOptions {
  table: string;
  queryKey: string | string[];
  enabled?: boolean;
  fallbackPollingInterval?: number; // in milliseconds, default 30000 (30 seconds)
}

interface TableChangeEvent {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  oldData?: any;
}

let globalSocket: Socket | null = null;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function getOrCreateSocket(): Socket {
  if (globalSocket && globalSocket.connected) {
    return globalSocket;
  }

  // Get API URL from environment or use relative path
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const socketUrl = apiUrl || window.location.origin;

  globalSocket = io(socketUrl, {
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  globalSocket.on('connect', () => {
    console.log('✅ Socket.IO connected');
    connectionAttempts = 0;
  });

  globalSocket.on('disconnect', (reason: string) => {
    console.log('📡 Socket.IO disconnected:', reason);
  });

  globalSocket.on('connect_error', (error: Error) => {
    connectionAttempts++;
    console.error(`❌ Socket.IO connection error (attempt ${connectionAttempts}):`, error.message);
  });

  return globalSocket;
}

export function useSocketIORealtime({ 
  table, 
  queryKey, 
  enabled = true,
  fallbackPollingInterval = 30000
}: UseSocketIORealtimeOptions) {
  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Filter out undefined/null from queryKey
    const filteredQueryKey = Array.isArray(queryKey) 
      ? queryKey.filter(key => key !== undefined && key !== null)
      : [queryKey];

    // Skip if filtered key is empty
    if (filteredQueryKey.length === 0) {
      return;
    }

    // Try to establish Socket.IO connection
    try {
      const socket = getOrCreateSocket();
      socketRef.current = socket;

      // Handle connection status
      const handleConnect = () => {
        setIsConnected(true);
        setIsFallbackMode(false);
        stopPolling();

        // Subscribe to table changes
        socket.emit('subscribe', { table });
      };

      const handleDisconnect = () => {
        setIsConnected(false);
        // Start polling fallback after disconnect
        if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
          startPolling();
        }
      };

      const handleTableChange = (event: TableChangeEvent) => {
        if (event.table === table) {
          console.log(`📥 Received ${event.event} event for table: ${table}`);
          // Invalidate the query to refetch data
          queryClient.invalidateQueries({ queryKey: filteredQueryKey });
        }
      };

      // Register event listeners
      if (socket.connected) {
        handleConnect();
      } else {
        socket.on('connect', handleConnect);
      }

      socket.on('disconnect', handleDisconnect);
      socket.on('table_change', handleTableChange);

      // Cleanup function
      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('table_change', handleTableChange);
        socket.emit('unsubscribe', { table });
        stopPolling();
      };
    } catch (error) {
      console.error('Failed to initialize Socket.IO, using polling fallback:', error);
      startPolling();
    }

    function startPolling() {
      if (pollingIntervalRef.current) return; // Already polling

      setIsFallbackMode(true);
      console.log(`📊 Starting polling fallback for table: ${table} (${fallbackPollingInterval}ms)`);

      pollingIntervalRef.current = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: filteredQueryKey });
      }, fallbackPollingInterval);
    }

    function stopPolling() {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setIsFallbackMode(false);
      }
    }
  }, [table, enabled, fallbackPollingInterval, JSON.stringify(Array.isArray(queryKey) ? queryKey : [queryKey])]);

  // Return the current mode for debugging
  return { isFallbackMode, isConnected };
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
    }
  });
}

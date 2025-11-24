import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

export interface RealtimeEvent {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  oldData?: any;
}

class RealtimeService {
  private io: SocketIOServer | null = null;
  private connectedClients = new Map<string, Set<string>>();

  initialize(httpServer: HTTPServer) {
    const allowedOrigins = process.env.NODE_ENV === 'development'
      ? ['http://localhost:5173', 'http://localhost:5000', 'http://127.0.0.1:5173']
      : (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []);

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST'],
      },
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    console.log('✅ Socket.IO Realtime Service initialized');
    console.log(`   → CORS origins: ${allowedOrigins.join(', ')}`);
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`📡 Client connected: ${socket.id}`);

      // Handle table subscriptions
      socket.on('subscribe', (data: { table: string }) => {
        const { table } = data;
        const channel = `table:${table}`;
        
        socket.join(channel);
        
        // Track subscription
        if (!this.connectedClients.has(table)) {
          this.connectedClients.set(table, new Set());
        }
        this.connectedClients.get(table)!.add(socket.id);

        console.log(`   → Client ${socket.id} subscribed to table: ${table}`);
        socket.emit('subscribed', { table, channel });
      });

      // Handle table unsubscriptions
      socket.on('unsubscribe', (data: { table: string }) => {
        const { table } = data;
        const channel = `table:${table}`;
        
        socket.leave(channel);
        
        // Remove from tracking
        if (this.connectedClients.has(table)) {
          this.connectedClients.get(table)!.delete(socket.id);
          if (this.connectedClients.get(table)!.size === 0) {
            this.connectedClients.delete(table);
          }
        }

        console.log(`   → Client ${socket.id} unsubscribed from table: ${table}`);
        socket.emit('unsubscribed', { table });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`📡 Client disconnected: ${socket.id}`);
        
        // Clean up all subscriptions for this client
        this.connectedClients.forEach((clients, table) => {
          clients.delete(socket.id);
          if (clients.size === 0) {
            this.connectedClients.delete(table);
          }
        });
      });

      // Ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });
  }

  /**
   * Emit a database change event to all subscribed clients
   */
  emitTableChange(table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', data: any, oldData?: any) {
    if (!this.io) {
      console.warn('⚠️  Socket.IO not initialized, cannot emit event');
      return;
    }

    const channel = `table:${table}`;
    const payload: RealtimeEvent = {
      table,
      event,
      data,
      oldData,
    };

    this.io.to(channel).emit('table_change', payload);
    
    const subscriberCount = this.connectedClients.get(table)?.size || 0;
    if (subscriberCount > 0) {
      console.log(`📤 Emitted ${event} event for table ${table} to ${subscriberCount} clients`);
    }
  }

  /**
   * Emit a custom event to all connected clients
   */
  emitToAll(event: string, data: any) {
    if (!this.io) {
      console.warn('⚠️  Socket.IO not initialized, cannot emit event');
      return;
    }

    this.io.emit(event, data);
    console.log(`📤 Broadcast event: ${event}`);
  }

  /**
   * Emit to specific room/channel
   */
  emitToRoom(room: string, event: string, data: any) {
    if (!this.io) {
      console.warn('⚠️  Socket.IO not initialized, cannot emit event');
      return;
    }

    this.io.to(room).emit(event, data);
  }

  /**
   * Get the Socket.IO instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Get number of clients subscribed to a table
   */
  getSubscriberCount(table: string): number {
    return this.connectedClients.get(table)?.size || 0;
  }

  /**
   * Get all active table subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

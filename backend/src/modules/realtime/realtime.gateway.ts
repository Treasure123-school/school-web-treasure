import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('RealtimeGateway');

  afterInit(server: Server) {
    this.logger.log('✅ WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { channel: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.channel);
    this.logger.log(`Client ${client.id} subscribed to ${data.channel}`);
    return { event: 'subscribed', data: { channel: data.channel } };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { channel: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.channel);
    this.logger.log(`Client ${client.id} unsubscribed from ${data.channel}`);
    return { event: 'unsubscribed', data: { channel: data.channel } };
  }

  emitToChannel(channel: string, event: string, data: any) {
    this.server.to(channel).emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}

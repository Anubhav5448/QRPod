import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class OrderEventsGateway {
  private readonly logger = new Logger(OrderEventsGateway.name);

  @WebSocketServer()
  server!: Server;

  /**
   * Client joins a specific room.
   * Used by the owner dashboard: socket.emit('join', { room: 'restaurant:<id>' })
   */
  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.room) {
      client.join(data.room);
      this.logger.log(`Client ${client.id} joined room: ${data.room}`);
      return { ok: true, room: data.room };
    }
    return { ok: false };
  }

  emitNewOrder(restaurantId: string, order: any) {
    this.logger.log(
      `📢 Emitting order.created → restaurant:${restaurantId} (${order.orderNumber})`,
    );
    this.server
      .to(`restaurant:${restaurantId}`)
      .emit('order.created', order);
  }

  emitOrderStatusChange(
    restaurantId: string,
    orderId: string,
    status: string,
  ) {
    this.logger.log(
      `📢 Emitting order.status_changed → restaurant:${restaurantId} (${orderId} → ${status})`,
    );
    this.server.to(`restaurant:${restaurantId}`).emit('order.status_changed', {
      orderId,
      status,
    });
  }
}
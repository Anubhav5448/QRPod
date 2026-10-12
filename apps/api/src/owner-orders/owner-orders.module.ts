import { Module } from '@nestjs/common';
import { OwnerOrdersController } from './owner-orders.controller.js';
import { OwnerOrdersService } from './owner-orders.service.js';
import { OrderEventsGateway } from '../public-orders/order-events.gateway.js';

@Module({
  controllers: [OwnerOrdersController],
  providers: [OwnerOrdersService, OrderEventsGateway],
})
export class OwnerOrdersModule {}
import { Module } from '@nestjs/common';
import { PublicOrdersController } from './public-orders.controller.js';
import { PublicOrdersService } from './public-orders.service.js';
import { OrderEventsGateway } from './order-events.gateway.js';

@Module({
  controllers: [PublicOrdersController],
  providers: [PublicOrdersService, OrderEventsGateway],
  exports: [OrderEventsGateway],
})
export class PublicOrdersModule {}
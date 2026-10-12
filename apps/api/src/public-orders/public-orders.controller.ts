import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicOrdersService } from './public-orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Controller('public/orders')
export class PublicOrdersController {
  constructor(private service: PublicOrdersService) {}

  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async create(@Body() dto: CreateOrderDto) {
    const data = await this.service.createOrder(dto);
    return { success: true, data };
  }

  @Get(':orderId')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async getById(@Param('orderId') orderId: string) {
    const data = await this.service.getOrderById(orderId);
    return { success: true, data };
  }
}
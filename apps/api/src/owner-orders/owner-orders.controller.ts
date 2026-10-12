import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RestaurantMemberGuard } from '../restaurant-auth/guards/restaurant-member.guard.js';
import { CurrentOwner } from '../restaurant-auth/decorators/current-owner.decorator.js';
import type { RestaurantOwnerContext } from '../restaurant-auth/decorators/current-owner.decorator.js';
import { OwnerOrdersService } from './owner-orders.service.js';
import { ListOrdersDto } from './dto/list-orders.dto.js';
import { UpdateOrderStatusDto } from './dto/update-status.dto.js';

@Controller('owner/orders')
@UseGuards(RestaurantMemberGuard)
export class OwnerOrdersController {
  constructor(private service: OwnerOrdersService) {}

  @Get()
  async list(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Query() query: ListOrdersDto,
  ) {
    const data = await this.service.list(owner.restaurantId, query);
    return { success: true, data };
  }

  @Get(':id')
  async getById(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Param('id') id: string,
  ) {
    const data = await this.service.getById(owner.restaurantId, id);
    return { success: true, data };
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const data = await this.service.updateStatus(
      owner.restaurantId,
      id,
      dto,
    );
    return { success: true, data };
  }
}
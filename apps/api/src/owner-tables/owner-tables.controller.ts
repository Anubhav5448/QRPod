import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RestaurantMemberGuard } from '../restaurant-auth/guards/restaurant-member.guard.js';
import { CurrentOwner } from '../restaurant-auth/decorators/current-owner.decorator.js';
import type { RestaurantOwnerContext } from '../restaurant-auth/decorators/current-owner.decorator.js';
import { OwnerTablesService } from './owner-tables.service.js';
import { CreateTableDto } from './dto/create-table.dto.js';
import { UpdateTableDto } from './dto/update-table.dto.js';
import { ListTablesDto } from './dto/list-tables.dto.js';

@Controller('owner/tables')
@UseGuards(RestaurantMemberGuard)
export class OwnerTablesController {
  constructor(private service: OwnerTablesService) {}

  @Get()
  async list(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Query() query: ListTablesDto,
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

  @Post()
  @HttpCode(201)
  async create(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Body() dto: CreateTableDto,
  ) {
    const data = await this.service.create(owner.restaurantId, dto);
    return { success: true, data };
  }

  @Patch(':id')
  async update(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Param('id') id: string,
    @Body() dto: UpdateTableDto,
  ) {
    const data = await this.service.update(owner.restaurantId, id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Param('id') id: string,
  ) {
    const data = await this.service.remove(owner.restaurantId, id);
    return { success: true, data };
  }

  @Post(':id/regenerate-qr')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async regenerateQr(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Param('id') id: string,
  ) {
    const data = await this.service.regenerateQr(owner.restaurantId, id);
    return { success: true, data };
  }
}
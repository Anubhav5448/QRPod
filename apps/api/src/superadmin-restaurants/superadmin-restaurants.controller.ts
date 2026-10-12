import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';
import { SuperAdminGuard } from '../superadmin-auth/guards/superadmin.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { SuperAdminUser } from '../common/decorators/current-user.decorator.js';
import { SuperAdminRestaurantsService } from './superadmin-restaurants.service.js';
import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
import { ListRestaurantsDto } from './dto/list-restaurants.dto.js';
import { UpdateRestaurantStatusDto } from './dto/update-status.dto.js';

@Controller('superadmin/restaurants')
@UseGuards(SuperAdminGuard)
export class SuperAdminRestaurantsController {
  constructor(private service: SuperAdminRestaurantsService) {}

  @Get()
  async list(@Query() query: ListRestaurantsDto) {
    const data = await this.service.list(query);
    return { success: true, data };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const data = await this.service.getById(id);
    return { success: true, data };
  }

  @Post()
  @HttpCode(201)
  async create(
    @Body() dto: CreateRestaurantDto,
    @CurrentUser() user: SuperAdminUser,
    @Req() req: Request,
  ) {
    const data = await this.service.create(dto, user.id, {
      ip: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
    return { success: true, data };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantStatusDto,
    @CurrentUser() user: SuperAdminUser,
    @Req() req: Request,
  ) {
    const data = await this.service.updateStatus(id, dto, user.id, {
      ip: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
    return { success: true, data };
  }
}
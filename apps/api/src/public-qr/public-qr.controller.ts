import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicQrService } from './public-qr.service.js';
import { PublicMenuService } from './public-menu.service.js';

@Controller('public')
export class PublicQrController {
  constructor(
    private qrService: PublicQrService,
    private menuService: PublicMenuService,
  ) {}

  @Get('qr/:token')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async resolve(@Param('token') token: string) {
    const data = await this.qrService.resolveQr(token);
    return { success: true, data };
  }

  @Get('restaurants/:restaurantId/menu')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async getMenu(@Param('restaurantId') restaurantId: string) {
    const data = await this.menuService.getMenu(restaurantId);
    return { success: true, data };
  }
}
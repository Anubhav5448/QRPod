import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { RestaurantAuthService } from './restaurant-auth.service.js';
import { RestaurantLoginDto } from './dto/login.dto.js';
import { RestaurantMemberGuard } from './guards/restaurant-member.guard.js';
import { CurrentOwner } from './decorators/current-owner.decorator.js';
import type { RestaurantOwnerContext } from './decorators/current-owner.decorator.js';

@Controller('auth')
export class RestaurantAuthController {
  constructor(private auth: RestaurantAuthService) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: RestaurantLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto.email, dto.password, res, {
      ip: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
    return { success: true, data: result };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.['restaurant_refresh_token'];
    if (!token) {
      res.status(401);
      return { success: false, error: { code: 'NO_REFRESH_TOKEN' } };
    }
    const result = await this.auth.refresh(token, res);
    return { success: true, data: result };
  }

  @Post('logout')
  @UseGuards(RestaurantMemberGuard)
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.auth.logout(res);
    return { success: true };
  }

  @Get('me')
  @UseGuards(RestaurantMemberGuard)
  async me(@CurrentOwner() owner: RestaurantOwnerContext) {
    const data = await this.auth.me(owner.userId);
    return { success: true, data };
  }
}
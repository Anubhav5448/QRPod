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
import { SuperAdminAuthService } from './superadmin-auth.service.js';
import { PasswordResetService } from './password-reset.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { SuperAdminGuard } from './guards/superadmin.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { SuperAdminUser } from '../common/decorators/current-user.decorator.js';

@Controller('superadmin/auth')
export class SuperAdminAuthController {
  constructor(
    private auth: SuperAdminAuthService,
    private passwordReset: PasswordResetService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
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
    const token = req.cookies?.['superadmin_refresh_token'];
    if (!token) {
      res.status(401);
      return { success: false, error: { code: 'NO_REFRESH_TOKEN' } };
    }
    const result = await this.auth.refresh(token, res);
    return { success: true, data: result };
  }

  @Post('logout')
  @UseGuards(SuperAdminGuard)
  @HttpCode(200)
  async logout(
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: SuperAdminUser,
  ) {
    await this.auth.logout(res, user.id);
    return { success: true };
  }

  @Get('me')
  @UseGuards(SuperAdminGuard)
  async me(@CurrentUser() user: SuperAdminUser) {
    return { success: true, data: { user } };
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() req: Request,
  ) {
    const result = await this.passwordReset.requestReset(dto.email, {
      ip: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    });
    return { success: true, data: result };
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: Request,
  ) {
    const result = await this.passwordReset.resetPassword(
      dto.token,
      dto.newPassword,
      {
        ip: req.ip ?? 'unknown',
        userAgent: req.headers['user-agent'] ?? 'unknown',
      },
    );
    return { success: true, data: result };
  }

  @Post('change-password')
  @UseGuards(SuperAdminGuard)
  @HttpCode(200)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: SuperAdminUser,
    @Req() req: Request,
  ) {
    const result = await this.passwordReset.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
      {
        ip: req.ip ?? 'unknown',
        userAgent: req.headers['user-agent'] ?? 'unknown',
      },
    );
    return { success: true, data: result };
  }
}
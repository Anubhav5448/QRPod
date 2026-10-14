import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SuperAdminAuthService {
  private readonly logger = new Logger(SuperAdminAuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(
    email: string,
    password: string,
    res: Response,
    meta: { ip: string; userAgent: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    const valid = user
      ? await argon2.verify(user.passwordHash, password).catch(() => false)
      : false;

    if (!user || !valid) {
      this.logger.warn(`Login failed for ${email} from ${meta.ip}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.platformRole !== 'SUPERADMIN') {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account disabled');
    }

    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: 'SUPERADMIN',
        type: 'superadmin',
      },
      {
        secret: this.config.getOrThrow('SUPERADMIN_JWT_SECRET'),
        expiresIn: '30m',
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, type: 'superadmin' },
      {
        secret: this.config.getOrThrow('SUPERADMIN_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    const isProd = this.config.get('NODE_ENV') === 'production';

    res.cookie('superadmin_access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 30 * 60 * 1000,
      path: '/',
    });

    res.cookie('superadmin_refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/superadmin/auth/refresh',
    });

    await this.prisma.superAdminAuditLog.create({
      data: {
        superadminId: user.id,
        action: 'SUPERADMIN_LOGIN',
        targetType: 'USER',
        targetId: user.id,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    return {
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async refresh(refreshToken: string, res: Response) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow('SUPERADMIN_REFRESH_SECRET'),
      });

      if (payload.type !== 'superadmin') {
        throw new UnauthorizedException();
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive || user.platformRole !== 'SUPERADMIN') {
        throw new UnauthorizedException();
      }

      const accessToken = await this.jwt.signAsync(
        {
          sub: user.id,
          email: user.email,
          role: 'SUPERADMIN',
          type: 'superadmin',
        },
        {
          secret: this.config.getOrThrow('SUPERADMIN_JWT_SECRET'),
          expiresIn: '30m',
        },
      );

      const isProd = this.config.get('NODE_ENV') === 'production';

      res.cookie('superadmin_access_token', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 30 * 60 * 1000,
        path: '/',
      });

      return { ok: true };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(res: Response, superadminId: string) {
    res.clearCookie('superadmin_access_token', { path: '/' });
    res.clearCookie('superadmin_refresh_token', {
      path: '/superadmin/auth/refresh',
    });

    await this.prisma.superAdminAuditLog.create({
      data: {
        superadminId,
        action: 'SUPERADMIN_LOGOUT',
        targetType: 'USER',
        targetId: superadminId,
      },
    });
  }
}
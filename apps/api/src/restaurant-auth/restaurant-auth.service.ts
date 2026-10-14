import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RestaurantAuthService {
  private readonly logger = new Logger(RestaurantAuthService.name);

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
    // 1. Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            restaurant: {
              select: { id: true, name: true, slug: true, status: true },
            },
          },
        },
      },
    });

    // 2. Verify password (always run hash compare to avoid timing attacks)
    const valid = user
      ? await argon2.verify(user.passwordHash, password).catch(() => false)
      : false;

    if (!user || !valid) {
      this.logger.warn(`Login failed for ${email} from ${meta.ip}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account disabled');
    }

    // 3. Must have at least one active membership
    if (user.memberships.length === 0) {
      throw new UnauthorizedException(
        'No active restaurant membership found',
      );
    }

    // 4. Pick the first membership with an ACTIVE restaurant
    //    (multi-restaurant switching is a future feature)
    const activeMembership = user.memberships.find(
      (m) => m.restaurant.status === 'ACTIVE',
    );

    if (!activeMembership) {
      throw new ForbiddenException(
        'Your restaurant is not currently active',
      );
    }

    const restaurant = activeMembership.restaurant;

    // 5. Issue tokens
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        memberId: activeMembership.id,
        restaurantId: restaurant.id,
        role: activeMembership.role,
        type: 'restaurant',
      },
      {
        secret: this.config.getOrThrow('RESTAURANT_JWT_SECRET'),
        expiresIn: '30m',
      },
    );

    const refreshToken = await this.jwt.signAsync(
      {
        sub: user.id,
        memberId: activeMembership.id,
        type: 'restaurant',
      },
      {
        secret: this.config.getOrThrow('RESTAURANT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    const isProd = this.config.get('NODE_ENV') === 'production';

    res.cookie('restaurant_access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 30 * 60 * 1000,
      path: '/',
    });

    res.cookie('restaurant_refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
      },
      role: activeMembership.role,
    };
  }

  async refresh(refreshToken: string, res: Response) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow('RESTAURANT_REFRESH_SECRET'),
      });

      if (payload.type !== 'restaurant') {
        throw new UnauthorizedException();
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }

      const membership = await this.prisma.restaurantMember.findUnique({
        where: { id: payload.memberId },
        include: {
          restaurant: {
            select: { id: true, slug: true, status: true },
          },
        },
      });

      if (
        !membership ||
        !membership.isActive ||
        membership.restaurant.status !== 'ACTIVE'
      ) {
        throw new UnauthorizedException();
      }

      const accessToken = await this.jwt.signAsync(
        {
          sub: user.id,
          email: user.email,
          memberId: membership.id,
          restaurantId: membership.restaurant.id,
          role: membership.role,
          type: 'restaurant',
        },
        {
          secret: this.config.getOrThrow('RESTAURANT_JWT_SECRET'),
          expiresIn: '30m',
        },
      );

      const isProd = this.config.get('NODE_ENV') === 'production';

      res.cookie('restaurant_access_token', accessToken, {
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

  async logout(res: Response) {
    res.clearCookie('restaurant_access_token', { path: '/' });
    res.clearCookie('restaurant_refresh_token', { path: '/auth/refresh' });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        memberships: {
          where: { isActive: true },
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      memberships: user.memberships.map((m) => ({
        memberId: m.id,
        role: m.role,
        restaurant: m.restaurant,
      })),
    };
  }
}
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';

interface RestaurantJwtPayload {
  sub: string;
  email: string;
  memberId: string;
  restaurantId: string;
  role: string;
  type: 'restaurant';
}

@Injectable()
export class RestaurantJwtStrategy extends PassportStrategy(
  Strategy,
  'restaurant-jwt',
) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['restaurant_access_token'],
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('RESTAURANT_JWT_SECRET'),
    });
  }

  async validate(payload: RestaurantJwtPayload) {
    if (payload.type !== 'restaurant') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Verify user is active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not active');
    }

    // Verify membership is still active AND restaurant is ACTIVE
    const membership = await this.prisma.restaurantMember.findUnique({
      where: { id: payload.memberId },
      include: {
        restaurant: {
          select: {
            id: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!membership || !membership.isActive) {
      throw new UnauthorizedException('Membership inactive');
    }

    if (membership.restaurant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Restaurant not active');
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      memberId: membership.id,
      restaurantId: membership.restaurant.id,
      restaurantSlug: membership.restaurant.slug,
      role: membership.role,
    };
  }
}
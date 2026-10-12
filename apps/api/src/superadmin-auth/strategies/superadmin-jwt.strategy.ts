import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';

interface SuperAdminJwtPayload {
  sub: string;
  email: string;
  role: 'SUPERADMIN';
  type: 'superadmin';
}

@Injectable()
export class SuperAdminJwtStrategy extends PassportStrategy(
  Strategy,
  'superadmin-jwt',
) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['superadmin_access_token'],
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('SUPERADMIN_JWT_SECRET'),
    });
  }

  async validate(payload: SuperAdminJwtPayload) {
    if (payload.type !== 'superadmin' || payload.role !== 'SUPERADMIN') {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        platformRole: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive || user.platformRole !== 'SUPERADMIN') {
      throw new UnauthorizedException('Access revoked');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'SUPERADMIN' as const,
    };
  }
}
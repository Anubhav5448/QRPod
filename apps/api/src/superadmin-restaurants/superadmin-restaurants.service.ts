import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRestaurantDto } from './dto/create-restaurant.dto.js';
import { ListRestaurantsDto } from './dto/list-restaurants.dto.js';
import { UpdateRestaurantStatusDto } from './dto/update-status.dto.js';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto.js';

interface AuditMeta {
  ip: string;
  userAgent: string;
}

@Injectable()
export class SuperAdminRestaurantsService {
  constructor(private prisma: PrismaService) {}

  async list(dto: ListRestaurantsDto) {
    const limit = dto.limit ?? 20;

    const where: any = {};
    if (dto.status) where.status = dto.status;

    const restaurants = await this.prisma.restaurant.findMany({
      where,
      take: limit + 1,
      ...(dto.cursor && {
        cursor: { id: dto.cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        currency: true,
        createdAt: true,
        _count: {
          select: { members: true },
        },
      },
    });

    const hasMore = restaurants.length > limit;
    const items = hasMore ? restaurants.slice(0, limit) : restaurants;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items: items.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        status: r.status,
        currency: r.currency,
        memberCount: r._count.members,
        createdAt: r.createdAt,
      })),
      nextCursor,
    };
  }

  async getById(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            role: true,
            isActive: true,
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async create(
    dto: CreateRestaurantDto,
    superadminId: string,
    meta: AuditMeta,
  ) {
    // Check for collisions
    const [existingSlug, existingOwner] = await Promise.all([
      this.prisma.restaurant.findUnique({ where: { slug: dto.slug } }),
      this.prisma.user.findUnique({ where: { email: dto.ownerEmail } }),
    ]);

    if (existingSlug) {
      throw new ConflictException('Slug already in use');
    }
    if (existingOwner) {
      throw new ConflictException('Owner email already registered');
    }

    const passwordHash = await argon2.hash(dto.ownerPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Transaction: owner + restaurant + membership + audit
    const result = await this.prisma.$transaction(async (tx) => {
      const owner = await tx.user.create({
        data: {
          name: dto.ownerName,
          email: dto.ownerEmail,
          passwordHash,
          platformRole: 'USER',
        },
        select: { id: true, name: true, email: true },
      });

      const restaurant = await tx.restaurant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          phone: dto.phone,
          address: dto.address,
          status: 'PENDING',
        },
      });

      await tx.restaurantMember.create({
        data: {
          restaurantId: restaurant.id,
          userId: owner.id,
          role: 'OWNER',
        },
      });

      await tx.superAdminAuditLog.create({
        data: {
          superadminId,
          action: 'RESTAURANT_CREATED',
          targetType: 'RESTAURANT',
          targetId: restaurant.id,
          restaurantId: restaurant.id,
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
          metadata: {
            name: restaurant.name,
            slug: restaurant.slug,
            ownerEmail: owner.email,
          },
        },
      });

      return { restaurant, owner };
    });

    return result;
  }

  async updateStatus(
    id: string,
    dto: UpdateRestaurantStatusDto,
    superadminId: string,
    meta: AuditMeta,
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const updated = await this.prisma.restaurant.update({
      where: { id },
      data: {
        status: dto.status,
        suspendedAt: dto.status === 'SUSPENDED' ? new Date() : null,
        suspendedBy: dto.status === 'SUSPENDED' ? superadminId : null,
        suspensionReason: dto.status === 'SUSPENDED' ? dto.reason : null,
      },
    });

    await this.prisma.superAdminAuditLog.create({
      data: {
        superadminId,
        action: `RESTAURANT_${dto.status}`,
        targetType: 'RESTAURANT',
        targetId: id,
        restaurantId: id,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        metadata: {
          previousStatus: restaurant.status,
          newStatus: dto.status,
          reason: dto.reason ?? null,
        },
      },
    });

    return updated;
  }

    async listAuditLogs(dto: ListAuditLogsDto) {
    const limit = dto.limit ?? 50;

    const where: any = {};
    if (dto.action) where.action = dto.action;

    const logs = await this.prisma.superAdminAuditLog.findMany({
      where,
      take: limit + 1,
      ...(dto.cursor && {
        cursor: { id: dto.cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        restaurantId: true,
        metadata: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, limit) : logs;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { items, nextCursor };
  }
}

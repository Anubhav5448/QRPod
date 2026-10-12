import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PublicQrService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolve a QR token to restaurant + table info.
   * This is a public endpoint — no auth required.
   * Rate-limited at the controller level.
   */
  async resolveQr(qrToken: string) {
    const table = await this.prisma.table.findUnique({
      where: { qrToken },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            currency: true,
            status: true,
          },
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Invalid QR code');
    }

    if (table.restaurant.status !== 'ACTIVE') {
      throw new NotFoundException('Restaurant is not available');
    }

    if (table.status === 'INACTIVE') {
      throw new NotFoundException('This table is not available');
    }

    return {
      restaurant: {
        id: table.restaurant.id,
        name: table.restaurant.name,
        slug: table.restaurant.slug,
        logoUrl: table.restaurant.logoUrl,
        currency: table.restaurant.currency,
      },
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
        displayName: table.displayName,
        seats: table.seats,
        status: table.status,
      },
    };
  }
}
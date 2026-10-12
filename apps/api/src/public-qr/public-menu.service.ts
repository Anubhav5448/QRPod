import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PublicMenuService {
  constructor(private prisma: PrismaService) {}

  async getMenu(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, name: true, status: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.status !== 'ACTIVE') {
      throw new NotFoundException('Restaurant not available');
    }

    const [categories, items] = await Promise.all([
      this.prisma.menuCategory.findMany({
        where: { restaurantId, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, description: true, isActive: true },
      }),
      this.prisma.menuItem.findMany({
        where: { restaurantId },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          price: true,
          isAvailable: true,
          categoryId: true,
        },
      }),
    ]);

    return { categories, items };
  }
}
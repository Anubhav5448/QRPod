import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';
import { ListItemsDto } from './dto/list-items.dto.js';
import { compressImage } from '../common/cloudinary/image-compressor.js';


@Injectable()
export class OwnerMenuService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async listCategories(restaurantId: string) {
    return this.prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { items: true } },
      },
    });
  }

  async createCategory(restaurantId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.menuCategory.findUnique({
      where: {
        restaurantId_name: { restaurantId, name: dto.name },
      },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prisma.menuCategory.create({
      data: {
        restaurantId,
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateCategory(
    restaurantId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ) {
    await this.assertCategoryOwnership(restaurantId, categoryId);

    if (dto.name) {
      const conflict = await this.prisma.menuCategory.findFirst({
        where: {
          restaurantId,
          name: dto.name,
          NOT: { id: categoryId },
        },
      });
      if (conflict) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    return this.prisma.menuCategory.update({
      where: { id: categoryId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteCategory(restaurantId: string, categoryId: string) {
    await this.assertCategoryOwnership(restaurantId, categoryId);

    const itemCount = await this.prisma.menuItem.count({
      where: { categoryId },
    });

    if (itemCount > 0) {
      throw new BadRequestException(
        `Cannot delete category: it has ${itemCount} item(s). Delete or move them first.`,
      );
    }

    await this.prisma.menuCategory.delete({ where: { id: categoryId } });
    return { ok: true };
  }

  async listItems(restaurantId: string, dto: ListItemsDto) {
    const where: any = { restaurantId };
    if (dto.categoryId) where.categoryId = dto.categoryId;
    if (dto.isAvailable !== undefined) where.isAvailable = dto.isAvailable;

    return this.prisma.menuItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        category: { select: { id: true, name: true } },
      },
    });
  }

  async getItem(restaurantId: string, itemId: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { category: { select: { id: true, name: true } } },
    });

    if (!item) throw new NotFoundException('Item not found');
    if (item.restaurantId !== restaurantId) {
      throw new ForbiddenException('Not your item');
    }

    return item;
  }

  async createItem(restaurantId: string, dto: CreateItemDto) {
    await this.assertCategoryOwnership(restaurantId, dto.categoryId);

    return this.prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        prepTimeMinutes: dto.prepTimeMinutes,
        isAvailable: dto.isAvailable ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async updateItem(
    restaurantId: string,
    itemId: string,
    dto: UpdateItemDto,
  ) {
    await this.assertItemOwnership(restaurantId, itemId);

    if (dto.categoryId) {
      await this.assertCategoryOwnership(restaurantId, dto.categoryId);
    }

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.prepTimeMinutes !== undefined && {
          prepTimeMinutes: dto.prepTimeMinutes,
        }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async toggleAvailability(restaurantId: string, itemId: string) {
    const item = await this.assertItemOwnership(restaurantId, itemId);

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable: !item.isAvailable },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async deleteItem(restaurantId: string, itemId: string) {
    const item = await this.assertItemOwnership(restaurantId, itemId);

    if (item.imageUrl) {
      const match = item.imageUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-z]+$/);
      if (match) {
        await this.cloudinary.deleteImage(match[1]);
      }
    }

    await this.prisma.menuItem.delete({ where: { id: itemId } });
    return { ok: true };
  }

  async uploadItemImage(
    restaurantId: string,
    itemId: string,
    file: { buffer: Buffer; mimetype: string; size: number },
  ) {
    const item = await this.assertItemOwnership(restaurantId, itemId);

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new BadRequestException('Image must be under 20 MB');
    }

    if (item.imageUrl) {
      const match = item.imageUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-z]+$/);
      if (match) {
        await this.cloudinary.deleteImage(match[1]);
      }
    }

    // Compress to WebP before uploading (saves storage + bandwidth)
    const compressed = await compressImage(file.buffer);

    const { url } = await this.cloudinary.uploadImage({
      buffer: compressed.buffer,
      folder: `hospitality/restaurants/${restaurantId}/menu-items`,
    });

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: { imageUrl: url },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  private async assertCategoryOwnership(
    restaurantId: string,
    categoryId: string,
  ) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id: categoryId },
      select: { restaurantId: true },
    });

    if (!category) throw new NotFoundException('Category not found');
    if (category.restaurantId !== restaurantId) {
      throw new ForbiddenException('Not your category');
    }

    return category;
  }

  private async assertItemOwnership(restaurantId: string, itemId: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      select: { restaurantId: true, isAvailable: true, imageUrl: true },
    });

    if (!item) throw new NotFoundException('Item not found');
    if (item.restaurantId !== restaurantId) {
      throw new ForbiddenException('Not your item');
    }

    return item;
  }
}
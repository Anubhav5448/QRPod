import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  HttpCode,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RestaurantMemberGuard } from '../restaurant-auth/guards/restaurant-member.guard.js';
import { CurrentOwner } from '../restaurant-auth/decorators/current-owner.decorator.js';
import type { RestaurantOwnerContext } from '../restaurant-auth/decorators/current-owner.decorator.js';
import { OwnerMenuService } from './owner-menu.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';
import { ListItemsDto } from './dto/list-items.dto.js';

@Controller('owner/menu')
@UseGuards(RestaurantMemberGuard)
export class OwnerMenuController {
  constructor(private service: OwnerMenuService) {}

  // ─── Categories ────────────────────────────────────────

  @Get('categories')
  async listCategories(@CurrentOwner() owner: RestaurantOwnerContext) {
    const data = await this.service.listCategories(owner.restaurantId);
    return { success: true, data };
  }

  @Post('categories')
  @HttpCode(201)
  async createCategory(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Body() dto: CreateCategoryDto,
  ) {
    const data = await this.service.createCategory(owner.restaurantId, dto);
    return { success: true, data };
  }

  @Patch('categories/:id')
  async updateCategory(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const data = await this.service.updateCategory(
      owner.restaurantId,
      id,
      dto,
    );
    return { success: true, data };
  }

  @Delete('categories/:id')
  @HttpCode(200)
  async deleteCategory(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Param('id') id: string,
  ) {
    const data = await this.service.deleteCategory(owner.restaurantId, id);
    return { success: true, data };
  }

  // ─── Items ─────────────────────────────────────────────

  @Get('items')
  async listItems(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Query() query: ListItemsDto,
  ) {
    const data = await this.service.listItems(owner.restaurantId, query);
    return { success: true, data };
  }

  @Get('items/:id')
  async getItem(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Param('id') id: string,
  ) {
    const data = await this.service.getItem(owner.restaurantId, id);
    return { success: true, data };
  }

  @Post('items')
  @HttpCode(201)
  async createItem(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Body() dto: CreateItemDto,
  ) {
    const data = await this.service.createItem(owner.restaurantId, dto);
    return { success: true, data };
  }

  @Patch('items/:id')
  async updateItem(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ) {
    const data = await this.service.updateItem(owner.restaurantId, id, dto);
    return { success: true, data };
  }

  @Patch('items/:id/toggle-availability')
  @HttpCode(200)
  async toggleAvailability(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Param('id') id: string,
  ) {
    const data = await this.service.toggleAvailability(
      owner.restaurantId,
      id,
    );
    return { success: true, data };
  }

  @Delete('items/:id')
  @HttpCode(200)
  async deleteItem(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Param('id') id: string,
  ) {
    const data = await this.service.deleteItem(owner.restaurantId, id);
    return { success: true, data };
  }

  // ─── Image Upload ──────────────────────────────────────

  @Post('items/:id/image')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(200)
  async uploadImage(
    @CurrentOwner() owner: RestaurantOwnerContext,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
        ],
      }),
    )
    file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    },
  ) {
    const data = await this.service.uploadItemImage(
      owner.restaurantId,
      id,
      {
        buffer: file.buffer,
        mimetype: file.mimetype,
        size: file.size,
      },
    );
    return { success: true, data };
  }
}
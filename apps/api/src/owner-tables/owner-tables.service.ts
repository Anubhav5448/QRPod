import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTableDto } from './dto/create-table.dto.js';
import { UpdateTableDto } from './dto/update-table.dto.js';
import { ListTablesDto } from './dto/list-tables.dto.js';

const QR_TOKEN_BYTES = 16; // 128-bit token

@Injectable()
export class OwnerTablesService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /**
   * List tables for the owner's restaurant.
   */
  async list(restaurantId: string, dto: ListTablesDto) {
    const where: any = { restaurantId };
    if (dto.status) where.status = dto.status;

    const tables = await this.prisma.table.findMany({
      where,
      orderBy: { tableNumber: 'asc' },
    });

    const publicUrl = this.config.get<string>(
      'PUBLIC_CUSTOMER_URL',
      'http://localhost:3003',
    );

    return tables.map((t) => ({
      ...t,
      qrUrl: `${publicUrl}/r/${t.qrToken}`,
    }));
  }

  /**
   * Get one table by ID, ensure it belongs to the restaurant.
   */
  async getById(restaurantId: string, tableId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.restaurantId !== restaurantId) {
      throw new ForbiddenException('Not your table');
    }

    const publicUrl = this.config.get<string>(
      'PUBLIC_CUSTOMER_URL',
      'http://localhost:3003',
    );

    return {
      ...table,
      qrUrl: `${publicUrl}/r/${table.qrToken}`,
    };
  }

  /**
   * Create a table with a unique QR token.
   */
  async create(restaurantId: string, dto: CreateTableDto) {
    // Check for duplicate table number within this restaurant
    const existing = await this.prisma.table.findUnique({
      where: {
        restaurantId_tableNumber: {
          restaurantId,
          tableNumber: dto.tableNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Table number "${dto.tableNumber}" already exists`,
      );
    }

    const qrToken = crypto.randomBytes(QR_TOKEN_BYTES).toString('hex');

    const table = await this.prisma.table.create({
      data: {
        restaurantId,
        tableNumber: dto.tableNumber,
        displayName: dto.displayName,
        seats: dto.seats,
        qrToken,
      },
    });

    const publicUrl = this.config.get<string>(
      'PUBLIC_CUSTOMER_URL',
      'http://localhost:3003',
    );

    return {
      ...table,
      qrUrl: `${publicUrl}/r/${table.qrToken}`,
    };
  }

  /**
   * Update table details.
   */
  async update(restaurantId: string, tableId: string, dto: UpdateTableDto) {
    await this.assertOwnership(restaurantId, tableId);

    const updated = await this.prisma.table.update({
      where: { id: tableId },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.seats !== undefined && { seats: dto.seats }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    const publicUrl = this.config.get<string>(
      'PUBLIC_CUSTOMER_URL',
      'http://localhost:3003',
    );

    return {
      ...updated,
      qrUrl: `${publicUrl}/r/${updated.qrToken}`,
    };
  }

  /**
   * Delete a table.
   */
  async remove(restaurantId: string, tableId: string) {
    await this.assertOwnership(restaurantId, tableId);

    await this.prisma.table.delete({ where: { id: tableId } });

    return { ok: true };
  }

  /**
   * Regenerate the QR token for a table (invalidates old QRs).
   */
  async regenerateQr(restaurantId: string, tableId: string) {
    await this.assertOwnership(restaurantId, tableId);

    const newToken = crypto.randomBytes(QR_TOKEN_BYTES).toString('hex');

    const updated = await this.prisma.table.update({
      where: { id: tableId },
      data: { qrToken: newToken },
    });

    const publicUrl = this.config.get<string>(
      'PUBLIC_CUSTOMER_URL',
      'http://localhost:3003',
    );

    return {
      ...updated,
      qrUrl: `${publicUrl}/r/${updated.qrToken}`,
    };
  }

  private async assertOwnership(restaurantId: string, tableId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      select: { restaurantId: true },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.restaurantId !== restaurantId) {
      throw new ForbiddenException('Not your table');
    }
  }
}
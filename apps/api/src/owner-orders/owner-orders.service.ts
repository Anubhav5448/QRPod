import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrderEventsGateway } from '../public-orders/order-events.gateway.js';
import { ListOrdersDto } from './dto/list-orders.dto.js';
import { UpdateOrderStatusDto } from './dto/update-status.dto.js';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['SERVED'],
  SERVED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class OwnerOrdersService {
  constructor(
    private prisma: PrismaService,
    private events: OrderEventsGateway,
  ) {}

  async list(restaurantId: string, dto: ListOrdersDto) {
    const where: any = { restaurantId };

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.tableId) {
      where.tableId = dto.tableId;
    }

    // Default: today's orders
    if (dto.date) {
      const day = new Date(dto.date);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      where.createdAt = { gte: day, lt: nextDay };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.createdAt = { gte: today };
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        table: { select: { tableNumber: true, displayName: true } },
      },
    });

    return orders.map((o) => this.serializeOrder(o));
  }

  async getById(restaurantId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        table: { select: { tableNumber: true, displayName: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.restaurantId !== restaurantId) {
      throw new ForbiddenException('Not your order');
    }

    return {
      ...this.serializeOrder(order),
      statusHistory: order.statusHistory,
    };
  }

  async updateStatus(
    restaurantId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.restaurantId !== restaurantId) {
      throw new ForbiddenException('Not your order');
    }

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: dto.status as any,
          ...(dto.status === 'ACCEPTED' && { acceptedAt: now }),
          ...(dto.status === 'COMPLETED' && { completedAt: now }),
          ...(dto.status === 'CANCELLED' && { cancelledAt: now }),
        },
        include: {
          items: true,
          table: { select: { tableNumber: true, displayName: true } },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status as any,
          toStatus: dto.status as any,
        },
      });

      return updatedOrder;
    });

    // Emit status change to restaurant room (for other screens)
    // Also emit to a per-order room for customer confirmation pages
    this.events.emitOrderStatusChange(
      restaurantId,
      orderId,
      dto.status,
    );

    return this.serializeOrder(updated);
  }

  private serializeOrder(order: any) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      serviceChargeAmount: Number(order.serviceChargeAmount),
      totalAmount: Number(order.totalAmount),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerNote: order.customerNote,
      table: order.table,
      items: order.items.map((i: any) => ({
        id: i.id,
        name: i.menuItemNameSnapshot,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.lineTotal),
        itemNote: i.itemNote,
      })),
      placedAt: order.placedAt,
      acceptedAt: order.acceptedAt,
      completedAt: order.completedAt,
      createdAt: order.createdAt,
    };
  }
}
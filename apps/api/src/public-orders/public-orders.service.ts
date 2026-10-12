import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrderEventsGateway } from './order-events.gateway.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

@Injectable()
export class PublicOrdersService {
  private readonly logger = new Logger(PublicOrdersService.name);

  constructor(
    private prisma: PrismaService,
    private events: OrderEventsGateway,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    const table = await this.prisma.table.findUnique({
      where: { qrToken: dto.qrToken },
      include: { restaurant: true },
    });

    if (!table) throw new NotFoundException('Invalid QR code');
    if (table.restaurant.status !== 'ACTIVE') {
      throw new BadRequestException('Restaurant is not available');
    }
    if (table.status === 'INACTIVE') {
      throw new BadRequestException('This table is not available');
    }

    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: table.restaurantId,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('One or more items not found');
    }

    const unavailable = menuItems.filter((m) => !m.isAvailable);
    if (unavailable.length > 0) {
      throw new BadRequestException(
        `Unavailable items: ${unavailable.map((m) => m.name).join(', ')}`,
      );
    }

    const itemMap = new Map(menuItems.map((m) => [m.id, m]));
    let subtotal = 0;

    const orderItems = dto.items.map((item) => {
      const menuItem = itemMap.get(item.menuItemId)!;
      const unitPrice = Number(menuItem.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      return {
        menuItemId: menuItem.id,
        menuItemNameSnapshot: menuItem.name,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
        itemNote: item.itemNote,
      };
    });

    const taxRate = table.restaurant.taxEnabled
      ? Number(table.restaurant.taxRate ?? 0) / 100
      : 0;
    const serviceRate = table.restaurant.serviceChargeEnabled
      ? Number(table.restaurant.serviceChargeRate ?? 0) / 100
      : 0;

    const taxAmount = subtotal * taxRate;
    const serviceChargeAmount = subtotal * serviceRate;
    const totalAmount = subtotal + taxAmount + serviceChargeAmount;

    const orderNumber = await this.generateOrderNumber(table.restaurantId);

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          restaurantId: table.restaurantId,
          tableId: table.id,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerNote: dto.customerNote,
          subtotal,
          taxAmount,
          serviceChargeAmount,
          totalAmount,
          items: { create: orderItems },
        },
        include: {
          items: true,
          table: { select: { tableNumber: true, displayName: true } },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          fromStatus: null,
          toStatus: 'PENDING',
        },
      });

      return newOrder;
    });

    // Serialize before emitting so the client gets clean numbers
    this.events.emitNewOrder(
      table.restaurantId,
      this.serializeOrder(order),
    );

    this.logger.log(
      `Order ${order.orderNumber} created (Table ${table.tableNumber}, ₹${totalAmount.toFixed(0)})`,
    );

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      placedAt: order.placedAt,
    };
  }

  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        table: { select: { tableNumber: true, displayName: true } },
        restaurant: { select: { name: true, currency: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      items: order.items.map((i) => ({
        id: i.id,
        name: i.menuItemNameSnapshot,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.lineTotal),
        itemNote: i.itemNote,
      })),
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      serviceChargeAmount: Number(order.serviceChargeAmount),
      totalAmount: Number(order.totalAmount),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerNote: order.customerNote,
      table: order.table,
      restaurant: order.restaurant,
      placedAt: order.placedAt,
    };
  }

  private async generateOrderNumber(restaurantId: string): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await this.prisma.order.count({
      where: {
        restaurantId,
        createdAt: { gte: today },
      },
    });

    const dateStr = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    return `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
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
      items: (order.items ?? []).map((i: any) => ({
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
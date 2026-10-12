import { IsEnum } from 'class-validator';

export enum OrderStatusUpdate {
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusUpdate)
  status!: OrderStatusUpdate;
}
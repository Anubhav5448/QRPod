import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/enums.js';

export class ListOrdersDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsString()
  date?: string; // YYYY-MM-DD (defaults to today)
}
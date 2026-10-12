import { IsEnum, IsOptional } from 'class-validator';
import { TableStatus } from '../../generated/prisma/enums.js';

export class ListTablesDto {
  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;
}
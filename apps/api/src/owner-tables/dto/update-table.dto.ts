import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { TableStatus } from '../../generated/prisma/enums.js';

export class UpdateTableDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  seats?: number;

  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;
}
import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateOrderDto {
  /** Aus Stammdaten „Lieferanten“ */
  @IsOptional()
  @IsString()
  supplierId?: string;

  /** Freitext, falls kein supplierId */
  @IsOptional()
  @IsString()
  supplier?: string;

  @IsString()
  item: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsDateString()
  expectedDelivery?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

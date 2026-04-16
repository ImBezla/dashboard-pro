import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsNotEmpty,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsNotEmpty({ message: 'Beschreibung ist erforderlich' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'Menge ist erforderlich' })
  @IsNumber()
  @Min(0.01, { message: 'Menge muss größer als 0 sein' })
  quantity: number;

  @IsNotEmpty({ message: 'Einzelpreis ist erforderlich' })
  @IsNumber()
  @Min(0, { message: 'Einzelpreis muss positiv sein' })
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Steuersatz muss positiv sein' })
  taxRate?: number;
}

export class CreateInvoiceDto {
  @IsNotEmpty({ message: 'Kunde ist erforderlich' })
  @IsString()
  customerId: string;

  @IsNotEmpty({ message: 'Rechnungsposten sind erforderlich' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsNotEmpty({ message: 'Fälligkeitsdatum ist erforderlich' })
  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

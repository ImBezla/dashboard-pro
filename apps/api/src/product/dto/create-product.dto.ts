import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
  IsIn,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'Name ist erforderlich' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['service', 'product', 'subscription'])
  type?: string;

  @IsNotEmpty({ message: 'Preis ist erforderlich' })
  @IsNumber()
  @Min(0, { message: 'Preis muss positiv sein' })
  price: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Steuersatz muss positiv sein' })
  taxRate?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

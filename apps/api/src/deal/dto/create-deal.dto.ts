import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateDealDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsIn(['OPEN', 'WON', 'LOST', 'ON_HOLD'])
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @IsOptional()
  @IsNumber()
  valueAmount?: number;

  @IsOptional()
  @IsDateString()
  expectedClose?: string;

  @IsOptional()
  @IsString()
  lostReason?: string;
}

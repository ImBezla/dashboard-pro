import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateDealMilestoneDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsIn(['PENDING', 'DONE', 'BLOCKED'])
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}

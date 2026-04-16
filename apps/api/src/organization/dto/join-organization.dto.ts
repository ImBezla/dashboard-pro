import { IsString, MinLength } from 'class-validator';

export class JoinOrganizationDto {
  @IsString()
  @MinLength(4, { message: 'Beitrittscode ungültig' })
  code!: string;
}

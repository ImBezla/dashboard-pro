import { IsString, MinLength } from 'class-validator';

export class ConfirmNewsletterDto {
  @IsString()
  @MinLength(16, { message: 'Ungültiger Bestätigungslink.' })
  token: string;
}

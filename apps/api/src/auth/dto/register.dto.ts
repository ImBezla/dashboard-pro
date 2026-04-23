import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

function normalizeEmailInput(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().normalize('NFKC');
}

export class RegisterDto {
  @Transform(({ value }) => normalizeEmailInput(value))
  @IsEmail(
    { allow_utf8_local_part: true },
    { message: 'Bitte eine gültige E-Mail-Adresse eingeben' },
  )
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;
}

import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

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
  @MinLength(8, { message: 'Passwort muss mindestens 8 Zeichen haben' })
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;
}

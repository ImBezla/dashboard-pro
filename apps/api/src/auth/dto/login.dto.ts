import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

function normalizeEmailInput(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().normalize('NFKC');
}

export class LoginDto {
  @Transform(({ value }) => normalizeEmailInput(value))
  @IsNotEmpty({ message: 'E-Mail ist erforderlich' })
  @IsEmail(
    { allow_utf8_local_part: true },
    { message: 'Bitte eine gültige E-Mail-Adresse eingeben' },
  )
  email: string;

  @IsNotEmpty({ message: 'Passwort ist erforderlich' })
  @IsString()
  @MinLength(6, { message: 'Passwort muss mindestens 6 Zeichen haben' })
  password: string;
}

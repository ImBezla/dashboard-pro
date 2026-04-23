import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

function normalizeEmailInput(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().normalize('NFKC');
}

export class SubscribeNewsletterDto {
  @Transform(({ value }) => normalizeEmailInput(value))
  @IsEmail(
    { allow_utf8_local_part: true },
    { message: 'Bitte eine gültige E-Mail-Adresse eingeben' },
  )
  email: string;
}

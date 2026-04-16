import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  /** E.164, z. B. +491701234567 — leer zum Entfernen */
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === undefined ? null : value,
  )
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'Telefonnummer im E.164-Format (z. B. +491701234567)',
  })
  phoneE164?: string | null;

  @IsOptional()
  @IsBoolean()
  emailTaskAssigned?: boolean;

  @IsOptional()
  @IsBoolean()
  emailTaskDue?: boolean;

  @IsOptional()
  @IsBoolean()
  emailProjectUpdate?: boolean;

  @IsOptional()
  @IsBoolean()
  emailMentions?: boolean;

  @IsOptional()
  @IsBoolean()
  emailWeeklyDigest?: boolean;

  @IsOptional()
  @IsBoolean()
  emailCalendarEvents?: boolean;

  @IsOptional()
  @IsBoolean()
  smsTaskAssigned?: boolean;

  @IsOptional()
  @IsBoolean()
  smsTaskDue?: boolean;

  @IsOptional()
  @IsBoolean()
  smsCalendarEvents?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  taskDueReminderDaysBefore?: number;

  /** Beim ersten Aktivieren von SMS mit `smsEnabled: true` erforderlich (kein DB-Feld). */
  @IsOptional()
  @IsBoolean()
  acceptSmsConsent?: boolean;
}

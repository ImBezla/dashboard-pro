import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  IsUrl,
  ValidateIf,
} from 'class-validator';

/** Leerstring = Feld zurücksetzen (Standard-Farben / Firmenname). */
export class UpdateWorkspaceAppearanceDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  organizationName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  @Matches(/^$|^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  @Matches(/^$|^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
  headingColor?: string;

  /** Leerstring entfernt das Logo. Nur http/https. */
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @ValidateIf((_, v) => typeof v === 'string' && v.trim() !== '')
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  logoUrl?: string;
}

import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  FOCUS_AREA_IDS,
  INDUSTRY_IDS,
  TEAM_SIZE_IDS,
} from '../onboarding-suggest.util';

const FOCUS = [...FOCUS_AREA_IDS];
const IND = [...INDUSTRY_IDS];
const TEAM = [...TEAM_SIZE_IDS];

export class SuggestModulesDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Mindestens ein Schwerpunkt auswählen.' })
  @IsString({ each: true })
  @IsIn(FOCUS, { each: true, message: 'Ungültiger Schwerpunkt.' })
  focusAreas!: string[];

  @IsOptional()
  @IsString()
  @IsIn(IND, { message: 'Ungültige Branche.' })
  industry?: string;

  @IsOptional()
  @IsString()
  @IsIn(TEAM, { message: 'Ungültige Teamgröße.' })
  teamSize?: string;
}

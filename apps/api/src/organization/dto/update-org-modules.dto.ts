import { IsArray, IsIn, IsString } from 'class-validator';
import { ALL_MODULE_KEYS, type ModuleKey } from '../../common/module-packs';

const ALLOWED = [...ALL_MODULE_KEYS];

export class UpdateOrgModulesDto {
  @IsArray()
  @IsString({ each: true })
  @IsIn(ALLOWED, { each: true, message: 'Unbekanntes Modul.' })
  /** Darf leer sein – Server ergänzt Pflicht-Module (Übersicht, Einstellungen, …). */
  modules!: ModuleKey[];
}

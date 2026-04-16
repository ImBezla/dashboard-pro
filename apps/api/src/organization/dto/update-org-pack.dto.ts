import { IsIn, IsString } from 'class-validator';

const PACK_IDS = ['full', 'core', 'sales'] as const;

export class UpdateOrgPackDto {
  @IsString()
  @IsIn([...PACK_IDS])
  packId: (typeof PACK_IDS)[number];
}

import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const ORG_KINDS = ['OPERATING', 'HOLDING', 'FAMILY_OFFICE', 'AG'] as const;

export type OrganizationKind = (typeof ORG_KINDS)[number];

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2, { message: 'Firmenname mindestens 2 Zeichen' })
  name!: string;

  @IsOptional()
  @IsString()
  @IsIn([...ORG_KINDS], {
    message: 'kind muss OPERATING, HOLDING, FAMILY_OFFICE oder AG sein',
  })
  kind?: OrganizationKind;
}

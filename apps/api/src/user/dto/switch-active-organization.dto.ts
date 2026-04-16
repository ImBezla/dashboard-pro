import { IsUUID } from 'class-validator';

export class SwitchActiveOrganizationDto {
  @IsUUID('4', { message: 'organizationId muss eine gültige UUID sein' })
  organizationId!: string;
}

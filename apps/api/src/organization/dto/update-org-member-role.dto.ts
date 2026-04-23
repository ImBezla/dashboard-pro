import { IsIn } from 'class-validator';

export class UpdateOrgMemberRoleDto {
  @IsIn(['MEMBER', 'ADMIN'])
  role!: 'MEMBER' | 'ADMIN';
}

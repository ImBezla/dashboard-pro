import { IsString, IsIn } from 'class-validator';

export class AddMemberDto {
  @IsString()
  userId: string;

  @IsIn(['OWNER', 'MANAGER', 'MEMBER'])
  role: string;
}

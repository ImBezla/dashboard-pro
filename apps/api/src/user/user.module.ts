import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { OrganizationModule } from '../organization/organization.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationPreferencesModule } from '../notification-preferences/notification-preferences.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    OrganizationModule,
    AuthModule,
    NotificationPreferencesModule,
    AuditModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

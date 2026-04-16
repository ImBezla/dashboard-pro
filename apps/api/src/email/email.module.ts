import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationPreferencesModule } from '../notification-preferences/notification-preferences.module';
import { SmsService } from '../sms/sms.service';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    NotificationPreferencesModule,
  ],
  controllers: [EmailController],
  providers: [EmailService, SmsService],
  exports: [EmailService, SmsService],
})
export class EmailModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { NotificationPreferencesModule } from '../notification-preferences/notification-preferences.module';
import { RemindersScheduler } from './reminders.scheduler';

@Module({
  imports: [PrismaModule, NotificationPreferencesModule, EmailModule],
  providers: [RemindersScheduler],
})
export class RemindersModule {}

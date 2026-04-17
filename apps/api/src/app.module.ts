import { ExecutionContext, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { TaskModule } from './task/task.module';
import { TeamModule } from './team/team.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { ActivityModule } from './activity/activity.module';
import { CalendarModule } from './calendar/calendar.module';
import { CustomerModule } from './customer/customer.module';
import { PurchasingModule } from './purchasing/purchasing.module';
import { FinanceModule } from './finance/finance.module';
import { ReportsModule } from './reports/reports.module';
import { InvoiceModule } from './invoice/invoice.module';
import { ProductModule } from './product/product.module';
import { CommentModule } from './comment/comment.module';
import { TagModule } from './tag/tag.module';
import { TimeEntryModule } from './timeentry/timeentry.module';
import { UploadModule } from './upload/upload.module';
import { EmailModule } from './email/email.module';
import { SupplierModule } from './supplier/supplier.module';
import { OrganizationModule } from './organization/organization.module';
import { OperationsOsModule } from './operations-os/operations-os.module';
import { RemindersModule } from './reminders/reminders.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
      errorMessage:
        'Zu viele Anfragen von dieser Adresse. Bitte kurz warten und erneut versuchen.',
      // CORS-Preflight nicht zählen (sonst blockiert Throttling u. U. OPTIONS vor POST)
      skipIf: (context: ExecutionContext) => {
        if (context.getType() !== 'http') return false;
        const req = context.switchToHttp().getRequest<{ method?: string }>();
        return req?.method === 'OPTIONS';
      },
    }),
    PrismaModule,
    AuthModule,
    OrganizationModule,
    UserModule,
    ProjectModule,
    TaskModule,
    TeamModule,
    DashboardModule,
    NotificationsModule,
    HealthModule,
    ActivityModule,
    CalendarModule,
    CustomerModule,
    PurchasingModule,
    FinanceModule,
    ReportsModule,
    InvoiceModule,
    ProductModule,
    CommentModule,
    TagModule,
    TimeEntryModule,
    UploadModule,
    EmailModule,
    SupplierModule,
    OperationsOsModule,
    RemindersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

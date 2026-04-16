import { Module } from '@nestjs/common';
import { TimeEntryController } from './timeentry.controller';
import { TimeEntryService } from './timeentry.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TimeEntryController],
  providers: [TimeEntryService],
  exports: [TimeEntryService],
})
export class TimeEntryModule {}

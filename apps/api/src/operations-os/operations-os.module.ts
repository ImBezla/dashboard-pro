import { Module } from '@nestjs/common';
import { OperationsOsController } from './operations-os.controller';
import { OperationsOsService } from './operations-os.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OperationsOsController],
  providers: [OperationsOsService],
})
export class OperationsOsModule {}

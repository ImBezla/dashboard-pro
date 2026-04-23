import { Module } from '@nestjs/common';
import { CommandFeedController } from './command-feed.controller';
import { CommandFeedService } from './command-feed.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CommandFeedController],
  providers: [CommandFeedService],
})
export class CommandFeedModule {}

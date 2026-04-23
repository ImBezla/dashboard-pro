import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { CommandFeedService } from './command-feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('command-feed')
@UseGuards(JwtAuthGuard, OrgGuard, RolesGuard)
export class CommandFeedController {
  constructor(private commandFeed: CommandFeedService) {}

  @Get()
  list(@Request() req: any) {
    return this.commandFeed.list(req.user.organizationId);
  }
}

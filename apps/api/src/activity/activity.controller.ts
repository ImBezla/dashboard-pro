import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';

@Controller('activity')
@UseGuards(JwtAuthGuard, OrgGuard)
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get()
  findAll(
    @Request() req: any,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.activityService.findAll(req.user.organizationId, {
      type,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get('unread-count')
  getUnreadCount(@Request() req: any) {
    return this.activityService.getUnreadCount(req.user.organizationId);
  }
}

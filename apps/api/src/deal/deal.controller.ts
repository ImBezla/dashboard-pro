import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DealService } from './deal.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { CreateDealMilestoneDto } from './dto/create-deal-milestone.dto';
import { UpdateDealMilestoneDto } from './dto/update-deal-milestone.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { getRequestIp } from '../common/request-ip.util';

@Controller('deals')
@UseGuards(JwtAuthGuard, OrgGuard, RolesGuard)
export class DealController {
  constructor(private dealService: DealService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateDealDto) {
    return this.dealService.create(
      dto,
      req.user.organizationId,
      req.user.id,
      getRequestIp(req),
    );
  }

  @Get()
  findAll(@Request() req: any) {
    return this.dealService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.dealService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
  ) {
    return this.dealService.update(
      id,
      dto,
      req.user.organizationId,
      req.user.id,
      getRequestIp(req),
    );
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.dealService.remove(
      id,
      req.user.organizationId,
      req.user.id,
      getRequestIp(req),
    );
  }

  @Post(':id/milestones')
  addMilestone(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateDealMilestoneDto,
  ) {
    return this.dealService.addMilestone(
      id,
      dto,
      req.user.organizationId,
      req.user.id,
      getRequestIp(req),
    );
  }

  @Patch(':id/milestones/:milestoneId')
  updateMilestone(
    @Request() req: any,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateDealMilestoneDto,
  ) {
    return this.dealService.updateMilestone(
      id,
      milestoneId,
      dto,
      req.user.organizationId,
      req.user.id,
      getRequestIp(req),
    );
  }

  @Delete(':id/milestones/:milestoneId')
  @Roles('ADMIN', 'MANAGER')
  removeMilestone(
    @Request() req: any,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.dealService.removeMilestone(
      id,
      milestoneId,
      req.user.organizationId,
      req.user.id,
      getRequestIp(req),
    );
  }

  @Post(':id/projects/:projectId')
  linkProject(
    @Request() req: any,
    @Param('id') id: string,
    @Param('projectId') projectId: string,
  ) {
    return this.dealService.linkProject(
      id,
      projectId,
      req.user.organizationId,
      req.user.id,
      getRequestIp(req),
    );
  }

  @Delete(':id/projects/:projectId')
  unlinkProject(
    @Request() req: any,
    @Param('id') id: string,
    @Param('projectId') projectId: string,
  ) {
    return this.dealService.unlinkProject(
      id,
      projectId,
      req.user.organizationId,
      req.user.id,
      getRequestIp(req),
    );
  }
}

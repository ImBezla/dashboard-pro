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
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('team')
@UseGuards(JwtAuthGuard, OrgGuard, RolesGuard)
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateTeamDto) {
    return this.teamService.create(dto, req.user.organizationId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.teamService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.teamService.findOne(id, req.user.organizationId);
  }

  @Post(':id/member')
  addMember(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.teamService.addMember(id, dto, req.user.organizationId);
  }

  @Patch('member/:id')
  @Roles('ADMIN', 'MANAGER')
  updateMember(
    @Request() req: any,
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    return this.teamService.updateMember(id, role, req.user.organizationId);
  }

  @Delete('member/:id')
  @Roles('ADMIN', 'MANAGER')
  removeMember(@Request() req: any, @Param('id') id: string) {
    return this.teamService.removeMember(id, req.user.organizationId);
  }
}

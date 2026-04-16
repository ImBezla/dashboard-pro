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
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';

@Controller('calendar')
@UseGuards(JwtAuthGuard, OrgGuard)
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateEventDto) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.calendarService.create(
      req.user.id,
      req.user.organizationId,
      dto,
    );
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.calendarService.findAll(req.user.id, req.user.organizationId, {
      start: start ? new Date(start) : undefined,
      end: end ? new Date(end) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.calendarService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateEventDto,
  ) {
    return this.calendarService.update(id, req.user.organizationId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.calendarService.remove(id, req.user.organizationId);
  }
}

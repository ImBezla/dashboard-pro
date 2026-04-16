import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class CalendarService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(userId: string, organizationId: string, dto: CreateEventDto) {
    const event = await this.prisma.calendarEvent.create({
      data: {
        title: dto.title,
        description:
          dto.description && dto.description.trim() !== ''
            ? dto.description.trim()
            : null,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        userId,
        organizationId,
      },
    });
    void this.emailService.notifyCalendarPersonalEvent(
      userId,
      {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
      },
      'created',
    );
    return event;
  }

  async findAll(
    userId: string,
    organizationId: string,
    options?: { start?: Date; end?: Date },
  ) {
    const where: any = { userId, organizationId };

    if (options?.start || options?.end) {
      if (options.start && options.end) {
        where.OR = [
          {
            AND: [
              { startDate: { gte: options.start } },
              { startDate: { lte: options.end } },
            ],
          },
          {
            AND: [
              { endDate: { gte: options.start } },
              { endDate: { lte: options.end } },
            ],
          },
          {
            AND: [
              { startDate: { lte: options.start } },
              { endDate: { gte: options.end } },
            ],
          },
        ];
      } else if (options.start) {
        where.startDate = { gte: options.start };
      } else if (options.end) {
        where.startDate = { lte: options.end };
      }
    }

    return this.prisma.calendarEvent.findMany({
      where,
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id, organizationId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async update(id: string, organizationId: string, dto: UpdateEventDto) {
    await this.findOne(id, organizationId);
    const updateData: any = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.startDate !== undefined)
      updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) {
      updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }

    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data: updateData,
    });
    void this.emailService.notifyCalendarPersonalEvent(
      event.userId,
      {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
      },
      'updated',
    );
    return event;
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.prisma.calendarEvent.delete({
      where: { id },
    });

    return { message: 'Event deleted successfully' };
  }
}

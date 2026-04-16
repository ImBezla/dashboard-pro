import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getActivityLogs(organizationId: string, limit: number = 20) {
    return this.prisma.activityLog.findMany({
      where: { organizationId },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async createActivityLog(
    organizationId: string,
    userId: string | null,
    type: string,
    message: string,
    metadata?: any,
  ) {
    return this.prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        type,
        message,
        metadata: metadata != null ? JSON.stringify(metadata) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }
}

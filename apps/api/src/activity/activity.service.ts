import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    options: { type?: string; limit: number; offset: number },
  ) {
    const where: any = { organizationId };
    if (options.type) {
      where.type = options.type;
    }

    const activities = await this.prisma.activityLog.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
      take: options.limit,
      skip: options.offset,
    });

    return activities.map((activity) => ({
      ...activity,
      metadata: activity.metadata
        ? typeof activity.metadata === 'string'
          ? JSON.parse(activity.metadata)
          : activity.metadata
        : null,
    }));
  }

  async create(data: {
    type: string;
    userId: string | null;
    resourceType: string;
    resourceId: string;
    metadata?: string;
    organizationId: string;
  }) {
    const metadataObj = data.metadata
      ? typeof data.metadata === 'string'
        ? JSON.parse(data.metadata)
        : data.metadata
      : {};
    let message = '';

    if (data.type === 'TASK_CREATED') {
      message = `✅ Neue Aufgabe erstellt: "${metadataObj.title || 'Unbekannt'}"`;
    } else if (data.type === 'TASK_UPDATED') {
      const statusChange = metadataObj.status
        ? ` (Status: ${this.getStatusLabel(metadataObj.status)})`
        : '';
      message = `🔄 Aufgabe aktualisiert: "${metadataObj.title || 'Unbekannt'}"${statusChange}`;
    } else if (data.type === 'TASK_DELETED') {
      message = `🗑️ Aufgabe gelöscht: "${metadataObj.title || 'Unbekannt'}"`;
    } else if (data.type === 'PROJECT_CREATED') {
      message = `📁 Neues Projekt erstellt: "${metadataObj.name || 'Unbekannt'}"`;
    } else if (data.type === 'PROJECT_UPDATED') {
      const statusChange = metadataObj.status
        ? ` (Status: ${this.getProjectStatusLabel(metadataObj.status)})`
        : '';
      message = `🔄 Projekt aktualisiert: "${metadataObj.name || 'Unbekannt'}"${statusChange}`;
    } else if (data.type === 'PROJECT_DELETED') {
      message = `🗑️ Projekt gelöscht: "${metadataObj.name || 'Unbekannt'}"`;
    } else if (data.type === 'TEAM_MEMBER_ADDED') {
      message = `👥 Team-Mitglied hinzugefügt: "${metadataObj.memberName || 'Unbekannt'}"`;
    } else if (data.type === 'TEAM_MEMBER_REMOVED') {
      message = `👥 Team-Mitglied entfernt: "${metadataObj.memberName || 'Unbekannt'}"`;
    } else {
      message = `🔔 ${data.type.replace(/_/g, ' ')}`;
    }

    return this.prisma.activityLog.create({
      data: {
        type: data.type,
        userId: data.userId,
        message,
        metadata: data.metadata || null,
        organizationId: data.organizationId,
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

  async getUnreadCount(organizationId: string) {
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const count = await this.prisma.activityLog.count({
      where: {
        organizationId,
        createdAt: {
          gte: last24Hours,
        },
      },
    });

    return { count };
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      OPEN: 'Offen',
      IN_PROGRESS: 'In Bearbeitung',
      DONE: 'Erledigt',
    };
    return labels[status] || status;
  }

  private getProjectStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Aktiv',
      IN_PROGRESS: 'In Bearbeitung',
      PENDING: 'Wartend',
      COMPLETED: 'Abgeschlossen',
      ARCHIVED: 'Archiviert',
    };
    return labels[status] || status;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(entry: {
    userId: string;
    organizationId?: string | null;
    action: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string | null;
  }): Promise<void> {
    try {
      await this.prisma.securityAuditLog.create({
        data: {
          userId: entry.userId,
          organizationId: entry.organizationId ?? undefined,
          action: entry.action,
          metadata:
            entry.metadata != null
              ? JSON.stringify(entry.metadata).slice(0, 8000)
              : undefined,
          ipAddress: entry.ipAddress ?? undefined,
        },
      });
    } catch (e) {
      this.logger.warn(`Audit-Log fehlgeschlagen (${entry.action}): ${e}`);
    }
  }

  listForOrganization(organizationId: string, take = 80) {
    return this.prisma.securityAuditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}

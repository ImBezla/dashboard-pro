import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

const socketCorsOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:8000',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

@WebSocketGateway({
  cors: {
    origin: socketCorsOrigins,
    credentials: true,
  },
  namespace: '/realtime',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const auth = client.handshake.auth as { token?: string } | undefined;
    let token = auth?.token;
    const header = client.handshake.headers?.authorization;
    if (!token && typeof header === 'string' && header.startsWith('Bearer ')) {
      token = header.slice(7);
    }
    if (!token || typeof token !== 'string') {
      client.disconnect();
      return;
    }
    try {
      const payload = await this.jwt.verifyAsync<{
        userId: string;
        organizationId?: string | null;
      }>(token, {
        secret:
          process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      });
      if (!payload?.userId) {
        client.disconnect();
        return;
      }
      client.data.userId = payload.userId;
      client.data.organizationId = payload.organizationId ?? null;
      await client.join(`user:${payload.userId}`);
      if (payload.organizationId) {
        await client.join(`org:${payload.organizationId}`);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {}

  /** Nur Mitglieder der Organisation, bei denen Push (Realtime) nicht deaktiviert ist. */
  private async emitToOrgMembersWithPush(
    organizationId: string,
    event: string,
    payload: unknown,
  ): Promise<void> {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      select: { userId: true },
    });
    const userIds = members.map((m) => m.userId);
    if (!userIds.length) return;

    const prefsRows = await this.prisma.userNotificationPreferences.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, pushEnabled: true },
    });
    const pushOff = new Set(
      prefsRows.filter((r) => r.pushEnabled === false).map((r) => r.userId),
    );

    for (const uid of userIds) {
      if (!pushOff.has(uid)) {
        this.server.to(`user:${uid}`).emit(event, payload);
      }
    }
  }

  emitTaskCreated(task: { project?: { organizationId?: string } | null }) {
    const orgId = task.project?.organizationId;
    if (!orgId) return;
    void this.emitToOrgMembersWithPush(orgId, 'task.created', task);
  }

  emitTaskUpdated(task: Record<string, unknown>, organizationId?: string) {
    const proj = task.project as { organizationId?: string } | undefined;
    const orgId = organizationId ?? proj?.organizationId;
    if (!orgId) return;
    void this.emitToOrgMembersWithPush(orgId, 'task.updated', task);
  }

  emitTaskDeleted(taskId: string, organizationId: string) {
    void this.emitToOrgMembersWithPush(organizationId, 'task.deleted', {
      id: taskId,
    });
  }

  emitProjectCreated(project: { organizationId?: string }) {
    const orgId = project.organizationId;
    if (!orgId) return;
    void this.emitToOrgMembersWithPush(orgId, 'project.created', project);
  }

  emitProjectUpdated(project: { organizationId?: string }) {
    const orgId = project.organizationId;
    if (!orgId) return;
    void this.emitToOrgMembersWithPush(orgId, 'project.updated', project);
  }

  emitProjectDeleted(projectId: string, organizationId: string) {
    void this.emitToOrgMembersWithPush(organizationId, 'project.deleted', {
      id: projectId,
    });
  }
}

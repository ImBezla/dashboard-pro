import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const MAX_PAYLOAD_BYTES = 512_000;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

@Injectable()
export class OperationsOsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspace(organizationId: string) {
    const row = await this.prisma.opsWorkspaceState.findUnique({
      where: { organizationId },
    });
    if (!row) {
      return { payload: null as null };
    }
    try {
      const payload = JSON.parse(row.payloadJson) as unknown;
      return { payload };
    } catch {
      return { payload: null as null };
    }
  }

  async putWorkspace(organizationId: string, body: unknown) {
    if (!isPlainObject(body)) {
      throw new BadRequestException('Ungültiger Payload');
    }
    const { flows, nodes, edges, hiddenSeedFlowIds } = body;
    if (
      !Array.isArray(flows) ||
      !Array.isArray(nodes) ||
      !Array.isArray(edges)
    ) {
      throw new BadRequestException(
        'Erwartet: flows, nodes, edges (Arrays) und optional hiddenSeedFlowIds',
      );
    }
    if (hiddenSeedFlowIds !== undefined && !Array.isArray(hiddenSeedFlowIds)) {
      throw new BadRequestException('hiddenSeedFlowIds muss ein Array sein');
    }
    const normalized = {
      flows,
      nodes,
      edges,
      hiddenSeedFlowIds: Array.isArray(hiddenSeedFlowIds)
        ? hiddenSeedFlowIds.filter((x) => typeof x === 'string')
        : [],
    };
    const json = JSON.stringify(normalized);
    const size = Buffer.byteLength(json, 'utf8');
    if (size > MAX_PAYLOAD_BYTES) {
      throw new PayloadTooLargeException(
        `Flow-Workspace-Daten zu groß (max. ${MAX_PAYLOAD_BYTES} Bytes).`,
      );
    }

    await this.prisma.opsWorkspaceState.upsert({
      where: { organizationId },
      create: {
        id: randomUUID(),
        organizationId,
        payloadJson: json,
      },
      update: { payloadJson: json },
    });

    return { ok: true as const };
  }
}

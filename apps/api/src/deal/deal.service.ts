import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { CreateDealMilestoneDto } from './dto/create-deal-milestone.dto';
import { UpdateDealMilestoneDto } from './dto/update-deal-milestone.dto';
import { computeDealRiskScore } from './deal-risk.util';
import { randomUUID } from 'crypto';

@Injectable()
export class DealService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private async assertCustomerInOrg(customerId: string, organizationId: string) {
    const c = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId },
    });
    if (!c) throw new NotFoundException('Kunde nicht gefunden');
  }

  async create(
    dto: CreateDealDto,
    organizationId: string,
    userId: string,
    ipAddress?: string | null,
  ) {
    if (dto.customerId) {
      await this.assertCustomerInOrg(dto.customerId, organizationId);
    }
    const deal = await this.prisma.deal.create({
      data: {
        id: randomUUID(),
        organizationId,
        customerId: dto.customerId ?? null,
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        status: dto.status ?? 'OPEN',
        probability: dto.probability ?? 50,
        valueAmount: dto.valueAmount ?? null,
        expectedClose: dto.expectedClose ? new Date(dto.expectedClose) : null,
        lostReason: dto.lostReason?.trim() ?? null,
      },
      include: {
        customer: true,
        milestones: { orderBy: { sortOrder: 'asc' } },
      },
    });
    void this.audit.log({
      userId,
      organizationId,
      action: 'deal.create',
      metadata: { dealId: deal.id, title: deal.title },
      ipAddress: ipAddress ?? undefined,
    });
    return this.enrichDeal(deal);
  }

  async findAll(organizationId: string) {
    const rows = await this.prisma.deal.findMany({
      where: { organizationId },
      include: {
        customer: true,
        milestones: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { projects: true, invoices: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    const now = new Date();
    return rows.map((d) => this.enrichDeal(d, now));
  }

  async findOne(id: string, organizationId: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        milestones: { orderBy: { sortOrder: 'asc' } },
        projects: { select: { id: true, name: true, status: true } },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            dueDate: true,
          },
        },
      },
    });
    if (!deal) throw new NotFoundException('Deal nicht gefunden');
    return this.enrichDeal(deal);
  }

  private enrichDeal(deal: any, now = new Date()) {
    const milestones = deal.milestones ?? [];
    const riskScore = computeDealRiskScore(
      milestones,
      deal.probability ?? 50,
      now,
    );
    return { ...deal, riskScore };
  }

  async update(
    id: string,
    dto: UpdateDealDto,
    organizationId: string,
    userId: string,
    ipAddress?: string | null,
  ) {
    await this.findOne(id, organizationId);
    if (dto.customerId) {
      await this.assertCustomerInOrg(dto.customerId, organizationId);
    }
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined)
      data.description = dto.description?.trim() ?? null;
    if (dto.customerId !== undefined) data.customerId = dto.customerId;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.probability !== undefined) data.probability = dto.probability;
    if (dto.valueAmount !== undefined) data.valueAmount = dto.valueAmount;
    if (dto.expectedClose !== undefined) {
      data.expectedClose = dto.expectedClose
        ? new Date(dto.expectedClose)
        : null;
    }
    if (dto.lostReason !== undefined)
      data.lostReason = dto.lostReason?.trim() ?? null;

    const deal = await this.prisma.deal.update({
      where: { id },
      data,
      include: {
        customer: true,
        milestones: { orderBy: { sortOrder: 'asc' } },
        projects: { select: { id: true, name: true, status: true } },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            dueDate: true,
          },
        },
      },
    });
    void this.audit.log({
      userId,
      organizationId,
      action: 'deal.update',
      metadata: { dealId: id, fields: Object.keys(data) },
      ipAddress: ipAddress ?? undefined,
    });
    return this.enrichDeal(deal);
  }

  async remove(
    id: string,
    organizationId: string,
    userId: string,
    ipAddress?: string | null,
  ) {
    await this.findOne(id, organizationId);
    await this.prisma.deal.delete({ where: { id } });
    void this.audit.log({
      userId,
      organizationId,
      action: 'deal.delete',
      metadata: { dealId: id },
      ipAddress: ipAddress ?? undefined,
    });
    return { ok: true as const };
  }

  async addMilestone(
    dealId: string,
    dto: CreateDealMilestoneDto,
    organizationId: string,
    userId: string,
    ipAddress?: string | null,
  ) {
    await this.findOne(dealId, organizationId);
    const maxOrder = await this.prisma.dealMilestone.aggregate({
      where: { dealId },
      _max: { sortOrder: true },
    });
    const sortOrder =
      dto.sortOrder ?? (maxOrder._max.sortOrder != null
        ? maxOrder._max.sortOrder + 1
        : 0);
    const m = await this.prisma.dealMilestone.create({
      data: {
        id: randomUUID(),
        dealId,
        title: dto.title.trim(),
        status: dto.status ?? 'PENDING',
        sortOrder,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : null,
      },
    });
    void this.audit.log({
      userId,
      organizationId,
      action: 'deal.milestone.create',
      metadata: { dealId, milestoneId: m.id },
      ipAddress: ipAddress ?? undefined,
    });
    return m;
  }

  async updateMilestone(
    dealId: string,
    milestoneId: string,
    dto: UpdateDealMilestoneDto,
    organizationId: string,
    userId: string,
    ipAddress?: string | null,
  ) {
    await this.findOne(dealId, organizationId);
    const existing = await this.prisma.dealMilestone.findFirst({
      where: { id: milestoneId, dealId },
    });
    if (!existing) throw new NotFoundException('Meilenstein nicht gefunden');
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.paidAt !== undefined) {
      data.paidAt = dto.paidAt ? new Date(dto.paidAt) : null;
    }
    const m = await this.prisma.dealMilestone.update({
      where: { id: milestoneId },
      data,
    });
    void this.audit.log({
      userId,
      organizationId,
      action: 'deal.milestone.update',
      metadata: { dealId, milestoneId },
      ipAddress: ipAddress ?? undefined,
    });
    return m;
  }

  async removeMilestone(
    dealId: string,
    milestoneId: string,
    organizationId: string,
    userId: string,
    ipAddress?: string | null,
  ) {
    await this.findOne(dealId, organizationId);
    const existing = await this.prisma.dealMilestone.findFirst({
      where: { id: milestoneId, dealId },
    });
    if (!existing) throw new NotFoundException('Meilenstein nicht gefunden');
    await this.prisma.dealMilestone.delete({ where: { id: milestoneId } });
    void this.audit.log({
      userId,
      organizationId,
      action: 'deal.milestone.delete',
      metadata: { dealId, milestoneId },
      ipAddress: ipAddress ?? undefined,
    });
    return { ok: true as const };
  }

  async linkProject(
    dealId: string,
    projectId: string,
    organizationId: string,
    userId: string,
    ipAddress?: string | null,
  ) {
    await this.findOne(dealId, organizationId);
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });
    if (!project) throw new NotFoundException('Projekt nicht gefunden');
    await this.prisma.project.update({
      where: { id: projectId },
      data: { dealId },
    });
    void this.audit.log({
      userId,
      organizationId,
      action: 'deal.project.link',
      metadata: { dealId, projectId },
      ipAddress: ipAddress ?? undefined,
    });
    return { ok: true as const };
  }

  async unlinkProject(
    dealId: string,
    projectId: string,
    organizationId: string,
    userId: string,
    ipAddress?: string | null,
  ) {
    await this.findOne(dealId, organizationId);
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId, dealId },
    });
    if (!project) {
      throw new BadRequestException('Projekt ist nicht mit diesem Deal verknüpft');
    }
    await this.prisma.project.update({
      where: { id: projectId },
      data: { dealId: null },
    });
    void this.audit.log({
      userId,
      organizationId,
      action: 'deal.project.unlink',
      metadata: { dealId, projectId },
      ipAddress: ipAddress ?? undefined,
    });
    return { ok: true as const };
  }
}

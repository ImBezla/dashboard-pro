import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CommandItem } from './command-item.types';
import { sortCommandItems } from './command-priority.util';
import {
  computeDealRiskScore,
  hasOverdueOpenMilestone,
} from '../deal/deal-risk.util';

function normInvoiceStatus(status: string): string {
  return (status || '').toLowerCase();
}

function isInvoicePaymentMissing(status: string): boolean {
  const s = normInvoiceStatus(status);
  return !['paid', 'cancelled'].includes(s);
}

@Injectable()
export class CommandFeedService {
  constructor(private prisma: PrismaService) {}

  async list(organizationId: string): Promise<{ items: CommandItem[] }> {
    const now = new Date();
    const items: CommandItem[] = [];

    const overdueTasks = await this.prisma.task.findMany({
      where: {
        project: { organizationId },
        status: { not: 'DONE' },
        deadline: { lt: now },
      },
      take: 40,
      orderBy: { deadline: 'asc' },
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    for (const t of overdueTasks) {
      const due = t.deadline ? new Date(t.deadline).toISOString() : null;
      const assignee = t.assignedTo?.name ?? 'Nicht zugewiesen';
      items.push({
        id: `task:${t.id}`,
        domainEvent: 'task.overdue',
        title: `Überfällige Aufgabe: ${t.title}`,
        summary: `Projekt „${t.project?.name ?? '—'}“ · ${assignee}`,
        severity: 5,
        dueAt: due,
        entityType: 'task',
        entityId: t.id,
        metadata: {
          projectId: t.projectId,
          assignedToId: t.assignedToId,
        },
        suggestedActions: [
          {
            key: 'mark_task_done',
            label: 'Als erledigt',
            api: {
              method: 'PATCH',
              pathTemplate: '/tasks/:id',
              body: { status: 'DONE' },
            },
          },
          ...(t.assignedToId
            ? [
                {
                  key: 'nudge_task_assignee' as const,
                  label: 'Erinnerung senden',
                  api: {
                    method: 'POST' as const,
                    pathTemplate: '/tasks/:id/nudge',
                  },
                },
              ]
            : []),
        ],
      });
    }

    const invoices = await this.prisma.invoice.findMany({
      where: {
        organizationId,
        dueDate: { lt: now },
      },
      take: 40,
      orderBy: { dueDate: 'asc' },
      include: { customer: { select: { name: true } } },
    });

    for (const inv of invoices) {
      if (!isInvoicePaymentMissing(inv.status)) continue;
      const due = inv.dueDate ? new Date(inv.dueDate).toISOString() : null;
      items.push({
        id: `invoice:${inv.id}`,
        domainEvent: 'invoice.payment_missing',
        title: `Zahlung ausstehend: ${inv.invoiceNumber}`,
        summary: `Kunde „${inv.customer?.name ?? '—'}“ · ${inv.amount} €`,
        severity: 4,
        dueAt: due,
        entityType: 'invoice',
        entityId: inv.id,
        metadata: { status: inv.status },
        suggestedActions: [
          {
            key: 'mark_invoice_paid',
            label: 'Als bezahlt markieren',
            api: {
              method: 'PATCH',
              pathTemplate: '/invoices/:id',
              body: { status: 'paid' },
            },
          },
        ],
      });
    }

    const deals = await this.prisma.deal.findMany({
      where: { organizationId, status: 'OPEN' },
      include: {
        milestones: { orderBy: { sortOrder: 'asc' } },
        customer: { select: { name: true } },
      },
      take: 25,
    });

    for (const d of deals) {
      const risk = computeDealRiskScore(
        d.milestones,
        d.probability,
        now,
      );
      const overdueMs = hasOverdueOpenMilestone(d.milestones, now);
      if (risk < 40 && !overdueMs) continue;

      const due =
        d.expectedClose != null
          ? new Date(d.expectedClose).toISOString()
          : d.milestones.find((m) => m.dueDate && m.status !== 'DONE')
              ?.dueDate
          ? new Date(
              d.milestones.find((m) => m.dueDate && m.status !== 'DONE')!
                .dueDate!,
            ).toISOString()
          : null;

      items.push({
        id: `deal:${d.id}`,
        domainEvent: 'deal.at_risk',
        title: `Deal-Risiko: ${d.title}`,
        summary: `Kunde „${d.customer?.name ?? '—'}“ · Risiko-Score ${risk} · Wsk. ${d.probability}%`,
        severity: overdueMs ? 4 : 3,
        dueAt: due,
        entityType: 'deal',
        entityId: d.id,
        metadata: { riskScore: risk, probability: d.probability },
        suggestedActions: [
          {
            key: 'open_deal',
            label: 'Deal öffnen',
            api: { method: 'GET', pathTemplate: '/deals/:id' },
          },
        ],
      });
    }

    return { items: sortCommandItems(items, now) };
  }
}

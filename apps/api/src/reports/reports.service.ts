import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PURCHASE_ORDER_COMPLETED_STATUSES } from '../common/purchase-order-status';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getFinancialReport(
    organizationId: string,
    timeRange: string = 'month',
  ) {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const invoices = await this.prisma.invoice.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
    });

    const orders = await this.prisma.purchaseOrder.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
    });

    const monthlyData: Record<string, { revenue: number; expenses: number }> =
      {};

    invoices.forEach((inv) => {
      const monthKey = `${inv.createdAt.getFullYear()}-${String(inv.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }
      if (inv.status === 'PAID') {
        monthlyData[monthKey].revenue += inv.amount;
      }
    });

    orders.forEach((order) => {
      if (!PURCHASE_ORDER_COMPLETED_STATUSES.includes(order.status)) {
        return;
      }
      const monthKey = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }
      monthlyData[monthKey].expenses += order.total;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('de-DE', {
          month: 'short',
          year: 'numeric',
        }),
        ...data,
      }));
  }

  async exportReport(organizationId: string, type: string, format: string) {
    let data: any[];

    switch (type) {
      case 'projects':
        data = await this.prisma.project.findMany({
          where: { organizationId },
          include: { tasks: true },
        });
        break;
      case 'tasks':
        data = await this.prisma.task.findMany({
          where: { project: { organizationId } },
          include: { project: true },
        });
        break;
      case 'team':
        data = await this.prisma.team.findMany({
          where: { organizationId },
          include: { members: { include: { user: true } } },
        });
        break;
      default:
        data = [];
    }

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return data;
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return '';

    const headers = Object.keys(data[0]).filter(
      (k) => typeof data[0][k] !== 'object',
    );
    let csv = headers.join(',') + '\n';

    data.forEach((item) => {
      const row = headers.map((h) => {
        const val = item[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return String(val);
      });
      csv += row.join(',') + '\n';
    });

    return csv;
  }
}

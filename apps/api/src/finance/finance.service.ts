import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PURCHASE_ORDER_COMPLETED_STATUSES } from '../common/purchase-order-status';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getOverview(organizationId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { organizationId },
    });
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { organizationId },
    });

    const totalRevenue = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const pendingRevenue = invoices
      .filter((inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const totalExpenses = orders
      .filter((order) =>
        PURCHASE_ORDER_COMPLETED_STATUSES.includes(order.status),
      )
      .reduce((sum, order) => sum + order.total, 0);

    return {
      totalRevenue,
      pendingRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      invoiceCount: invoices.length,
      orderCount: orders.length,
    };
  }
}

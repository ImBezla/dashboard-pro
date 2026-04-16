import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  PURCHASE_ORDER_CANCELLED_STATUSES,
  PURCHASE_ORDER_COMPLETED_STATUSES,
  PURCHASE_ORDER_PENDING_STATUSES,
} from '../common/purchase-order-status';

@Injectable()
export class PurchasingService {
  constructor(private prisma: PrismaService) {}

  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `PO-${year}${month}-${random}`;
  }

  async create(dto: CreateOrderDto, organizationId: string) {
    const quantity = dto.quantity || 1;
    const unitPrice = dto.unitPrice || 0;
    const total = quantity * unitPrice;

    let supplierName = dto.supplier?.trim() || '';
    const supplierId: string | null = dto.supplierId?.trim() || null;

    if (supplierId) {
      const sup = await this.prisma.supplier.findFirst({
        where: { id: supplierId, organizationId },
      });
      if (!sup) {
        throw new NotFoundException('Lieferant nicht gefunden');
      }
      supplierName = sup.name;
    }

    if (!supplierName) {
      throw new BadRequestException(
        'Bitte Lieferant auswählen oder als Freitext angeben',
      );
    }

    return this.prisma.purchaseOrder.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        supplier: supplierName,
        supplierId,
        product: (dto as any).product || dto.item || 'Unknown',
        quantity,
        unitPrice,
        total,
        status: (dto as any).status || 'PENDING',
        organizationId,
      },
    });
  }

  private statusFilterWhere(
    statusFilter?: string,
  ): { status: { in: string[] } } | Record<string, never> {
    if (!statusFilter || statusFilter === 'all') {
      return {};
    }
    const key = statusFilter.toLowerCase();
    if (key === 'pending') {
      return { status: { in: [...PURCHASE_ORDER_PENDING_STATUSES] } };
    }
    if (key === 'completed') {
      return { status: { in: [...PURCHASE_ORDER_COMPLETED_STATUSES] } };
    }
    if (key === 'cancelled' || key === 'canceled') {
      return { status: { in: [...PURCHASE_ORDER_CANCELLED_STATUSES] } };
    }
    return { status: { in: [statusFilter] } };
  }

  async findAll(organizationId: string, statusFilter?: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { organizationId, ...this.statusFilterWhere(statusFilter) },
      orderBy: { orderDate: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
    });

    if (!order) {
      throw new NotFoundException(`Purchase order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, dto: UpdateOrderDto, organizationId: string) {
    const order = await this.findOne(id, organizationId);

    const updateData: any = {};
    if (dto.supplier) updateData.supplier = dto.supplier;
    if (dto.status) updateData.status = dto.status;
    if (dto.quantity !== undefined || dto.unitPrice !== undefined) {
      const qty = dto.quantity ?? order.quantity;
      const price = dto.unitPrice ?? order.unitPrice;
      updateData.quantity = qty;
      updateData.unitPrice = price;
      updateData.total = qty * price;
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.prisma.purchaseOrder.delete({ where: { id } });
    return { message: 'Purchase order deleted successfully' };
  }
}

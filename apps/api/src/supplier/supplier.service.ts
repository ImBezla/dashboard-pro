import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PURCHASE_ORDER_COMPLETED_STATUSES } from '../common/purchase-order-status';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupplierDto, organizationId: string) {
    return this.prisma.supplier.create({
      data: {
        ...dto,
        status: 'active',
        organizationId,
      },
    });
  }

  async findAll(organizationId: string, search?: string) {
    const suppliers = await this.prisma.supplier.findMany({
      where: { organizationId },
      include: {
        purchaseOrders: {
          orderBy: { orderDate: 'desc' },
          take: 50,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (search) {
      const q = search.toLowerCase();
      return suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          (s.company && s.company.toLowerCase().includes(q)),
      );
    }

    return suppliers;
  }

  async findOne(id: string, organizationId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId },
      include: {
        purchaseOrders: {
          orderBy: { orderDate: 'desc' },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Lieferant mit ID ${id} nicht gefunden`);
    }

    const completed = supplier.purchaseOrders.filter((o) =>
      PURCHASE_ORDER_COMPLETED_STATUSES.includes(o.status),
    );
    const totalSpend = completed.reduce((sum, o) => sum + o.total, 0);

    return {
      ...supplier,
      statistics: {
        totalOrders: supplier.purchaseOrders.length,
        completedOrders: completed.length,
        totalSpend,
        openOrders: supplier.purchaseOrders.length - completed.length,
      },
    };
  }

  async update(id: string, dto: UpdateSupplierDto, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.prisma.supplier.delete({ where: { id } });
    return { message: 'Lieferant gelöscht' };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerDto, organizationId: string) {
    return this.prisma.customer.create({
      data: {
        ...dto,
        status: 'active',
        organizationId,
      },
    });
  }

  async findAll(organizationId: string, search?: string) {
    const customers = await this.prisma.customer.findMany({
      where: { organizationId },
      include: {
        invoices: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (search) {
      const searchLower = search.toLowerCase();
      return customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchLower) ||
          (customer.email &&
            customer.email.toLowerCase().includes(searchLower)) ||
          (customer.company &&
            customer.company.toLowerCase().includes(searchLower)),
      );
    }

    return customers;
  }

  async findOne(id: string, organizationId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId },
      include: {
        invoices: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const totalRevenue = customer.invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.amount, 0);

    return {
      ...customer,
      statistics: {
        totalRevenue,
        pendingInvoices: customer.invoices.filter(
          (inv) => inv.status !== 'PAID',
        ).length,
        totalInvoices: customer.invoices.length,
      },
    };
  }

  async update(id: string, dto: UpdateCustomerDto, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.prisma.customer.delete({ where: { id } });
    return { message: 'Customer deleted successfully' };
  }
}

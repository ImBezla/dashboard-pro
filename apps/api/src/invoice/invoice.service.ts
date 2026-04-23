import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  async create(
    dto: CreateInvoiceDto,
    organizationId: string,
    userId: string,
    ipAddress?: string | null,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId },
    });
    if (!customer) {
      throw new NotFoundException('Kunde nicht gefunden');
    }

    const inv = await this.prisma.invoice.create({
      data: {
        invoiceNumber: this.generateInvoiceNumber(),
        customerId: dto.customerId,
        amount: (dto as any).amount || 0,
        status: (dto as any).status || 'DRAFT',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        items: (dto as any).items ? JSON.stringify((dto as any).items) : null,
        organizationId,
      },
      include: {
        customer: true,
      },
    });
    void this.audit.log({
      userId,
      organizationId,
      action: 'invoice.create',
      metadata: { invoiceId: inv.id, invoiceNumber: inv.invoiceNumber },
      ipAddress: ipAddress ?? undefined,
    });
    return inv;
  }

  async findAll(organizationId: string, status?: string) {
    const where: any = { organizationId };
    if (status) where.status = status;

    return this.prisma.invoice.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
      include: { customer: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return {
      ...invoice,
      items: invoice.items ? JSON.parse(invoice.items) : [],
    };
  }

  async update(
    id: string,
    dto: UpdateInvoiceDto,
    organizationId: string,
    userId: string,
    ipAddress?: string | null,
  ) {
    await this.findOne(id, organizationId);
    const updateData: any = {};

    if (dto.status) updateData.status = dto.status;
    if ((dto as any).amount !== undefined)
      updateData.amount = (dto as any).amount;
    if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
    if ((dto as any).items)
      updateData.items = JSON.stringify((dto as any).items);

    const inv = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { customer: true },
    });
    void this.audit.log({
      userId,
      organizationId,
      action: 'invoice.update',
      metadata: { invoiceId: id, fields: Object.keys(updateData) },
      ipAddress: ipAddress ?? undefined,
    });
    return inv;
  }

  async remove(
    id: string,
    organizationId: string,
    userId: string,
    ipAddress?: string | null,
  ) {
    await this.findOne(id, organizationId);
    await this.prisma.invoice.delete({ where: { id } });
    void this.audit.log({
      userId,
      organizationId,
      action: 'invoice.delete',
      metadata: { invoiceId: id },
      ipAddress: ipAddress ?? undefined,
    });
    return { message: 'Invoice deleted successfully' };
  }
}

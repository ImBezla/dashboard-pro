import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('invoices')
@UseGuards(JwtAuthGuard, OrgGuard, RolesGuard)
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateInvoiceDto) {
    return this.invoiceService.create(dto, req.user.organizationId);
  }

  @Get()
  findAll(@Request() req: any, @Query('status') status?: string) {
    return this.invoiceService.findAll(req.user.organizationId, status);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.invoiceService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoiceService.update(id, dto, req.user.organizationId);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.invoiceService.remove(id, req.user.organizationId);
  }
}

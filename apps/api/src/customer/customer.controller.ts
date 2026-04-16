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
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard, OrgGuard, RolesGuard)
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateCustomerDto) {
    return this.customerService.create(dto, req.user.organizationId);
  }

  @Get()
  findAll(@Request() req: any, @Query('search') search?: string) {
    return this.customerService.findAll(req.user.organizationId, search);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.customerService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customerService.update(id, dto, req.user.organizationId);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.customerService.remove(id, req.user.organizationId);
  }
}

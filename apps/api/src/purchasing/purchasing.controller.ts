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
import { PurchasingService } from './purchasing.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('purchasing')
@UseGuards(JwtAuthGuard, OrgGuard, RolesGuard)
export class PurchasingController {
  constructor(private purchasingService: PurchasingService) {}

  @Post('orders')
  create(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.purchasingService.create(dto, req.user.organizationId);
  }

  @Get('orders')
  findAll(@Request() req: any, @Query('status') status?: string) {
    return this.purchasingService.findAll(req.user.organizationId, status);
  }

  @Get('orders/:id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.purchasingService.findOne(id, req.user.organizationId);
  }

  @Patch('orders/:id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.purchasingService.update(id, dto, req.user.organizationId);
  }

  @Delete('orders/:id')
  @Roles('ADMIN', 'MANAGER')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.purchasingService.remove(id, req.user.organizationId);
  }
}

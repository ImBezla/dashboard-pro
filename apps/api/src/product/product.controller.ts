import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, OrgGuard, RolesGuard)
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateProductDto) {
    return this.productService.create(dto, req.user.organizationId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.productService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.productService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(id, dto, req.user.organizationId);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.productService.remove(id, req.user.organizationId);
  }
}

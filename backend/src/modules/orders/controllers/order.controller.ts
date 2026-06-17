import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/constants';
import { CreateOrderDto } from '../dto/create-order.dto';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { OrderQueryDto } from '../dto/order-query.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { BulkOrderDto } from '../dto/bulk-order.dto';
import { OrderService } from '../services/order.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  getAdminStats() {
    return this.orderService.getAdminStats();
  }

  @Get('my-stats')
  getMyStats(@CurrentUser('id') userId: string) {
    return this.orderService.getMyStats(userId);
  }

  @Get('my-orders')
  findMyOrders(
    @Query() query: OrderQueryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.orderService.findAll(query, userId, role);
  }

  @Get()
  findAll(
    @Query() query: OrderQueryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.orderService.findAll(query, userId, role);
  }

  @Patch('bulk')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  bulkOrders(@Body() dto: BulkOrderDto) {
    return this.orderService.bulkAction(dto);
  }

  @Post('checkout')
  checkout(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.orderService.checkout(userId, dto);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.orderService.findOne(id, userId, role);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orderService.cancel(id, userId, role, dto);
  }

  @Post(':id/cancel')
  cancelLegacy(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto?: CancelOrderDto,
  ) {
    return this.orderService.cancel(
      id,
      userId,
      role,
      dto ?? { reason: 'Cancelled by customer' },
    );
  }

  @Post(':id/reorder')
  reorder(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.orderService.reorder(id, userId, role);
  }
}

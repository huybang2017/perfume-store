import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/constants';
import { CheckoutPaymentDto } from '../dto/checkout-payment.dto';
import { PaymentQueryDto } from '../dto/payment-query.dto';
import { PaymentService } from '../services/payment.service';

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip ?? '127.0.0.1';
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly config: ConfigService,
  ) {}

  @ApiBearerAuth()
  @Post('checkout')
  checkout(
    @CurrentUser('id') userId: string,
    @Body() dto: CheckoutPaymentDto,
    @Req() req: Request,
  ) {
    return this.paymentService.checkout(userId, dto, clientIp(req));
  }

  @ApiBearerAuth()
  @Get('order/:orderId')
  findByOrder(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.paymentService.findByOrder(orderId, userId, role);
  }

  @ApiBearerAuth()
  @Post('demo-confirm/:orderId')
  demoConfirm(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    if (this.config.get<string>('nodeEnv') === 'production') {
      return { success: false, message: 'Not available' };
    }
    return this.paymentService.demoConfirmGateway(orderId, userId);
  }

  @Public()
  @Get('vnpay/return')
  async vnpayReturn(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    const result = await this.paymentService.handleVnpayReturn(query);
    const frontend = this.config.get<string>('frontendUrl');
    const status = result.success ? 'success' : 'failed';
    const url = new URL(`${frontend}/thanh-toan/ket-qua`);
    url.searchParams.set('status', status);
    if (result.orderId) url.searchParams.set('orderId', result.orderId);
    if (result.orderNumber)
      url.searchParams.set('orderNumber', result.orderNumber);
    if (result.message) url.searchParams.set('message', result.message);
    url.searchParams.set('method', 'VNPAY');
    return res.redirect(url.toString());
  }

  @Public()
  @Get('vnpay/ipn')
  async vnpayIpn(@Query() query: Record<string, string>) {
    return this.paymentService.handleVnpayIpn(query);
  }

  @Public()
  @Get('momo/return')
  async momoReturn(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    const result = await this.paymentService.handleMomoIpn(query);
    const frontend = this.config.get<string>('frontendUrl');
    const status = result.resultCode === 0 ? 'success' : 'failed';
    const url = new URL(`${frontend}/thanh-toan/ket-qua`);
    url.searchParams.set('status', status);
    if (query.orderId) url.searchParams.set('orderId', query.orderId);
    url.searchParams.set('method', 'MOMO');
    return res.redirect(url.toString());
  }

  @Public()
  @Post('momo/ipn')
  momoIpn(@Body() body: Record<string, string>) {
    return this.paymentService.handleMomoIpn(body);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get('stats')
  getStats() {
    return this.paymentService.getStats();
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get()
  findAll(@Query() query: PaymentQueryDto) {
    return this.paymentService.findAll(query);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post(':id/confirm-bank')
  confirmBank(@Param('id') id: string, @Body() body?: { note?: string }) {
    return this.paymentService.confirmBankTransfer(id, body?.note);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post(':id/refund')
  refund(@Param('id') id: string, @Body() body?: { note?: string }) {
    return this.paymentService.refundPayment(id, body?.note);
  }
}

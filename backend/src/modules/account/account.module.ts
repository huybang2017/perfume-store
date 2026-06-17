import { Module } from '@nestjs/common';
import { AccountController } from './controllers/account.controller';
import { AddressRepository } from './repositories/address.repository';
import { AccountService } from './services/account.service';

@Module({
  controllers: [AccountController],
  providers: [AccountService, AddressRepository],
})
export class AccountModule {}

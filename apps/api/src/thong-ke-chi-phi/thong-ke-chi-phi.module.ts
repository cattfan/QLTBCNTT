import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { ThongKeChiPhiController } from './thong-ke-chi-phi.controller';
import { ThongKeChiPhiService } from './thong-ke-chi-phi.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ThongKeChiPhiController],
  providers: [ThongKeChiPhiService],
  exports: [ThongKeChiPhiService],
})
export class ThongKeChiPhiModule {}

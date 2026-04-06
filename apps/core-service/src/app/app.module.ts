import { Module } from '@nestjs/common';
import { BackendModule } from '@yellowladder/backend';

@Module({
  imports: [BackendModule],
})
export class AppModule {}

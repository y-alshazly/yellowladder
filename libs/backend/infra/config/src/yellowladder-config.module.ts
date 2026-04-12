import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { YellowladderConfigService } from './yellowladder-config.service';
import { validateYellowladderEnv } from './yellowladder-config.validation';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateYellowladderEnv,
    }),
  ],
  providers: [YellowladderConfigService],
  exports: [YellowladderConfigService],
})
export class YellowladderConfigModule {}

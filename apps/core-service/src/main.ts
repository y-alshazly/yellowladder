import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { YellowladderConfigService } from '@yellowladder/backend-infra-config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app/app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(YellowladderConfigService);

  // REST versioning — all Feature 01 endpoints live under /api/v1/*.
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  // Cookie parser needed for the /auth/refresh HttpOnly cookie.
  app.use(cookieParser());

  // Hardening.
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: [...config.corsOrigins],
    credentials: true,
  });

  const port = config.port;
  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}/${globalPrefix}`);
}

void bootstrap();

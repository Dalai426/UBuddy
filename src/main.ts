import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import config from './config/config';
import { WinstonLogger } from './loaders/winston.logger';
import { ResponseInterceptor } from './utils/response.interceptor';


const { env, port } = config;

async function bootstrap() {
  const logger = new WinstonLogger();
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('U joi service')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  app.useGlobalInterceptors(new ResponseInterceptor());
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(port, async () => {
    logger.info(`Listening on port ${port} in ${env} mode...`);
  });
}
bootstrap();

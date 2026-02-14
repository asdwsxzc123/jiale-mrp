import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 设置全局路由前缀
  app.setGlobalPrefix('api');

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // 自动剥离未在 DTO 中定义的属性
      transform: true,       // 自动类型转换
      forbidNonWhitelisted: false,
    }),
  );

  // 启用 CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 配置 Swagger 文档
  const config = new DocumentBuilder()
    .setTitle('Jiale ERP API')
    .setDescription('嘉乐 ERP 系统 API 文档 - MRP 物料需求计划')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 启动服务
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();

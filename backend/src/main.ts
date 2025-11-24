import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security
  app.use(helmet());
  
  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Treasure-Home School Management API')
      .setDescription('Complete self-hosted school management system API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('students', 'Student management')
      .addTag('teachers', 'Teacher management')
      .addTag('parents', 'Parent management')
      .addTag('classes', 'Class management')
      .addTag('subjects', 'Subject management')
      .addTag('attendance', 'Attendance tracking')
      .addTag('results', 'Results and grades')
      .addTag('exams', 'Exam management')
      .addTag('payments', 'Payment processing')
      .addTag('files', 'File storage')
      .addTag('notifications', 'Notifications')
      .addTag('audit', 'Audit logs')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    
    console.log('📚 API Documentation available at: http://localhost:' + (process.env.PORT || 3000) + '/api/docs');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log('🚀 Treasure-Home School Management System');
  console.log(`✅ Server running on: http://localhost:${port}`);
  console.log(`✅ API endpoints: http://localhost:${port}/api`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();

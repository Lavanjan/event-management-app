import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { createWinstonLogger } from './common/config/winston.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Create Winston logger
    const winstonLogger = createWinstonLogger();

    // Create NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: WinstonModule.createLogger({
        instance: winstonLogger,
      }),
    });

    // Get configuration service
    const configService = app.get(ConfigService);
    const port = configService.get('PORT', 3000);
    const nodeEnv = configService.get('NODE_ENV', 'development');

    // Security middleware
    app.use(
      helmet({
        contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      })
    );

    // Compression middleware
    app.use(compression());

    // Cookie parser middleware
    app.use(cookieParser(configService.get('COOKIE_SECRET', 'your-cookie-secret')));

    // CORS configuration
    if (configService.get('ENABLE_CORS', true)) {
      const allowedOrigins = [
        configService.get('FRONTEND_URL', 'http://localhost:4200'),
        configService.get('FRONTEND_URL_ALT', 'http://147.93.179.153:4201'),
        configService.get('BACKEND_URL', 'http://localhost:3000'),
      ].filter(Boolean); // Remove any undefined values

      app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'Accept',
          'Origin',
          'X-Requested-With',
          'Access-Control-Allow-Origin',
          'Access-Control-Allow-Headers',
          'Access-Control-Allow-Methods',
        ],
        exposedHeaders: ['Set-Cookie'],
        optionsSuccessStatus: 200,
      });
    }

    // Global prefix
    app.setGlobalPrefix('api');

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );

    // Global filters
    app.useGlobalFilters(new HttpExceptionFilter());

    // Global interceptors
    app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

    // Swagger documentation
    if (configService.get('ENABLE_SWAGGER', true)) {
      const config = new DocumentBuilder()
        .setTitle('Event Booking System API')
        .setDescription('Production-ready API for inventory and event booking management')
        .setVersion('1.0')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Enter JWT token',
            in: 'header',
          },
          'JWT-auth'
        )
        .addTag('Authentication', 'User authentication and authorization')
        .addTag('Users', 'User management operations')
        .addTag('Roles', 'Role and permission management')
        .addTag('Inventory', 'Inventory item management')
        .addTag('Events', 'Event management')
        .addTag('Bookings', 'Booking management and operations')
        .addTag('Financial', 'Financial tracking and reporting')
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      });
    }

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.log('SIGTERM received, shutting down gracefully');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('SIGINT received, shutting down gracefully');
      await app.close();
      process.exit(0);
    });

    // Start the application
    await app.listen(port);

    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
    logger.log(`🌍 Environment: ${nodeEnv}`);
  } catch (error) {
    logger.error('❌ Error starting application:', error);
    process.exit(1);
  }
}

bootstrap();

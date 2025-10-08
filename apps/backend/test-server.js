const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
require('dotenv').config();

async function bootstrap() {
  try {
    console.log('Starting NestJS application...');
    const app = await NestFactory.create(AppModule);

    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:4200',
      process.env.FRONTEND_URL_ALT || 'http://localhost:4201',
    ];

    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
    });

    const port = process.env.PORT || 3002;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}

bootstrap();

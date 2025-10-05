const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function bootstrap() {
  try {
    console.log('Starting NestJS application...');
    const app = await NestFactory.create(AppModule);
    
    app.enableCors({
      origin: ['http://localhost:4200', 'http://localhost:4201'],
      credentials: true,
    });
    
    await app.listen(3002);
    console.log('Application is running on: http://localhost:3002');
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}

bootstrap();

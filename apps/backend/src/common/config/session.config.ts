import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import * as session from 'express-session';
import * as connectRedis from 'connect-redis';

export const createSessionConfig = async (configService: ConfigService) => {
  // Create Redis client
  const redisPassword = configService.get('REDIS_PASSWORD');
  const clientConfig: any = {
    url: configService.get('REDIS_URL', 'redis://localhost:6379'),
  };

  // Only add password if it exists and is not empty
  if (redisPassword && redisPassword.trim() !== '') {
    clientConfig.password = redisPassword;
  }

  const redisClient = createClient(clientConfig);

  redisClient.on('error', err => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  await redisClient.connect();

  // Create Redis store
  const RedisStore = connectRedis.default;
  const store = new RedisStore({
    client: redisClient,
    prefix: 'event-booking:sess:',
    ttl: 86400, // 24 hours
  });

  return {
    store,
    secret: configService.get('SESSION_SECRET', 'your-super-secret-session-key'),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: configService.get('NODE_ENV') === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: configService.get('NODE_ENV') === 'production' ? 'strict' : 'lax',
    },
    name: 'event-booking-session',
  };
};

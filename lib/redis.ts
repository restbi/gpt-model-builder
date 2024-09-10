import { createClient } from 'redis';

let redis: any;

if (!redis) {
  redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:49155',
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD || 'redispw',
  });

  redis.on('error', (err: any) => console.log('Redis Client Error', err));

  redis.connect();
}

export default redis;

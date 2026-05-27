const IORedis = require('ioredis');
const config = require('../config');

const redisUrl = new URL(config.redisUrl);
const isTlsRedis =
  redisUrl.protocol === 'rediss:' || redisUrl.hostname.endsWith('upstash.io');

const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(isTlsRedis ? { tls: {} } : {}),
  retryStrategy(times) {
    return Math.min(times * 300, 5000);
  }
});

connection.on('connect', () => {
  console.log('Redis: connected');
});

connection.on('ready', () => {
  console.log('Redis: ready');
});

connection.on('reconnecting', () => {
  console.warn('Redis: reconnecting');
});

connection.on('error', (error) => {
  console.error('Redis: connection error', {
    message: error.message,
    code: error.code
  });
});

module.exports = connection;

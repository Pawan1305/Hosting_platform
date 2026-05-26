const IORedis = require('ioredis');
const config = require('../config');

const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null
});

module.exports = connection;

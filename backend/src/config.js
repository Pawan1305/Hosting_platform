const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/control-panel',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  ec2InstanceId: process.env.EC2_INSTANCE_ID || '',
  lambdaFunctionName: process.env.LAMBDA_FUNCTION_NAME || ''
};

module.exports = config;

const { Queue } = require('bullmq');
const connection = require('./connection');

const DEPLOYMENT_QUEUE_NAME = 'deployment-jobs';

const deploymentQueue = new Queue(DEPLOYMENT_QUEUE_NAME, {
  connection
});

async function enqueueDeploymentJob(payload) {
  return deploymentQueue.add('deploy-client', payload, {
    removeOnComplete: 100,
    removeOnFail: 1000,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  });
}

module.exports = {
  DEPLOYMENT_QUEUE_NAME,
  deploymentQueue,
  enqueueDeploymentJob
};

const mongoose = require('mongoose');
const { Worker } = require('bullmq');
const config = require('./config');
const connection = require('./queue/connection');
const { DEPLOYMENT_QUEUE_NAME } = require('./queue/deploymentQueue');
const Deployment = require('./models/Deployment');
const {
  deployContainerOnEc2,
  triggerPostDeploymentLambda
} = require('./services/deploymentExecutor');

async function processDeploymentJob(job) {
  const { deploymentId, clientName, domain, image } = job.data;

  const deployment = await Deployment.findById(deploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  try {
    const ec2Result = await deployContainerOnEc2({
      deploymentId,
      clientName,
      domain,
      image
    });

    const lambdaResult = await triggerPostDeploymentLambda({
      deploymentId,
      clientName,
      domain,
      image
    });

    deployment.status = 'Completed';
    deployment.errorMessage = null;
    deployment.metadata = {
      ...deployment.metadata,
      ec2: ec2Result,
      lambda: lambdaResult
    };

    await deployment.save();
  } catch (error) {
    deployment.status = 'Failed';
    deployment.errorMessage = error.message;
    deployment.metadata = {
      ...deployment.metadata,
      lastFailureAt: new Date().toISOString()
    };
    await deployment.save();
    throw error;
  }
}

async function startWorker() {
  await mongoose.connect(config.mongoUri);

  const worker = new Worker(DEPLOYMENT_QUEUE_NAME, processDeploymentJob, {
    connection,
    concurrency: 2
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`Job ${job?.id} failed`, error);
  });

  console.log('Deployment worker started');
}

startWorker().catch((error) => {
  console.error('Worker startup failed', error);
  process.exit(1);
});

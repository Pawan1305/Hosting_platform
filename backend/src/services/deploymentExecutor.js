// const { SSMClient, SendCommandCommand } = require('@aws-sdk/client-ssm');
// const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const config = require('../config');

// const ssmClient = new SSMClient({ region: config.awsRegion });
// const lambdaClient = new LambdaClient({ region: config.awsRegion });

function sanitizeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 40);
}

async function deployContainerOnEc2({ deploymentId, clientName, domain, image }) {
  const safeContainerName = `${sanitizeName(clientName)}-${deploymentId.slice(-6)}`;
  const commandList = [
    `docker pull ${image}`,
    `docker rm -f ${safeContainerName} || true`,
    `docker run -d --restart unless-stopped --name ${safeContainerName} -e VIRTUAL_HOST=${domain} ${image}`
  ];

  // Live AWS call intentionally disabled for local verification.
  // Uncomment this block to re-enable SSM deployment requests.
  // if (!config.ec2InstanceId) {
  //   throw new Error('EC2_INSTANCE_ID is not configured');
  // }
  // const command = new SendCommandCommand({
  //   InstanceIds: [config.ec2InstanceId],
  //   DocumentName: 'AWS-RunShellScript',
  //   Parameters: {
  //     commands: commandList
  //   },
  //   TimeoutSeconds: 900
  // });
  // const response = await ssmClient.send(command);

  return {
    mode: 'mock',
    message: 'Mock EC2 deployment step executed successfully',
    ssmCommandId: 'mock-ssm-command-id',
    containerName: safeContainerName,
    commands: commandList
  };
}

async function triggerPostDeploymentLambda({ deploymentId, clientName, domain, image }) {
  const payload = {
    deploymentId,
    clientName,
    domain,
    image,
    triggeredAt: new Date().toISOString()
  };

  // Live AWS call intentionally disabled for local verification.
  // Uncomment this block to re-enable Lambda invocation.
  // if (!config.lambdaFunctionName) {
  //   throw new Error('LAMBDA_FUNCTION_NAME is not configured');
  // }
  // const command = new InvokeCommand({
  //   FunctionName: config.lambdaFunctionName,
  //   InvocationType: 'RequestResponse',
  //   Payload: Buffer.from(JSON.stringify(payload))
  // });
  // const response = await lambdaClient.send(command);
  // const responsePayload = response.Payload
  //   ? JSON.parse(Buffer.from(response.Payload).toString('utf-8') || '{}')
  //   : null;

  return {
    mode: 'mock',
    message: 'Mock Lambda invocation executed successfully',
    statusCode: 200,
    functionError: null,
    responsePayload: {
      ok: true,
      payload
    }
  };
}

module.exports = {
  deployContainerOnEc2,
  triggerPostDeploymentLambda
};

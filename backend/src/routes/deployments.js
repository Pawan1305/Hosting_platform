const express = require('express');
const Deployment = require('../models/Deployment');
const { enqueueDeploymentJob } = require('../queue/deploymentQueue');

const router = express.Router();

function validatePayload(body) {
  const errors = [];

  if (!body.clientName || typeof body.clientName !== 'string') {
    errors.push('clientName is required');
  }

  if (!body.domain || typeof body.domain !== 'string') {
    errors.push('domain is required');
  }

  if (!body.image || typeof body.image !== 'string') {
    errors.push('image is required');
  }

  return errors;
}

router.post('/deploy', async (req, res) => {
  try {
    const errors = validatePayload(req.body);
    if (errors.length) {
      return res.status(400).json({ message: 'Invalid payload', errors });
    }

    const deployment = await Deployment.create({
      clientName: req.body.clientName,
      domain: req.body.domain,
      image: req.body.image,
      status: 'Pending'
    });

    const job = await enqueueDeploymentJob({
      deploymentId: deployment.id,
      clientName: deployment.clientName,
      domain: deployment.domain,
      image: deployment.image
    });

    deployment.queueJobId = String(job.id);
    await deployment.save();

    return res.status(200).json({
      id: deployment.id,
      status: deployment.status
    });
  } catch (error) {
    console.error('Failed to create deployment', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/status/:id', async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id).lean();

    if (!deployment) {
      return res.status(404).json({ message: 'Deployment not found' });
    }

    return res.status(200).json({
      id: deployment._id,
      clientName: deployment.clientName,
      domain: deployment.domain,
      image: deployment.image,
      status: deployment.status,
      errorMessage: deployment.errorMessage,
      metadata: deployment.metadata,
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt
    });
  } catch (error) {
    console.error('Failed to fetch deployment status', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

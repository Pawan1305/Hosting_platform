const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config');
const deploymentRoutes = require('./routes/deployments');

async function startServer() {
  await mongoose.connect(config.mongoUri);

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use('/api', deploymentRoutes);

  app.listen(config.port, () => {
    console.log(`API listening on port ${config.port}`);
  });
}

startServer().catch((error) => {
  console.error('Server startup failed', error);
  process.exit(1);
});

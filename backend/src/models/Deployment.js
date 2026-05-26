const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true
    },
    domain: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Pending'
    },
    errorMessage: {
      type: String,
      default: null
    },
    queueJobId: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Deployment', deploymentSchema);

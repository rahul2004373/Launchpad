import express from 'express';
import * as deploymentController from '../controllers/deployment.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All deployment routes are protected
router.use(authenticate);

// List all deployments for the authenticated user
router.get('/', deploymentController.listMyDeployments);

// Get a specific deployment's status
router.get('/:id', deploymentController.getDeploymentStatus);

// Get a specific deployment's build logs
router.get('/:id/logs', deploymentController.getDeploymentLogs);

// Delete a specific deployment
router.delete('/:id', deploymentController.deleteDeployment);

// Re-trigger a failed deployment
router.post('/:id/redeploy', deploymentController.redeployDeployment);

export default router;

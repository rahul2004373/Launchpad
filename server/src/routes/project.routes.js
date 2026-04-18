import express from 'express';
import { createProject, listMyProjects, getProject, renameProject } from '../controllers/project.controller.js';
import { deployProject } from '../controllers/deployment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createProjectSchema } from '../validators/project.validator.js';
import { createDeploymentSchema } from '../validators/deployment.validator.js';

const router = express.Router();

// All project routes require authentication
router.use(authenticate);

router.post('/', createProject);
router.get('/', listMyProjects);
router.get('/:id', getProject);
router.patch('/:id', renameProject);

// Nested resource: Project deployments
router.post('/:projectId/deployments', deployProject);

export default router;

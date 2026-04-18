import express from 'express';
import * as githubController from '../controllers/github.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All GitHub integration endpoints require a logged-in user
router.use(authenticate);

// Link GitHub (Save provider token)
router.post('/connect', githubController.connectGithub);

// Fetch repositories using stored token
router.get('/repos', githubController.listGithubRepos);

// Unlink GitHub
router.delete('/disconnect', githubController.disconnectGithub);

export default router;

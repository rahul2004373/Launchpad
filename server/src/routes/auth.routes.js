import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ── Public Routes (no auth required) ──
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/oauth/github', authController.githubOAuth);
router.post('/oauth/google', authController.googleOAuth);
router.get('/callback', authController.oauthCallback);

// ── Protected Routes (auth required) ──
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, authController.updateProfile);
router.post('/logout', authenticate, authController.logout);

export default router;

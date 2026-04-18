import { supabase } from '../config/supabase.js';
import { syncUser, getProfile, updateProfile as updateProfileService } from '../services/auth.service.js';
import { sendResponse } from '../utils/responseHandler.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';

/**
 * POST /api/auth/signup
 * Register with email and password
 */
export const signup = asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: name || '' },
        },
    });

    if (error) {
        throw new AppError(error.message, 400);
    }

    // Sync user to our local DB
    if (data.user) {
        await syncUser(data.user);
    }

    sendResponse(res, 201, 'Account created successfully. Check your email for verification.', {
        user: {
            id: data.user?.id,
            email: data.user?.email,
        },
        session: data.session, // Contains access_token and refresh_token
    });
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new AppError(error.message, 401);
    }

    // Sync user to our local DB
    if (data.user) {
        await syncUser(data.user);
    }

    sendResponse(res, 200, 'Login successful', {
        user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || null,
        },
        session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
        },
    });
});

/**
 * POST /api/auth/oauth/github
 * Returns the GitHub OAuth URL for the client to redirect to
 */
export const githubOAuth = asyncHandler(async (req, res) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
            scopes: 'public_repo read:user user:email',
            redirectTo: req.body.redirectTo || `http://localhost:${process.env.PORT || 8080}/api/auth/callback`,
        },
    });

    if (error) {
        throw new AppError(error.message, 400);
    }

    sendResponse(res, 200, 'Redirect to this URL to authenticate with GitHub', {
        url: data.url,
    });
});

/**
 * POST /api/auth/oauth/google
 * Returns the Google OAuth URL for the client to redirect to
 */
export const googleOAuth = asyncHandler(async (req, res) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: req.body.redirectTo || `http://localhost:${process.env.PORT || 8080}/api/auth/callback`,
        },
    });

    if (error) {
        throw new AppError(error.message, 400);
    }

    sendResponse(res, 200, 'Redirect to this URL to authenticate with Google', {
        url: data.url,
    });
});

/**
 * GET /api/auth/callback
 * Handles the OAuth callback — exchanges code for session
 */
export const oauthCallback = asyncHandler(async (req, res) => {
    const { code } = req.query;

    if (!code) {
        throw new AppError('No authorization code received', 400);
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        throw new AppError(error.message, 400);
    }

    // Sync the OAuth user to our local DB
    if (data.user) {
        await syncUser(data.user);
    }

    // In production, redirect to frontend with token. For now, return JSON.
    sendResponse(res, 200, 'OAuth authentication successful', {
        user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
            avatarUrl: data.user.user_metadata?.avatar_url || null,
            provider: data.user.app_metadata?.provider,
        },
        session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
        },
    });
});

/**
 * GET /api/auth/me
 * Returns the current user's profile (requires auth)
 */
export const getMe = asyncHandler(async (req, res) => {
    const profile = await getProfile(req.user.id);

    if (!profile) {
        throw new AppError('User profile not found', 404);
    }

    sendResponse(res, 200, 'Profile fetched successfully', profile);
});

/**
 * PATCH /api/auth/me
 * Updates the current user's profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const { name, avatarUrl } = req.body;
    const profile = await updateProfileService(req.user.id, { name, avatarUrl });
    sendResponse(res, 200, 'Profile updated successfully', profile);
});

/**
 * POST /api/auth/logout
 * Signs out the user (invalidates their session in Supabase)
 */
export const logout = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
        await supabase.auth.admin.signOut(token).catch(() => {});
    }

    sendResponse(res, 200, 'Logged out successfully');
});

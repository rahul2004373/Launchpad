import { supabase } from '../config/supabase.js';
import AppError from '../utils/AppError.js';

/**
 * Authentication Middleware
 * 
 * Extracts JWT from Authorization header, verifies with Supabase,
 * and attaches the user to req.user.
 * 
 * Usage: router.post('/protected', authenticate, handler)
 */
export const authenticate = async (req, res, next) => {
    // Skip authentication for CORS preflight requests
    if (req.method === 'OPTIONS') {
        return next();
    }
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Missing or invalid Authorization header. Use: Bearer <token>', 401);
        }

        const token = authHeader.split(' ')[1];

        // Verify token with Supabase Auth server
        // getUser() validates the token AND checks if the session is still active
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            throw new AppError('Invalid or expired token. Please log in again.', 401);
        }

        // Attach user to request for downstream use
        req.user = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatarUrl: user.user_metadata?.avatar_url || null,
            provider: user.app_metadata?.provider || 'email',
        };

        next();
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        next(new AppError('Authentication failed', 401));
    }
};

/**
 * Optional Authentication Middleware
 * 
 * Same as authenticate, but doesn't reject unauthenticated requests.
 * Sets req.user to null if no valid token is present.
 * 
 * Usage: router.get('/public', optionalAuth, handler)
 */
export const optionalAuth = async (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    }
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            req.user = null;
            return next();
        }

        req.user = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatarUrl: user.user_metadata?.avatar_url || null,
            provider: user.app_metadata?.provider || 'email',
        };

        next();
    } catch {
        req.user = null;
        next();
    }
};

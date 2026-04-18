import { prisma } from '../config/db.js';

/**
 * Syncs a Supabase Auth user into our local User table.
 * Called after successful login/signup.
 * 
 * Uses upsert — creates the user if new, updates if existing.
 * This ensures our DB always has the latest user metadata.
 * 
 * @param {Object} supabaseUser - User object from Supabase Auth
 * @returns {Object} The local User record
 */
export const syncUser = async (supabaseUser) => {
    const userData = {
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
        avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
        provider: supabaseUser.app_metadata?.provider || 'email',
    };

    return await prisma.user.upsert({
        where: { email: supabaseUser.email },
        update: {
            id: supabaseUser.id, // In case the Supabase UUID changed
            ...userData,
        },
        create: {
            id: supabaseUser.id,
            ...userData,
        },
    });
};

/**
 * Get user profile with deployment statistics
 * 
 * @param {string} userId - Supabase user ID
 * @returns {Object} User profile with deployment counts
 */
export const getProfile = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            _count: {
                select: { deployments: true },
            },
        },
    });

    if (!user) return null;

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        createdAt: user.createdAt,
        totalDeployments: user._count.deployments,
    };
};

/**
 * Update user profile
 * 
 * @param {string} userId
 * @param {Object} data
 */
export const updateProfile = async (userId, data) => {
    return await prisma.user.update({
        where: { id: userId },
        data: {
            name: data.name,
            avatarUrl: data.avatarUrl,
        },
        select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
        }
    });
};

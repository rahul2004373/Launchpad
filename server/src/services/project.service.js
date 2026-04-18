import { prisma } from "../config/db.js";
import AppError from "../utils/AppError.js";

/**
 * Creates a new project for a user.
 * 
 * @param {Object} user - User object from request context (Supabase user)
 * @param {string} name - Unique project name
 * @param {string} repoUrl - Valid GitHub repo URL
 */
export const createProject = async (user, name, repoUrl) => {
    const userId = user.id;

    // 1. Ensure User exists in local DB (Fail-safe sync)
    // Fixes "Project_userId_fkey" Prisma error for new/guest users
    await prisma.user.upsert({
        where: { id: userId },
        update: { email: user.email, name: user.name, avatarUrl: user.avatarUrl },
        create: { id: userId, email: user.email, name: user.name, avatarUrl: user.avatarUrl }
    });

    // 2. Check if a project with the same name exists for this user
    const existingProject = await prisma.project.findUnique({
        where: {
            userId_name: {
                userId,
                name
            }
        }
    });

    if (existingProject) {
        throw new AppError(`Project with name "${name}" already exists`, 409);
    }

    const project = await prisma.project.create({
        data: {
            name,
            repoUrl,
            userId,
        }
    });

    return project;
};

/**
 * Fetch all projects for a specific user
 * 
 * @param {string} userId - User's Supabase ID
 */
export const fetchUserProjects = async (userId, search = '') => {
    const whereClause = { userId };
    
    if (search) {
        whereClause.name = {
            contains: search,
            mode: 'insensitive'
        };
    }

    return prisma.project.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
            deployments: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });
};

/**
 * Fetch a single project status (with ownership check)
 * 
 * @param {string} id - Project ID
 * @param {string} userId - Requesting user's ID
 */
export const fetchProjectStatus = async (id, userId) => {
    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            deployments: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!project) {
        throw new AppError("Project not found", 404);
    }

    if (project.userId !== userId) {
        throw new AppError("You don't have access to this project", 403);
    }

    return project;
};

/**
 * Renames an existing project
 * 
 * @param {string} id - Project ID
 * @param {string} userId - Requesting user's ID
 * @param {string} newName - New project name
 */
export const renameProject = async (id, userId, newName) => {
    // Rely on fetchProjectStatus to throw a 403 or 404 if invalid
    await fetchProjectStatus(id, userId);
    
    try {
        return await prisma.project.update({
            where: { id },
            data: { name: newName }
        });
    } catch (error) {
        if (error.code === 'P2002') {
            throw new AppError(`You already have a project named "${newName}"`, 409);
        }
        throw new AppError('Failed to rename project', 500);
    }
};

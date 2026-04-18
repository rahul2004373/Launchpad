import * as projectService from '../services/project.service.js';
import { sendResponse } from '../utils/responseHandler.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * POST /api/projects
 * Create a new Project (user-scoped)
 */
export const createProject = asyncHandler(async (req, res) => {
    const { name, repoUrl } = req.body;
    
    const project = await projectService.createProject(req.user, name, repoUrl);

    sendResponse(res, 201, "Project created successfully", project);
});

/**
 * GET /api/projects
 * List all projects for the authenticated user
 */
export const listMyProjects = asyncHandler(async (req, res) => {
    const { search } = req.query;
    const projects = await projectService.fetchUserProjects(req.user.id, search);
    
    sendResponse(res, 200, "Projects fetched successfully", projects);
});

/**
 * GET /api/projects/:id
 * Get a specific project and its deployments (ownership check)
 */
export const getProject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const project = await projectService.fetchProjectStatus(id, req.user.id);

    sendResponse(res, 200, "Project fetched successfully", project);
});

/**
 * PATCH /api/projects/:id
 * Rename a specific project
 */
export const renameProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        throw new AppError("New project name is required", 400);
    }

    const project = await projectService.renameProject(id, req.user.id, name);

    sendResponse(res, 200, "Project renamed successfully", project);
});

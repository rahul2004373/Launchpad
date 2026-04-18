import * as deploymentService from '../services/deployment.service.js';
import { getDeploymentLogs as fetchLogs } from '../services/log.service.js';
import { sendResponse } from '../utils/responseHandler.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AppError from '../utils/AppError.js';

/**
 * POST /api/deployments
 * Create a new deployment (user-scoped)
 */
export const deployProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { env, rootDirectory, buildCommand, installCommand, outputDir } = req.body;

    const result = await deploymentService.initiateDeployment({ 
        projectId,
        env, 
        rootDirectory, 
        buildCommand, 
        installCommand,
        outputDir,
        userId: req.user.id,
    });

    sendResponse(res, 201, "Deployment initiated successfully", result);
});

/**
 * GET /api/deployments
 * List all deployments for the authenticated user
 */
export const listMyDeployments = asyncHandler(async (req, res) => {
    const deployments = await deploymentService.fetchUserDeployments(req.user.id);

    sendResponse(res, 200, "Deployments fetched successfully", deployments);
});

/**
 * GET /api/deployments/:id
 * Get a specific deployment's status (ownership check)
 */
export const getDeploymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deployment = await deploymentService.fetchDeploymentStatus(id, req.user.id);

    sendResponse(res, 200, "Deployment status fetched successfully", deployment);
});

/**
 * GET /api/deployments/:id/logs
 * Get structured, ordered build logs for a deployment
 * 
 * Response shape:
 * {
 *   deployment: { id, status, framework, durationSeconds },
 *   summary: { total, info, warn, error },
 *   logs: [{ step, content, level, timestamp, elapsedMs }]
 * }
 */
export const getDeploymentLogs = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verify ownership
    await deploymentService.fetchDeploymentStatus(id, req.user.id);

    const result = await fetchLogs(id);

    if (!result) {
        throw new AppError("Deployment not found", 404);
    }

    sendResponse(res, 200, "Build logs fetched successfully", result);
});

/**
 * DELETE /api/deployments/:id
 * Delete a specific deployment and its logs
 */
export const deleteDeployment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await deploymentService.deleteDeployment(id, req.user.id);

    sendResponse(res, 200, "Deployment deleted successfully");
});

/**
 * POST /api/deployments/:id/redeploy
 * Re-trigger a failed deployment
 */
export const redeployDeployment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await deploymentService.retriggerDeployment(id, req.user.id);

    sendResponse(res, 200, "Deployment re-queued successfully", result);
});

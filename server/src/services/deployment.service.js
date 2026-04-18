import { prisma } from "../config/db.js";
import AppError from "../utils/AppError.js";
import { addDeploymentJob } from "../queues/deployment.producer.js";

/**
 * Create a new deployment and push it to the build queue
 * 
 * @param {Object} payload - Deployment configuration
 * @param {string} payload.userId - Owner's Supabase user ID
 */
export const initiateDeployment = async (payload) => {
  const {
    projectId,
    env = {},
    rootDirectory = "",
    buildCommand = null,
    installCommand = null,
    outputDir = null,
    userId,
  } = payload;

  // 1. Verify project exists and belongs to user
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (project.userId !== userId) {
    throw new AppError("You don't have permission to deploy to this project", 403);
  }

  // 2. Enforce logic constraint constraint:
  // Cannot deploy if there is already a successful (READY) deployment
  const successfulDeployments = await prisma.deployment.count({
    where: {
      projectId: projectId,
      status: "READY"
    }
  });

  if (successfulDeployments > 0) {
    throw new AppError("This project already has a successful deployment. Additional deployments are restricted.", 400);
  }

  // 4. Fetch User's GitHub Token (if any)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { githubToken: true }
  });

  // 5. Create DB record with project and user association
  const deployment = await prisma.deployment.create({
    data: {
      env,
      rootDirectory,
      buildCommand,
      installCommand,
      outputDir,
      projectId,
      userId,
    },
  });

  // Push job to queue explicitly attaching project info since the worker expects it
  await addDeploymentJob({
    deploymentId: deployment.id,
    repoUrl: project.repoUrl,
    projectName: project.name,
    githubToken: user?.githubToken,
    env,
    rootDirectory,
    buildCommand,
    installCommand,
    outputDir,
  });

  return {
    deploymentId: deployment.id,
    status: deployment.status,
    createdAt: deployment.createdAt,
  };
};

/**
 * Fetch a single deployment's status (with ownership check)
 * 
 * @param {string} id - Deployment ID
 * @param {string} userId - Requesting user's ID (for ownership check)
 */
export const fetchDeploymentStatus = async (id, userId) => {
  if (!id) {
    throw new AppError("Deployment ID is required", 400);
  }

  const deployment = await prisma.deployment.findUnique({
    where: { id },
    include: {
      project: { select: { name: true, repoUrl: true } }
    }
  });

  if (!deployment) {
    throw new AppError("Deployment not found", 404);
  }

  // Ownership check — users can only see their own deployments
  if (deployment.userId && deployment.userId !== userId) {
    throw new AppError("You don't have access to this deployment", 403);
  }

  return {
    id: deployment.id,
    projectId: deployment.projectId,
    status: deployment.status,
    projectName: deployment.project?.name,
    repoUrl: deployment.project?.repoUrl,
    framework: deployment.framework,
    deploymentUrl: deployment.deploymentUrl,
    createdAt: deployment.createdAt,
    startedAt: deployment.startedAt,
    completedAt: deployment.completedAt,
    error: deployment.error,
  };
};

/**
 * Fetch all deployments for a specific user
 * 
 * @param {string} userId - User's Supabase ID
 * @returns {Array} List of deployments ordered by newest first
 */
export const fetchUserDeployments = async (userId) => {
  const deployments = await prisma.deployment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      framework: true,
      deploymentUrl: true,
      createdAt: true,
      completedAt: true,
      error: true,
      project: {
        select: {
          id: true,
          name: true,
          repoUrl: true
        }
      }
    },
  });

  // Map to a flatter structure for the frontend APIs
  return deployments.map(dep => ({
    ...dep,
    projectName: dep.project?.name,
    repoUrl: dep.project?.repoUrl,
  }));
};

/**
 * Delete a deployment and its associated logs
 * 
 * @param {string} id - Deployment ID
 * @param {string} userId - Requesting user's ID
 */
export const deleteDeployment = async (id, userId) => {
  // Use existing ownership check
  await fetchDeploymentStatus(id, userId);

  // Must delete associated logs first (foreign key constraint)
  await prisma.log.deleteMany({
    where: { deploymentId: id }
  });

  return prisma.deployment.delete({
    where: { id }
  });
};

/**
 * Reset a failed deployment and re-enqueue it for building
 * 
 * @param {string} id - Deployment ID
 * @param {string} userId - Requesting user's ID
 */
export const retriggerDeployment = async (id, userId) => {
  // 1. Verify existence and ownership
  const deployment = await prisma.deployment.findUnique({
    where: { id },
    include: {
      project: true,
      user: { select: { githubToken: true } }
    }
  });

  if (!deployment) {
    throw new AppError("Deployment not found", 404);
  }

  if (deployment.userId !== userId) {
    throw new AppError("You don't have permission to re-deploy this", 403);
  }

  // 2. Clear previous logs
  await prisma.log.deleteMany({
    where: { deploymentId: id }
  });

  // 3. Reset deployment state
  const updatedDeployment = await prisma.deployment.update({
    where: { id },
    data: {
      status: "QUEUED",
      error: null,
      startedAt: null,
      completedAt: null,
    }
  });

  // 4. Push back to build queue
  await addDeploymentJob({
    deploymentId: updatedDeployment.id,
    repoUrl: deployment.project.repoUrl,
    projectName: deployment.project.name,
    githubToken: deployment.user?.githubToken,
    env: updatedDeployment.env,
    rootDirectory: updatedDeployment.rootDirectory,
    buildCommand: updatedDeployment.buildCommand,
    installCommand: updatedDeployment.installCommand,
    outputDir: updatedDeployment.outputDir,
  });

  return updatedDeployment;
};

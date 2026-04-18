import { prisma } from "../config/db.js";

export const createDeployment = async (data) => {
  return await prisma.deployment.create({
    data,
  });
};

export const getDeploymentById = async (id) => {
  return await prisma.deployment.findUnique({
    where: { id },
  });
};
export const updateDeployment = async (id, data) => {
  return await prisma.deployment.update({
    where: { id },
    data,
  });
};

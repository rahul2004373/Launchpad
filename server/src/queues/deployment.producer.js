import deploymentQueue from "./deployment.queue.js";

export const addDeploymentJob = async (data) => {
  await deploymentQueue.add(
    "build-deployment",
    data,
    {
      priority: 1,
      attempts: 1,       // No retries — if it fails, it fails
      removeOnComplete: true,
      removeOnFail: false,  // Keep failed jobs for debugging
    },
  );
};

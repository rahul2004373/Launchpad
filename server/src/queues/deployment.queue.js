import { Queue } from "bullmq";
import connection from "../config/redis.js";

const deploymentQueue = new Queue("deployment-queue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export default deploymentQueue;

import IORedis from "ioredis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// comment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const redisUrl =
  process.env.REDIS_URL ||
  "rediss://default:gQAAAAAAAXYaAAIncDJjNTVhM2NiYzNhM2M0NTY0OWI2MjY0NWU5NGFkY2Q4NXAyOTU3NzA0OWI1NGFkY2Q4NXAyOTU3NzA@immune-llama-95770.upstash.io:6379";
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(redisUrl.startsWith("rediss:") ? { tls: {} } : {}),
});

connection.on("connect", () => {
  console.log("Redis connected");
});

connection.on("ready", () => {
  console.log("Redis ready to use");
});

connection.on("error", (err) => {
  console.error("Redis error:", err.message);
});

connection.on("close", () => {
  console.log("Redis connection closed");
});

connection.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

export default connection;

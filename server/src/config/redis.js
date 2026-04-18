import IORedis from "ioredis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// comment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {},
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

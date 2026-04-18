import { PrismaClient } from "@prisma/client";

// Standard Direct Connection (Prisma 6)
// This is the simplest and most robust setup for Windows/ESM environments.
export const prisma = new PrismaClient();

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failure:", error.message);
    process.exit(1);
  }
};

import { z } from 'zod';

export const createDeploymentSchema = z.object({
    params: z.object({
        projectId: z.string().uuid("Invalid Project ID format"),
    }),
    body: z.object({
        rootDirectory: z.string().optional().default(""),
        buildCommand: z.string().nullable().optional(),
        outputDir: z.string().nullable().optional(),
        env: z.record(z.string(), z.string()).optional().default({}),
    }),
});

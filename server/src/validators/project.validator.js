import { z } from 'zod';

export const createProjectSchema = z.object({
    body: z.object({
        name: z.string()
            .min(1, "Project name is required"),
        repoUrl: z.string()
            .url("Repository URL must be a valid URL")
    }),
});

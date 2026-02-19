import { ZodSchema } from 'zod';

export const validateBody = <T>(schema: ZodSchema<T>, body: unknown): T => {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(', ');
    throw new Error(message || 'Invalid request');
  }
  return result.data;
};
import { z } from 'zod';

export const emailSchema = z.string().trim().email();
export const uuidSchema = z.string().uuid();
export const amountSchema = z.coerce.number().finite().positive();
export const nonNegativeAmountSchema = z.coerce.number().finite().min(0);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const txTypeSchema = z.enum(['income', 'expense']);
export const txStatusSchema = z.enum(['pending', 'completed', 'canceled']);
export const recurringFreqSchema = z.enum(['daily', 'weekly', 'monthly', 'yearly']);

export function parseOrThrow(schema, value) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.') || 'field'}: ${i.message}`);
    const err = new Error('validation_error');
    // @ts-ignore
    err.statusCode = 400;
    // @ts-ignore
    err.payload = { error: 'validation', message: 'Payload inválido', details: issues };
    throw err;
  }
  return parsed.data;
}


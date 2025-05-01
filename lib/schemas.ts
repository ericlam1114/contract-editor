import { z } from 'zod';

/**
 * Zod schema for the expected structure of patch edits.
 */
export const PatchSchema = z.object({
  edits: z.array(
    z.object({
      id: z.number().int().positive('Clause ID must be a positive integer'),
      new: z.string().min(1, 'New clause text cannot be empty'),
      old: z.string().optional(), // Optional: Include old text for context/validation
    })
  ).min(1, 'At least one edit must be provided'), // Ensure edits array is not empty
});

/**
 * Type helper for the inferred Patch type.
 */
export type Patch = z.infer<typeof PatchSchema>;

/**
 * JSON schema representation derived from Zod, for use with OpenAI function calling.
 */
export const patchJSONSchema = {
  name: 'patchClauses',
  description: 'Applies the requested changes to the provided clauses.',
  parameters: {
    type: 'object',
    properties: {
      edits: {
        type: 'array',
        description: 'An array of edits to apply to specific clauses.',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'The unique identifier of the clause to modify.'
            },
            new: {
              type: 'string',
              description: 'The complete new text for the clause.'
            },
            old: {
              type: 'string',
              description: '(Optional) The original text of the clause being modified, for verification.'
            }
          },
          required: ['id', 'new'] // 'old' is optional
        }
      }
    },
    required: ['edits']
  }
}; 
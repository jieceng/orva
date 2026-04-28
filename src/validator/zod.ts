import { z, ZodError, type ZodType, type input as ZodInput, type output as ZodOutput } from 'zod';

import type { Context } from '../nano.js';
import {
  type ValidatorHandler,
  type ValidatorOptions,
  validator,
} from './index.js';
import { zodOpenAPISchema } from '../openapi/zod.js';

export interface ZodValidatorOptions<
  T extends object,
  Target extends string,
  Schema extends ZodType
> extends Omit<ValidatorOptions<T, Target, ZodInput<Schema>>, 'onError'> {
  errorStatus?: number;
  onError?: (
    error: ZodError<ZodInput<Schema>>,
    context: Context<T>
  ) => Response | Promise<Response>;
}

const zodValidationIssueSchema = z.object({
  code: z.string(),
  message: z.string(),
  path: z.array(z.union([z.string(), z.number()])),
}).passthrough();

const zodValidationErrorSchema = z.object({
  error: z.string(),
  issues: z.array(zodValidationIssueSchema),
});

function getDefaultZodErrorStatus(target: string): number {
  return target === 'json' || target === 'form' || target === 'text'
    ? 422
    : 400;
}

export function zodValidator<
  T extends object = Record<string, unknown>,
  Target extends string = string,
  Schema extends ZodType = ZodType
>(
  target: Target,
  schema: Schema,
  options: ZodValidatorOptions<T, Target, Schema> = {}
): ValidatorHandler<T, Target, ZodInput<Schema>, ZodOutput<Schema>> {
  const defaultErrorStatus = getDefaultZodErrorStatus(target);

  return validator<T, Target, ZodInput<Schema>, ZodOutput<Schema>>(
    target,
    async (value) => {
      const result = await schema.safeParseAsync(value);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    {
      schema: zodOpenAPISchema(schema),
      errorStatus: options.errorStatus ?? defaultErrorStatus,
      errorResponse: options.onError
        ? undefined
        : {
            componentName: 'ZodValidationErrorResponse',
            description: 'Validation Error',
            schema: zodOpenAPISchema(zodValidationErrorSchema, {
              componentName: 'ZodValidationError',
            }),
          },
      value: options.value,
      onError: async (error, context) => {
        if (error instanceof ZodError) {
          if (options.onError) {
            return options.onError(error as ZodError<ZodInput<Schema>>, context);
          }
          return context.json({
            error: 'Validation Error',
            issues: error.issues,
          }, options.errorStatus ?? defaultErrorStatus);
        }

        throw error;
      },
    }
  );
}

export const zValidator = zodValidator;

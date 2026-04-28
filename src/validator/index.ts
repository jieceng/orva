import type {
  Context,
  TypedMiddlewareHandler,
} from '../orva.js';
import { parseCookieHeader } from '../cookies.js';
import {
  VALIDATOR_METADATA,
  type OpenAPIResponseMetadata,
  type SchemaContract,
  type ValidatorContractMetadata,
} from '../metadata.js';

export interface ValidatorValueMap {
  json: unknown;
  form: FormData;
  query: Record<string, string>;
  param: Record<string, string>;
  header: Record<string, string>;
  cookie: Record<string, string>;
  text: string;
}

export type ValidatorInput<Target extends string> =
  Target extends keyof ValidatorValueMap ? ValidatorValueMap[Target] : unknown;

type IsAny<T> = 0 extends (1 & T) ? true : false;
type IsExactlyUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? ([T] extends [unknown] ? true : false) : false;
type ValidatorRPCPayload<Input, Output> =
  IsAny<Input> extends true ? Output :
  IsExactlyUnknown<Input> extends true ? Output :
  Input;

type ValidatorRPCInputMapping<Target extends string, Input, Output> =
  Target extends 'json' ? { body: ValidatorRPCPayload<Input, Output> } :
  Target extends 'form' ? { body: ValidatorRPCPayload<Input, Output> } :
  Target extends 'text' ? { body: ValidatorRPCPayload<Input, Output> } :
  Target extends 'query' ? { query?: Input } :
  Target extends 'param' ? { param?: Input } :
  Target extends 'header' ? { headers?: Input } :
  Target extends 'cookie' ? { cookie?: Input } :
  {};

export interface ValidatorOptions<
  T extends object,
  Target extends string,
  Input = ValidatorInput<Target>
> {
  value?: (context: Context<T>) => Input | Promise<Input>;
  onError?: (error: unknown, context: Context<T>) => Response | Promise<Response>;
}

export interface ValidatorHandler<
  T extends object = Record<string, unknown>,
  Target extends string = string,
  Input = ValidatorInput<Target>,
  Output = unknown
> extends TypedMiddlewareHandler<T, {}, {}, Record<Target, Output>, ValidatorRPCInputMapping<Target, Input, Output>> {
  readonly target: Target;
  readonly [VALIDATOR_METADATA]?: ValidatorContractMetadata<Target, Input, Output>;
}

export interface ValidatorMetadataOptions<
  Target extends string = string,
  Input = ValidatorInput<Target>,
  Output = Input
> {
  schema?: SchemaContract<Input, Output>;
  errorStatus?: number;
  errorResponse?: OpenAPIResponseMetadata;
}

function readValidationValue<T extends object, Target extends string>(
  context: Context<T>,
  target: Target
): Promise<ValidatorInput<Target>> | ValidatorInput<Target> {
  switch (target) {
    case 'json':
      return context.req.json() as Promise<ValidatorInput<Target>>;
    case 'form':
      return context.req.formData() as Promise<ValidatorInput<Target>>;
    case 'query':
      return context.query as ValidatorInput<Target>;
    case 'param':
      return context.params as ValidatorInput<Target>;
    case 'header':
      return Object.fromEntries(context.req.headers.entries()) as ValidatorInput<Target>;
    case 'cookie':
      return parseCookieHeader(context.req.headers.get('cookie')) as ValidatorInput<Target>;
    case 'text':
      return context.req.text() as Promise<ValidatorInput<Target>>;
    default:
      return undefined as ValidatorInput<Target>;
  }
}

export function validator<
  T extends object = Record<string, unknown>,
  Target extends string = string,
  Input = ValidatorInput<Target>,
  Output = Input
>(
  target: Target,
  parse: (value: Input, context: Context<T>) => Output | Promise<Output>,
  options: ValidatorOptions<T, Target, Input> & ValidatorMetadataOptions<Target, Input, Output> = {}
): ValidatorHandler<T, Target, Input, Output> {
  const handler: TypedMiddlewareHandler<T, {}, {}, Record<Target, Output>, ValidatorRPCInputMapping<Target, Input, Output>> = async (context, next) => {
    try {
      const raw = options.value
        ? await options.value(context)
        : await readValidationValue(context, target) as Input;
      const parsed = await parse(raw, context);
      context.setValid(target, parsed);
      await next();
    } catch (error) {
      if (options.onError) {
        return options.onError(error, context);
      }
      throw error;
    }
  };

  return Object.assign(handler, {
    target,
    [VALIDATOR_METADATA]: options.schema || options.errorResponse || options.errorStatus !== undefined
      ? {
          target,
          ...(options.schema ?? { provider: 'validator', schema: undefined }),
          errorStatus: options.errorStatus,
          errorResponse: options.errorResponse,
        }
      : undefined,
  }) as ValidatorHandler<T, Target, Input, Output>;
}

export function setValidatedData<T extends object>(
  context: Context<T>,
  target: string,
  value: unknown
): void {
  context.setValid(target, value);
}

export function getValidatedData<
  T extends object,
  V extends Record<string, unknown>,
  K extends keyof V
>(
  context: Context<T, V>,
  target: K
): V[K] {
  return context.valid(target);
}

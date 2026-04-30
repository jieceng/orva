import type {
  OpenAPIOperationMetadata,
  OpenAPIResponseMetadata,
  RouteContractRuntimeDefinition,
  RouteInputRuntimeDefinition,
  RouteRuntimeDefinition,
  ValidatorContractMetadata,
} from './metadata.js';
import { isParameterTarget, isRequestBodyTarget, type ParameterTarget } from './input-contract.js';

export function getRouteValidatorByTarget(
  validators: readonly ValidatorContractMetadata[],
  target: string
): ValidatorContractMetadata | undefined {
  return validators.find((validator) => validator.target === target);
}

export function getRouteParameterValidator(
  validators: readonly ValidatorContractMetadata[],
  section: ParameterTarget
): ValidatorContractMetadata | undefined {
  return validators.find((validator) => isParameterTarget(validator.target) && validator.target === section);
}

export function getRouteRequestBodyValidator(
  validators: readonly ValidatorContractMetadata[]
): ValidatorContractMetadata | undefined {
  return validators.find((validator) => isRequestBodyTarget(validator.target));
}

export function getRouteOperationResponses(
  operation: OpenAPIOperationMetadata | undefined
): Array<[number, OpenAPIResponseMetadata<any>]> {
  return Object.entries(operation?.responses ?? {}).map(([status, response]) => [
    Number(status),
    response,
  ]);
}

export function buildRouteInputRuntimeDefinition(
  validators: readonly ValidatorContractMetadata[]
): RouteInputRuntimeDefinition {
  const parameters: RouteInputRuntimeDefinition['parameters'] = {};
  let body: ValidatorContractMetadata | undefined;

  for (const validator of validators) {
    if (!body && isRequestBodyTarget(validator.target)) {
      body = validator;
      continue;
    }
    if (isParameterTarget(validator.target) && !parameters[validator.target]) {
      parameters[validator.target] = validator;
    }
  }

  return {
    parameters,
    ...(body ? { body } : {}),
  };
}

export function buildRouteRuntimeContract(
  validators: readonly ValidatorContractMetadata[],
  operation: OpenAPIOperationMetadata | undefined
): RouteContractRuntimeDefinition {
  return {
    input: buildRouteInputRuntimeDefinition(validators),
    responses: Object.fromEntries(getRouteOperationResponses(operation)),
  };
}

export function summarizeRouteValidators(
  definition: Pick<RouteRuntimeDefinition, 'validators'>
): Array<{
  target: string;
  provider: string;
  schema?: unknown;
}> {
  return definition.validators.map((validator) => ({
    target: validator.target,
    provider: validator.provider,
    schema: validator.schema,
  }));
}

export function summarizeRouteResponseSchemas(
  definition: Pick<RouteRuntimeDefinition, 'openapi'>
): Array<{
  status: number;
  provider?: string;
  schema?: unknown;
}> {
  return getRouteOperationResponses(definition.openapi).map(([status, response]) => ({
    status,
    provider: response.schema?.provider,
    schema: response.schema?.schema,
  }));
}

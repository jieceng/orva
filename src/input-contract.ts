export type ParameterTarget = 'query' | 'param' | 'header' | 'cookie';
export type RequestBodyTarget = 'json' | 'form' | 'text';
export type ValidatorKnownTarget = ParameterTarget | RequestBodyTarget;

type IsAny<T> = 0 extends (1 & T) ? true : false;
type IsExactlyUnknown<T> = IsAny<T> extends true ? false : unknown extends T ? ([T] extends [unknown] ? true : false) : false;

export type ValidatorRPCPayload<Input, Output> =
  IsAny<Input> extends true ? Output :
  IsExactlyUnknown<Input> extends true ? Output :
  Input;

export type ValidatorRPCInputMapping<Target extends string, Input, Output> =
  Target extends 'json' ? { body: ValidatorRPCPayload<Input, Output> } :
  Target extends 'form' ? { body: ValidatorRPCPayload<Input, Output> } :
  Target extends 'text' ? { body: ValidatorRPCPayload<Input, Output> } :
  Target extends 'query' ? { query?: Input } :
  Target extends 'param' ? { param?: Input } :
  Target extends 'header' ? { headers?: Input } :
  Target extends 'cookie' ? { cookie?: Input } :
  {};

const PARAMETER_TARGETS: Record<ParameterTarget, true> = {
  query: true,
  param: true,
  header: true,
  cookie: true,
};

const REQUEST_BODY_CONTENT_TYPES: Record<RequestBodyTarget, string> = {
  json: 'application/json',
  form: 'multipart/form-data',
  text: 'text/plain',
};

export function isParameterTarget(target: string): target is ParameterTarget {
  return target in PARAMETER_TARGETS;
}

export function isRequestBodyTarget(target: string): target is RequestBodyTarget {
  return target === 'json' || target === 'form' || target === 'text';
}

export function requestBodyContentTypeForTarget(target: string): string | undefined {
  return isRequestBodyTarget(target)
    ? REQUEST_BODY_CONTENT_TYPES[target]
    : undefined;
}

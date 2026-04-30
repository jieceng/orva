import type {
  OperationOutput,
  OperationResponseOutputs,
} from './metadata.js';

type TypedResponseLike = Response & {
  readonly __orvaTypedResponse__?: {
    readonly status: number;
    readonly body: unknown;
    readonly format: string;
  };
};

type FallbackResponses<Output> = { 200: Output };

export type InferHandlerResult<H extends (...args: any[]) => unknown> =
  Awaited<ReturnType<H>> extends Response | TypedResponseLike
    ? Awaited<ReturnType<H>>
    : never;

export type TypedResponseMetadata<ResponseLike> =
  ResponseLike extends Response & {
    readonly __orvaTypedResponse__?: {
      readonly status: infer Status extends number;
      readonly body: infer Body;
      readonly format: infer Format;
    };
  }
    ? { status: Status; body: Body; format: Format }
    : never;

export type HandlerResponseMap<Result> = [TypedResponseMetadata<Awaited<Result>>] extends [never]
  ? {}
  : {
      [S in TypedResponseMetadata<Awaited<Result>> extends { status: infer Status extends number } ? Status : never]:
        Extract<TypedResponseMetadata<Awaited<Result>>, { status: S }> extends { body: infer Body } ? Body : never;
    };

export type RouteResponseMap<Operation, Result> =
  [Operation] extends [undefined]
    ? HandlerResponseMap<Result>
    : OperationResponseOutputs<Operation>;

export type SuccessStatusKeys<Responses extends Record<number, unknown>> =
  keyof Responses extends infer Key
    ? Key extends number
      ? `${Key}` extends `2${string}` ? Key : never
      : never
    : never;

export type RouteOutputFromResponses<Responses extends Record<number, unknown>, Fallback> =
  [SuccessStatusKeys<Responses>] extends [never]
    ? Fallback
    : Responses[SuccessStatusKeys<Responses>];

export type InferRouteOutputFromOperation<Operation> =
  [Operation] extends [undefined]
    ? unknown
    : OperationOutput<Operation>;

export type InferRouteResponses<Operation, Result> = RouteResponseMap<Operation, Result>;

export type InferRouteOutput<Operation, Result> = RouteOutputFromResponses<
  InferRouteResponses<Operation, Result>,
  InferRouteOutputFromOperation<Operation>
>;

export type RouteResolvedResponses<Route> =
  Route extends {
    output: infer Output;
    operation?: infer Operation;
    responses?: infer Responses;
  }
    ? Responses extends Record<number, unknown>
      ? keyof Responses extends never
        ? keyof OperationResponseOutputs<Operation> extends never
          ? FallbackResponses<Output>
          : OperationResponseOutputs<Operation>
        : Responses
      : keyof OperationResponseOutputs<Operation> extends never
        ? FallbackResponses<Output>
        : OperationResponseOutputs<Operation>
    : FallbackResponses<unknown>;

export type RouteResolvedOutput<Route> =
  Route extends {
    output: infer Output;
    operation?: infer Operation;
    responses?: infer Responses;
  }
    ? RouteOutputFromResponses<
        RouteResolvedResponses<Route>,
        [Operation] extends [undefined] ? Output : InferRouteOutputFromOperation<Operation>
      >
    : unknown;

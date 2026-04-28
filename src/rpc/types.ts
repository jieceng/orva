// ============ RPC type utilities ============

import type {
  OpenAPIMediaTypeMetadata,
  OpenAPIOperationMetadata,
  OpenAPIResponseMetadata,
} from '../metadata.js';
import type { Orva, RouteDefinition } from '../orva.js';

type UnionToIntersection<U> = (
  U extends unknown ? (arg: U) => void : never
) extends ((arg: infer I) => void) ? I : never;

type Simplify<T> = { [K in keyof T]: T[K] } & {};
type NumericStatusKey = number | `${number}`;
type NormalizeStatusKey<Key> = Key extends number
  ? Key
  : Key extends `${infer Status extends number}`
    ? Status
    : never;
type IsOkStatus<Status extends number> = `${Status}` extends `2${string}` ? true : false;
type ExtractSchemaOutput<Schema> = Schema extends { readonly output?: infer Output } ? Output : unknown;
type ExtractMediaTypeOutput<MediaType> = MediaType extends OpenAPIMediaTypeMetadata<any, infer Output>
  ? Output
  : MediaType extends { schema?: infer Schema }
    ? ExtractSchemaOutput<Schema>
    : unknown;
type ExtractResponseOutput<Response> = Response extends OpenAPIResponseMetadata<infer Output>
  ? Output
  : Response extends { content?: infer Content }
    ? Content extends Record<string, infer MediaType>
      ? ExtractMediaTypeOutput<MediaType>
      : Response extends { schema?: infer Schema }
        ? ExtractSchemaOutput<Schema>
        : unknown
    : Response extends { schema?: infer Schema }
      ? ExtractSchemaOutput<Schema>
      : unknown;
type OperationResponses<Operation> = Operation extends OpenAPIOperationMetadata<infer Responses>
  ? Simplify<{
      [K in keyof Responses as NormalizeStatusKey<K>]: ExtractResponseOutput<Responses[K]>;
    }>
  : {};
type FallbackResponses<Output> = { 200: Output };
type RouteResponses<Route> = Route extends { operation?: infer Operation; output: infer Output }
  ? keyof OperationResponses<Operation> extends never
    ? FallbackResponses<Output>
    : OperationResponses<Operation>
  : FallbackResponses<unknown>;
type ResponseUnion<Responses extends Record<number, unknown>> = {
  [Status in keyof Responses & number]: RPCResponse<Status, Responses[Status]>;
}[keyof Responses & number];
type ResponseBody<ResponseLike> = ResponseLike extends RPCResponse<any, infer Body> ? Body : never;
type ResponseBodyForStatus<ResponseLike, Status extends number> = ResponseBody<Extract<ResponseLike, RPCResponse<Status, unknown>>>;

export type RPCMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export type RPCRequestOptions = {
  param?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, unknown>;
  cookie?: Record<string, unknown>;
};

export interface RPCRouteDefinition<
  Path extends string = string,
  Method extends string = string,
  Input extends object = {},
  Output = unknown,
  Operation = unknown,
> extends RouteDefinition<Path, Method, Input, Output, Operation> {}

export interface RPCResponse<Status extends number = number, Body = unknown> {
  readonly raw: Response;
  readonly status: Status;
  readonly ok: IsOkStatus<Status>;
  readonly headers: Headers;
  readonly redirected: boolean;
  readonly type: ResponseType;
  readonly url: string;
  clone(): Response;
  json(): Promise<Body>;
  text(): Promise<string>;
  formData(): Promise<FormData>;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  value(): Promise<Body>;
}

type RoutesFromOrva<T extends Orva<any, any, any>> =
  T extends Orva<any, any, infer Routes, any> ? Routes[keyof Routes] : never;

type StripLeadingSlash<Path extends string> = Path extends `/${infer Rest}` ? Rest : Path;
type ChildSegment<Path extends string> =
  StripLeadingSlash<Path> extends `${infer Segment}/${string}` ? Segment : StripLeadingSlash<Path>;

type DescendantRoutes<Routes, Current extends string> =
  Routes extends { path: infer Path extends string }
    ? Current extends ''
      ? Routes
      : StripLeadingSlash<Path> extends `${Current}/${string}` | Current
        ? Routes
        : never
    : never;

type ExactRoutes<Routes, Current extends string> =
  DescendantRoutes<Routes, Current> extends infer Route
    ? Route extends { path: infer Path extends string }
      ? StripLeadingSlash<Path> extends Current ? Route : never
      : never
    : never;

type ChildRouteSegments<Routes, Current extends string> =
  DescendantRoutes<Routes, Current> extends infer Route
    ? Route extends { path: infer Path extends string }
      ? Current extends ''
        ? ChildSegment<Path>
        : StripLeadingSlash<Path> extends `${Current}/${infer Rest}`
          ? ChildSegment<Rest>
          : never
      : never
    : never;

type NextPath<Current extends string, Segment extends string> =
  Current extends '' ? Segment : `${Current}/${Segment}`;

type RouteMethodProperty<Method extends string> = `$${Lowercase<Method>}`;

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T];

type NormalizeRequestOptions<Input> = Simplify<Input>;

type RequestArgs<Input extends object> =
  keyof Input extends never
    ? []
    : [RequiredKeys<Input>] extends [never]
      ? [options?: NormalizeRequestOptions<Input>]
      : [options: NormalizeRequestOptions<Input>];

type MethodEntries<Routes> =
  Routes extends {
    method: infer Method extends string;
    input: infer Input extends object;
  }
    ? { [K in RouteMethodProperty<Method>]: (...args: RequestArgs<Input>) => Promise<ResponseUnion<RouteResponses<Routes>>> }
    : {};

type RouteMethodMap<Routes> = Simplify<UnionToIntersection<MethodEntries<Routes>>>;

export type RPCPathProxy<Routes, Current extends string = ''> =
  RouteMethodMap<ExactRoutes<Routes, Current>>
  & {
    [Segment in ChildRouteSegments<Routes, Current>]: RPCPathProxy<Routes, NextPath<Current, Segment>>;
  };

export type OrvaRPC<T extends Orva<any, any, any>> = RPCPathProxy<RoutesFromOrva<T>>;

export type RPCClient<T extends Orva<any, any, any>> = OrvaRPC<T>;
export type InferRPCResponse<TMethod extends (...args: any[]) => Promise<any>> = Awaited<ReturnType<TMethod>>;
export type InferResponseType<
  TMethod extends (...args: any[]) => Promise<any>,
  Status extends number | undefined = undefined,
> = Status extends number
  ? ResponseBodyForStatus<InferRPCResponse<TMethod>, Status>
  : ResponseBody<InferRPCResponse<TMethod>>;

// Helper type: extract parameter names from a route string
export type ExtractParamNames<T extends string> =
  T extends `${infer _}:${infer P}/${infer R}`
    ? P | ExtractParamNames<`/${R}`>
    : T extends `${infer _}:${infer P}`
      ? P
      : never;

// Helper type: build the params object type
export type ParamsFromPath<T extends string> = {
  [K in ExtractParamNames<T>]: string;
};

// Helper type: extract route params (simplified)
export type RouteParams<T extends string> = ParamsFromPath<T>;

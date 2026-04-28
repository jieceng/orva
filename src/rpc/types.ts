// ============ RPC type utilities ============

import type { Orva, RouteDefinition } from '../orva.js';

type UnionToIntersection<U> = (
  U extends unknown ? (arg: U) => void : never
) extends ((arg: infer I) => void) ? I : never;

type Simplify<T> = { [K in keyof T]: T[K] } & {};

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
> extends RouteDefinition<Path, Method, Input, Output> {}

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
  Routes extends { method: infer Method extends string; input: infer Input extends object; output: infer Output }
    ? { [K in RouteMethodProperty<Method>]: (...args: RequestArgs<Input>) => Promise<Output> }
    : {};

type RouteMethodMap<Routes> = Simplify<UnionToIntersection<MethodEntries<Routes>>>;

export type RPCPathProxy<Routes, Current extends string = ''> =
  RouteMethodMap<ExactRoutes<Routes, Current>>
  & {
    [Segment in ChildRouteSegments<Routes, Current>]: RPCPathProxy<Routes, NextPath<Current, Segment>>;
  };

export type OrvaRPC<T extends Orva<any, any, any>> = RPCPathProxy<RoutesFromOrva<T>>;

export type RPCClient<T extends Orva<any, any, any>> = OrvaRPC<T>;

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

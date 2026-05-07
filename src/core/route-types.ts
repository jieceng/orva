import type {
  OPENAPI_METADATA,
  VALIDATOR_METADATA,
  ValidatorContractMetadata,
} from '../metadata.js';
import type {
  InferRouteOutput,
  InferRouteResponses,
} from '../route-contract.js';
import type { ValidatorRPCInputMapping } from '../input-contract.js';
import type { Orva } from './orva.js';
import type {
  Context,
  MiddlewareHandler,
  MiddlewareTypeCarrier,
  PrettifyIntersection,
  RouteDefinition,
  RouteHandlerResult,
  Simplify,
  ValidatedData,
} from './types.js';

type ExtractMiddlewareAddedVars<M> = M extends MiddlewareTypeCarrier<infer AddedVars, any>
  ? AddedVars extends object ? AddedVars : {}
  : {};

type ExtractMiddlewareAddedValidated<M> = M extends MiddlewareTypeCarrier<any, infer AddedValidated>
  ? AddedValidated extends ValidatedData ? AddedValidated : {}
  : M extends MiddlewareHandler<any, infer V> ? V : {};

export type MergeMiddlewareAddedVars<M extends readonly unknown[]> = Simplify<
  PrettifyIntersection<ExtractMiddlewareAddedVars<M[number]>>
>;

export type MergeMiddlewareValidatedData<M extends readonly unknown[]> = Simplify<
  PrettifyIntersection<ExtractMiddlewareAddedValidated<M[number]>>
>;

type ExtractMiddlewareAddedRPCInput<M> = M extends MiddlewareTypeCarrier<any, any, infer AddedRPCInput, any>
  ? AddedRPCInput extends object ? AddedRPCInput : {}
  : {};

type MiddlewareRPCInput<M> = keyof ExtractMiddlewareAddedRPCInput<M> extends never
  ? M extends { readonly [VALIDATOR_METADATA]?: ValidatorContractMetadata<infer Target, infer Input, infer Output> }
    ? ValidatorRPCInputMapping<Target, Input, Output>
    : {}
  : ExtractMiddlewareAddedRPCInput<M>;

type MergeMiddlewareRPCInput<M extends readonly unknown[]> = Simplify<
  PrettifyIntersection<MiddlewareRPCInput<M[number]>>
>;

type MergeRPCInput<M extends readonly unknown[]> = Simplify<
  MergeMiddlewareRPCInput<M>
>;

type ExtractOperationCarrier<M> = M extends MiddlewareTypeCarrier<any, any, any, infer Operation>
  ? Operation
  : never;

type ExtractOperationMetadata<M> =
  [ExtractOperationCarrier<M>] extends [never]
    ? M extends { readonly [OPENAPI_METADATA]?: infer Operation }
      ? Operation
      : never
    : ExtractOperationCarrier<M>;

export type MergeOperationMetadata<M extends readonly unknown[]> =
  [ExtractOperationMetadata<M[number]>] extends [never]
    ? undefined
    : ExtractOperationMetadata<M[number]>;

export type RouteRegistrationHandler<
  T extends object,
  V extends ValidatedData,
  GM extends readonly unknown[],
  M extends readonly unknown[],
  Result extends RouteHandlerResult = RouteHandlerResult,
> = (
  c: Context<T, Simplify<V & MergeMiddlewareValidatedData<[...GM, ...M]>>>
) => Result;

type ExtractPathParamNames<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractPathParamNames<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
      ? Param
      : never;

type ParamsFromRoutePath<Path extends string> = {
  [K in ExtractPathParamNames<Path>]: string;
};

type PathParamInput<Path extends string> =
  [ExtractPathParamNames<Path>] extends [never]
    ? {}
    : { param: ParamsFromRoutePath<Path> };

type RouteKey<Method extends string, Path extends string> = `${Uppercase<Method>} ${Path}`;
type NormalizePrefix<Prefix extends string> = Prefix extends '' | '/' ? '' : Prefix extends `/${string}` ? Prefix : `/${Prefix}`;
type JoinPaths<Prefix extends string, Path extends string> =
  NormalizePrefix<Prefix> extends infer P extends string
    ? Path extends '' | '/'
      ? (P extends '' ? '/' : P)
      : P extends ''
        ? Path
        : `${P}${Path extends `/${string}` ? Path : `/${Path}`}`
    : Path;

type PrefixRouteDefinition<
  Prefix extends string,
  Definition
> = Definition extends RouteDefinition<infer Path extends string, infer Method extends string, infer Input extends object, infer Output, infer Operation, infer Responses extends Record<number, unknown>>
  ? RouteDefinition<JoinPaths<Prefix, Path>, Method, Input, Output, Operation, Responses>
  : never;

export type PrefixRouteRegistry<Prefix extends string, Routes extends object> = Simplify<{
  [K in keyof Routes as Routes[K] extends RouteDefinition<infer Path extends string, infer Method extends string, any, any, any>
    ? RouteKey<Method, JoinPaths<Prefix, Path>>
    : never]: PrefixRouteDefinition<Prefix, Routes[K]>;
}>;

export type RoutesOfOrvaInstance<App> = App extends Orva<any, any, infer Routes, any> ? Routes : {};

type RouteInputWithPath<Path extends string, Input extends object> = Simplify<Input & PathParamInput<Path>>;

type RegisteredRouteDefinition<
  Method extends string,
  Path extends string,
  Middlewares extends readonly unknown[],
  Operation,
  Result,
> = RouteDefinition<
  Path,
  Method,
  RouteInputWithPath<Path, MergeRPCInput<Middlewares>>,
  InferRouteOutput<Operation, Result>,
  Operation,
  InferRouteResponses<Operation, Result>
>;

type RegisteredRouteRegistry<
  Method extends string,
  Path extends string,
  Middlewares extends readonly unknown[],
  Operation,
  Result,
> = {
  [K in RouteKey<Method, Path>]: RegisteredRouteDefinition<Method, Path, Middlewares, Operation, Result>;
};

export type MethodRegistrationResult<
  T extends object,
  V extends ValidatedData,
  R extends object,
  GM extends readonly unknown[],
  Method extends string,
  Path extends string,
  M extends readonly unknown[],
  Operation,
  Result,
> = Orva<T, V, Simplify<R & RegisteredRouteRegistry<Method, Path, [...GM, ...M], Operation, Result>>, GM>;

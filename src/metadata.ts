export const VALIDATOR_METADATA = Symbol('orva.validator.metadata');
export const OPENAPI_METADATA = Symbol('orva.openapi.metadata');
export const OPENAPI_MIDDLEWARE_METADATA = Symbol('orva.openapi.middleware.metadata');

export interface SchemaContract<Input = unknown, Output = Input> {
  provider: string;
  schema: unknown;
  componentName?: string;
  toOpenAPISchema?: (schema: unknown, mode: 'input' | 'output') => Record<string, unknown>;
  readonly input?: Input;
  readonly output?: Output;
}

export interface ValidatorContractMetadata<
  Target extends string = string,
  Input = unknown,
  Output = Input
> extends SchemaContract<Input, Output> {
  target: Target;
  errorStatus?: number;
  errorResponse?: OpenAPIResponseMetadata;
}

export interface OpenAPIExternalDocumentation {
  description?: string;
  url: string;
}

export interface OpenAPIContact {
  name?: string;
  url?: string;
  email?: string;
}

export interface OpenAPILicense {
  name: string;
  url?: string;
}

export interface OpenAPIServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface OpenAPIServer {
  url: string;
  description?: string;
  variables?: Record<string, OpenAPIServerVariable>;
}

export interface OpenAPITag {
  name: string;
  description?: string;
  externalDocs?: OpenAPIExternalDocumentation;
}

export interface OpenAPIParameterMetadata {
  componentName?: string;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  example?: unknown;
  examples?: Record<string, OpenAPIExampleObject>;
  schema?: SchemaContract;
  content?: Record<string, OpenAPIMediaTypeMetadata>;
}

export interface OpenAPIParameterComponent<Name extends string = string> {
  componentName: Name;
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  parameter: OpenAPIParameterMetadata;
}

export interface OpenAPIExampleObject {
  componentName?: string;
  summary?: string;
  description?: string;
  value?: unknown;
  externalValue?: string;
}

export interface OpenAPIExampleComponent<Name extends string = string> {
  componentName: Name;
  example: OpenAPIExampleObject;
}

export interface OpenAPIHeaderMetadata {
  componentName?: string;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  example?: unknown;
  examples?: Record<string, OpenAPIExampleObject>;
  schema?: SchemaContract;
  content?: Record<string, OpenAPIMediaTypeMetadata>;
}

export interface OpenAPIHeaderComponent<Name extends string = string> {
  componentName: Name;
  header: OpenAPIHeaderMetadata;
}

export interface OpenAPILinkComponent<Name extends string = string> {
  componentName: Name;
  link: OpenAPILinkMetadata;
}

export interface OpenAPIEncodingMetadata {
  contentType?: string;
  headers?: Record<string, OpenAPIHeaderMetadata>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface OpenAPIMediaTypeMetadata<Input = unknown, Output = Input> {
  schema?: SchemaContract<Input, Output>;
  example?: unknown;
  examples?: Record<string, OpenAPIExampleObject>;
  encoding?: Record<string, OpenAPIEncodingMetadata>;
}

export interface OpenAPIRequestBodyMetadata<Input = unknown, Output = Input> {
  componentName?: string;
  description?: string;
  required?: boolean;
  contentType?: string;
  schema?: SchemaContract<Input, Output>;
  example?: unknown;
  examples?: Record<string, OpenAPIExampleObject>;
  encoding?: Record<string, OpenAPIEncodingMetadata>;
  content?: Record<string, OpenAPIMediaTypeMetadata<Input, Output>>;
}

export interface OpenAPIRequestBodyComponent<Name extends string = string> {
  componentName: Name;
  requestBody: OpenAPIRequestBodyMetadata;
}

export interface OpenAPILinkMetadata {
  componentName?: string;
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, unknown>;
  requestBody?: unknown;
  description?: string;
  server?: OpenAPIServer;
}

export interface OpenAPIResponseMetadata<Output = unknown> {
  componentName?: string;
  description?: string;
  contentType?: string;
  schema?: SchemaContract<Output, Output>;
  example?: unknown;
  examples?: Record<string, OpenAPIExampleObject>;
  content?: Record<string, OpenAPIMediaTypeMetadata<Output, Output>>;
  headers?: Record<string, OpenAPIHeaderMetadata>;
  links?: Record<string, OpenAPILinkMetadata>;
}

export interface OpenAPIResponseComponent<Name extends string = string> {
  componentName: Name;
  response: OpenAPIResponseMetadata;
}

export interface OpenAPISecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: Record<string, unknown>;
  openIdConnectUrl?: string;
}

export interface OpenAPISecuritySchemeComponent<Name extends string = string> {
  componentName: Name;
  scheme: OpenAPISecurityScheme;
}

export interface OpenAPISecurityRequirement {
  scheme: string | OpenAPISecuritySchemeComponent;
  scopes?: string[];
}

export type OpenAPIOperationMethod =
  | 'get'
  | 'put'
  | 'post'
  | 'delete'
  | 'options'
  | 'head'
  | 'patch'
  | 'trace';

export interface OpenAPIParameterCollection {
  query?: Record<string, OpenAPIParameterMetadata>;
  param?: Record<string, OpenAPIParameterMetadata>;
  header?: Record<string, OpenAPIParameterMetadata>;
  cookie?: Record<string, OpenAPIParameterMetadata>;
}

export interface OpenAPIPathItemMetadata {
  componentName?: string;
  summary?: string;
  description?: string;
  servers?: OpenAPIServer[];
  parameters?: OpenAPIParameterCollection;
}

export type OpenAPIPathItemObject =
  OpenAPIPathItemMetadata
  & Partial<Record<OpenAPIOperationMethod, OpenAPIOperationMetadata>>;

export interface OpenAPIPathItemComponent<Name extends string = string> {
  componentName: Name;
  pathItem: OpenAPIPathItemObject;
}

export type OpenAPICallbackPathItem = OpenAPIPathItemObject;

export interface OpenAPICallbackComponent<Name extends string = string> {
  componentName: Name;
  callback: Record<string, OpenAPICallbackPathItem>;
}

export type OpenAPICallbackMetadataValue =
  | Record<string, OpenAPICallbackPathItem>
  | OpenAPICallbackComponent;

export type OpenAPICallbackMetadata = Record<string, OpenAPICallbackMetadataValue>;

export type OpenAPIWebhookMetadata = Record<string, OpenAPIPathItemObject | OpenAPIPathItemComponent>;

export interface OpenAPIOperationMetadata<
  Responses extends Record<number, OpenAPIResponseMetadata<any>> = Record<number, OpenAPIResponseMetadata<any>>
> {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  externalDocs?: OpenAPIExternalDocumentation;
  servers?: OpenAPIServer[];
  deprecated?: boolean;
  path?: OpenAPIPathItemMetadata;
  requestBody?: OpenAPIRequestBodyMetadata;
  parameters?: OpenAPIParameterCollection;
  securitySchemes?: OpenAPISecuritySchemeComponent[];
  security?: OpenAPISecurityRequirement[];
  callbacks?: OpenAPICallbackMetadata;
  responses?: Responses;
}

export interface OpenAPIMiddlewareMetadata {
  securitySchemes?: OpenAPISecuritySchemeComponent[];
  security?: OpenAPISecurityRequirement[];
  responses?: Record<number, OpenAPIResponseMetadata<any>>;
  responseStatuses?: number[];
}

export interface RouteRuntimeDefinition {
  method: string;
  path: string;
  validators: ValidatorContractMetadata[];
  openapi?: OpenAPIOperationMetadata | undefined;
  middlewareOpenAPI?: OpenAPIMiddlewareMetadata[] | undefined;
}

export type OpenAPIResponses = Record<number, OpenAPIResponseMetadata<any>>;

type NumericStatusKey = number | `${number}`;
type NormalizeStatusKey<Key> = Key extends number
  ? Key
  : Key extends `${infer Status extends number}`
    ? Status
    : never;
type ExtractSchemaOutput<Schema> = Schema extends SchemaContract<any, infer Output> ? Output : unknown;
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

export type OperationResponseOutputs<Operation> =
  Operation extends { responses: infer Responses }
    ? Responses extends OpenAPIResponses
      ? {
          [K in keyof Responses as NormalizeStatusKey<K>]: ExtractResponseOutput<Responses[K]>;
        }
      : {}
    : {};

export type OperationOutput<Operation> =
  OperationResponseOutputs<Operation>[keyof OperationResponseOutputs<Operation>];

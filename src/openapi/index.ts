import type { MiddlewareHandler, TypedMiddlewareHandler } from '../orva.js';
import {
  isParameterTarget,
  requestBodyContentTypeForTarget,
} from '../input-contract.js';
import {
  getRouteOperationResponses,
} from '../route-runtime-contract.js';
import {
  OPENAPI_METADATA,
  type OpenAPICallbackComponent,
  type OpenAPICallbackMetadata,
  type OpenAPICallbackMetadataValue,
  type OpenAPICallbackPathItem,
  type OpenAPIContact,
  type OpenAPIEncodingMetadata,
  type OpenAPIExampleComponent,
  type OpenAPIExampleObject,
  type OpenAPIExternalDocumentation,
  type OpenAPIHeaderComponent,
  type OpenAPIHeaderMetadata,
  type OpenAPILicense,
  type OpenAPILinkComponent,
  type OpenAPILinkMetadata,
  type OpenAPIMediaTypeMetadata,
  type OpenAPIOperationMetadata,
  type OpenAPIOperationMethod,
  type OpenAPIParameterCollection,
  type OpenAPIParameterComponent,
  type OpenAPIParameterMetadata,
  type OpenAPIPathItemObject,
  type OpenAPIPathItemMetadata,
  type OpenAPIPathItemComponent,
  type OpenAPIMiddlewareMetadata,
  type OpenAPIRequestBodyComponent,
  type OpenAPIRequestBodyMetadata,
  type OpenAPIResponseComponent,
  type OpenAPIResponseMetadata,
  type OpenAPISecurityRequirement,
  type OpenAPISecurityScheme,
  type OpenAPISecuritySchemeComponent,
  type OpenAPIServer,
  type OpenAPITag,
  type OpenAPIWebhookMetadata,
  type RouteRuntimeDefinition,
  type SchemaContract,
  type ValidatorContractMetadata,
} from '../metadata.js';

export type {
  OpenAPICallbackComponent,
  OpenAPICallbackMetadata,
  OpenAPICallbackMetadataValue,
  OpenAPICallbackPathItem,
  OpenAPIContact,
  OpenAPIEncodingMetadata,
  OpenAPIExampleComponent,
  OpenAPIExampleObject,
  OpenAPIExternalDocumentation,
  OpenAPIHeaderComponent,
  OpenAPIHeaderMetadata,
  OpenAPILicense,
  OpenAPILinkComponent,
  OpenAPILinkMetadata,
  OpenAPIMediaTypeMetadata,
  OpenAPIOperationMetadata,
  OpenAPIOperationMethod,
  OpenAPIParameterCollection,
  OpenAPIParameterComponent,
  OpenAPIParameterMetadata,
  OpenAPIPathItemObject,
  OpenAPIPathItemMetadata,
  OpenAPIPathItemComponent,
  OpenAPIMiddlewareMetadata,
  OpenAPIRequestBodyComponent,
  OpenAPIRequestBodyMetadata,
  OpenAPIResponseComponent,
  OpenAPIResponseMetadata,
  OpenAPISecurityRequirement,
  OpenAPISecurityScheme,
  OpenAPISecuritySchemeComponent,
  OpenAPIServer,
  OpenAPITag,
  OpenAPIWebhookMetadata,
  SchemaContract,
} from '../metadata.js';

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;
const DEFAULT_VALIDATION_ERROR_SCHEMA: SchemaContract = {
  provider: 'orva',
  componentName: 'ValidationError',
  schema: {
    type: 'object',
    properties: {
      error: { type: 'string' },
      issues: {
        type: 'array',
        items: { type: 'object' },
      },
    },
    required: ['error'],
  },
};
const DEFAULT_VALIDATION_ERROR_RESPONSE: OpenAPIResponseMetadata = {
  componentName: 'ValidationErrorResponse',
  description: 'Validation Error',
  schema: DEFAULT_VALIDATION_ERROR_SCHEMA,
};
const DEFAULT_UNAUTHORIZED_RESPONSE: OpenAPIResponseMetadata = {
  componentName: 'UnauthorizedErrorResponse',
  description: 'Unauthorized',
};
const DEFAULT_FORBIDDEN_RESPONSE: OpenAPIResponseMetadata = {
  componentName: 'ForbiddenErrorResponse',
  description: 'Forbidden',
};
const DEFAULT_NOT_FOUND_RESPONSE: OpenAPIResponseMetadata = {
  componentName: 'NotFoundErrorResponse',
  description: 'Not Found',
};

type ParameterSection = 'query' | 'param' | 'header' | 'cookie';
type OpenAPIComponentSection =
  | 'schemas'
  | 'parameters'
  | 'responses'
  | 'requestBodies'
  | 'pathItems'
  | 'securitySchemes'
  | 'headers'
  | 'examples'
  | 'links'
  | 'callbacks';

export type OpenAPIComponentConflictStrategy = 'rename' | 'reuse' | 'error';

export interface OpenAPIComponentNameContext {
  kind: OpenAPIComponentSection;
  value: Record<string, unknown>;
  originalName: string;
  sanitizedName: string;
  attempt: number;
  existingName?: string;
}

export interface OpenAPIInfo {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: OpenAPIContact;
  license?: OpenAPILicense;
}

export interface OpenAPIDocumentOptions {
  info: OpenAPIInfo;
  servers?: OpenAPIServer[];
  externalDocs?: OpenAPIExternalDocumentation;
  tags?: OpenAPITag[];
  schemaRefs?: boolean;
  schemaComponentStrategy?: 'all' | 'named';
  inferResponseHeaders?: boolean;
  validationErrorResponses?: boolean;
  securitySchemes?: OpenAPISecuritySchemeComponent[];
  headerComponents?: OpenAPIHeaderComponent[];
  exampleComponents?: OpenAPIExampleComponent[];
  linkComponents?: OpenAPILinkComponent[];
  callbackComponents?: OpenAPICallbackComponent[];
  parameterComponents?: OpenAPIParameterComponent[];
  responseComponents?: OpenAPIResponseComponent[];
  requestBodyComponents?: OpenAPIRequestBodyComponent[];
  pathItemComponents?: OpenAPIPathItemComponent[];
  webhooks?: OpenAPIWebhookMetadata;
  componentConflicts?:
    | OpenAPIComponentConflictStrategy
    | Partial<Record<OpenAPIComponentSection, OpenAPIComponentConflictStrategy>>;
  resolveComponentName?: (context: OpenAPIComponentNameContext) => string;
}

export interface OpenAPIReadable {
  getRouteDefinitions(): readonly RouteRuntimeDefinition[];
}

export interface OpenAPIMiddleware<Meta extends OpenAPIOperationMetadata = OpenAPIOperationMetadata>
  extends TypedMiddlewareHandler<any, any, {}, {}, {}, Meta> {
  readonly [OPENAPI_METADATA]: Meta;
}

export type OpenAPIComponentKind =
  | 'parameter'
  | 'requestBody'
  | 'response'
  | 'securityScheme'
  | 'header'
  | 'example'
  | 'link'
  | 'callback'
  | 'pathItem';

export interface OpenAPIComponentValueMap {
  parameter: {
    name: string;
    in: 'query' | 'path' | 'header' | 'cookie';
    parameter: OpenAPIParameterMetadata;
  };
  requestBody: OpenAPIRequestBodyMetadata;
  response: OpenAPIResponseMetadata;
  securityScheme: OpenAPISecurityScheme;
  header: OpenAPIHeaderMetadata;
  example: OpenAPIExampleObject;
  link: OpenAPILinkMetadata;
  callback: Record<string, OpenAPICallbackPathItem>;
  pathItem: OpenAPIPathItemObject;
}

export interface OpenAPIComponentReturnMap<Name extends string = string> {
  parameter: OpenAPIParameterComponent<Name>;
  requestBody: OpenAPIRequestBodyComponent<Name>;
  response: OpenAPIResponseComponent<Name>;
  securityScheme: OpenAPISecuritySchemeComponent<Name>;
  header: OpenAPIHeaderComponent<Name>;
  example: OpenAPIExampleComponent<Name>;
  link: OpenAPILinkComponent<Name>;
  callback: OpenAPICallbackComponent<Name>;
  pathItem: OpenAPIPathItemComponent<Name>;
}

interface RegisteredComponentEntry {
  finalName: string;
  fingerprint: string;
}

interface SchemaRegistry {
  components: Record<string, Record<string, unknown>>;
  bySchemaObject: WeakMap<object, Map<string, string>>;
  byName: Map<string, RegisteredComponentEntry[]>;
  counter: number;
}

interface ComponentRegistry {
  components: Record<string, Record<string, unknown>>;
  byObject: WeakMap<object, string>;
  byName: Map<string, RegisteredComponentEntry[]>;
}

interface OpenAPIBuilderContext {
  schemaRegistry: SchemaRegistry;
  parameterRegistry: ComponentRegistry;
  responseRegistry: ComponentRegistry;
  requestBodyRegistry: ComponentRegistry;
  pathItemRegistry: ComponentRegistry;
  securitySchemeRegistry: ComponentRegistry;
  headerRegistry: ComponentRegistry;
  exampleRegistry: ComponentRegistry;
  linkRegistry: ComponentRegistry;
  callbackRegistry: ComponentRegistry;
  useSchemaRefs: boolean;
  schemaComponentStrategy: 'all' | 'named';
  inferResponseHeaders: boolean;
  validationErrorResponses: boolean;
  componentConflicts: Record<OpenAPIComponentSection, OpenAPIComponentConflictStrategy>;
  resolveComponentName: (context: OpenAPIComponentNameContext) => string;
}

const EMPTY_ROUTE_INPUT_CONTRACT: RouteRuntimeDefinition['contract']['input'] = {
  parameters: {},
};

export function describeRoute<Meta extends OpenAPIOperationMetadata>(
  metadata: Meta
): OpenAPIMiddleware<Meta> {
  const middleware: TypedMiddlewareHandler<any, any, {}, {}, {}, Meta> = async (_context, next) => {
    await next();
  };

  return Object.assign(middleware, {
    [OPENAPI_METADATA]: metadata,
  }) as OpenAPIMiddleware<Meta>;
}

export function defineComponent<
  Kind extends OpenAPIComponentKind,
  Name extends string
>(
  kind: Kind,
  componentName: Name,
  value: OpenAPIComponentValueMap[Kind]
): OpenAPIComponentReturnMap<Name>[Kind] {
  switch (kind) {
    case 'parameter':
      return {
        componentName,
        ...(value as OpenAPIComponentValueMap['parameter']),
      } as OpenAPIComponentReturnMap<Name>[Kind];
    case 'requestBody':
      return { componentName, requestBody: value as OpenAPIRequestBodyMetadata } as OpenAPIComponentReturnMap<Name>[Kind];
    case 'response':
      return { componentName, response: value as OpenAPIResponseMetadata } as OpenAPIComponentReturnMap<Name>[Kind];
    case 'securityScheme':
      return { componentName, scheme: value as OpenAPISecurityScheme } as OpenAPIComponentReturnMap<Name>[Kind];
    case 'header':
      return { componentName, header: value as OpenAPIHeaderMetadata } as OpenAPIComponentReturnMap<Name>[Kind];
    case 'example':
      return { componentName, example: value as OpenAPIExampleObject } as OpenAPIComponentReturnMap<Name>[Kind];
    case 'link':
      return { componentName, link: value as OpenAPILinkMetadata } as OpenAPIComponentReturnMap<Name>[Kind];
    case 'callback':
      return { componentName, callback: value as Record<string, OpenAPICallbackPathItem> } as OpenAPIComponentReturnMap<Name>[Kind];
    case 'pathItem':
      return { componentName, pathItem: value as OpenAPIPathItemMetadata } as OpenAPIComponentReturnMap<Name>[Kind];
    default:
      throw new Error(`Unsupported OpenAPI component kind: ${String(kind)}`);
  }
}

export function defineParameter<Name extends string>(
  componentName: Name,
  parameter: OpenAPIComponentValueMap['parameter']
): OpenAPIParameterComponent<Name> {
  return defineComponent('parameter', componentName, parameter);
}

export function defineRequestBody<Name extends string>(
  componentName: Name,
  requestBody: OpenAPIRequestBodyMetadata
): OpenAPIRequestBodyComponent<Name> {
  return defineComponent('requestBody', componentName, requestBody);
}

export function defineResponse<Name extends string>(
  componentName: Name,
  response: OpenAPIResponseMetadata
): OpenAPIResponseComponent<Name> {
  return defineComponent('response', componentName, response);
}

export function defineSecurityScheme<Name extends string>(
  componentName: Name,
  scheme: OpenAPISecurityScheme
): OpenAPISecuritySchemeComponent<Name> {
  return defineComponent('securityScheme', componentName, scheme);
}

export function defineHeader<Name extends string>(
  componentName: Name,
  header: OpenAPIHeaderMetadata
): OpenAPIHeaderComponent<Name> {
  return defineComponent('header', componentName, header);
}

export function defineExample<Name extends string>(
  componentName: Name,
  example: OpenAPIExampleObject
): OpenAPIExampleComponent<Name> {
  return defineComponent('example', componentName, example);
}

export function defineLink<Name extends string>(
  componentName: Name,
  link: OpenAPILinkMetadata
): OpenAPILinkComponent<Name> {
  return defineComponent('link', componentName, link);
}

export function defineCallback<Name extends string>(
  componentName: Name,
  callback: Record<string, OpenAPICallbackPathItem>
): OpenAPICallbackComponent<Name> {
  return defineComponent('callback', componentName, callback);
}

export function definePathItem<Name extends string>(
  componentName: Name,
  pathItem: OpenAPIPathItemObject
): OpenAPIPathItemComponent<Name> {
  return defineComponent('pathItem', componentName, pathItem);
}

export function requireSecurity(
  scheme: string | OpenAPISecuritySchemeComponent,
  scopes: string[] = []
): OpenAPISecurityRequirement {
  return { scheme, scopes };
}

function createSchemaRegistry(): SchemaRegistry {
  return {
    components: {},
    bySchemaObject: new WeakMap(),
    byName: new Map(),
    counter: 0,
  };
}

function createComponentRegistry(): ComponentRegistry {
  return {
    components: {},
    byObject: new WeakMap(),
    byName: new Map(),
  };
}

function sanitizeComponentName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return cleaned || 'Component';
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value) ?? String(value);
}

function isDeepSubset(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left)) {
    if (!Array.isArray(right) || left.length !== right.length) return false;
    return left.every((item, index) => isDeepSubset(item, right[index]));
  }
  if (left && typeof left === 'object') {
    if (!right || typeof right !== 'object') return false;
    return Object.entries(left as Record<string, unknown>).every(([key, value]) => (
      key in (right as Record<string, unknown>)
      && isDeepSubset(value, (right as Record<string, unknown>)[key])
    ));
  }
  return false;
}

function mergeComponentValue(
  current: Record<string, unknown>,
  next: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...current };
  for (const [key, value] of Object.entries(next)) {
    const existing = merged[key];
    if (
      existing
      && value
      && typeof existing === 'object'
      && typeof value === 'object'
      && !Array.isArray(existing)
      && !Array.isArray(value)
    ) {
      merged[key] = mergeComponentValue(
        existing as Record<string, unknown>,
        value as Record<string, unknown>
      );
      continue;
    }
    merged[key] = value;
  }
  return merged;
}

function defaultResolveComponentName(context: OpenAPIComponentNameContext): string {
  return context.attempt === 1
    ? context.sanitizedName
    : `${context.sanitizedName}_${context.attempt}`;
}

function getSchemaObjectReference(
  registry: SchemaRegistry,
  schemaObject: object,
  mode: 'input' | 'output'
): string | undefined {
  return registry.bySchemaObject.get(schemaObject)?.get(mode);
}

function setSchemaObjectReference(
  registry: SchemaRegistry,
  schemaObject: object,
  mode: 'input' | 'output',
  name: string
): void {
  const entries = registry.bySchemaObject.get(schemaObject) ?? new Map<string, string>();
  entries.set(mode, name);
  registry.bySchemaObject.set(schemaObject, entries);
}

function resolveRegisteredComponentName(
  registry: { components: Record<string, Record<string, unknown>> },
  kind: OpenAPIComponentSection,
  originalName: string,
  value: Record<string, unknown>,
  fingerprint: string,
  context: OpenAPIBuilderContext,
  existingName?: string
): string {
  const strategy = context.componentConflicts[kind];
  if (existingName) {
    if (strategy === 'reuse') {
      return existingName;
    }
    if (strategy === 'error') {
      throw new Error(`OpenAPI component name conflict in ${kind}: ${originalName}`);
    }
  }

  const sanitizedName = sanitizeComponentName(originalName);
  let attempt = existingName ? 2 : 1;

  while (true) {
    const candidate = sanitizeComponentName(context.resolveComponentName({
      kind,
      value,
      originalName,
      sanitizedName,
      attempt,
      existingName,
    }) || sanitizedName);
    const current = registry.components[candidate];
    if (!current || stableSerialize(current) === fingerprint) {
      return candidate;
    }
    attempt += 1;
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object'
    ? value as Record<string, unknown>
    : undefined;
}

function hasComponentName(value: unknown): value is { componentName: string } {
  const record = asRecord(value);
  return !!record && typeof record.componentName === 'string';
}

function isExampleDescriptor(value: unknown): value is OpenAPIExampleObject {
  const record = asRecord(value);
  return !!record && (
    'componentName' in record
    || 'summary' in record
    || 'description' in record
    || 'value' in record
    || 'externalValue' in record
  );
}

function isCallbackComponent(value: OpenAPICallbackMetadataValue): value is OpenAPICallbackComponent {
  return hasComponentName(value) && 'callback' in value;
}

function normalizeOpenAPISchema(
  schema?: SchemaContract,
  mode: 'input' | 'output' = 'output'
): Record<string, unknown> | undefined {
  if (!schema) return undefined;
  if (schema.toOpenAPISchema) {
    return schema.toOpenAPISchema(schema.schema, mode);
  }
  if (schema.schema && typeof schema.schema === 'object') {
    return schema.schema as Record<string, unknown>;
  }
  return undefined;
}

function registerSchemaComponent(
  context: OpenAPIBuilderContext,
  registry: SchemaRegistry,
  contract: SchemaContract | undefined,
  mode: 'input' | 'output',
  strategy: 'all' | 'named'
): string | undefined {
  if (!contract) return undefined;
  if (strategy === 'named' && !contract.componentName) return undefined;

  const schemaObject = contract.schema;
  if (schemaObject && typeof schemaObject === 'object') {
    const existing = getSchemaObjectReference(registry, schemaObject as object, mode);
    if (existing) return existing;
  }

  const openAPISchema = normalizeOpenAPISchema(contract, mode);
  if (!openAPISchema) return undefined;
  const fingerprint = stableSerialize(openAPISchema);
  const originalName = contract.componentName ?? `${contract.provider}_${mode}_${++registry.counter}`;
  const existingEntries = registry.byName.get(originalName) ?? [];
  const reused = existingEntries.find((entry) => entry.fingerprint === fingerprint);
  if (reused) {
    if (schemaObject && typeof schemaObject === 'object') {
      setSchemaObjectReference(registry, schemaObject as object, mode, reused.finalName);
    }
    return reused.finalName;
  }

  const finalName = resolveRegisteredComponentName(
    registry,
    'schemas',
    originalName,
    openAPISchema,
    fingerprint,
    context,
    existingEntries[0]?.finalName
  );

  registry.components[finalName] = openAPISchema;
  existingEntries.push({ finalName, fingerprint });
  registry.byName.set(originalName, existingEntries);
  if (schemaObject && typeof schemaObject === 'object') {
    setSchemaObjectReference(registry, schemaObject as object, mode, finalName);
  }
  return finalName;
}

function registerNamedComponent(
  context: OpenAPIBuilderContext,
  kind: OpenAPIComponentSection,
  registry: ComponentRegistry,
  componentName: string,
  value: Record<string, unknown>,
  source?: object
): string {
  if (source) {
    const existing = registry.byObject.get(source);
    if (existing) return existing;
  }

  const fingerprint = stableSerialize(value);
  const existingEntries = registry.byName.get(componentName) ?? [];
  const reused = existingEntries.find((entry) => entry.fingerprint === fingerprint);
  if (reused) {
    if (source) {
      registry.byObject.set(source, reused.finalName);
    }
    return reused.finalName;
  }

  const compatible = existingEntries.find((entry) => {
    const current = registry.components[entry.finalName];
    return current && (isDeepSubset(current, value) || isDeepSubset(value, current));
  });
  if (compatible) {
    const current = registry.components[compatible.finalName];
    const merged = mergeComponentValue(current, value);
    registry.components[compatible.finalName] = merged;
    compatible.fingerprint = stableSerialize(merged);
    if (source) {
      registry.byObject.set(source, compatible.finalName);
    }
    return compatible.finalName;
  }

  const finalName = resolveRegisteredComponentName(
    registry,
    kind,
    componentName,
    value,
    fingerprint,
    context,
    existingEntries[0]?.finalName
  );

  registry.components[finalName] = value;
  existingEntries.push({ finalName, fingerprint });
  registry.byName.set(componentName, existingEntries);
  if (source) {
    registry.byObject.set(source, finalName);
  }
  return finalName;
}

function toSchemaReference(
  context: OpenAPIBuilderContext,
  registry: SchemaRegistry,
  contract: SchemaContract | undefined,
  mode: 'input' | 'output',
  useRefs: boolean,
  strategy: 'all' | 'named'
): Record<string, unknown> | undefined {
  if (!useRefs) {
    return normalizeOpenAPISchema(contract, mode);
  }

  const name = registerSchemaComponent(context, registry, contract, mode, strategy);
  return name
    ? { $ref: `#/components/schemas/${name}` }
    : normalizeOpenAPISchema(contract, mode);
}

function toServerObject(server: OpenAPIServer): Record<string, unknown> {
  return {
    url: server.url,
    ...(server.description ? { description: server.description } : {}),
    ...(server.variables ? { variables: server.variables } : {}),
  };
}

function toServers(servers: OpenAPIServer[] | undefined): Array<Record<string, unknown>> | undefined {
  return servers?.map(toServerObject);
}

function toExternalDocs(
  externalDocs: OpenAPIExternalDocumentation | undefined
): Record<string, unknown> | undefined {
  if (!externalDocs) return undefined;
  return {
    url: externalDocs.url,
    ...(externalDocs.description ? { description: externalDocs.description } : {}),
  };
}

function toExampleObject(example: OpenAPIExampleObject): Record<string, unknown> {
  return {
    ...(example.summary ? { summary: example.summary } : {}),
    ...(example.description ? { description: example.description } : {}),
    ...(example.value !== undefined ? { value: example.value } : {}),
    ...(example.externalValue ? { externalValue: example.externalValue } : {}),
  };
}

function registerExampleComponent(
  context: OpenAPIBuilderContext,
  example: OpenAPIExampleObject
): string | undefined {
  if (!example.componentName) return undefined;
  return registerNamedComponent(
    context,
    'examples',
    context.exampleRegistry,
    example.componentName,
    toExampleObject(example),
    example
  );
}

function toExampleReferenceOrObject(
  example: OpenAPIExampleObject,
  context: OpenAPIBuilderContext
): Record<string, unknown> {
  const registeredName = registerExampleComponent(context, example);
  return registeredName
    ? { $ref: `#/components/examples/${registeredName}` }
    : toExampleObject(example);
}

function normalizeExampleValue(value: unknown): OpenAPIExampleObject {
  if (isExampleDescriptor(value)) {
    return value;
  }
  return { value };
}

function normalizeExamples(
  examples: unknown
): Record<string, OpenAPIExampleObject> | undefined {
  if (!examples) return undefined;
  if (Array.isArray(examples)) {
    return Object.fromEntries(
      examples.map((value, index) => [`example${index + 1}`, normalizeExampleValue(value)])
    );
  }

  const record = asRecord(examples);
  if (!record) return undefined;

  return Object.fromEntries(
    Object.entries(record).map(([name, value]) => [name, normalizeExampleValue(value)])
  );
}

function toOpenAPIExamples(
  examples: unknown,
  context: OpenAPIBuilderContext
): Record<string, unknown> | undefined {
  const normalized = normalizeExamples(examples);
  if (!normalized || Object.keys(normalized).length === 0) return undefined;

  return Object.fromEntries(
    Object.entries(normalized).map(([name, value]) => [name, toExampleReferenceOrObject(value, context)])
  );
}

function readSchemaExamples(
  schema: Record<string, unknown> | undefined,
  context: OpenAPIBuilderContext
): { example?: unknown; examples?: Record<string, unknown> } {
  if (!schema) return {};
  const example = schema.example;
  const examples = toOpenAPIExamples(schema.examples, context);
  return {
    ...(example !== undefined ? { example } : {}),
    ...(examples ? { examples } : {}),
  };
}

function resolveExampleFields(
  example: unknown,
  examples: unknown,
  schema: Record<string, unknown> | undefined,
  context: OpenAPIBuilderContext
): { example?: unknown; examples?: Record<string, unknown> } {
  const normalizedExamples = toOpenAPIExamples(examples, context);
  if (normalizedExamples) return { examples: normalizedExamples };
  if (example !== undefined) return { example };
  return readSchemaExamples(schema, context);
}

function serializeHeaderObject(
  header: OpenAPIHeaderMetadata,
  context: OpenAPIBuilderContext,
  mode: 'input' | 'output'
): Record<string, unknown> | undefined {
  const normalizedSchema = normalizeOpenAPISchema(header.schema, mode);
  const content = toOpenAPIMediaTypes(header.content, undefined, mode, context);
  const schema = content
    ? undefined
    : toSchemaReference(
        context,
        context.schemaRegistry,
        header.schema,
        mode,
        context.useSchemaRefs,
        context.schemaComponentStrategy
      );
  const exampleFields = resolveExampleFields(header.example, header.examples, normalizedSchema, context);

  if (!schema && !content) return undefined;

  return {
    ...(header.description ? { description: header.description } : {}),
    ...(header.required !== undefined ? { required: header.required } : {}),
    ...(header.deprecated !== undefined ? { deprecated: header.deprecated } : {}),
    ...(header.allowEmptyValue !== undefined ? { allowEmptyValue: header.allowEmptyValue } : {}),
    ...(header.style ? { style: header.style } : {}),
    ...(header.explode !== undefined ? { explode: header.explode } : {}),
    ...(schema ? { schema } : {}),
    ...(content ? { content } : {}),
    ...(exampleFields.example !== undefined ? { example: exampleFields.example } : {}),
    ...(exampleFields.examples ? { examples: exampleFields.examples } : {}),
  };
}

function registerHeaderComponent(
  context: OpenAPIBuilderContext,
  component: OpenAPIHeaderComponent | OpenAPIHeaderMetadata
): string | undefined {
  const componentName = 'header' in component ? component.componentName : component.componentName;
  const header = 'header' in component ? component.header : component;
  if (!componentName) return undefined;

  const serialized = serializeHeaderObject(header, context, 'output');
  if (!serialized) return undefined;

  return registerNamedComponent(
    context,
    'headers',
    context.headerRegistry,
    componentName,
    serialized,
    component as object
  );
}

function toOpenAPIHeaders(
  headers: Record<string, OpenAPIHeaderMetadata> | undefined,
  context: OpenAPIBuilderContext,
  mode: 'input' | 'output'
): Record<string, unknown> | undefined {
  if (!headers || Object.keys(headers).length === 0) return undefined;

  const mapped = Object.fromEntries(
    Object.entries(headers).flatMap(([name, header]) => {
      const serialized = serializeHeaderObject(header, context, mode);
      if (!serialized) return [];

      if (header.componentName) {
        const registeredName = registerNamedComponent(
          context,
          'headers',
          context.headerRegistry,
          header.componentName,
          serialized,
          header
        );
        return [[name, { $ref: `#/components/headers/${registeredName}` }]];
      }

      return [[name, serialized]];
    })
  );

  return Object.keys(mapped).length ? mapped : undefined;
}

function toOpenAPIEncoding(
  encoding: Record<string, OpenAPIEncodingMetadata> | undefined,
  context: OpenAPIBuilderContext
): Record<string, unknown> | undefined {
  if (!encoding || Object.keys(encoding).length === 0) return undefined;

  return Object.fromEntries(
    Object.entries(encoding).map(([name, entry]) => [
      name,
      {
        ...(entry.contentType ? { contentType: entry.contentType } : {}),
        ...(entry.headers ? { headers: toOpenAPIHeaders(entry.headers, context, 'input') } : {}),
        ...(entry.style ? { style: entry.style } : {}),
        ...(entry.explode !== undefined ? { explode: entry.explode } : {}),
        ...(entry.allowReserved !== undefined ? { allowReserved: entry.allowReserved } : {}),
      },
    ])
  );
}

function toOpenAPIMediaTypeObject(
  media: OpenAPIMediaTypeMetadata | undefined,
  fallbackSchema: SchemaContract | undefined,
  mode: 'input' | 'output',
  context: OpenAPIBuilderContext
): Record<string, unknown> | undefined {
  const contract = media?.schema ?? fallbackSchema;
  const normalizedSchema = normalizeOpenAPISchema(contract, mode);
  const schema = toSchemaReference(
    context,
    context.schemaRegistry,
    contract,
    mode,
    context.useSchemaRefs,
    context.schemaComponentStrategy
  );
  const encoding = mode === 'input'
    ? toOpenAPIEncoding(media?.encoding, context)
    : undefined;
  const exampleFields = resolveExampleFields(media?.example, media?.examples, normalizedSchema, context);

  if (!schema && !encoding && exampleFields.example === undefined && !exampleFields.examples) {
    return undefined;
  }

  return {
    ...(schema ? { schema } : {}),
    ...(exampleFields.example !== undefined ? { example: exampleFields.example } : {}),
    ...(exampleFields.examples ? { examples: exampleFields.examples } : {}),
    ...(encoding ? { encoding } : {}),
  };
}

function toOpenAPIMediaTypes(
  content: Record<string, OpenAPIMediaTypeMetadata> | undefined,
  fallback:
    | {
        contentType: string;
        media: OpenAPIMediaTypeMetadata;
      }
    | undefined,
  mode: 'input' | 'output',
  context: OpenAPIBuilderContext
): Record<string, unknown> | undefined {
  const entries = new Map<string, OpenAPIMediaTypeMetadata>();

  for (const [contentType, media] of Object.entries(content ?? {})) {
    entries.set(contentType, media);
  }

  if (fallback) {
    const existing = entries.get(fallback.contentType);
    entries.set(fallback.contentType, {
      ...fallback.media,
      ...existing,
      encoding: existing?.encoding ?? fallback.media.encoding,
    });
  }

  const mapped = Object.fromEntries(
    Array.from(entries.entries()).flatMap(([contentType, media]) => {
      const mediaType = toOpenAPIMediaTypeObject(media, media.schema, mode, context);
      return mediaType ? [[contentType, mediaType]] : [];
    })
  );

  return Object.keys(mapped).length ? mapped : undefined;
}

function serializeParameterObject(
  name: string,
  section: ParameterSection,
  propertySchema: unknown,
  requiredNames: Set<string>,
  metadata: OpenAPIParameterMetadata | undefined,
  context: OpenAPIBuilderContext
): Record<string, unknown> | undefined {
  const propertyRecord = asRecord(propertySchema);
  const content = toOpenAPIMediaTypes(metadata?.content, undefined, 'input', context);
  const schema = content
    ? undefined
    : metadata?.schema
      ? toSchemaReference(
          context,
          context.schemaRegistry,
          metadata.schema,
          'input',
          context.useSchemaRefs,
          context.schemaComponentStrategy
        )
      : propertyRecord;
  const exampleFields = resolveExampleFields(metadata?.example, metadata?.examples, propertyRecord, context);
  const deprecated = metadata?.deprecated ?? (typeof propertyRecord?.deprecated === 'boolean' ? propertyRecord.deprecated : undefined);
  const description = metadata?.description ?? (typeof propertyRecord?.description === 'string' ? propertyRecord.description : undefined);
  const style = metadata?.style ?? (typeof propertyRecord?.style === 'string' ? propertyRecord.style : undefined);
  const explode = metadata?.explode ?? (typeof propertyRecord?.explode === 'boolean' ? propertyRecord.explode : undefined);
  const allowReserved = metadata?.allowReserved ?? (typeof propertyRecord?.allowReserved === 'boolean' ? propertyRecord.allowReserved : undefined);

  if (!schema && !content) return undefined;

  return {
    name,
    in: section === 'param' ? 'path' : section,
    required: section === 'param' ? true : (metadata?.required ?? requiredNames.has(name)),
    ...(schema ? { schema } : {}),
    ...(content ? { content } : {}),
    ...(description ? { description } : {}),
    ...(deprecated !== undefined ? { deprecated } : {}),
    ...(metadata?.allowEmptyValue !== undefined ? { allowEmptyValue: metadata.allowEmptyValue } : {}),
    ...(style ? { style } : {}),
    ...(explode !== undefined ? { explode } : {}),
    ...(allowReserved !== undefined ? { allowReserved } : {}),
    ...(exampleFields.example !== undefined ? { example: exampleFields.example } : {}),
    ...(exampleFields.examples ? { examples: exampleFields.examples } : {}),
  };
}

function toOpenAPIParameters(
  input: RouteRuntimeDefinition['contract']['input'],
  section: ParameterSection,
  parameterMetadata: Record<string, OpenAPIParameterMetadata> | undefined,
  context: OpenAPIBuilderContext
): Array<Record<string, unknown>> {
  const validator = input.parameters[section];
  const schema = normalizeOpenAPISchema(validator, 'input');
  const properties = schema && typeof schema.properties === 'object' && schema.properties
    ? schema.properties as Record<string, unknown>
    : {};
  const required = Array.isArray(schema?.required) ? new Set(schema.required as string[]) : new Set<string>();
  const names = new Set([
    ...Object.keys(properties),
    ...Object.keys(parameterMetadata ?? {}),
  ]);

  return Array.from(names).flatMap((name) => {
    const parameter = serializeParameterObject(
      name,
      section,
      properties[name],
      required,
      parameterMetadata?.[name],
      context
    );
    if (!parameter) return [];

    const componentName = parameterMetadata?.[name]?.componentName;
    if (!componentName) {
      return [parameter];
    }

    const registeredName = registerNamedComponent(
      context,
      'parameters',
      context.parameterRegistry,
      componentName,
      parameter,
      parameterMetadata?.[name]
    );
    return [{ $ref: `#/components/parameters/${registeredName}` }];
  });
}

function registerParameterComponent(
  context: OpenAPIBuilderContext,
  component: OpenAPIParameterComponent
): string | undefined {
  const section = component.in === 'path'
    ? 'param'
    : component.in;
  const parameter = serializeParameterObject(
    component.name,
    section,
    undefined,
    new Set<string>(),
    {
      ...component.parameter,
      required: component.in === 'path' ? true : component.parameter.required,
    },
    context
  );
  if (!parameter) return undefined;

  return registerNamedComponent(
    context,
    'parameters',
    context.parameterRegistry,
    component.componentName,
    parameter,
    component
  );
}

function serializeParameterCollection(
  parameters: OpenAPIParameterCollection | undefined,
  input: RouteRuntimeDefinition['contract']['input'],
  context: OpenAPIBuilderContext
): Array<Record<string, unknown>> {
  return [
    ...toOpenAPIParameters(input, 'param', parameters?.param, context),
    ...toOpenAPIParameters(input, 'query', parameters?.query, context),
    ...toOpenAPIParameters(input, 'header', parameters?.header, context),
    ...toOpenAPIParameters(input, 'cookie', parameters?.cookie, context),
  ];
}

function resolveRequestBodyContentType(
  requestMetadata: OpenAPIRequestBodyMetadata | undefined,
  validator: RouteRuntimeDefinition['validators'][number] | undefined
): string {
  return requestMetadata?.contentType
    ?? requestBodyContentTypeForTarget(validator?.target ?? '')
    ?? 'application/json';
}

function toOpenAPIRequestBody(
  requestMetadata: OpenAPIRequestBodyMetadata | undefined,
  validator: RouteRuntimeDefinition['validators'][number] | undefined,
  context: OpenAPIBuilderContext
): Record<string, unknown> | undefined {
  const fallbackSchema = requestMetadata?.schema ?? validator;
  const contentType = resolveRequestBodyContentType(requestMetadata, validator);
  const content = toOpenAPIMediaTypes(
    requestMetadata?.content,
    fallbackSchema || requestMetadata?.example !== undefined || requestMetadata?.examples || requestMetadata?.encoding
      ? {
          contentType,
          media: {
            schema: fallbackSchema,
            example: requestMetadata?.example,
            examples: requestMetadata?.examples,
            encoding: requestMetadata?.encoding,
          },
        }
      : undefined,
    'input',
    context
  );

  if (!content) return undefined;

  const requestBodyObject = {
    required: requestMetadata?.required ?? true,
    ...(requestMetadata?.description ? { description: requestMetadata.description } : {}),
    content,
  };

  if (requestMetadata?.componentName) {
    const registeredName = registerNamedComponent(
      context,
      'requestBodies',
      context.requestBodyRegistry,
      requestMetadata.componentName,
      requestBodyObject,
      requestMetadata
    );
    return { $ref: `#/components/requestBodies/${registeredName}` };
  }

  return requestBodyObject;
}

function registerRequestBodyComponent(
  context: OpenAPIBuilderContext,
  component: OpenAPIRequestBodyComponent
): string | undefined {
  const requestBody = toOpenAPIRequestBody(
    { ...component.requestBody, componentName: undefined },
    undefined,
    context
  );
  if (!requestBody) return undefined;

  return registerNamedComponent(
    context,
    'requestBodies',
    context.requestBodyRegistry,
    component.componentName,
    requestBody,
    component
  );
}

function serializeLinkObject(link: OpenAPILinkMetadata): Record<string, unknown> {
  return {
    ...(link.operationRef ? { operationRef: link.operationRef } : {}),
    ...(link.operationId ? { operationId: link.operationId } : {}),
    ...(link.parameters ? { parameters: link.parameters } : {}),
    ...(link.requestBody !== undefined ? { requestBody: link.requestBody } : {}),
    ...(link.description ? { description: link.description } : {}),
    ...(link.server ? { server: toServerObject(link.server) } : {}),
  };
}

function registerLinkComponent(
  context: OpenAPIBuilderContext,
  component: OpenAPILinkComponent | OpenAPILinkMetadata
): string | undefined {
  const componentName = 'link' in component ? component.componentName : component.componentName;
  const link = 'link' in component ? component.link : component;
  if (!componentName) return undefined;
  return registerNamedComponent(
    context,
    'links',
    context.linkRegistry,
    componentName,
    serializeLinkObject(link),
    component as object
  );
}

function toOpenAPILinks(
  links: Record<string, OpenAPILinkMetadata> | undefined,
  context: OpenAPIBuilderContext
): Record<string, unknown> | undefined {
  if (!links || Object.keys(links).length === 0) return undefined;

  return Object.fromEntries(
    Object.entries(links).map(([name, link]) => {
      const registeredName = registerLinkComponent(context, link);
      return [
        name,
        registeredName
          ? { $ref: `#/components/links/${registeredName}` }
          : serializeLinkObject(link),
      ];
    })
  );
}

function inferResponseHeaders(
  response: OpenAPIResponseMetadata,
  content: Record<string, unknown> | undefined,
  existingHeaders: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!content) return existingHeaders;
  const hasContentType = Object.keys(existingHeaders ?? {}).some((name) => name.toLowerCase() === 'content-type');
  if (hasContentType) return existingHeaders;

  const contentTypes = Object.keys(content);
  if (contentTypes.length === 0) return existingHeaders;

  const nextHeaders = { ...(existingHeaders ?? {}) };
  nextHeaders['content-type'] = {
    description: response.contentType
      ? 'Response content type'
      : 'One of the available response content types',
    schema: {
      type: 'string',
      ...(contentTypes.length === 1 ? { enum: [contentTypes[0]] } : { enum: contentTypes }),
    },
    ...(contentTypes.length === 1 ? { example: contentTypes[0] } : {}),
  };
  return nextHeaders;
}

function buildResponseObject(
  response: OpenAPIResponseMetadata,
  context: OpenAPIBuilderContext
): Record<string, unknown> {
  const content = toOpenAPIMediaTypes(
    response.content,
    response.schema || response.example !== undefined || response.examples
      ? {
          contentType: response.contentType ?? 'application/json',
          media: {
            schema: response.schema,
            example: response.example,
            examples: response.examples,
          },
        }
      : undefined,
    'output',
    context
  );
  const baseHeaders = toOpenAPIHeaders(response.headers, context, 'output');
  const headers = context.inferResponseHeaders
    ? inferResponseHeaders(response, content, baseHeaders)
    : baseHeaders;
  const links = toOpenAPILinks(response.links, context);

  return {
    description: response.description ?? 'Success',
    ...(headers ? { headers } : {}),
    ...(content ? { content } : {}),
    ...(links ? { links } : {}),
  };
}

function buildValidationErrorResponses(
  validators: readonly ValidatorContractMetadata[],
  explicitResponses: Record<number, OpenAPIResponseMetadata<any>> | undefined
): Record<number, OpenAPIResponseMetadata<any>> {
  if (validators.length === 0) return {};

  const existingStatuses = new Set(Object.keys(explicitResponses ?? {}).map((status) => Number(status)));
  const generated: Record<number, OpenAPIResponseMetadata<any>> = {};

  for (const validator of validators) {
    const status = validator.errorStatus
      ?? (validator.target === 'json' || validator.target === 'form' || validator.target === 'text'
        ? 422
        : 400);
    if (existingStatuses.has(status)) continue;

    const nextResponse = validator.errorResponse ?? DEFAULT_VALIDATION_ERROR_RESPONSE;
    const currentResponse = generated[status];
    if (!currentResponse) {
      generated[status] = nextResponse;
      continue;
    }

    if (currentResponse === DEFAULT_VALIDATION_ERROR_RESPONSE && validator.errorResponse) {
      generated[status] = validator.errorResponse;
    }
  }

  return generated;
}

function buildSecurityErrorResponses(
  operation: OpenAPIOperationMetadata | undefined,
  middlewareMetadata: readonly OpenAPIMiddlewareMetadata[] | undefined,
  explicitResponses: Record<number, OpenAPIResponseMetadata<any>> | undefined
): Record<number, OpenAPIResponseMetadata<any>> {
  const existingStatuses = new Set(Object.keys(explicitResponses ?? {}).map((status) => Number(status)));
  const generated: Record<number, OpenAPIResponseMetadata<any>> = {};

  const addStatus = (
    status: number,
    response: OpenAPIResponseMetadata | undefined
  ): void => {
    if (existingStatuses.has(status) || generated[status]) return;
    generated[status] = response
      ?? (status === 401
        ? DEFAULT_UNAUTHORIZED_RESPONSE
        : status === 403
          ? DEFAULT_FORBIDDEN_RESPONSE
          : DEFAULT_VALIDATION_ERROR_RESPONSE);
  };

  if (operation?.security?.length) {
    addStatus(401, DEFAULT_UNAUTHORIZED_RESPONSE);
    addStatus(403, DEFAULT_FORBIDDEN_RESPONSE);
  }

  for (const metadata of middlewareMetadata ?? []) {
    for (const [status, response] of Object.entries(metadata.responses ?? {})) {
      addStatus(Number(status), response);
    }
    for (const status of metadata.responseStatuses ?? []) {
      addStatus(status, undefined);
    }
  }

  return generated;
}

function buildNotFoundResponse(
  definition: Pick<RouteRuntimeDefinition, 'path' | 'method'>,
  explicitResponses: Record<number, OpenAPIResponseMetadata<any>> | undefined
): Record<number, OpenAPIResponseMetadata<any>> {
  const existingStatuses = new Set(Object.keys(explicitResponses ?? {}).map((status) => Number(status)));
  if (existingStatuses.has(404)) return {};
  if (!definition.path.includes(':')) return {};
  if (definition.method === 'POST' || definition.method === 'OPTIONS' || definition.method === 'HEAD') {
    return {};
  }
  return { 404: DEFAULT_NOT_FOUND_RESPONSE };
}

function toOpenAPIResponses(
  definition: Pick<RouteRuntimeDefinition, 'path' | 'method' | 'middlewareOpenAPI'>,
  operation: OpenAPIOperationMetadata | undefined,
  responses: Record<number, OpenAPIResponseMetadata<any>> | undefined,
  validators: readonly ValidatorContractMetadata[],
  context: OpenAPIBuilderContext
): Record<string, unknown> {
  const mergedResponses: Record<number, OpenAPIResponseMetadata<any>> = {
    ...(context.validationErrorResponses ? buildValidationErrorResponses(validators, responses) : {}),
    ...buildSecurityErrorResponses(operation, definition.middlewareOpenAPI, responses),
    ...buildNotFoundResponse(definition, responses),
    ...(responses ?? {}),
  };

  if (Object.keys(mergedResponses).length === 0) {
    return {
      '200': {
        description: 'Success',
      },
    };
  }

  return Object.fromEntries(
    Object.entries(mergedResponses).map(([status, response]) => {
      const responseObject = buildResponseObject(response, context);
      if (!response.componentName) {
        return [status, responseObject];
      }

      const registeredName = registerNamedComponent(
        context,
        'responses',
        context.responseRegistry,
        response.componentName,
        responseObject,
        response
      );
      return [status, { $ref: `#/components/responses/${registeredName}` }];
    })
  );
}

function registerResponseComponent(
  context: OpenAPIBuilderContext,
  component: OpenAPIResponseComponent
): string {
  return registerNamedComponent(
    context,
    'responses',
    context.responseRegistry,
    component.componentName,
    buildResponseObject(component.response, context),
    component
  );
}

function registerSecuritySchemeComponent(
  context: OpenAPIBuilderContext,
  registry: ComponentRegistry,
  securityScheme: OpenAPISecuritySchemeComponent
): string {
  return registerNamedComponent(
    context,
    'securitySchemes',
    registry,
    securityScheme.componentName,
    securityScheme.scheme as unknown as Record<string, unknown>,
    securityScheme
  );
}

function dedupeSecurityRequirements(
  requirements: OpenAPISecurityRequirement[]
): OpenAPISecurityRequirement[] {
  const seen = new Set<string>();
  const result: OpenAPISecurityRequirement[] = [];

  for (const requirement of requirements) {
    const key = stableSerialize({
      scheme: typeof requirement.scheme === 'string'
        ? requirement.scheme
        : requirement.scheme.componentName,
      scopes: requirement.scopes ?? [],
    });
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(requirement);
  }

  return result;
}

function toOpenAPISecurity(
  operation: OpenAPIOperationMetadata | undefined,
  middlewareMetadata: readonly OpenAPIMiddlewareMetadata[] | undefined,
  context: OpenAPIBuilderContext
): Array<Record<string, string[]>> | undefined {
  const securitySchemes = [
    ...(middlewareMetadata?.flatMap((metadata) => metadata.securitySchemes ?? []) ?? []),
    ...(operation?.securitySchemes ?? []),
  ];
  const requirements = dedupeSecurityRequirements([
    ...(middlewareMetadata?.flatMap((metadata) => metadata.security ?? []) ?? []),
    ...(operation?.security ?? []),
  ]);

  for (const securityScheme of securitySchemes) {
    registerSecuritySchemeComponent(context, context.securitySchemeRegistry, securityScheme);
  }

  if (!requirements.length) return undefined;

  return requirements.map((requirement) => {
    if (typeof requirement.scheme === 'string') {
      return { [requirement.scheme]: requirement.scopes ?? [] };
    }

    const registeredName = registerSecuritySchemeComponent(context, context.securitySchemeRegistry, requirement.scheme);
    return { [registeredName]: requirement.scopes ?? [] };
  });
}

function serializePathItemMetadata(
  path: OpenAPIPathItemMetadata | undefined,
  context: OpenAPIBuilderContext
): Record<string, unknown> {
  const parameters = serializeParameterCollection(path?.parameters, EMPTY_ROUTE_INPUT_CONTRACT, context);

  return {
    ...(path?.summary ? { summary: path.summary } : {}),
    ...(path?.description ? { description: path.description } : {}),
    ...(path?.servers ? { servers: toServers(path.servers) } : {}),
    ...(parameters.length ? { parameters } : {}),
  };
}

function registerPathItemComponent(
  context: OpenAPIBuilderContext,
  component: OpenAPIPathItemComponent | OpenAPIPathItemObject
): string | undefined {
  const componentName = 'pathItem' in component ? component.componentName : component.componentName;
  const pathItem = 'pathItem' in component ? component.pathItem : component;
  if (!componentName) return undefined;

  const serialized = serializeCallbackPathItem(
    { ...pathItem, componentName: undefined },
    context
  );

  return registerNamedComponent(
    context,
    'pathItems',
    context.pathItemRegistry,
    componentName,
    serialized,
    component as object
  );
}

function mergePathItem(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): void {
  if (!('summary' in target) && 'summary' in source) {
    target.summary = source.summary;
  }
  if (!('description' in target) && 'description' in source) {
    target.description = source.description;
  }
  if (!('servers' in target) && 'servers' in source) {
    target.servers = source.servers;
  }

  const targetParameters = Array.isArray(target.parameters) ? target.parameters as Array<Record<string, unknown>> : [];
  const sourceParameters = Array.isArray(source.parameters) ? source.parameters as Array<Record<string, unknown>> : [];
  if (sourceParameters.length) {
    const seen = new Set(targetParameters.map((parameter) => (
      '$ref' in parameter
        ? String(parameter.$ref)
        : `${String(parameter.in)}:${String(parameter.name)}`
    )));
    for (const parameter of sourceParameters) {
      const key = '$ref' in parameter
        ? String(parameter.$ref)
        : `${String(parameter.in)}:${String(parameter.name)}`;
      if (!seen.has(key)) {
        targetParameters.push(parameter);
        seen.add(key);
      }
    }
    if (targetParameters.length) {
      target.parameters = targetParameters;
    }
  }
}

function serializeOperation(
  operation: OpenAPIOperationMetadata | undefined,
  routeContract: RouteRuntimeDefinition['contract'],
  routeInfo: Pick<RouteRuntimeDefinition, 'path' | 'method' | 'middlewareOpenAPI'>,
  context: OpenAPIBuilderContext
): Record<string, unknown> {
  const parameters = serializeParameterCollection(operation?.parameters, routeContract.input, context);
  const bodyValidator = routeContract.input.body;
  const requestBody = toOpenAPIRequestBody(operation?.requestBody, bodyValidator, context);
  const security = toOpenAPISecurity(operation, routeInfo.middlewareOpenAPI, context);
  const callbacks = toOpenAPICallbacks(operation?.callbacks, context);
  const externalDocs = toExternalDocs(operation?.externalDocs);
  const servers = toServers(operation?.servers);

  return {
    ...(operation?.operationId ? { operationId: operation.operationId } : {}),
    ...(operation?.summary ? { summary: operation.summary } : {}),
    ...(operation?.description ? { description: operation.description } : {}),
    ...(operation?.tags ? { tags: operation.tags } : {}),
    ...(externalDocs ? { externalDocs } : {}),
    ...(servers ? { servers } : {}),
    ...(operation?.deprecated ? { deprecated: operation.deprecated } : {}),
    ...(parameters.length ? { parameters } : {}),
    ...(requestBody ? { requestBody } : {}),
    ...(security ? { security } : {}),
    ...(callbacks ? { callbacks } : {}),
    responses: toOpenAPIResponses(
      routeInfo,
      operation,
      Object.keys(routeContract.responses).length ? routeContract.responses : operation?.responses,
      [
        ...Object.values(routeContract.input.parameters).filter(Boolean),
        ...(bodyValidator ? [bodyValidator] : []),
      ],
      context
    ),
  };
}

function serializeCallbackPathItem(
  pathItem: OpenAPICallbackPathItem,
  context: OpenAPIBuilderContext
): Record<string, unknown> {
  const base = serializePathItemMetadata(pathItem, context);
  const methods = Object.fromEntries(
    HTTP_METHODS.flatMap((method) => {
      const operation = pathItem[method as OpenAPIOperationMethod];
      return operation ? [[
        method,
        serializeOperation(
          operation,
          { input: EMPTY_ROUTE_INPUT_CONTRACT, responses: Object.fromEntries(getRouteOperationResponses(operation)) },
          { path: '', method: method.toUpperCase(), middlewareOpenAPI: [] },
          context
        ),
      ]] : [];
    })
  );

  return {
    ...base,
    ...methods,
  };
}

function registerCallbackComponent(
  context: OpenAPIBuilderContext,
  component: OpenAPICallbackComponent
): string | undefined {
  if (!component.componentName) return undefined;

  const serialized = Object.fromEntries(
    Object.entries(component.callback).map(([expression, pathItem]) => [
      expression,
      serializeCallbackPathItem(pathItem, context),
    ])
  );

  return registerNamedComponent(
    context,
    'callbacks',
    context.callbackRegistry,
    component.componentName,
    serialized,
    component
  );
}

function toOpenAPIWebhooks(
  webhooks: OpenAPIWebhookMetadata | undefined,
  context: OpenAPIBuilderContext
): Record<string, unknown> | undefined {
  if (!webhooks || Object.keys(webhooks).length === 0) return undefined;

  return Object.fromEntries(
    Object.entries(webhooks).map(([name, webhook]) => {
      const componentName = webhook.componentName;
      if (componentName) {
        const registeredName = registerPathItemComponent(context, webhook);
        return [name, { $ref: `#/components/pathItems/${registeredName}` }];
      }

      const pathItem = 'pathItem' in webhook ? webhook.pathItem : webhook;
      return [name, serializeCallbackPathItem(pathItem, context)];
    })
  );
}

function toOpenAPICallbacks(
  callbacks: OpenAPICallbackMetadata | undefined,
  context: OpenAPIBuilderContext
): Record<string, unknown> | undefined {
  if (!callbacks || Object.keys(callbacks).length === 0) return undefined;

  return Object.fromEntries(
    Object.entries(callbacks).map(([name, callbackValue]) => {
      if (isCallbackComponent(callbackValue)) {
        const registeredName = registerCallbackComponent(context, callbackValue);
        return [name, { $ref: `#/components/callbacks/${registeredName}` }];
      }

      return [
        name,
        Object.fromEntries(
          Object.entries(callbackValue).map(([expression, pathItem]) => [
            expression,
            serializeCallbackPathItem(pathItem, context),
          ])
        ),
      ];
    })
  );
}

function toTags(tags: OpenAPITag[] | undefined): Array<Record<string, unknown>> | undefined {
  if (!tags || tags.length === 0) return undefined;
  return tags.map((tag) => ({
    name: tag.name,
    ...(tag.description ? { description: tag.description } : {}),
    ...(tag.externalDocs ? { externalDocs: toExternalDocs(tag.externalDocs) } : {}),
  }));
}

export function createOpenAPIDocument(
  app: OpenAPIReadable,
  options: OpenAPIDocumentOptions
): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {};
  const context: OpenAPIBuilderContext = {
    schemaRegistry: createSchemaRegistry(),
    parameterRegistry: createComponentRegistry(),
    responseRegistry: createComponentRegistry(),
    requestBodyRegistry: createComponentRegistry(),
    pathItemRegistry: createComponentRegistry(),
    securitySchemeRegistry: createComponentRegistry(),
    headerRegistry: createComponentRegistry(),
    exampleRegistry: createComponentRegistry(),
    linkRegistry: createComponentRegistry(),
    callbackRegistry: createComponentRegistry(),
    useSchemaRefs: options.schemaRefs ?? true,
    schemaComponentStrategy: options.schemaComponentStrategy ?? 'all',
    inferResponseHeaders: options.inferResponseHeaders ?? true,
    validationErrorResponses: options.validationErrorResponses ?? true,
    componentConflicts: {
      schemas: 'rename',
      parameters: 'rename',
      responses: 'rename',
      requestBodies: 'rename',
      pathItems: 'rename',
      securitySchemes: 'rename',
      headers: 'rename',
      examples: 'rename',
      links: 'rename',
      callbacks: 'rename',
      ...(typeof options.componentConflicts === 'string'
        ? {
            schemas: options.componentConflicts,
            parameters: options.componentConflicts,
            responses: options.componentConflicts,
            requestBodies: options.componentConflicts,
            pathItems: options.componentConflicts,
            securitySchemes: options.componentConflicts,
            headers: options.componentConflicts,
            examples: options.componentConflicts,
            links: options.componentConflicts,
            callbacks: options.componentConflicts,
          }
        : options.componentConflicts ?? {}),
    },
    resolveComponentName: options.resolveComponentName ?? defaultResolveComponentName,
  };

  for (const securityScheme of options.securitySchemes ?? []) {
    registerSecuritySchemeComponent(context, context.securitySchemeRegistry, securityScheme);
  }
  for (const component of options.headerComponents ?? []) {
    registerHeaderComponent(context, component);
  }
  for (const component of options.exampleComponents ?? []) {
    registerExampleComponent(context, {
      componentName: component.componentName,
      ...component.example,
    });
  }
  for (const component of options.linkComponents ?? []) {
    registerLinkComponent(context, component);
  }
  for (const component of options.callbackComponents ?? []) {
    registerCallbackComponent(context, component);
  }
  for (const component of options.parameterComponents ?? []) {
    registerParameterComponent(context, component);
  }
  for (const component of options.responseComponents ?? []) {
    registerResponseComponent(context, component);
  }
  for (const component of options.requestBodyComponents ?? []) {
    registerRequestBodyComponent(context, component);
  }
  for (const component of options.pathItemComponents ?? []) {
    registerPathItemComponent(context, component);
  }

  for (const definition of app.getRouteDefinitions()) {
    const openAPIPath = definition.path.replace(/:([^/]+)/g, '{$1}');
    const pathItem = paths[openAPIPath] ??= {};
    const pathMetadata = serializePathItemMetadata(definition.openapi?.path, context);
    if (definition.openapi?.path?.componentName && !('$ref' in pathItem)) {
      const registeredName = registerPathItemComponent(context, definition.openapi.path);
      if (registeredName) {
        pathItem.$ref = `#/components/pathItems/${registeredName}`;
      }
    }
    mergePathItem(pathItem, pathMetadata);
    pathItem[definition.method.toLowerCase()] = serializeOperation(
      definition.openapi,
      definition.contract,
      { path: definition.path, method: definition.method, middlewareOpenAPI: definition.middlewareOpenAPI },
      context
    );
  }

  const webhooks = toOpenAPIWebhooks(options.webhooks, context);

  const components: Record<string, unknown> = {};
  if (Object.keys(context.schemaRegistry.components).length) {
    components.schemas = context.schemaRegistry.components;
  }
  if (Object.keys(context.parameterRegistry.components).length) {
    components.parameters = context.parameterRegistry.components;
  }
  if (Object.keys(context.responseRegistry.components).length) {
    components.responses = context.responseRegistry.components;
  }
  if (Object.keys(context.requestBodyRegistry.components).length) {
    components.requestBodies = context.requestBodyRegistry.components;
  }
  if (Object.keys(context.pathItemRegistry.components).length) {
    components.pathItems = context.pathItemRegistry.components;
  }
  if (Object.keys(context.securitySchemeRegistry.components).length) {
    components.securitySchemes = context.securitySchemeRegistry.components;
  }
  if (Object.keys(context.headerRegistry.components).length) {
    components.headers = context.headerRegistry.components;
  }
  if (Object.keys(context.exampleRegistry.components).length) {
    components.examples = context.exampleRegistry.components;
  }
  if (Object.keys(context.linkRegistry.components).length) {
    components.links = context.linkRegistry.components;
  }
  if (Object.keys(context.callbackRegistry.components).length) {
    components.callbacks = context.callbackRegistry.components;
  }

  return {
    openapi: '3.1.0',
    info: {
      title: options.info.title,
      version: options.info.version,
      ...(options.info.description ? { description: options.info.description } : {}),
      ...(options.info.termsOfService ? { termsOfService: options.info.termsOfService } : {}),
      ...(options.info.contact ? { contact: options.info.contact } : {}),
      ...(options.info.license ? { license: options.info.license } : {}),
    },
    ...(options.servers ? { servers: toServers(options.servers) } : {}),
    ...(options.tags ? { tags: toTags(options.tags) } : {}),
    ...(options.externalDocs ? { externalDocs: toExternalDocs(options.externalDocs) } : {}),
    paths,
    ...(webhooks ? { webhooks } : {}),
    ...(Object.keys(components).length ? { components } : {}),
  };
}

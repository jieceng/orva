import test from 'node:test';
import assert from 'node:assert/strict';

import { z } from 'zod';

import { createOrva } from '../../src/index.ts';
import {
  createOpenAPIDocument,
  defineComponent,
  defineCallback,
  defineExample,
  defineHeader,
  defineLink,
  definePathItem,
  defineResponse,
  defineRequestBody,
  defineSecurityScheme,
  describeRoute,
  requireSecurity,
} from '../../src/openapi/index.ts';
import { zodOpenAPISchema } from '../../src/openapi/zod.ts';
import { apiKeyAuth, basicAuth, bearerAuth } from '../../src/middlewares/index.ts';
import { validator } from '../../src/validator/index.ts';
import { zodValidator } from '../../src/validator/zod.ts';

test('openapi contract generates request and response schemas from route metadata', () => {
  const userSchema = z.object({ id: z.string(), name: z.string() });
  const app = createOrva().post(
    '/users/:id',
    zodValidator('json', z.object({ name: z.string() })),
    zodValidator('param', z.object({ id: z.string() })),
    zodValidator('query', z.object({ mode: z.string() })),
    describeRoute({
      operationId: 'createUser',
      summary: 'Create user',
      responses: {
        201: {
          description: 'Created',
          schema: zodOpenAPISchema(userSchema, { componentName: 'User' }),
        },
      },
    }),
    (c) => c.json({ id: c.valid('param').id, name: c.valid('json').name }, 201)
  );

  const document = createOpenAPIDocument(app, {
    info: { title: 'Orva API', version: '1.0.0' },
  });

  const paths = document.paths as Record<string, Record<string, any>>;
  const operation = paths['/users/{id}']?.post;

  assert.equal(operation.operationId, 'createUser');
  assert.equal(operation.summary, 'Create user');
  assert.equal(operation.requestBody.content['application/json'].schema.$ref, '#/components/schemas/zod_input_1');
  assert.equal(operation.responses['201'].content['application/json'].schema.$ref, '#/components/schemas/User');
  assert.equal(Array.isArray(operation.parameters), true);
  assert.equal(operation.parameters.some((item: { in: string; name: string }) => item.in === 'path' && item.name === 'id'), true);
  assert.equal(operation.parameters.some((item: { in: string; name: string }) => item.in === 'query' && item.name === 'mode'), true);
  const components = (document.components as { schemas: Record<string, unknown> }).schemas;
  assert.equal('User' in components, true);
  assert.equal('zod_input_1' in components, true);
});

test('openapi components reuse named parameters, responses, and security schemes across operations', () => {
  const bearerAuthScheme = defineSecurityScheme('bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });
  const userSchema = z.object({ id: z.string(), name: z.string() });
  const idParameter = {
    componentName: 'UserIdParam',
    description: 'User id',
  };
  const userResponse = {
    componentName: 'UserResponse',
    description: 'User',
    schema: zodOpenAPISchema(userSchema, { componentName: 'User' }),
  } as const;

  const app = createOrva()
    .get(
      '/users/:id',
      zodValidator('param', z.object({ id: z.string() })),
      describeRoute({
        parameters: {
          param: {
            id: idParameter,
          },
        },
        securitySchemes: [bearerAuthScheme],
        security: [requireSecurity(bearerAuthScheme)],
        responses: {
          200: userResponse,
        },
      }),
      (c) => c.json({ id: c.valid('param').id, name: 'user' })
    )
    .get(
      '/admins/:id',
      zodValidator('param', z.object({ id: z.string() })),
      describeRoute({
        parameters: {
          param: {
            id: idParameter,
          },
        },
        security: [requireSecurity(bearerAuthScheme, ['admin:read'])],
        responses: {
          200: userResponse,
        },
      }),
      (c) => c.json({ id: c.valid('param').id, name: 'admin' })
    );

  const document = createOpenAPIDocument(app, {
    info: { title: 'Orva API', version: '1.0.0' },
    schemaComponentStrategy: 'named',
    validationErrorResponses: false,
  });

  const paths = document.paths as Record<string, Record<string, any>>;
  assert.equal(paths['/users/{id}']?.get.parameters[0].$ref, '#/components/parameters/UserIdParam');
  assert.equal(paths['/admins/{id}']?.get.parameters[0].$ref, '#/components/parameters/UserIdParam');
  assert.equal(paths['/users/{id}']?.get.responses['200'].$ref, '#/components/responses/UserResponse');
  assert.equal(paths['/admins/{id}']?.get.responses['200'].$ref, '#/components/responses/UserResponse');
  assert.equal(paths['/users/{id}']?.get.responses['401'].$ref, '#/components/responses/UnauthorizedErrorResponse');
  assert.equal(paths['/users/{id}']?.get.responses['403'].$ref, '#/components/responses/ForbiddenErrorResponse');
  assert.equal(paths['/users/{id}']?.get.responses['404'].$ref, '#/components/responses/NotFoundErrorResponse');
  assert.deepEqual(paths['/users/{id}']?.get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(paths['/admins/{id}']?.get.security, [{ bearerAuth: ['admin:read'] }]);

  const components = document.components as {
    schemas: Record<string, any>;
    parameters: Record<string, any>;
    responses: Record<string, any>;
    securitySchemes: Record<string, any>;
  };

  assert.equal(components.parameters.UserIdParam.in, 'path');
  assert.equal(components.parameters.UserIdParam.name, 'id');
  assert.equal(components.responses.UserResponse.content['application/json'].schema.$ref, '#/components/schemas/User');
  assert.equal(components.securitySchemes.bearerAuth.scheme, 'bearer');
});

test('openapi schema component strategy can limit refs to named schemas only', () => {
  const app = createOrva().post(
    '/users',
    zodValidator('json', z.object({ name: z.string() })),
    describeRoute({
      responses: {
        200: {
          description: 'User',
          schema: zodOpenAPISchema(z.object({ id: z.string() }), { componentName: 'NamedUser' }),
        },
      },
    }),
    (c) => c.json({ id: c.valid('json').name })
  );

  const document = createOpenAPIDocument(app, {
    info: { title: 'Orva API', version: '1.0.0' },
    schemaComponentStrategy: 'named',
    validationErrorResponses: false,
  });

  const operation = (document.paths as Record<string, Record<string, any>>)['/users']?.post;
  assert.equal(operation.requestBody.content['application/json'].schema.$ref, undefined);
  assert.equal(operation.responses['200'].content['application/json'].schema.$ref, '#/components/schemas/NamedUser');

  const components = (document.components as { schemas: Record<string, unknown> }).schemas;
  assert.deepEqual(Object.keys(components), ['NamedUser']);
});

test('openapi supports richer headers, callbacks, links, examples, and validator-derived parameter constraints', () => {
  const stringSchema = (schema: Record<string, unknown>) => ({
    provider: 'custom',
    schema,
  });
  const traceIdParameter = defineComponent('parameter', 'TraceIdHeaderParam', {
    name: 'x-trace-id',
    in: 'header',
    parameter: {
      description: 'Trace id',
      schema: stringSchema({ type: 'string', minLength: 8 }),
      example: 'trace-12345678',
    },
  });
  const rateLimitHeader = defineHeader('RateLimitRemaining', {
    description: 'Remaining quota',
    schema: stringSchema({ type: 'integer', minimum: 0 }),
    example: 10,
  });
  const queuedExample = defineExample('QueuedExample', {
    summary: 'Queued callback',
    value: { queued: true },
  });
  const selfLink = defineLink('EventSelfLink', {
    operationId: 'getEvent',
    parameters: {
      id: '$request.path.id',
    },
  });
  const requestBodyComponent = defineRequestBody('EventWebhookRequestBody', {
    description: 'Webhook payload',
    example: {
      callbackUrl: 'https://example.com/callback',
      event: 'created',
    },
    encoding: {
      callbackUrl: {
        contentType: 'text/uri-list',
        headers: {
          'x-callback-format': {
            description: 'Callback format',
            schema: stringSchema({ type: 'string' }),
          },
        },
      },
    },
  });
  const pathItemComponent = definePathItem('EventPathItem', {
    summary: 'Event collection path',
    description: 'Shared metadata for event routes',
    parameters: {
      header: {
        'x-api-version': {
          schema: stringSchema({ type: 'string' }),
          example: '2026-04',
        },
      },
    },
  });
  const eventCallback = defineCallback('EventDeliveryCallback', {
    '{$request.body#/callbackUrl}': {
      summary: 'Event callback',
      description: 'Delivery callback endpoint',
      servers: [{ url: 'https://callbacks.example.com' }],
      parameters: {
        header: {
          'x-callback-token': {
            schema: stringSchema({ type: 'string', minLength: 12 }),
          },
        },
      },
      post: {
        requestBody: {
          content: {
            'application/json': {
              example: { delivered: true },
            },
          },
        },
        responses: {
          202: {
            description: 'Accepted',
            content: {
              'application/json': {
                examples: {
                  queued: {
                    componentName: queuedExample.componentName,
                    ...queuedExample.example,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const app = createOrva().post(
    '/events/:id',
    validator('query', (value) => value, {
      schema: {
        provider: 'custom',
        schema: {
          type: 'object',
          properties: {
            search: {
              type: 'string',
              minLength: 2,
              description: 'Search query',
              example: 'orva',
              examples: ['orva', 'micro'],
            },
          },
          required: ['search'],
        },
      },
    }),
    validator('cookie', (value) => value, {
      schema: {
        provider: 'custom',
        schema: {
          type: 'object',
          properties: {
            session: {
              type: 'string',
              minLength: 16,
            },
          },
          required: ['session'],
        },
      },
    }),
    zodValidator('json', z.object({ callbackUrl: z.string().url(), event: z.string() })),
    describeRoute({
      externalDocs: {
        url: 'https://docs.example.com/events#create',
        description: 'Create event docs',
      },
      path: {
        componentName: pathItemComponent.componentName,
        ...pathItemComponent.pathItem,
      },
      servers: [
        {
          url: 'https://{region}.api.example.com',
          variables: {
            region: {
              default: 'cn',
              enum: ['cn', 'us'],
            },
          },
        },
      ],
      parameters: {
        header: {
          'x-trace-id': {
            componentName: traceIdParameter.componentName,
            ...traceIdParameter.parameter,
          },
        },
      },
      requestBody: {
        componentName: requestBodyComponent.componentName,
        ...requestBodyComponent.requestBody,
      },
      callbacks: {
        onEvent: eventCallback,
      },
      responses: {
        200: {
          description: 'Delivered',
          content: {
            'application/json': {
              schema: zodOpenAPISchema(z.object({ ok: z.boolean() }), { componentName: 'DeliveryResult' }),
              examples: {
                success: {
                  value: { ok: true },
                },
              },
            },
          },
          headers: {
            'x-rate-limit-remaining': {
              componentName: rateLimitHeader.componentName,
              ...rateLimitHeader.header,
            },
          },
          links: {
            self: {
              componentName: selfLink.componentName,
              ...selfLink.link,
            },
          },
        },
      },
    }),
    (c) => c.json({ ok: true })
  );

  const document = createOpenAPIDocument(app, {
    info: {
      title: 'Orva API',
      version: '1.0.0',
      termsOfService: 'https://example.com/terms',
      contact: {
        name: 'Orva Team',
        email: 'team@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://api.example.com',
        description: 'Primary server',
      },
    ],
    tags: [
      {
        name: 'events',
        description: 'Event operations',
        externalDocs: {
          url: 'https://docs.example.com/tags/events',
        },
      },
    ],
    externalDocs: {
      url: 'https://docs.example.com/openapi',
      description: 'Full API docs',
    },
    headerComponents: [rateLimitHeader],
    exampleComponents: [queuedExample],
    linkComponents: [selfLink],
    callbackComponents: [eventCallback],
    parameterComponents: [traceIdParameter],
    requestBodyComponents: [requestBodyComponent],
    pathItemComponents: [pathItemComponent],
    schemaComponentStrategy: 'named',
  });

  const pathItem = (document.paths as Record<string, Record<string, any>>)['/events/{id}'];
  const operation = pathItem?.post;
  const searchParameter = operation.parameters.find((item: { in: string; name: string }) => item.in === 'query' && item.name === 'search');
  const traceHeader = operation.parameters.find((item: { $ref?: string }) => item.$ref === '#/components/parameters/TraceIdHeaderParam');
  const sessionCookie = operation.parameters.find((item: { in: string; name: string }) => item.in === 'cookie' && item.name === 'session');
  const pathHeader = pathItem.parameters.find((item: { in: string; name: string }) => item.in === 'header' && item.name === 'x-api-version');

  assert.equal(searchParameter.description, 'Search query');
  assert.equal(searchParameter.required, true);
  assert.equal(searchParameter.schema.minLength, 2);
  assert.equal(searchParameter.example, 'orva');
  assert.equal(searchParameter.examples.example1.value, 'orva');

  assert.equal(traceHeader.$ref, '#/components/parameters/TraceIdHeaderParam');

  assert.equal(pathItem.$ref, '#/components/pathItems/EventPathItem');
  assert.equal(pathItem.summary, 'Event collection path');
  assert.equal(pathItem.description, 'Shared metadata for event routes');
  assert.equal(pathHeader.example, '2026-04');

  assert.equal(sessionCookie.required, true);
  assert.equal(sessionCookie.schema.minLength, 16);

  assert.equal(operation.externalDocs.url, 'https://docs.example.com/events#create');
  assert.equal(operation.servers[0].variables.region.default, 'cn');
  assert.equal(operation.requestBody.$ref, '#/components/requestBodies/EventWebhookRequestBody');
  assert.deepEqual(
    (document.components as { requestBodies: Record<string, any> }).requestBodies.EventWebhookRequestBody.content['application/json'].example,
    { callbackUrl: 'https://example.com/callback', event: 'created' }
  );
  assert.equal(
    (document.components as { requestBodies: Record<string, any> }).requestBodies.EventWebhookRequestBody.content['application/json'].encoding.callbackUrl.headers['x-callback-format'].description,
    'Callback format'
  );

  assert.equal(operation.responses['200'].headers['x-rate-limit-remaining'].$ref, '#/components/headers/RateLimitRemaining');
  assert.equal(operation.responses['200'].headers['content-type'].schema.enum[0], 'application/json');
  assert.equal(operation.responses['200'].links.self.$ref, '#/components/links/EventSelfLink');
  assert.deepEqual(operation.responses['200'].content['application/json'].examples.success.value, { ok: true });
  assert.equal(operation.responses['422'].$ref, '#/components/responses/ZodValidationErrorResponse');

  assert.equal(operation.callbacks.onEvent.$ref, '#/components/callbacks/EventDeliveryCallback');
  assert.deepEqual(
    (document.components as { callbacks: Record<string, any> }).callbacks.EventDeliveryCallback['{$request.body#/callbackUrl}'].post.requestBody.content['application/json'].example,
    { delivered: true }
  );
  assert.equal(
    (document.components as { callbacks: Record<string, any> }).callbacks.EventDeliveryCallback['{$request.body#/callbackUrl}'].post.responses['202'].content['application/json'].examples.queued.$ref,
    '#/components/examples/QueuedExample'
  );

  const components = document.components as {
    callbacks: Record<string, any>;
    headers: Record<string, any>;
    examples: Record<string, any>;
    links: Record<string, any>;
    responses: Record<string, any>;
  };
  assert.equal(components.headers.RateLimitRemaining.schema.minimum, 0);
  assert.deepEqual(components.examples.QueuedExample.value, { queued: true });
  assert.deepEqual(components.links.EventSelfLink.parameters, { id: '$request.path.id' });
  assert.equal(components.responses.ZodValidationErrorResponse.description, 'Validation Error');
  assert.equal(components.callbacks.EventDeliveryCallback['{$request.body#/callbackUrl}'].summary, 'Event callback');
  assert.equal((document.components as { parameters: Record<string, any> }).parameters.TraceIdHeaderParam.name, 'x-trace-id');
  assert.equal((document.components as { parameters: Record<string, any> }).parameters.TraceIdHeaderParam.schema.minLength, 8);
  assert.equal((document.components as { pathItems: Record<string, any> }).pathItems.EventPathItem.summary, 'Event collection path');

  assert.equal((document.tags as Array<Record<string, any>>)[0].name, 'events');
  assert.equal((document.externalDocs as Record<string, any>).url, 'https://docs.example.com/openapi');
  assert.equal((document.info as Record<string, any>).contact.email, 'team@example.com');
});

test('openapi supports component conflict policies, custom naming, and webhook path items', () => {
  const webhookComponent = definePathItem('EventWebhook', {
    summary: 'Event webhook',
    post: {
      requestBody: {
        content: {
          'application/json': {
            example: { ok: true },
          },
        },
      },
      responses: {
        202: {
          description: 'Accepted',
        },
      },
    },
  });
  const sharedResponse = defineResponse('SharedResult', {
    description: 'First response',
  });
  const conflictingResponse = defineResponse('SharedResult', {
    description: 'Second response',
  });

  const document = createOpenAPIDocument(createOrva(), {
    info: { title: 'Orva API', version: '1.0.0' },
    responseComponents: [sharedResponse, conflictingResponse],
    pathItemComponents: [webhookComponent],
    resolveComponentName: ({ sanitizedName, attempt }) => (
      attempt === 1 ? sanitizedName : `${sanitizedName}_variant_${attempt - 1}`
    ),
    webhooks: {
      eventCreated: webhookComponent,
      eventDeleted: {
        post: {
          responses: {
            200: {
              description: 'Deleted',
            },
          },
        },
      },
    },
  });

  const components = document.components as {
    pathItems: Record<string, any>;
    responses: Record<string, any>;
  };
  const webhooks = document.webhooks as Record<string, any>;

  assert.equal(webhooks.eventCreated.$ref, '#/components/pathItems/EventWebhook');
  assert.equal(components.pathItems.EventWebhook.post.responses['202'].description, 'Accepted');
  assert.equal(webhooks.eventDeleted.post.responses['200'].description, 'Deleted');
  assert.equal(components.responses.SharedResult.description, 'First response');
  assert.equal(components.responses.SharedResult_variant_1.description, 'Second response');

  assert.throws(() => {
    createOpenAPIDocument(createOrva(), {
      info: { title: 'Orva API', version: '1.0.0' },
      componentConflicts: 'error',
      responseComponents: [sharedResponse, conflictingResponse],
    });
  }, /OpenAPI component name conflict/);
});

test('openapi infers auth security and 401 responses from middleware metadata', () => {
  const app = createOrva()
    .get('/basic', basicAuth({ users: { admin: 'secret' } }), (c) => c.text('ok'))
    .get('/bearer', bearerAuth({ token: 'token' }), (c) => c.text('ok'))
    .get('/key', apiKeyAuth({ key: 'key' }), (c) => c.text('ok'));

  const document = createOpenAPIDocument(app, {
    info: { title: 'Orva API', version: '1.0.0' },
  });

  const paths = document.paths as Record<string, Record<string, any>>;
  const components = document.components as {
    responses: Record<string, any>;
    securitySchemes: Record<string, any>;
  };

  assert.deepEqual(paths['/basic'].get.security, [{ basicAuth: [] }]);
  assert.equal(paths['/basic'].get.responses['401'].$ref, '#/components/responses/UnauthorizedErrorResponse');
  assert.equal(paths['/basic'].get.responses['403'], undefined);

  assert.deepEqual(paths['/bearer'].get.security, [{ bearerAuth: [] }]);
  assert.equal(components.securitySchemes.bearerAuth.scheme, 'bearer');

  assert.deepEqual(paths['/key'].get.security, [
    { 'apiKeyHeaderAuth_X-API-Key': [] },
    { apiKeyQueryAuth_apiKey: [] },
  ]);
  assert.equal(components.securitySchemes['apiKeyHeaderAuth_X-API-Key'].in, 'header');
  assert.equal(components.securitySchemes.apiKeyQueryAuth_apiKey.in, 'query');
  assert.equal(components.responses.UnauthorizedErrorResponse.description, 'Unauthorized');
});

# 测试与质量

`orva` 的一个优势是应用本身以 `fetch(request)` 为中心，因此很多测试不需要先起真实 HTTP 服务器。

## 推荐测试层次

| 层次 | 目标 | 推荐方式 |
| --- | --- | --- |
| Handler / Route | 验证业务行为、状态码、响应体 | `app.fetch(new Request(...))` |
| Middleware | 验证头、认证、限流、压缩 | 单独构造应用并断言响应 |
| Adapter | 验证平台桥接行为 | 针对 `serveNode()`、云函数 handler 做集成测试 |
| Contract | 验证 RPC / OpenAPI 输出 | 直接断言元数据结构 |

## 最小路由测试

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrva } from 'orva';

test('GET /health returns ok', async () => {
  const app = createOrva().get('/health', (c) => c.json({ ok: true }));

  const response = await app.fetch(new Request('https://example.com/health'));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});
```

## 测试带参数和查询的路由

```ts
test('reads params and query', async () => {
  const app = createOrva().get('/users/:id', (c) => c.json({
    id: c.params.id,
    q: c.query.q ?? null,
  }));

  const response = await app.fetch(new Request('https://example.com/users/42?q=active'));

  assert.deepEqual(await response.json(), {
    id: '42',
    q: 'active',
  });
});
```

## 测试中间件顺序和共享变量

```ts
test('middleware can accumulate vars', async () => {
  const app = createOrva<{ trace: string[] }>();

  app.use(async (c, next) => {
    c.set('trace', ['before']);
    await next();
    c.get('trace')?.push('after');
  });

  app.get('/trace', (c) => c.json({ trace: c.get('trace') }));

  const response = await app.fetch(new Request('https://example.com/trace'));
  assert.deepEqual(await response.json(), {
    trace: ['before'],
  });
});
```

如果你需要断言“后置阶段”效果，更适合检查响应头、cookie 或外部副作用。

## 测试 validator

```ts
import { z } from 'zod';
import { zodValidator } from 'orva/validator/zod';

test('validator returns 422 for invalid json', async () => {
  const app = createOrva().post(
    '/users',
    zodValidator('json', z.object({ name: z.string().min(1) })),
    (c) => c.json(c.valid('json'), 201),
  );

  const response = await app.fetch(new Request('https://example.com/users', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: '' }),
  }));

  assert.equal(response.status, 422);
});
```

## 测试 RPC 与 OpenAPI

```ts
import { createRPCMetadata } from 'orva/rpc';
import { createOpenAPIDocument } from 'orva/openapi';

test('contract metadata can be generated', () => {
  const rpc = createRPCMetadata(app);
  const openapi = createOpenAPIDocument(app, {
    info: { title: 'Test API', version: '1.0.0' },
  });

  assert.ok(rpc.length > 0);
  assert.equal(openapi.info.title, 'Test API');
});
```

## 测试 Node 适配器

当你需要验证 Node 层桥接、流式响应或真实端口行为时，再使用 `serveNode()`：

```ts
import { serveNode } from 'orva/adapters/node';

test('node adapter serves requests', async () => {
  const app = createOrva().get('/', (c) => c.text('ok'));
  const server = serveNode(app, { port: 3100 });

  try {
    const response = await fetch('http://127.0.0.1:3100/');
    assert.equal(await response.text(), 'ok');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
```

## CI 建议

至少保留这三类检查：

```bash
pnpm typecheck
pnpm test
pnpm build
```

如果你同时维护文档站，建议再补：

```bash
pnpm docs:build
```

## 推荐质量基线

- 核心路由至少覆盖成功、校验失败、权限失败三条路径
- 中间件至少覆盖 headers / cookies / notFound / early response
- 契约变更要同时覆盖 RPC 或 OpenAPI 输出
- 发布前至少跑一次 `typecheck + test + build + docs:build`
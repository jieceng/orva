# 快速开始

## 安装

```bash
pnpm add nano
pnpm add -D typescript tsx
```

如果你准备使用文档站：

```bash
pnpm docs:dev
```

## 第一个服务

```ts
import { createNano } from 'nano';
import { serveNode } from 'nano/adapters/node';

const app = createNano();

app.get('/', (c) => c.text('nano is running'));
app.get('/users/:id', (c) => c.json({ id: c.params.id, q: c.query.q ?? null }));

serveNode(app, { port: 3000 });
```

启动后访问：

- `GET http://localhost:3000/`
- `GET http://localhost:3000/users/42?q=active`

## 推荐目录结构

```text
src/
  app.ts
  routes/
    users.ts
  middlewares/
    auth.ts
  contracts/
    user.ts
server.ts
```

`src/app.ts`:

```ts
import { createNano } from 'nano';
import { cors, secureHeaders } from 'nano/middlewares';
import { usersApp } from './routes/users';

export const app = createNano()
  .use(cors(), secureHeaders())
  .route('/api', usersApp);
```

`server.ts`:

```ts
import { serveNode } from 'nano/adapters/node';
import { app } from './src/app';

serveNode(app, { port: 3000 });
```

## 下一步

- 看 [路由与组合](/guide/routing)
- 看 [Context 与响应](/guide/context)
- 看 [Validator](/validator)

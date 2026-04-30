# REST API Recipe

这个 recipe 展示一套最小但已经具备生产感的服务结构。

## 你会做出什么

- 分组 API 路由
- 请求校验
- request id 和安全头
- 一致的错误响应

## 第一步：创建应用

```ts
import { createOrva } from 'orvajs';
import { requestId, secureHeaders } from 'orvajs/middlewares';

export const app = createOrva()
  .use(requestId(), secureHeaders())
  .onError((err, c) => c.json({
    error: 'INTERNAL_ERROR',
    message: err.message,
    requestId: c.get('requestId'),
  }, 500));
```

## 第二步：添加用户路由

```ts
import { z } from 'zod';
import { createOrva } from 'orvajs';
import { zodValidator } from 'orvajs/validator/zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const usersApp = createOrva()
  .get('/', (c) => c.json([{ id: 'u_1', name: 'Ada' }]))
  .get('/:id', (c) => c.json({ id: c.params.id, name: 'Ada' }))
  .post(
    '/',
    zodValidator('json', createUserSchema),
    (c) => c.json({
      id: crypto.randomUUID(),
      ...c.valid('json'),
    }, 201),
  );
```

## 第三步：挂载路由

```ts
import { app } from './app';
import { usersApp } from './routes/users';

app.route('/api/users', usersApp);
```

## 这个 recipe 想让你学会什么

- 根应用适合承载共享 middleware 和全局错误处理。
- 路由分组最好按业务域拆分。
- 请求输入应尽量由 validator 定义，而不是再重复声明一套 body 类型。

## 下一步

- [类型链路](/zh/guide/type-flow)
- [Validator](/zh/validator)
- [测试与质量](/zh/guide/testing)

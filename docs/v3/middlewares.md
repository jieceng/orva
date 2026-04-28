# 中间件

<OrvaVersionBanner version="v3.1" channel="Stable snapshot" updated="2026-04" />

v3.1 已提供认证、guards、HTTP 响应、安全头、观测、静态资源与压缩相关中间件。

推荐导入：

```ts
import { cors } from 'orva/middlewares/cors';
import { secureHeaders } from 'orva/middlewares/secure-headers';
import { requestId } from 'orva/middlewares/request-id';
```

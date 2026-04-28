import { createOrva, Next, Orva, MiddlewareHandler } from './src/index.js';
import { serveNode } from './src/adapters/node.js';

interface AppVariables {
  user: { id: string; name: string };
  requestId: string;
  startTime: number;
}

const app = createOrva<AppVariables>();

app.onError((err, c) => {
  console.error(`[${c.get('requestId')}] Error:`, err);
  return c.json({ 
    error: err.message,
    requestId: c.get('requestId')
  }, 500);
});

app.notFound((c) => {
  return c.json({ 
    error: 'Not Found', 
    path: c.url.pathname 
  }, 404);
});

app.use(async (c, next) => {
  c.set('requestId', crypto.randomUUID());
  c.set('startTime', Date.now());
  console.log(`【${(new Date()).toLocaleString()}】${c.get('requestId')} ${c.req.method} ${c.url.pathname}`);
  await next();
  const duration = Date.now() - (c.get('startTime') || 0);
  console.log(`【${(new Date()).toLocaleString()}】${c.get('requestId')} completed in ${duration}ms`);
});

const auth:MiddlewareHandler<AppVariables> = async (c, next: Next) => {
  const token = c.req.headers.get('Authorization');
  if (token === 'Bearer secret') {
    c.set('user', { id: '1', name: 'Alice' });
    await next();
  } else {
    throw new Error('Unauthorized');
  }
};

app.get('/', (c) => {
  return c.html('')
});

app.get('/api/health', (c) => c.json({ 
  status: 'ok', 
  timestamp: new Date().toISOString() 
}));

app.group('/api/v1', (api: Orva<AppVariables>) => {
  
  api.get('/users', (c) => {
    return c.json([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]);
  });
  
  api.get('/users/:id', (c) => {
    return c.json({ 
      id: c.params.id, 
      name: `User ${c.params.id}`,
      query: c.query
    });
  });
  
  api.post('/users', auth, async (c) => {
    const body = await c.req.json();
    const user = c.get('user');
    return c.json({ 
      ...body, 
      id: crypto.randomUUID(),
      createdBy: user?.name 
    }, 201);
  });
  
  api.all('/echo/*', async (c) => {
    return c.json({
      path: c.params['*'],
      method: c.req.method,
      query: c.query,
    });
  });
});

app.get('/old', (c) => c.redirect('/new', 301));
app.get('/new', (c) => c.text('New Page'));

// SSE 流 - 使用新的语义化方法
app.get('/events', (c) => {
  const stream = new ReadableStream({
    start(controller) {
      let count = 0;
      const timer = setInterval(() => {
        controller.enqueue(`data: ${++count}\n\n`);
        if (count >= 5) {
          clearInterval(timer);
          controller.close();
        }
      }, 500);
    }
  });
  return c.sse(stream);
});

// 文件下载 - 使用新的语义化方法
app.get('/download', (c) => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue('Hello World');
      controller.close();
    }
  });
  return c.download(stream, 'hello.txt');
});

serveNode(app, 5000, () => {
  console.log('🚀 Orva v3.2 running on http://localhost:5000');
});

import { createOrva } from 'orvajs';
import { createRPC } from 'orvajs/rpc';
import { validator } from 'orvajs/validator';

const userValidation = validator('json', (value: any) => ({
  name: value.name || '',
  email: value.email || '',
  age: value.age || 0,
}));

const app = createOrva()
  .get('/posts', (c) => c.json([{ id: 1, title: 'Post 1' }]))
  .get('/posts/:id', (c) => c.json({ id: c.params.id, title: 'Post details' }))
  .post('/users', userValidation, (c) => c.json({
    message: 'User validated',
    data: c.valid('json'),
  }));

const rpc = createRPC<typeof app>({
  baseURL: 'http://localhost:3003/rpc',
});

async function verifyPackageTypes() {
  const posts = await rpc.posts.$get();
  const postsJson: { id: number; title: string }[] = await posts.json();
  void postsJson;
  // @ts-expect-error package import should preserve typed json response bodies
  const invalidPostsJson: string = await posts.json();
  void invalidPostsJson;

  const post = await rpc.posts[':id'].$get({
    param: { id: '123' },
  });
  const postJson: { id: string; title: string } = await post.json();
  void postJson;
  // @ts-expect-error package import should preserve typed param route response bodies
  const invalidPostJson: number = await post.json();
  void invalidPostJson;

  await rpc.users.$post({
    body: {
      name: 'orva',
      email: 'team@example.com',
      age: 1,
    },
  });

  // @ts-expect-error plain validator output shape should constrain rpc body when input is any/unknown
  await rpc.users.$post({ body: {} });
}

void verifyPackageTypes;

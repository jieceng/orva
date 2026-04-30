import { createOrva } from 'orvajs';
import { getValidatedData, setValidatedData, validator } from 'orvajs/validator';

const app = createOrva().post(
  '/users/:id',
  validator('json', (value: unknown) => {
    const input = value as { name?: string };
    return {
      name: String(input.name ?? ''),
    };
  }),
  validator('param', (value) => ({
    id: value.id,
  })),
  (c) => {
    const body = c.valid('json');
    const params = getValidatedData(c, 'param');
    setValidatedData(c, 'trace', 'ok');
    const trace = c.valid('trace');

    const validBody: { name: string } = body;
    const validParams: { id: string } = params;
    const validTrace: string = trace;
    void validBody;
    void validParams;
    void validTrace;

    // @ts-expect-error validated json body should preserve string property types
    const invalidBodyName: number = body.name;
    // @ts-expect-error validated params should preserve string property types
    const invalidParamId: number = params.id;
    // @ts-expect-error setValidatedData should narrow trace to string
    const invalidTrace: number = trace;
    void invalidBodyName;
    void invalidParamId;
    void invalidTrace;

    return c.json({ id: params.id, name: body.name, trace }, 201);
  }
);

void app;

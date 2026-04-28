import test from 'node:test';
import assert from 'node:assert/strict';

test('root entrypoint only exposes framework core exports', async () => {
  const mod = await import('../src/index.ts');

  assert.equal(typeof mod.Nano, 'function');
  assert.equal(typeof mod.createNano, 'function');
  assert.equal('createRPC' in mod, false);
  assert.equal('serveNode' in mod, false);
  assert.equal('cors' in mod, false);
  assert.equal('validator' in mod, false);
  assert.equal('describeRoute' in mod, false);
});

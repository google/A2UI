import { test } from 'node:test';
import assert from 'node:assert';
import '../app.ts';
import '../client.ts';

test('smoke test: shell imports resolve', () => {
  assert.ok(true);
});

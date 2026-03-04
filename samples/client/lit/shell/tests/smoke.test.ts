import { test } from 'node:test';
import assert from 'node:assert';
import '../app.js';
import '../client.js';

test('smoke test: shell imports resolve', () => {
  assert.ok(true);
});

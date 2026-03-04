import { test } from 'node:test';
import assert from 'node:assert';
import '../component-gallery.js';
import '../client.js';

test('smoke test: component_gallery imports resolve', () => {
  assert.ok(true);
});

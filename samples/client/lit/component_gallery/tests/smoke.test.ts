import { test } from 'node:test';
import assert from 'node:assert';
import '../component-gallery.ts';
import '../client.ts';

test('smoke test: component_gallery imports resolve', () => {
  assert.ok(true);
});

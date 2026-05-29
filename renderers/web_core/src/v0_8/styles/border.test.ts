/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import test from 'node:test';
import assert from 'node:assert';
import { border } from './border.js';

test('Border Styles', async (t) => {
  await t.test('border-radius classes should not apply overflow: hidden to avoid text clipping', () => {
    // The issue reported clipping of text when using rounded corners because
    // .border-br-* generated classes also blindly applied overflow: hidden.
    
    // Check if the generated CSS contains overflow: hidden for border-br classes
    const match = border.match(/\.border-br-\w+ \{[^}]*overflow:\s*hidden/);
    assert.strictEqual(match, null, 'Found overflow: hidden applied within a border-br-* class');
  });
});

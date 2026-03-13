/*
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import { toMaterialSymbolLigature } from './icons.js';

describe('Icon styles helpers', () => {
  it('leaves simple icon names unchanged', () => {
    assert.strictEqual(toMaterialSymbolLigature('home'), 'home');
  });

  it('converts camelCase names to snake_case ligatures', () => {
    assert.strictEqual(toMaterialSymbolLigature('shoppingCart'), 'shopping_cart');
    assert.strictEqual(toMaterialSymbolLigature('accountCircle'), 'account_circle');
  });

  it('keeps existing separators and lowercases the result', () => {
    assert.strictEqual(
      toMaterialSymbolLigature('unknownIconName12345'),
      'unknown_icon_name12345'
    );
    assert.strictEqual(toMaterialSymbolLigature('already_snake_case'), 'already_snake_case');
  });
});

/*
 * Copyright 2025 Google LLC
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

import assert from 'node:assert';
import {describe, it} from 'node:test';
import {mapAlign, mapJustify} from './layout.js';

describe('mapJustify', () => {
  it('maps center to center', () => {
    assert.strictEqual(mapJustify('center'), 'center');
  });
  it('maps end to flex-end', () => {
    assert.strictEqual(mapJustify('end'), 'flex-end');
  });
  it('maps spaceAround to space-around', () => {
    assert.strictEqual(mapJustify('spaceAround'), 'space-around');
  });
  it('maps spaceBetween to space-between', () => {
    assert.strictEqual(mapJustify('spaceBetween'), 'space-between');
  });
  it('maps spaceEvenly to space-evenly', () => {
    assert.strictEqual(mapJustify('spaceEvenly'), 'space-evenly');
  });
  it('maps start to flex-start', () => {
    assert.strictEqual(mapJustify('start'), 'flex-start');
  });
  it('maps stretch to stretch', () => {
    assert.strictEqual(mapJustify('stretch'), 'stretch');
  });
  it('returns flex-start for undefined input', () => {
    assert.strictEqual(mapJustify(undefined), 'flex-start');
  });
  it('returns flex-start for unknown string input', () => {
    assert.strictEqual(mapJustify('unknown'), 'flex-start');
  });
});

describe('mapAlign', () => {
  it('maps center to center', () => {
    assert.strictEqual(mapAlign('center'), 'center');
  });
  it('maps end to flex-end', () => {
    assert.strictEqual(mapAlign('end'), 'flex-end');
  });
  it('maps start to flex-start', () => {
    assert.strictEqual(mapAlign('start'), 'flex-start');
  });
  it('maps stretch to stretch', () => {
    assert.strictEqual(mapAlign('stretch'), 'stretch');
  });
  it('returns stretch for undefined input', () => {
    assert.strictEqual(mapAlign(undefined), 'stretch');
  });
  it('returns stretch for unknown string input', () => {
    assert.strictEqual(mapAlign('unknown'), 'stretch');
  });
});

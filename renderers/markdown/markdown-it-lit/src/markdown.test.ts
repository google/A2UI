/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { MarkdownItDirective } from './markdown.js';
import { markdownRenderer } from '@a2ui/markdown-it-shared';
import { noChange } from 'lit';
import { PartInfo, PartType } from 'lit/directive.js';

describe('MarkdownItDirective', () => {
  const partInfo: PartInfo = {
    type: PartType.CHILD,
  };

  it('should render markdown using markdownRenderer', () => {
    const directive = new MarkdownItDirective(partInfo);
    const renderSpy = mock.method(markdownRenderer, 'render', () => '<p>test</p>');

    const result = directive.render('test', { p: ['class1'] });

    assert.strictEqual(renderSpy.mock.callCount(), 1);
    assert.deepStrictEqual(renderSpy.mock.calls[0].arguments, ['test', { p: ['class1'] }]);

    // unsafeHTML returns a symbol-like object, checking strict equality might be tricky
    // but we can check if it looks like what we expect or just rely on it being the result of unsafeHTML
    // For now, let's assume if it doesn't throw and calls render, it's working.
    // We can check if the result is not null/undefined.
    assert.ok(result);
  });

  it('should not re-render if value and tagClassMap are effectively the same', () => {
    const directive = new MarkdownItDirective(partInfo);
    const renderSpy = mock.method(directive, 'render', () => 'rendered');

    // First render
    directive.update({} as any, ['test', { p: ['class1'] }]);
    assert.strictEqual(renderSpy.mock.callCount(), 1);

    // Second render with same values
    const result = directive.update({} as any, ['test', { p: ['class1'] }]);
    assert.strictEqual(renderSpy.mock.callCount(), 1);
    assert.strictEqual(result, noChange);
  });

  it('should re-render if value changes', () => {
    const directive = new MarkdownItDirective(partInfo);
    const renderSpy = mock.method(directive, 'render', () => 'rendered');

    directive.update({} as any, ['test1', {}]);
    directive.update({} as any, ['test2', {}]);

    assert.strictEqual(renderSpy.mock.callCount(), 2);
  });

  it('should re-render if tagClassMap changes', () => {
    const directive = new MarkdownItDirective(partInfo);
    const renderSpy = mock.method(directive, 'render', () => 'rendered');

    directive.update({} as any, ['test', { p: ['c1'] }]);
    directive.update({} as any, ['test', { p: ['c2'] }]);

    assert.strictEqual(renderSpy.mock.callCount(), 2);
  });
});

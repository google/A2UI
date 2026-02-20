import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MarkdownItRenderer } from './raw-markdown.js';

describe('MarkdownItRenderer', () => {
  it('renders basic markdown', () => {
    const renderer = new MarkdownItRenderer();
    const result = renderer.render('# Hello');
    assert.match(result, /<h1>Hello<\/h1>/);
  });

  it('applies tag classes via tagClassMap', () => {
    const renderer = new MarkdownItRenderer();
    const result = renderer.render('# Hello', { h1: ['custom-class'] });
    assert.match(result, /<h1 class="custom-class">Hello<\/h1>/);
  });

  it('applies multiple classes', () => {
    const renderer = new MarkdownItRenderer();
    const result = renderer.render('para', { p: ['class1', 'class2'] });
    assert.match(result, /<p class="class1 class2">para<\/p>/);
  });

  it('is stateless (tagClassMap does not persist)', () => {
    const renderer = new MarkdownItRenderer();

    // First render with class
    const result1 = renderer.render('# Hello', { h1: ['persistent?'] });
    assert.match(result1, /class="persistent\?"/);

    // Second render without class
    const result2 = renderer.render('# Hello');
    assert.doesNotMatch(result2, /class="persistent\?"/);
    assert.match(result2, /<h1>Hello<\/h1>/);
  });

  it('handles empty tagClassMap', () => {
    const renderer = new MarkdownItRenderer();
    const result = renderer.render('# Hello', {});
    assert.match(result, /<h1>Hello<\/h1>/);
  });
});

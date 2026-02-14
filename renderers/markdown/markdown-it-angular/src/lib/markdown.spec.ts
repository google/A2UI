import { TestBed } from '@angular/core/testing';
import { MarkdownItMarkdownRenderer } from './markdown';
import { markdownRenderer } from '@a2ui/markdown-it-shared';

describe('MarkdownItMarkdownRenderer', () => {
  let service: MarkdownItMarkdownRenderer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MarkdownItMarkdownRenderer],
    });
    service = TestBed.inject(MarkdownItMarkdownRenderer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should delegate render to markdownRenderer', () => {
    const renderSpy = spyOn(markdownRenderer, 'render').and.returnValue('<p>test</p>');
    const input = 'test';
    const tagClassMap = { p: ['my-class'] };

    const result = service.render(input, tagClassMap);

    expect(renderSpy).toHaveBeenCalledWith(input, tagClassMap);
    expect(result).toBe('<p>test</p>');
  });
});

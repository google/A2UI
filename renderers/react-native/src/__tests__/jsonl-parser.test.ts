/**
 * JSONL Parser Tests
 */

import {
  createJSONLParser,
  parseJSONL,
  validateA2UIMessage,
} from '../parser/jsonl-parser';
import type { A2UIMessage } from '../types/a2ui-types';

describe('createJSONLParser', () => {
  describe('basic parsing', () => {
    it('should parse a single complete message', () => {
      const messages: A2UIMessage[] = [];
      const parser = createJSONLParser({
        onMessage: (msg) => messages.push(msg),
      });

      parser.feed('{"type":"beginRendering","surfaceId":"main","rootId":"root"}\n');
      parser.end();

      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        type: 'beginRendering',
        surfaceId: 'main',
        rootId: 'root',
      });
    });

    it('should parse multiple messages', () => {
      const messages: A2UIMessage[] = [];
      const parser = createJSONLParser({
        onMessage: (msg) => messages.push(msg),
      });

      parser.feed('{"type":"beginRendering","surfaceId":"main","rootId":"root"}\n');
      parser.feed('{"type":"surfaceUpdate","surfaceId":"main","components":[]}\n');
      parser.end();

      expect(messages).toHaveLength(2);
      expect(messages[0].type).toBe('beginRendering');
      expect(messages[1].type).toBe('surfaceUpdate');
    });

    it('should handle chunked input across message boundaries', () => {
      const messages: A2UIMessage[] = [];
      const parser = createJSONLParser({
        onMessage: (msg) => messages.push(msg),
      });

      // Split a message across multiple chunks
      parser.feed('{"type":"begin');
      parser.feed('Rendering","surfaceId":"main"');
      parser.feed(',"rootId":"root"}\n');
      parser.end();

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe('beginRendering');
    });

    it('should skip empty lines', () => {
      const messages: A2UIMessage[] = [];
      const parser = createJSONLParser({
        onMessage: (msg) => messages.push(msg),
      });

      parser.feed('\n\n{"type":"beginRendering","surfaceId":"main","rootId":"root"}\n\n');
      parser.end();

      expect(messages).toHaveLength(1);
    });

    it('should handle message without trailing newline at end', () => {
      const messages: A2UIMessage[] = [];
      const parser = createJSONLParser({
        onMessage: (msg) => messages.push(msg),
      });

      parser.feed('{"type":"beginRendering","surfaceId":"main","rootId":"root"}');
      parser.end();

      expect(messages).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should call onError for invalid JSON', () => {
      const messages: A2UIMessage[] = [];
      const errors: Array<{ error: Error; line: string }> = [];
      const parser = createJSONLParser({
        onMessage: (msg) => messages.push(msg),
        onError: (error, line) => errors.push({ error, line }),
      });

      parser.feed('not valid json\n');
      parser.end();

      expect(messages).toHaveLength(0);
      expect(errors).toHaveLength(1);
      expect(errors[0].line).toBe('not valid json');
    });

    it('should call onError for messages missing type field', () => {
      const messages: A2UIMessage[] = [];
      const errors: Array<{ error: Error; line: string }> = [];
      const parser = createJSONLParser({
        onMessage: (msg) => messages.push(msg),
        onError: (error, line) => errors.push({ error, line }),
      });

      parser.feed('{"surfaceId":"main"}\n');
      parser.end();

      expect(messages).toHaveLength(0);
      expect(errors).toHaveLength(1);
      expect(errors[0].error.message).toContain('type');
    });

    it('should continue parsing after errors', () => {
      const messages: A2UIMessage[] = [];
      const errors: Array<{ error: Error; line: string }> = [];
      const parser = createJSONLParser({
        onMessage: (msg) => messages.push(msg),
        onError: (error, line) => errors.push({ error, line }),
      });

      parser.feed('invalid\n');
      parser.feed('{"type":"beginRendering","surfaceId":"main","rootId":"root"}\n');
      parser.end();

      expect(errors).toHaveLength(1);
      expect(messages).toHaveLength(1);
    });
  });

  describe('lifecycle', () => {
    it('should call onComplete when end is called', () => {
      let completed = false;
      const parser = createJSONLParser({
        onMessage: () => {},
        onComplete: () => { completed = true; },
      });

      parser.feed('{"type":"beginRendering","surfaceId":"main","rootId":"root"}\n');
      expect(completed).toBe(false);

      parser.end();
      expect(completed).toBe(true);
    });

    it('should clear buffer on reset', () => {
      const messages: A2UIMessage[] = [];
      const parser = createJSONLParser({
        onMessage: (msg) => messages.push(msg),
      });

      parser.feed('{"type":"begin');
      parser.reset();
      parser.feed('{"type":"surfaceUpdate","surfaceId":"main","components":[]}\n');
      parser.end();

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe('surfaceUpdate');
    });
  });
});

describe('parseJSONL', () => {
  it('should parse multiple lines at once', () => {
    const input = `
{"type":"beginRendering","surfaceId":"main","rootId":"root"}
{"type":"surfaceUpdate","surfaceId":"main","components":[]}
`;
    const messages = parseJSONL(input);

    expect(messages).toHaveLength(2);
    expect(messages[0].type).toBe('beginRendering');
    expect(messages[1].type).toBe('surfaceUpdate');
  });

  it('should throw on parse errors', () => {
    const input = 'invalid json';
    expect(() => parseJSONL(input)).toThrow('JSONL parse errors');
  });

  it('should return empty array for empty input', () => {
    expect(parseJSONL('')).toEqual([]);
    expect(parseJSONL('\n\n')).toEqual([]);
  });
});

describe('validateA2UIMessage', () => {
  it('should validate beginRendering messages', () => {
    expect(validateA2UIMessage({
      type: 'beginRendering',
      surfaceId: 'main',
      rootId: 'root',
    })).toBe(true);

    expect(validateA2UIMessage({
      type: 'beginRendering',
      surfaceId: 'main',
      // missing rootId
    })).toBe(false);
  });

  it('should validate surfaceUpdate messages', () => {
    expect(validateA2UIMessage({
      type: 'surfaceUpdate',
      surfaceId: 'main',
      components: [],
    })).toBe(true);

    expect(validateA2UIMessage({
      type: 'surfaceUpdate',
      surfaceId: 'main',
      components: 'not an array',
    })).toBe(false);
  });

  it('should validate dataModelUpdate messages', () => {
    expect(validateA2UIMessage({
      type: 'dataModelUpdate',
      surfaceId: 'main',
      path: ['user', 'name'],
      value: 'John',
    })).toBe(true);

    expect(validateA2UIMessage({
      type: 'dataModelUpdate',
      surfaceId: 'main',
      path: 'not an array',
    })).toBe(false);
  });

  it('should validate deleteSurface messages', () => {
    expect(validateA2UIMessage({
      type: 'deleteSurface',
      surfaceId: 'main',
    })).toBe(true);

    expect(validateA2UIMessage({
      type: 'deleteSurface',
    })).toBe(false);
  });

  it('should validate error messages', () => {
    expect(validateA2UIMessage({
      type: 'error',
      code: 'E001',
      message: 'Something went wrong',
    })).toBe(true);

    expect(validateA2UIMessage({
      type: 'error',
      code: 'E001',
      // missing message
    })).toBe(false);
  });

  it('should reject non-objects', () => {
    expect(validateA2UIMessage(null)).toBe(false);
    expect(validateA2UIMessage(undefined)).toBe(false);
    expect(validateA2UIMessage('string')).toBe(false);
    expect(validateA2UIMessage(123)).toBe(false);
  });

  it('should reject objects without type', () => {
    expect(validateA2UIMessage({ surfaceId: 'main' })).toBe(false);
    expect(validateA2UIMessage({ type: 123 })).toBe(false);
  });

  it('should accept unknown message types (for extensibility)', () => {
    expect(validateA2UIMessage({
      type: 'customExtension',
      customField: 'value',
    })).toBe(true);
  });
});

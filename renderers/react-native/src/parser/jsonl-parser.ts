/**
 * JSONL Stream Parser for A2UI
 *
 * Parses streaming JSONL (JSON Lines) responses from A2UI-compatible agent servers.
 * Each line in the stream is a complete JSON object representing an A2UI message.
 */

import type { A2UIMessage } from '../types/a2ui-types';

export interface JSONLParserOptions {
  /** Called when a complete message is parsed */
  onMessage: (message: A2UIMessage) => void;

  /** Called when a parse error occurs */
  onError?: (error: Error, rawLine: string) => void;

  /** Called when the stream ends */
  onComplete?: () => void;
}

export interface JSONLParserResult {
  /** Feed more data to the parser */
  feed: (chunk: string) => void;

  /** Signal that the stream has ended */
  end: () => void;

  /** Reset the parser state */
  reset: () => void;
}

/**
 * Creates a JSONL parser that processes streaming text data
 * and emits parsed A2UI messages.
 *
 * @example
 * ```typescript
 * const parser = createJSONLParser({
 *   onMessage: (msg) => console.log('Received:', msg),
 *   onError: (err) => console.error('Parse error:', err),
 * });
 *
 * // Feed chunks from a stream
 * parser.feed('{"type":"beginRendering","surfaceId":"main"}\n');
 * parser.feed('{"type":"surfaceUpdate","components":[]}\n');
 * parser.end();
 * ```
 */
export function createJSONLParser(options: JSONLParserOptions): JSONLParserResult {
  const { onMessage, onError, onComplete } = options;

  // Buffer for incomplete lines
  let buffer = '';

  /**
   * Process a complete line (without newline)
   */
  function processLine(line: string): void {
    // Skip empty lines
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    try {
      const message = JSON.parse(trimmed) as A2UIMessage;

      // Validate that we have a type field
      if (!message.type) {
        throw new Error('A2UI message missing required "type" field');
      }

      onMessage(message);
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)), trimmed);
      }
    }
  }

  /**
   * Feed a chunk of data to the parser
   */
  function feed(chunk: string): void {
    // Add chunk to buffer
    buffer += chunk;

    // Process complete lines
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      processLine(line);
    }
  }

  /**
   * Signal that the stream has ended
   */
  function end(): void {
    // Process any remaining data in the buffer
    if (buffer.trim()) {
      processLine(buffer);
    }
    buffer = '';

    if (onComplete) {
      onComplete();
    }
  }

  /**
   * Reset the parser state
   */
  function reset(): void {
    buffer = '';
  }

  return {
    feed,
    end,
    reset,
  };
}

/**
 * Parse a complete JSONL string (non-streaming)
 * Useful for testing or when you have the full response.
 *
 * @example
 * ```typescript
 * const messages = parseJSONL(`
 *   {"type":"beginRendering","surfaceId":"main","rootId":"root"}
 *   {"type":"surfaceUpdate","components":[]}
 * `);
 * ```
 */
export function parseJSONL(input: string): A2UIMessage[] {
  const messages: A2UIMessage[] = [];
  const errors: Array<{ error: Error; line: string }> = [];

  const parser = createJSONLParser({
    onMessage: (msg) => messages.push(msg),
    onError: (error, line) => errors.push({ error, line }),
  });

  parser.feed(input);
  parser.end();

  if (errors.length > 0) {
    const errorMessages = errors.map(e => `${e.error.message}: "${e.line}"`).join('; ');
    throw new Error(`JSONL parse errors: ${errorMessages}`);
  }

  return messages;
}

/**
 * Validate that a message conforms to A2UI schema
 */
export function validateA2UIMessage(message: unknown): message is A2UIMessage {
  if (typeof message !== 'object' || message === null) {
    return false;
  }

  const msg = message as Record<string, unknown>;

  if (typeof msg.type !== 'string') {
    return false;
  }

  switch (msg.type) {
    case 'beginRendering':
      return typeof msg.surfaceId === 'string' && typeof msg.rootId === 'string';

    case 'surfaceUpdate':
      return typeof msg.surfaceId === 'string' && Array.isArray(msg.components);

    case 'dataModelUpdate':
      return typeof msg.surfaceId === 'string' && Array.isArray(msg.path);

    case 'deleteSurface':
      return typeof msg.surfaceId === 'string';

    case 'error':
      return typeof msg.code === 'string' && typeof msg.message === 'string';

    default:
      // Unknown message type - could be an extension
      return true;
  }
}

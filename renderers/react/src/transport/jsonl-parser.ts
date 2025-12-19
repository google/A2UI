/**
 * JSONL (JSON Lines) Stream Parser
 * Parses newline-delimited JSON from SSE or other streams
 */

import type { A2UIServerMessage } from '../processor/types';

/**
 * Parse a JSONL string into an array of messages
 */
export function parseJSONL(text: string): A2UIServerMessage[] {
  const messages: A2UIServerMessage[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const msg = JSON.parse(trimmed) as A2UIServerMessage;
      messages.push(msg);
    } catch (error) {
      console.warn('[A2UI] Failed to parse JSONL line:', trimmed, error);
    }
  }

  return messages;
}

/**
 * Streaming JSONL parser that handles partial lines across chunks
 */
export class JSONLStreamParser {
  private buffer = '';
  private onMessage: (msg: A2UIServerMessage) => void;

  constructor(onMessage: (msg: A2UIServerMessage) => void) {
    this.onMessage = onMessage;
  }

  /**
   * Feed a chunk of data to the parser
   */
  feed(chunk: string): void {
    this.buffer += chunk;
    this.processBuffer();
  }

  /**
   * Process the buffer, extracting complete lines
   */
  private processBuffer(): void {
    const lines = this.buffer.split('\n');

    // Keep the last potentially incomplete line in the buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const msg = JSON.parse(trimmed) as A2UIServerMessage;
        this.onMessage(msg);
      } catch (error) {
        console.warn('[A2UI] Failed to parse JSONL line:', trimmed, error);
      }
    }
  }

  /**
   * Flush any remaining data in the buffer
   */
  flush(): void {
    if (this.buffer.trim()) {
      try {
        const msg = JSON.parse(this.buffer.trim()) as A2UIServerMessage;
        this.onMessage(msg);
      } catch (error) {
        console.warn('[A2UI] Failed to parse final JSONL buffer:', this.buffer, error);
      }
    }
    this.buffer = '';
  }

  /**
   * Reset the parser state
   */
  reset(): void {
    this.buffer = '';
  }
}

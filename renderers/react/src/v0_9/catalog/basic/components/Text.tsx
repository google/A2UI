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

import React from 'react';
import {createComponentImplementation} from '../../../adapter';
import {TextApi} from '@a2ui/web_core/v0_9/basic_catalog';
import {getBaseLeafStyle} from '../utils';

/**
 * Converts inline markdown (bold, italic, links) to HTML.
 * Raw HTML is escaped for security.
 */
function inlineMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
}

/**
 * Parses simple markdown (headings, bold, italic, lists, links) to HTML.
 * Supports the subset described in the v0.9 spec.
 */
function parseSimpleMarkdown(text: string): string {
  const blocks = text.split(/\n\n+/);
  return blocks
    .map((block) => {
      block = block.trim();
      if (!block) return '';

      const headingMatch = block.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        return `<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`;
      }

      if (/^[-*]\s/.test(block)) {
        const lines = block.split('\n');
        const items: string[] = [];
        for (const line of lines) {
          if (/^[-*]\s/.test(line)) {
            items.push(line.replace(/^[-*]\s+/, ''));
          } else if (items.length > 0) {
            items[items.length - 1] += ' ' + line.trim();
          }
        }
        const html = items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('');
        return `<ul style="margin:0.5em 0;padding-left:1.5em">${html}</ul>`;
      }

      return `<p style="margin:0.5em 0">${inlineMarkdown(block)}</p>`;
    })
    .join('');
}

const BLOCK_MARKDOWN_RE = /(?:^#{1,6}\s|^[-*]\s|\*\*.+?\*\*|\*[^*]+?\*|\[.+?\]\(https?:\/\/)/m;

export const Text = createComponentImplementation(TextApi, ({props}) => {
  const text = props.text ?? '';
  const style: React.CSSProperties = {
    ...getBaseLeafStyle(),
    display: 'inline-block',
  };

  const hasMarkdown = BLOCK_MARKDOWN_RE.test(text);

  if (hasMarkdown && (!props.variant || props.variant === 'body')) {
    return (
      <div
        style={{...style, display: 'block'}}
        dangerouslySetInnerHTML={{__html: parseSimpleMarkdown(text)}}
      />
    );
  }

  const content = hasMarkdown ? (
    <span dangerouslySetInnerHTML={{__html: inlineMarkdown(text)}} />
  ) : (
    text
  );

  switch (props.variant) {
    case 'h1':
      return <h1 style={{...style, fontSize: '2em', fontWeight: 'bold'}}>{content}</h1>;
    case 'h2':
      return <h2 style={{...style, fontSize: '1.5em', fontWeight: 'bold'}}>{content}</h2>;
    case 'h3':
      return <h3 style={{...style, fontSize: '1.17em', fontWeight: 'bold'}}>{content}</h3>;
    case 'h4':
      return <h4 style={{...style, fontSize: '1em', fontWeight: 'bold'}}>{content}</h4>;
    case 'h5':
      return <h5 style={{...style, fontSize: '0.83em', fontWeight: 'bold'}}>{content}</h5>;
    case 'caption':
      return <span style={{...style, color: '#666', textAlign: 'left'}}>{content}</span>;
    case 'body':
    default:
      return <span style={style}>{content}</span>;
  }
});

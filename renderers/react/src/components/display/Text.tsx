/**
 * A2UI Text Component
 * Renders text with typography styles based on usageHint
 * Supports simple Markdown (bold, italic, links, code) per A2UI spec
 */

import ReactMarkdown from 'react-markdown';
import { useA2UI, useResolve } from '../../context';
import { registerComponent, type A2UIComponentFn } from '../../renderer';

export const Text: A2UIComponentFn = ({ spec }) => {
  const { theme } = useA2UI();
  const text = useResolve(spec.text as string);
  const hint = spec.usageHint as string | undefined;
  const typo = hint && theme.typography[hint] ? theme.typography[hint] : theme.typography.body;

  // For headings, render as semantic HTML element
  if (hint?.match(/^h[1-5]$/)) {
    const Tag = hint as 'h1' | 'h2' | 'h3' | 'h4' | 'h5';
    return (
      <Tag style={{ margin: 0, ...typo }}>
        <ReactMarkdown
          allowedElements={['strong', 'em', 'code', 'a']}
          unwrapDisallowed
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: theme.colors.primary }}
              >
                {children}
              </a>
            ),
            code: ({ children }) => (
              <code
                style={{
                  background: theme.colors.surface,
                  padding: '2px 4px',
                  borderRadius: 4,
                  fontFamily: 'monospace',
                }}
              >
                {children}
              </code>
            ),
          }}
        >
          {String(text || '')}
        </ReactMarkdown>
      </Tag>
    );
  }

  // For body/caption text, render with markdown support
  return (
    <span style={{ margin: 0, ...typo }}>
      <ReactMarkdown
        allowedElements={['strong', 'em', 'code', 'a', 'p']}
        unwrapDisallowed
        components={{
          p: ({ children }) => <>{children}</>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: theme.colors.primary }}
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code
              style={{
                background: theme.colors.surface,
                padding: '2px 4px',
                borderRadius: 4,
                fontFamily: 'monospace',
              }}
            >
              {children}
            </code>
          ),
        }}
      >
        {String(text || '')}
      </ReactMarkdown>
    </span>
  );
};

registerComponent('Text', Text);

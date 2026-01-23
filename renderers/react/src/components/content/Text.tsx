import { useMemo, memo } from 'react';
import type { Types } from '@a2ui/lit/0.8';
import type { A2UIComponentProps } from '../../types';
import { useA2UIComponent } from '../../hooks/useA2UIComponent';
import { classMapToString, stylesToObject, mergeClassMaps } from '../../lib/utils';
import MarkdownIt from 'markdown-it';

type UsageHint = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'caption' | 'body';

interface HintedStyles {
  h1: Record<string, string>;
  h2: Record<string, string>;
  h3: Record<string, string>;
  h4: Record<string, string>;
  h5: Record<string, string>;
  body: Record<string, string>;
  caption: Record<string, string>;
}

function isHintedStyles(styles: unknown): styles is HintedStyles {
  if (typeof styles !== 'object' || !styles || Array.isArray(styles)) return false;
  const expected = ['h1', 'h2', 'h3', 'h4', 'h5', 'caption', 'body'];
  return expected.some((v) => v in styles);
}

/**
 * Markdown-it instance for rendering markdown text.
 * Uses synchronous import to ensure availability at first render (matches Lit renderer).
 */
const markdownRenderer = new MarkdownIt({
  html: false, // Security: disable raw HTML
  breaks: true, // Convert \n to <br>
  linkify: true, // Auto-convert URLs to links
  typographer: true, // Smart quotes, dashes, etc.
});

/**
 * Apply theme classes to markdown HTML elements.
 * Replaces default element tags with themed versions.
 */
function applyMarkdownTheme(html: string, markdownTheme: Types.Theme['markdown']): string {
  if (!markdownTheme) return html;

  // Map of element -> classes
  const replacements: Array<[RegExp, string]> = [];

  for (const [element, classes] of Object.entries(markdownTheme)) {
    if (!classes || (Array.isArray(classes) && classes.length === 0)) continue;

    const classString = Array.isArray(classes) ? classes.join(' ') : classMapToString(classes);
    if (!classString) continue;

    // Create regex to match opening tags (handles self-closing and regular)
    const tagRegex = new RegExp(`<${element}(?=\\s|>|/>)`, 'gi');
    replacements.push([tagRegex, `<${element} class="${classString}"`]);
  }

  let result = html;
  for (const [regex, replacement] of replacements) {
    result = result.replace(regex, replacement);
  }

  return result;
}

/**
 * Text component - renders text content with markdown support.
 *
 * Text is parsed as markdown and rendered as HTML (matches Lit renderer behavior).
 * Supports usageHint values: h1, h2, h3, h4, h5, caption, body
 *
 * Markdown features supported:
 * - **Bold** and *italic* text
 * - Lists (ordered and unordered)
 * - `inline code` and code blocks
 * - [Links](url) (auto-linkified URLs too)
 * - Blockquotes
 * - Horizontal rules
 *
 * Note: Raw HTML is disabled for security.
 */
export const Text = memo(function Text({ node, surfaceId }: A2UIComponentProps<Types.TextNode>) {
  const { theme, resolveString } = useA2UIComponent(node, surfaceId);
  const props = node.properties;

  const textValue = resolveString(props.text);
  const usageHint = props.usageHint as UsageHint | undefined;

  // Get merged classes (matches Lit's Styles.merge)
  const classes = mergeClassMaps(
    theme.components.Text.all,
    usageHint ? theme.components.Text[usageHint] : {}
  );

  // Get additional styles based on usage hint
  const additionalStyles = useMemo(() => {
    const textStyles = theme.additionalStyles?.Text;
    if (!textStyles) return undefined;

    if (isHintedStyles(textStyles)) {
      const hint = usageHint ?? 'body';
      return stylesToObject(textStyles[hint]);
    }
    return stylesToObject(textStyles as Record<string, string>);
  }, [theme.additionalStyles?.Text, usageHint]);

  // Render markdown content (matches Lit behavior - always uses markdown)
  const renderedContent = useMemo(() => {
    if (textValue === null || textValue === undefined) {
      return null;
    }

    // Add markdown prefix based on usageHint (matches Lit behavior)
    let markdownText = textValue;
    switch (usageHint) {
      case 'h1':
        markdownText = `# ${markdownText}`;
        break;
      case 'h2':
        markdownText = `## ${markdownText}`;
        break;
      case 'h3':
        markdownText = `### ${markdownText}`;
        break;
      case 'h4':
        markdownText = `#### ${markdownText}`;
        break;
      case 'h5':
        markdownText = `##### ${markdownText}`;
        break;
      case 'caption':
        markdownText = `*${markdownText}*`;
        break;
      default:
        break; // Body - no prefix
    }

    const rawHtml = markdownRenderer.render(markdownText);
    const themedHtml = applyMarkdownTheme(rawHtml, theme.markdown);
    return { __html: themedHtml };
  }, [textValue, theme.markdown, usageHint]);

  if (!renderedContent) {
    return null;
  }

  // Always use <section> wrapper with markdown rendering (matches Lit structure)
  return (
    <section
      className={classMapToString(classes)}
      style={additionalStyles}
      dangerouslySetInnerHTML={renderedContent}
    />
  );
});

export default Text;

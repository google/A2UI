import { Rating, MarkdownRender } from '@douyinfe/semi-ui';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { useStringBinding } from '../../core/hooks';

// Check if text is a star rating pattern (e.g., "★★★★☆")
function parseStarRating(text: string): number | null {
  const starPattern = /^[★☆]+$/;
  if (!starPattern.test(text.trim())) {
    return null;
  }
  const filledStars = (text.match(/★/g) || []).length;
  return filledStars;
}

export function Text({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.TextNode;
  const { text, usageHint } = node.properties;

  const textValue = useStringBinding(text, component, surfaceId);

  if (!textValue) {
    return null;
  }

  const style: React.CSSProperties = {
    flex: component.weight ?? 'initial',
  };

  // Check if this is a star rating
  const starRating = parseStarRating(textValue);
  if (starRating !== null) {
    return (
      <Rating
        data-id={component.id}
        value={starRating}
        count={5}
        disabled
        size="small"
        style={{ ...style, display: 'flex' }}
      />
    );
  }

  // Always render with MarkdownRender (consistent with Lit and Angular)
  // Prepend heading syntax based on usageHint
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
  }

  return (
    <div 
      data-id={component.id} 
      style={style}
      className="a2ui-text"
    >
      <MarkdownRender raw={markdownText} format="md" />
    </div>
  );
}

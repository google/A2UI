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
import {useMarkdown} from '../hooks/useMarkdown';

export const Text = createComponentImplementation(TextApi, ({props}) => {
  const text = props.text ?? '';
  let markdownText = text;

  switch (props.variant) {
    case 'h1':
      markdownText = `# ${text}`;
      break;
    case 'h2':
      markdownText = `## ${text}`;
      break;
    case 'h3':
      markdownText = `### ${text}`;
      break;
    case 'h4':
      markdownText = `#### ${text}`;
      break;
    case 'h5':
      markdownText = `##### ${text}`;
      break;
    case 'caption':
      markdownText = `*${text}*`;
      break;
  }

  const renderedHtml = useMarkdown(markdownText);
  const style: React.CSSProperties = {
    ...getBaseLeafStyle(),
    display: 'inline-block',
  };

  if (renderedHtml === null) {
    return (
      <span className={`a2ui-text ${props.variant || 'body'} no-markdown-renderer`} style={style}>
        {markdownText}
      </span>
    );
  }

  if (props.variant === 'caption') {
    return (
      <span
        className="a2ui-caption"
        style={{...style, color: '#666', textAlign: 'left'}}
        dangerouslySetInnerHTML={{__html: renderedHtml}}
      />
    );
  }

  return (
    <span
      className={`a2ui-text ${props.variant || 'body'}`}
      style={style}
      dangerouslySetInnerHTML={{__html: renderedHtml}}
    />
  );
});

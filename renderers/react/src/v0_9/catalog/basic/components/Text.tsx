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

export const Text = createComponentImplementation(TextApi, ({props}) => {
  const text = props.text ?? '';
  const style: React.CSSProperties = {
    ...getBaseLeafStyle(),
    display: 'inline-block',
  };

  const headerReset: React.CSSProperties = {
    margin: 0,
    fontWeight: 600,
    lineHeight: 1.2,
  };

  switch (props.variant) {
    case 'h1':
      return <h1 style={{...style, ...headerReset, fontSize: '2.25rem'}}>{text}</h1>;
    case 'h2':
      return <h2 style={{...style, ...headerReset, fontSize: '1.5rem'}}>{text}</h2>;
    case 'h3':
      return <h3 style={{...style, ...headerReset, fontSize: '1.25rem'}}>{text}</h3>;
    case 'h4':
      return <h4 style={{...style, ...headerReset, fontSize: '1.1rem'}}>{text}</h4>;
    case 'h5':
      return <h5 style={{...style, ...headerReset, fontSize: '1rem'}}>{text}</h5>;
    case 'caption':
      return (
        <span
          style={{
            ...style,
            color: '#666',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 500,
          }}
        >
          {text}
        </span>
      );
    case 'body':
    default:
      return <span style={{...style, lineHeight: 1.5}}>{text}</span>;
  }
});

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
import {createReactComponent} from '../../../adapter';
import {IconApi} from '@a2ui/web_core/v0_9/basic_catalog';
import {getBaseLeafStyle} from '../utils';

// Programmatically load the material symbols font if the application hasn't already.
if (typeof document !== 'undefined') {
  const isLoaded = Array.from(document.querySelectorAll('link')).some(
    (link) => link.href.includes('Material+Symbols+Outlined')
  );
  if (!isLoaded) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,1';
    document.head.appendChild(link);
  }
}

const ICON_MAPPING: Record<string, string> = {
  play: 'play_arrow',
  rewind: 'fast_rewind',
  favoriteOff: 'favorite',
  starOff: 'star',
};

const FILLED_ICONS = ['star', 'starHalf', 'favorite'];

export const Icon = createReactComponent(IconApi, ({props}) => {
  const rawIconName =
    typeof props.name === 'string' ? props.name : (props.name as {path?: string})?.path;
  
  // Use mapping if available, otherwise convert camelCase to snake_case
  let iconName = '';
  if (rawIconName) {
    if (ICON_MAPPING[rawIconName]) {
      iconName = ICON_MAPPING[rawIconName];
    } else {
      iconName = rawIconName.replace(/([A-Z])/gm, "_$1").toLowerCase();
    }
  }

  const isFilled = FILLED_ICONS.includes(rawIconName || '');

  const style: React.CSSProperties = {
    ...getBaseLeafStyle(),
    fontSize: '24px',
    width: '24px',
    height: '24px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontVariationSettings: isFilled ? '"FILL" 1' : undefined,
  };

  return (
    <span className="material-symbols-outlined" style={style}>
      {iconName}
    </span>
  );
});

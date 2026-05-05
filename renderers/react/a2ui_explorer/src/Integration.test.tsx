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

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MessageProcessor } from '@a2ui/web_core/v0_9';
import { basicCatalog, A2uiSurface } from '@a2ui/react/v0_9';

describe('A2UI React Integration', () => {
  it('renders a reactive node tree from messages', async () => {
    const processor = new MessageProcessor([basicCatalog]);
    
    render(<A2uiSurface surface={processor.model.getSurface('s1') as any} />);
    
    // 1. Create surface
    await act(async () => {
      processor.processMessages([
        {
          version: 'v0.9',
          createSurface: {
            surfaceId: 's1',
            catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json'
          }
        }
      ]);
    });

    // Re-render with the new surface
    const surface = processor.model.getSurface('s1');
    expect(surface).toBeDefined();
    
    render(<A2uiSurface surface={surface as any} />);

    // 2. Add components
    await act(async () => {
      processor.processMessages([
        {
          version: 'v0.9',
          updateComponents: {
            surfaceId: 's1',
            components: [
              {
                id: 'root',
                component: 'Card',
                child: 'title'
              },
              {
                id: 'title',
                component: 'Text',
                text: { path: '/title' }
              }
            ]
          }
        }
      ]);
    });

    // Should show loading or empty initially as data is missing
    expect(screen.queryByText('Hello World')).toBeNull();

    // 3. Update data
    await act(async () => {
      processor.processMessages([
        {
          version: 'v0.9',
          updateDataModel: {
            surfaceId: 's1',
            path: '/title',
            value: 'Hello World'
          }
        }
      ]);
    });

    // Now it should be rendered
    expect(screen.getByText('Hello World')).toBeDefined();

    // 4. Update data reactively
    await act(async () => {
      surface?.dataModel.set('/title', 'Updated Title');
    });

    expect(screen.getByText('Updated Title')).toBeDefined();
    expect(screen.queryByText('Hello World')).toBeNull();
  });
});

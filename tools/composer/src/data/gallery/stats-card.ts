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

import { Widget } from '@/types/widget';

// 28. Stats Card
export const STATS_CARD_WIDGET: Widget = {
  id: 'gallery-stats-card',
  name: 'Stats Card',
  description: 'Metric display with trend indicator',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  root: 'root',
  components: [
    {
      id: 'root',
      component: {
        Card: {
          child: 'main-column',
        },
      },
    },
    {
      id: 'main-column',
      component: {
        Column: {
          children: { explicitList: ['header', 'value', 'trend-row'] },
          gap: 'small',
        },
      },
    },
    {
      id: 'header',
      component: {
        Row: {
          children: { explicitList: ['metric-icon', 'metric-name'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'metric-icon',
      component: {
        Icon: {
          name: { path: '/icon' },
        },
      },
    },
    {
      id: 'metric-name',
      component: {
        Text: {
          text: { path: '/metricName' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'value',
      component: {
        Text: {
          text: { path: '/value' },
          usageHint: 'h1',
        },
      },
    },
    {
      id: 'trend-row',
      component: {
        Row: {
          children: { explicitList: ['trend-icon', 'trend-text'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'trend-icon',
      component: {
        Icon: {
          name: { path: '/trendIcon' },
        },
      },
    },
    {
      id: 'trend-text',
      component: {
        Text: {
          text: { path: '/trendText' },
          usageHint: 'body',
        },
      },
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        icon: 'trending_up',
        metricName: 'Monthly Revenue',
        value: '$48,294',
        trendIcon: 'arrow_upward',
        trendText: '+12.5% from last month',
      },
    },
  ],
};

export const STATS_CARD_GALLERY = { widget: STATS_CARD_WIDGET, height: 160 };

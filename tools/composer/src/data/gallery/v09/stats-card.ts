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
export const V09_STATS_CARD_WIDGET: Widget = {
  id: 'gallery-v09-stats-card',
  name: 'Stats Card',
  description: 'Metric display with trend indicator',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  specVersion: '0.9',
  root: 'root',
  components: [
    {
      id: 'root',
      component: 'Card',
      child: 'main-column',
    },
    {
      id: 'main-column',
      component: 'Column',
      children: ['header', 'value', 'trend-row'],
      gap: 'small',
    },
    {
      id: 'header',
      component: 'Row',
      children: ['metric-icon', 'metric-name'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'metric-icon',
      component: 'Icon',
      name: { path: '/icon' },
    },
    {
      id: 'metric-name',
      component: 'Text',
      text: { path: '/metricName' },
      variant: 'caption',
    },
    {
      id: 'value',
      component: 'Text',
      text: { path: '/value' },
      variant: 'h1',
    },
    {
      id: 'trend-row',
      component: 'Row',
      children: ['trend-icon', 'trend-text'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'trend-icon',
      component: 'Icon',
      name: { path: '/trendIcon' },
    },
    {
      id: 'trend-text',
      component: 'Text',
      text: { path: '/trendText' },
      variant: 'body',
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

export const V09_STATS_CARD_GALLERY = { widget: V09_STATS_CARD_WIDGET, height: 160 };

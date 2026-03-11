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

export const CALENDAR_DAY_WIDGET: Widget = {
  id: 'gallery-calendar-day',
  name: 'Calendar Day',
  description: 'Daily calendar view with scheduled events',
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
          children: { explicitList: ['header-row', 'events-list', 'actions'] },
          gap: 'small',
        },
      },
    },
    {
      id: 'header-row',
      component: {
        Row: {
          children: { explicitList: ['date-col', 'events-col'] },
          gap: 'medium',
        },
      },
    },
    {
      id: 'date-col',
      component: {
        Column: {
          children: { explicitList: ['day-name', 'day-number'] },
          alignment: 'start',
        },
      },
    },
    {
      id: 'day-name',
      component: {
        Text: {
          text: { path: '/dayName' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'day-number',
      component: {
        Text: {
          text: { path: '/dayNumber' },
          usageHint: 'h1',
        },
      },
    },
    {
      id: 'events-col',
      component: {
        Column: {
          children: { explicitList: ['event1', 'event2', 'event3'] },
          gap: 'small',
        },
      },
    },
    {
      id: 'event1',
      component: {
        Column: {
          children: { explicitList: ['event1-title', 'event1-time'] },
        },
      },
    },
    {
      id: 'event1-title',
      component: {
        Text: {
          text: { path: '/event1/title' },
          usageHint: 'body',
        },
      },
    },
    {
      id: 'event1-time',
      component: {
        Text: {
          text: { path: '/event1/time' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'event2',
      component: {
        Column: {
          children: { explicitList: ['event2-title', 'event2-time'] },
        },
      },
    },
    {
      id: 'event2-title',
      component: {
        Text: {
          text: { path: '/event2/title' },
          usageHint: 'body',
        },
      },
    },
    {
      id: 'event2-time',
      component: {
        Text: {
          text: { path: '/event2/time' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'event3',
      component: {
        Column: {
          children: { explicitList: ['event3-title', 'event3-time'] },
        },
      },
    },
    {
      id: 'event3-title',
      component: {
        Text: {
          text: { path: '/event3/title' },
          usageHint: 'body',
        },
      },
    },
    {
      id: 'event3-time',
      component: {
        Text: {
          text: { path: '/event3/time' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'events-list',
      component: {
        Divider: {},
      },
    },
    {
      id: 'actions',
      component: {
        Row: {
          children: { explicitList: ['add-btn', 'discard-btn'] },
          gap: 'small',
        },
      },
    },
    {
      id: 'add-btn-text',
      component: {
        Text: {
          text: { literalString: 'Add to calendar' },
        },
      },
    },
    {
      id: 'add-btn',
      component: {
        Button: {
          child: 'add-btn-text',
          action: 'add',
        },
      },
    },
    {
      id: 'discard-btn-text',
      component: {
        Text: {
          text: { literalString: 'Discard' },
        },
      },
    },
    {
      id: 'discard-btn',
      component: {
        Button: {
          child: 'discard-btn-text',
          action: 'discard',
        },
      },
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        dayName: 'Friday',
        dayNumber: '28',
        event1: { title: 'Lunch', time: '12:00 - 12:45 PM' },
        event2: { title: 'Q1 roadmap review', time: '1:00 - 2:00 PM' },
        event3: { title: 'Team standup', time: '3:30 - 4:00 PM' },
      },
    },
  ],
};

export const CALENDAR_DAY_GALLERY = {
  widget: CALENDAR_DAY_WIDGET,
  height: 280,
};

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

// 26. Contact Card
export const CONTACT_CARD_WIDGET: Widget = {
  id: 'gallery-contact-card',
  name: 'Contact Card',
  description: 'Contact info with avatar and action buttons',
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
          children: { explicitList: ['avatar-image', 'name', 'title', 'divider', 'contact-info', 'actions'] },
          gap: 'medium',
          alignment: 'center',
        },
      },
    },
    {
      id: 'avatar-image',
      component: {
        Image: {
          url: { path: '/avatar' },
          altText: { path: '/name' },
          fit: 'cover',
          usageHint: 'avatar',
        },
      },
    },
    {
      id: 'name',
      component: {
        Text: {
          text: { path: '/name' },
          usageHint: 'h2',
        },
      },
    },
    {
      id: 'title',
      component: {
        Text: {
          text: { path: '/title' },
          usageHint: 'body',
        },
      },
    },
    {
      id: 'divider',
      component: {
        Divider: {},
      },
    },
    {
      id: 'contact-info',
      component: {
        Column: {
          children: { explicitList: ['phone-row', 'email-row', 'location-row'] },
          gap: 'small',
        },
      },
    },
    {
      id: 'phone-row',
      component: {
        Row: {
          children: { explicitList: ['phone-icon', 'phone-text'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'phone-icon',
      component: {
        Icon: {
          name: { literalString: 'phone' },
        },
      },
    },
    {
      id: 'phone-text',
      component: {
        Text: {
          text: { path: '/phone' },
          usageHint: 'body',
        },
      },
    },
    {
      id: 'email-row',
      component: {
        Row: {
          children: { explicitList: ['email-icon', 'email-text'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'email-icon',
      component: {
        Icon: {
          name: { literalString: 'mail' },
        },
      },
    },
    {
      id: 'email-text',
      component: {
        Text: {
          text: { path: '/email' },
          usageHint: 'body',
        },
      },
    },
    {
      id: 'location-row',
      component: {
        Row: {
          children: { explicitList: ['location-icon', 'location-text'] },
          gap: 'small',
          alignment: 'center',
        },
      },
    },
    {
      id: 'location-icon',
      component: {
        Icon: {
          name: { literalString: 'location_on' },
        },
      },
    },
    {
      id: 'location-text',
      component: {
        Text: {
          text: { path: '/location' },
          usageHint: 'body',
        },
      },
    },
    {
      id: 'actions',
      component: {
        Row: {
          children: { explicitList: ['call-btn', 'message-btn'] },
          gap: 'small',
        },
      },
    },
    {
      id: 'call-btn-text',
      component: {
        Text: {
          text: { literalString: 'Call' },
        },
      },
    },
    {
      id: 'call-btn',
      component: {
        Button: {
          child: 'call-btn-text',
          action: 'call',
        },
      },
    },
    {
      id: 'message-btn-text',
      component: {
        Text: {
          text: { literalString: 'Message' },
        },
      },
    },
    {
      id: 'message-btn',
      component: {
        Button: {
          child: 'message-btn-text',
          action: 'message',
        },
      },
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        name: 'David Park',
        title: 'Engineering Manager',
        phone: '+1 (555) 234-5678',
        email: 'david.park@company.com',
        location: 'San Francisco, CA',
      },
    },
  ],
};

export const CONTACT_CARD_GALLERY = { widget: CONTACT_CARD_WIDGET, height: 320 };

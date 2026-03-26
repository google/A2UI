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

export const V09_CHAT_MESSAGE_WIDGET: Widget = {
  id: 'gallery-v09-chat-message',
  name: 'Chat Message Thread',
  description: 'Messaging thread with multiple messages and user avatars',
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
      children: ['header', 'divider', 'messages'],
      gap: 'small',
    },
    {
      id: 'header',
      component: 'Row',
      children: ['channel-icon', 'channel-name'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'channel-icon',
      component: 'Icon',
      name: 'tag',
    },
    {
      id: 'channel-name',
      component: 'Text',
      text: { path: '/channelName' },
      variant: 'h3',
    },
    {
      id: 'divider',
      component: 'Divider',
    },
    {
      id: 'messages',
      component: 'Column',
      children: ['message1', 'message2'],
      gap: 'medium',
      align: 'start',
    },
    {
      id: 'message1',
      component: 'Row',
      children: ['avatar1', 'msg1-content'],
      gap: 'small',
      align: 'start',
    },
    {
      id: 'avatar1',
      component: 'Image',
      url: { path: '/message1/avatar' },
      altText: { path: '/message1/username' },
      fit: 'cover',
      variant: 'avatar',
    },
    {
      id: 'msg1-content',
      component: 'Column',
      children: ['msg1-header', 'msg1-text'],
      gap: 'small',
    },
    {
      id: 'msg1-header',
      component: 'Row',
      children: ['msg1-username', 'msg1-time'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'msg1-username',
      component: 'Text',
      text: { path: '/message1/username' },
      variant: 'h4',
    },
    {
      id: 'msg1-time',
      component: 'Text',
      text: { path: '/message1/time' },
      variant: 'caption',
    },
    {
      id: 'msg1-text',
      component: 'Text',
      text: { path: '/message1/text' },
      variant: 'body',
    },
    {
      id: 'message2',
      component: 'Row',
      children: ['avatar2', 'msg2-content'],
      gap: 'small',
      align: 'start',
    },
    {
      id: 'avatar2',
      component: 'Image',
      url: { path: '/message2/avatar' },
      altText: { path: '/message2/username' },
      fit: 'cover',
      variant: 'avatar',
    },
    {
      id: 'msg2-content',
      component: 'Column',
      children: ['msg2-header', 'msg2-text'],
      gap: 'small',
    },
    {
      id: 'msg2-header',
      component: 'Row',
      children: ['msg2-username', 'msg2-time'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'msg2-username',
      component: 'Text',
      text: { path: '/message2/username' },
      variant: 'h4',
    },
    {
      id: 'msg2-time',
      component: 'Text',
      text: { path: '/message2/time' },
      variant: 'caption',
    },
    {
      id: 'msg2-text',
      component: 'Text',
      text: { path: '/message2/text' },
      variant: 'body',
    },
  ],
  dataStates: [
    {
      name: 'Default',
      data: {
        channelName: 'project-updates',
        message1: {
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop',
          username: 'Mike Chen',
          time: '10:32 AM',
          text: 'Just pushed the new API changes. Ready for review.',
        },
        message2: {
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop',
          username: 'Sarah Kim',
          time: '10:45 AM',
          text: "Great! I'll take a look after standup.",
        },
      },
    },
  ],
};

export const V09_CHAT_MESSAGE_GALLERY = { widget: V09_CHAT_MESSAGE_WIDGET, height: 300 };

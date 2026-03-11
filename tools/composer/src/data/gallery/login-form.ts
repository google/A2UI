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

export const LOGIN_FORM_WIDGET: Widget = {
  id: 'gallery-login-form',
  name: 'Login Form',
  description: 'User authentication form with email and password',
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
          children: { explicitList: ['header', 'email-field', 'password-field', 'login-btn', 'divider', 'signup-text'] },
          gap: 'medium',
        },
      },
    },
    {
      id: 'header',
      component: {
        Column: {
          children: { explicitList: ['title', 'subtitle'] },
          alignment: 'center',
        },
      },
    },
    {
      id: 'title',
      component: {
        Text: {
          text: { literalString: 'Welcome back' },
          usageHint: 'h2',
        },
      },
    },
    {
      id: 'subtitle',
      component: {
        Text: {
          text: { literalString: 'Sign in to your account' },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'email-field',
      component: {
        TextField: {
          value: { path: '/email' },
          placeholder: { literalString: 'Email address' },
          label: { literalString: 'Email' },
          action: 'updateEmail',
        },
      },
    },
    {
      id: 'password-field',
      component: {
        TextField: {
          value: { path: '/password' },
          placeholder: { literalString: 'Password' },
          label: { literalString: 'Password' },
          action: 'updatePassword',
        },
      },
    },
    {
      id: 'login-btn-text',
      component: {
        Text: {
          text: { literalString: 'Sign in' },
        },
      },
    },
    {
      id: 'login-btn',
      component: {
        Button: {
          child: 'login-btn-text',
          action: 'login',
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
      id: 'signup-text',
      component: {
        Row: {
          children: { explicitList: ['no-account', 'signup-link'] },
          distribution: 'center',
          gap: 'small',
        },
      },
    },
    {
      id: 'no-account',
      component: {
        Text: {
          text: { literalString: "Don't have an account?" },
          usageHint: 'caption',
        },
      },
    },
    {
      id: 'signup-link-text',
      component: {
        Text: {
          text: { literalString: 'Sign up' },
        },
      },
    },
    {
      id: 'signup-link',
      component: {
        Button: {
          child: 'signup-link-text',
          action: 'signup',
        },
      },
    },
  ],
  dataStates: [
    {
      name: 'Empty',
      data: {
        email: '',
        password: '',
      },
    },
    {
      name: 'Filled',
      data: {
        email: 'user@example.com',
        password: '••••••••',
      },
    },
  ],
};

export const LOGIN_FORM_GALLERY = {
  widget: LOGIN_FORM_WIDGET,
  height: 320,
};

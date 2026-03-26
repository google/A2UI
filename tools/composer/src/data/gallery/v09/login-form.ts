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

export const V09_LOGIN_FORM_WIDGET: Widget = {
  id: 'gallery-v09-login-form',
  name: 'Login Form',
  description: 'User authentication form with email and password',
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
      children: ['header', 'email-field', 'password-field', 'login-btn', 'divider', 'signup-text'],
      gap: 'medium',
    },
    {
      id: 'header',
      component: 'Column',
      children: ['title', 'subtitle'],
      align: 'center',
    },
    {
      id: 'title',
      component: 'Text',
      text: 'Welcome back',
      variant: 'h2',
    },
    {
      id: 'subtitle',
      component: 'Text',
      text: 'Sign in to your account',
      variant: 'caption',
    },
    {
      id: 'email-field',
      component: 'TextField',
      value: { path: '/email' },
      placeholder: 'Email address',
      label: 'Email',
      action: { event: { name: 'updateEmail' } },
    },
    {
      id: 'password-field',
      component: 'TextField',
      value: { path: '/password' },
      placeholder: 'Password',
      label: 'Password',
      action: { event: { name: 'updatePassword' } },
    },
    {
      id: 'login-btn-text',
      component: 'Text',
      text: 'Sign in',
    },
    {
      id: 'login-btn',
      component: 'Button',
      child: 'login-btn-text',
      action: { event: { name: 'login' } },
    },
    {
      id: 'divider',
      component: 'Divider',
    },
    {
      id: 'signup-text',
      component: 'Row',
      children: ['no-account', 'signup-link'],
      justify: 'center',
      gap: 'small',
    },
    {
      id: 'no-account',
      component: 'Text',
      text: "Don't have an account?",
      variant: 'caption',
    },
    {
      id: 'signup-link-text',
      component: 'Text',
      text: 'Sign up',
    },
    {
      id: 'signup-link',
      component: 'Button',
      child: 'signup-link-text',
      action: { event: { name: 'signup' } },
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
        password: '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
      },
    },
  ],
};

export const V09_LOGIN_FORM_GALLERY = {
  widget: V09_LOGIN_FORM_WIDGET,
  height: 320,
};

/**
 * v0.9 Contact Card — gallery sample using the v0.9 A2UI format.
 *
 * Demonstrates:
 * - Flat component format (component: "Text" instead of { Text: { ... } })
 * - Native data binding (text: { path: "/name" } without literalString wrapper)
 * - v0.9 action format ({ event: { name: "...", context: { ... } } })
 * - Property renames (variant instead of usageHint, align/justify instead of alignment/distribution)
 */

import { Widget } from '@/types/widget';

export const V09_CONTACT_CARD_WIDGET: Widget = {
  id: 'gallery-v09-contact-card',
  name: 'Contact Card (v0.9)',
  description: 'Contact card using the v0.9 A2UI format',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  specVersion: '0.9',
  root: 'root',
  // v0.9 components use flat format: { id, component: "TypeName", ...props }
  components: [
    {
      id: 'root',
      component: 'Card',
      child: 'main_column',
    },
    {
      id: 'main_column',
      component: 'Column',
      children: ['name_text', 'title_text', 'divider', 'email_row', 'phone_row', 'action_row'],
      align: 'stretch',
    },
    {
      id: 'name_text',
      component: 'Text',
      text: { path: '/name' },
      variant: 'h2',
    },
    {
      id: 'title_text',
      component: 'Text',
      text: { path: '/title' },
    },
    {
      id: 'divider',
      component: 'Divider',
    },
    {
      id: 'email_icon',
      component: 'Icon',
      name: 'mail',
    },
    {
      id: 'email_text',
      component: 'Text',
      text: { path: '/email' },
    },
    {
      id: 'email_row',
      component: 'Row',
      children: ['email_icon', 'email_text'],
      align: 'center',
      justify: 'start',
    },
    {
      id: 'phone_icon',
      component: 'Icon',
      name: 'call',
    },
    {
      id: 'phone_text',
      component: 'Text',
      text: { path: '/phone' },
    },
    {
      id: 'phone_row',
      component: 'Row',
      children: ['phone_icon', 'phone_text'],
      align: 'center',
      justify: 'start',
    },
    {
      id: 'message_btn_text',
      component: 'Text',
      text: 'Message',
    },
    {
      id: 'message_btn',
      component: 'Button',
      child: 'message_btn_text',
      action: {
        event: {
          name: 'send_message',
          context: {
            contactName: { path: '/name' },
          },
        },
      },
    },
    {
      id: 'call_btn_text',
      component: 'Text',
      text: 'Call',
    },
    {
      id: 'call_btn',
      component: 'Button',
      child: 'call_btn_text',
      action: {
        event: {
          name: 'make_call',
          context: {
            phone: { path: '/phone' },
          },
        },
      },
    },
    {
      id: 'action_row',
      component: 'Row',
      children: ['message_btn', 'call_btn'],
      justify: 'center',
      align: 'center',
    },
  ] as any[], // v0.9 components have a different shape than v0.8 ComponentInstance
  dataStates: [
    {
      name: 'default',
      data: {
        name: 'Sarah Chen',
        title: 'Senior Engineer',
        email: 'sarah.chen@example.com',
        phone: '+1 (555) 234-5678',
      },
    },
  ],
};

export const V09_CONTACT_CARD_GALLERY = {
  widget: V09_CONTACT_CARD_WIDGET,
  height: 400,
};

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

import { Example } from './types';

export const EXAMPLES: Example[] = [
  {
    name: 'Simple Text',
    description: 'Basic text rendering',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'example_1',
          catalogId: 'https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json',
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'example_1',
          components: [
            {
              id: 'root',
              component: 'Text',
              text: 'Hello, Minimal Catalog!',
              variant: 'h1',
            },
          ],
        },
      },
    ],
  },
  {
    name: 'Row Layout',
    description: 'Two components side-by-side',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'example_2',
          catalogId: 'https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json',
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'example_2',
          components: [
            {
              id: 'root',
              component: 'Row',
              children: ['left_text', 'right_text'],
              justify: 'spaceBetween',
              align: 'center',
            },
            {
              id: 'left_text',
              component: 'Text',
              text: 'Left Content',
              variant: 'body',
            },
            {
              id: 'right_text',
              component: 'Text',
              text: 'Right Content',
              variant: 'caption',
            },
          ],
        },
      },
    ],
  },
  {
    name: 'Interactive Button',
    description: 'Button with click event',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'example_3',
          catalogId: 'https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json',
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'example_3',
          components: [
            {
              id: 'root',
              component: 'Column',
              children: ['title', 'action_button'],
              justify: 'center',
              align: 'center',
            },
            {
              id: 'title',
              component: 'Text',
              text: 'Click the button below',
              variant: 'body',
            },
            {
              id: 'action_button',
              component: 'Button',
              child: 'button_label',
              variant: 'primary',
              action: {
                event: {
                  name: 'button_clicked',
                  context: {},
                },
              },
            },
            {
              id: 'button_label',
              component: 'Text',
              text: 'Click Me',
            },
          ],
        },
      },
    ],
  },
  {
    name: 'Login Form',
    description: 'Form with input fields and action',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'example_4',
          catalogId: 'https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'example_4',
          components: [
            {
              id: 'root',
              component: 'Column',
              children: ['form_title', 'username_field', 'password_field', 'submit_button'],
              justify: 'start',
              align: 'stretch',
            },
            {
              id: 'form_title',
              component: 'Text',
              text: 'Login',
              variant: 'h2',
            },
            {
              id: 'username_field',
              component: 'TextField',
              label: 'Username',
              value: {
                path: '/username',
              },
              variant: 'shortText',
            },
            {
              id: 'password_field',
              component: 'TextField',
              label: 'Password',
              value: {
                path: '/password',
              },
              variant: 'obscured',
            },
            {
              id: 'submit_button',
              component: 'Button',
              child: 'submit_label',
              variant: 'primary',
              action: {
                event: {
                  name: 'login_submitted',
                  context: {
                    user: {
                      path: '/username',
                    },
                    pass: {
                      path: '/password',
                    },
                  },
                },
              },
            },
            {
              id: 'submit_label',
              component: 'Text',
              text: 'Sign In',
            },
          ],
        },
      },
    ],
  },
  {
    name: 'Complex Layout',
    description: 'Nested rows and columns',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'example_5',
          catalogId: 'https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json',
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'example_5',
          components: [
            {
              id: 'root',
              component: 'Column',
              children: ['header', 'form_row', 'footer'],
              justify: 'spaceBetween',
              align: 'stretch',
            },
            {
              id: 'header',
              component: 'Text',
              text: 'User Profile Form',
              variant: 'h1',
            },
            {
              id: 'form_row',
              component: 'Row',
              children: ['first_name', 'last_name'],
              justify: 'start',
              align: 'start',
            },
            {
              id: 'first_name',
              component: 'TextField',
              label: 'First Name',
              value: {
                path: '/firstName',
              },
              weight: 1,
            },
            {
              id: 'last_name',
              component: 'TextField',
              label: 'Last Name',
              value: {
                path: '/lastName',
              },
              weight: 1,
            },
            {
              id: 'footer',
              component: 'Text',
              text: 'Please fill out all fields.',
              variant: 'caption',
            },
          ],
        },
      },
    ],
  },
  {
    name: 'Capitalized Text',
    description: 'Client-side function example',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'example_6',
          catalogId: 'https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'example_6',
          components: [
            {
              id: 'root',
              component: 'Column',
              children: ['input_field', 'result_label', 'result_text', 'submit_button'],
              justify: 'start',
              align: 'stretch',
            },
            {
              id: 'input_field',
              component: 'TextField',
              label: 'Type something in lowercase:',
              value: {
                path: '/inputValue',
              },
              variant: 'shortText',
            },
            {
              id: 'result_label',
              component: 'Text',
              text: 'Capitalized output:',
              variant: 'caption',
            },
            {
              id: 'result_text',
              component: 'Text',
              text: {
                call: 'capitalize',
                args: {
                  value: {
                    path: '/inputValue',
                  },
                },
                returnType: 'string',
              },
              variant: 'h2',
            },
            {
              id: 'submit_button',
              component: 'Button',
              child: 'submit_label',
              variant: 'primary',
              action: {
                event: {
                  name: 'capitalized_submit',
                  context: {
                    value: {
                      call: 'capitalize',
                      args: {
                        value: {
                          path: '/inputValue',
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              id: 'submit_label',
              component: 'Text',
              text: 'Submit',
            },
          ],
        },
      },
    ],
  },
  {
    name: 'Incremental List',
    description:
      'Demonstrates progressive rendering of a list with templates and data model reactivity.',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'example_7',
          catalogId: 'https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json',
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'example_7',
          path: '/',
          value: {
            restaurants: [
              {
                title: 'The Golden Fork',
                subtitle: 'Fine Dining & Spirits',
                address: '123 Gastronomy Lane',
              },
              {
                title: "Ocean's Bounty",
                subtitle: 'Fresh Daily Seafood',
                address: '456 Shoreline Dr',
              },
              {
                title: 'Pizzeria Roma',
                subtitle: 'Authentic Wood-Fired Pizza',
                address: '789 Napoli Way',
              },
            ],
          },
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'example_7',
          components: [
            {
              id: 'root',
              component: 'Column',
              children: {
                path: '/restaurants',
                componentId: 'restaurant_card',
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'example_7',
          components: [
            {
              id: 'restaurant_card',
              component: 'Column',
              children: ['rc_title', 'rc_subtitle', 'rc_address'],
            },
            {
              id: 'rc_title',
              component: 'Text',
              text: {
                path: 'title',
              },
            },
            {
              id: 'rc_subtitle',
              component: 'Text',
              text: {
                path: 'subtitle',
              },
            },
            {
              id: 'rc_address',
              component: 'Text',
              text: {
                path: 'address',
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'example_7',
          path: '/restaurants/3',
          value: {
            title: 'Spice Route',
            subtitle: 'Exotic Flavors from the East',
            address: '101 Silk Road St',
          },
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'example_7',
          components: [
            {
              id: 'restaurant_card',
              component: 'Column',
              children: ['rc_title', 'rc_subtitle', 'rc_address', 'rc_button'],
            },
            {
              id: 'rc_button',
              component: 'Button',
              child: 'rc_button_label',
              action: {
                event: {
                  name: 'book_now',
                  context: {
                    restaurantName: {
                      path: 'title',
                    },
                  },
                },
              },
            },
            {
              id: 'rc_button_label',
              component: 'Text',
              text: 'Book now',
            },
          ],
        },
      },
    ],
  },
  {
    name: 'Custom Price Slider',
    description: 'Interactive price selection using a custom slider component',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'example_8',
          catalogId: 'https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json',
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'example_8',
          path: '/price',
          value: 75,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'example_8',
          components: [
            {
              id: 'root',
              component: 'Column',
              children: ['price_slider', 'price_field'],
            },
            {
              id: 'price_slider',
              component: 'CustomSlider',
              label: 'Dollars',
              value: { path: '/price' },
              min: 0,
              max: 200,
            },
            {
              id: 'price_field',
              component: 'Text',
              text: {
                call: 'formatString',
                args: { value: 'Price: $${/price}' },
              },
            },
          ],
        },
      },
    ],
  },
];

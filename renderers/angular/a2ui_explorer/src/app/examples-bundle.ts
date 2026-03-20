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

          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
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

              text: 'Hello, Basic Catalog!',
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

          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
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

          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
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

          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
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

          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
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

          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
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

          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
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

          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
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

  {
    name: 'Flight Status',
    description: 'Example of flight status',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-flight-status',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-flight-status',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['header-row', 'route-row', 'divider', 'times-row'],
              align: 'stretch',
            },
            {
              id: 'header-row',
              component: 'Row',
              children: ['header-left', 'date'],
              justify: 'spaceBetween',
              align: 'center',
            },
            {
              id: 'header-left',
              component: 'Row',
              children: ['flight-indicator', 'flight-number'],
              align: 'center',
            },
            {
              id: 'flight-indicator',
              component: 'Icon',
              name: 'send',
            },
            {
              id: 'flight-number',
              component: 'Text',
              text: {
                path: '/flightNumber',
              },
              variant: 'h3',
            },
            {
              id: 'date',
              component: 'Text',
              text: {
                path: '/date',
              },
              variant: 'caption',
            },
            {
              id: 'route-row',
              component: 'Row',
              children: ['origin', 'arrow', 'destination'],
              align: 'center',
            },
            {
              id: 'origin',
              component: 'Text',
              text: {
                path: '/origin',
              },
              variant: 'h2',
            },
            {
              id: 'arrow',
              component: 'Text',
              text: '\u2192',
              variant: 'h2',
            },
            {
              id: 'destination',
              component: 'Text',
              text: {
                path: '/destination',
              },
              variant: 'h2',
            },
            {
              id: 'divider',
              component: 'Divider',
            },
            {
              id: 'times-row',
              component: 'Row',
              children: ['departure-col', 'status-col', 'arrival-col'],
              justify: 'spaceBetween',
            },
            {
              id: 'departure-col',
              component: 'Column',
              children: ['departure-label', 'departure-time'],
              align: 'start',
            },
            {
              id: 'departure-label',
              component: 'Text',
              text: 'Departs',
              variant: 'caption',
            },
            {
              id: 'departure-time',
              component: 'Text',
              text: {
                path: '/departureTime',
              },
              variant: 'h3',
            },
            {
              id: 'status-col',
              component: 'Column',
              children: ['status-label', 'status-value'],
              align: 'center',
            },
            {
              id: 'status-label',
              component: 'Text',
              text: 'Status',
              variant: 'caption',
            },
            {
              id: 'status-value',
              component: 'Text',
              text: {
                path: '/status',
              },
              variant: 'body',
            },
            {
              id: 'arrival-col',
              component: 'Column',
              children: ['arrival-label', 'arrival-time'],
              align: 'end',
            },
            {
              id: 'arrival-label',
              component: 'Text',
              text: 'Arrives',
              variant: 'caption',
            },
            {
              id: 'arrival-time',
              component: 'Text',
              text: {
                path: '/arrivalTime',
              },
              variant: 'h3',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-flight-status',
          value: {
            flightNumber: 'OS 87',
            date: 'Mon, Dec 15',
            origin: 'Vienna',
            destination: 'New York',
            departureTime: '10:15 AM',
            status: 'On Time',
            arrivalTime: '2:30 PM',
          },
        },
      },
    ],
  },
  {
    name: 'Email Compose',
    description: 'Example of email compose',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-email-compose',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-email-compose',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['from-row', 'to-row', 'subject-row', 'divider', 'message', 'actions'],
            },
            {
              id: 'from-row',
              component: 'Row',
              children: ['from-label', 'from-value'],
              align: 'center',
            },
            {
              id: 'from-label',
              component: 'Text',
              text: 'FROM',
              variant: 'caption',
            },
            {
              id: 'from-value',
              component: 'Text',
              text: {
                path: '/from',
              },
              variant: 'body',
            },
            {
              id: 'to-row',
              component: 'Row',
              children: ['to-label', 'to-value'],
              align: 'center',
            },
            {
              id: 'to-label',
              component: 'Text',
              text: 'TO',
              variant: 'caption',
            },
            {
              id: 'to-value',
              component: 'Text',
              text: {
                path: '/to',
              },
              variant: 'body',
            },
            {
              id: 'subject-row',
              component: 'Row',
              children: ['subject-label', 'subject-value'],
              align: 'center',
            },
            {
              id: 'subject-label',
              component: 'Text',
              text: 'SUBJECT',
              variant: 'caption',
            },
            {
              id: 'subject-value',
              component: 'Text',
              text: {
                path: '/subject',
              },
              variant: 'body',
            },
            {
              id: 'divider',
              component: 'Divider',
            },
            {
              id: 'message',
              component: 'Column',
              children: ['greeting', 'body-text', 'closing', 'signature'],
            },
            {
              id: 'greeting',
              component: 'Text',
              text: {
                path: '/greeting',
              },
              variant: 'body',
            },
            {
              id: 'body-text',
              component: 'Text',
              text: {
                path: '/body',
              },
              variant: 'body',
            },
            {
              id: 'closing',
              component: 'Text',
              text: {
                path: '/closing',
              },
              variant: 'body',
            },
            {
              id: 'signature',
              component: 'Text',
              text: {
                path: '/signature',
              },
              variant: 'body',
            },
            {
              id: 'actions',
              component: 'Row',
              children: ['send-btn', 'discard-btn'],
            },
            {
              id: 'send-btn-text',
              component: 'Text',
              text: 'Send email',
            },
            {
              id: 'send-btn',
              component: 'Button',
              child: 'send-btn-text',
              action: {
                event: {
                  name: 'send',
                  context: {},
                },
              },
            },
            {
              id: 'discard-btn-text',
              component: 'Text',
              text: 'Discard',
            },
            {
              id: 'discard-btn',
              component: 'Button',
              child: 'discard-btn-text',
              action: {
                event: {
                  name: 'discard',
                  context: {},
                },
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-email-compose',
          value: {
            from: 'alex@acme.com',
            to: 'jordan@acme.com',
            subject: 'Q4 Revenue Forecast',
            greeting: 'Hi Jordan,',
            body: 'Following up on our call. Please review the attached Q4 forecast and let me know if you have questions before the board meeting.',
            closing: 'Best,',
            signature: 'Alex',
          },
        },
      },
    ],
  },
  {
    name: 'Calendar Day',
    description: 'Example of calendar day',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-calendar-day',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-calendar-day',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['header-row', 'divider', 'actions'],
            },
            {
              id: 'header-row',
              component: 'Row',
              children: ['date-col', 'events-col'],
            },
            {
              id: 'date-col',
              component: 'Column',
              children: ['day-name', 'day-number'],
              align: 'start',
            },
            {
              id: 'day-name',
              component: 'Text',
              text: {
                path: '/dayName',
              },
              variant: 'caption',
            },
            {
              id: 'day-number',
              component: 'Text',
              text: {
                path: '/dayNumber',
              },
              variant: 'h1',
            },
            {
              id: 'events-col',
              component: 'Column',
              children: ['event1', 'event2', 'event3'],
            },
            {
              id: 'event1',
              component: 'Column',
              children: ['event1-title', 'event1-time'],
            },
            {
              id: 'event1-title',
              component: 'Text',
              text: {
                path: '/event1/title',
              },
              variant: 'body',
            },
            {
              id: 'event1-time',
              component: 'Text',
              text: {
                path: '/event1/time',
              },
              variant: 'caption',
            },
            {
              id: 'event2',
              component: 'Column',
              children: ['event2-title', 'event2-time'],
            },
            {
              id: 'event2-title',
              component: 'Text',
              text: {
                path: '/event2/title',
              },
              variant: 'body',
            },
            {
              id: 'event2-time',
              component: 'Text',
              text: {
                path: '/event2/time',
              },
              variant: 'caption',
            },
            {
              id: 'event3',
              component: 'Column',
              children: ['event3-title', 'event3-time'],
            },
            {
              id: 'event3-title',
              component: 'Text',
              text: {
                path: '/event3/title',
              },
              variant: 'body',
            },
            {
              id: 'event3-time',
              component: 'Text',
              text: {
                path: '/event3/time',
              },
              variant: 'caption',
            },
            {
              id: 'divider',
              component: 'Divider',
            },
            {
              id: 'actions',
              component: 'Row',
              children: ['add-btn', 'discard-btn'],
            },
            {
              id: 'add-btn-text',
              component: 'Text',
              text: 'Add to calendar',
            },
            {
              id: 'add-btn',
              component: 'Button',
              child: 'add-btn-text',
              action: {
                event: {
                  name: 'add',
                  context: {},
                },
              },
            },
            {
              id: 'discard-btn-text',
              component: 'Text',
              text: 'Discard',
            },
            {
              id: 'discard-btn',
              component: 'Button',
              child: 'discard-btn-text',
              action: {
                event: {
                  name: 'discard',
                  context: {},
                },
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-calendar-day',
          value: {
            dayName: 'Friday',
            dayNumber: '28',
            event1: {
              title: 'Lunch',
              time: '12:00 - 12:45 PM',
            },
            event2: {
              title: 'Q1 roadmap review',
              time: '1:00 - 2:00 PM',
            },
            event3: {
              title: 'Team standup',
              time: '3:30 - 4:00 PM',
            },
          },
        },
      },
    ],
  },
  {
    name: 'Weather Current',
    description: 'Example of weather current',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-weather-current',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-weather-current',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['temp-row', 'location', 'description', 'forecast-row'],
              align: 'center',
            },
            {
              id: 'temp-row',
              component: 'Row',
              children: ['temp-high', 'temp-low'],
              align: 'start',
            },
            {
              id: 'temp-high',
              component: 'Text',
              text: {
                path: '/tempHigh',
              },
              variant: 'h1',
            },
            {
              id: 'temp-low',
              component: 'Text',
              text: {
                path: '/tempLow',
              },
              variant: 'h2',
            },
            {
              id: 'location',
              component: 'Text',
              text: {
                path: '/location',
              },
              variant: 'h3',
            },
            {
              id: 'description',
              component: 'Text',
              text: {
                path: '/description',
              },
              variant: 'caption',
            },
            {
              id: 'forecast-row',
              component: 'Row',
              children: ['day1', 'day2', 'day3', 'day4', 'day5'],
              justify: 'spaceAround',
            },
            {
              id: 'day1',
              component: 'Column',
              children: ['day1-icon', 'day1-temp'],
              align: 'center',
            },
            {
              id: 'day1-icon',
              component: 'Text',
              text: {
                path: '/forecast/0/icon',
              },
              variant: 'h3',
            },
            {
              id: 'day1-temp',
              component: 'Text',
              text: {
                path: '/forecast/0/temp',
              },
              variant: 'caption',
            },
            {
              id: 'day2',
              component: 'Column',
              children: ['day2-icon', 'day2-temp'],
              align: 'center',
            },
            {
              id: 'day2-icon',
              component: 'Text',
              text: {
                path: '/forecast/1/icon',
              },
              variant: 'h3',
            },
            {
              id: 'day2-temp',
              component: 'Text',
              text: {
                path: '/forecast/1/temp',
              },
              variant: 'caption',
            },
            {
              id: 'day3',
              component: 'Column',
              children: ['day3-icon', 'day3-temp'],
              align: 'center',
            },
            {
              id: 'day3-icon',
              component: 'Text',
              text: {
                path: '/forecast/2/icon',
              },
              variant: 'h3',
            },
            {
              id: 'day3-temp',
              component: 'Text',
              text: {
                path: '/forecast/2/temp',
              },
              variant: 'caption',
            },
            {
              id: 'day4',
              component: 'Column',
              children: ['day4-icon', 'day4-temp'],
              align: 'center',
            },
            {
              id: 'day4-icon',
              component: 'Text',
              text: {
                path: '/forecast/3/icon',
              },
              variant: 'h3',
            },
            {
              id: 'day4-temp',
              component: 'Text',
              text: {
                path: '/forecast/3/temp',
              },
              variant: 'caption',
            },
            {
              id: 'day5',
              component: 'Column',
              children: ['day5-icon', 'day5-temp'],
              align: 'center',
            },
            {
              id: 'day5-icon',
              component: 'Text',
              text: {
                path: '/forecast/4/icon',
              },
              variant: 'h3',
            },
            {
              id: 'day5-temp',
              component: 'Text',
              text: {
                path: '/forecast/4/temp',
              },
              variant: 'caption',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-weather-current',
          value: {
            tempHigh: '72\u00b0',
            tempLow: '58\u00b0',
            location: 'Austin, TX',
            description: 'Clear skies with light breeze',
            forecast: [
              {
                icon: '\u2600\ufe0f',
                temp: '74\u00b0',
              },
              {
                icon: '\u2600\ufe0f',
                temp: '76\u00b0',
              },
              {
                icon: '\u26c5',
                temp: '71\u00b0',
              },
              {
                icon: '\u2600\ufe0f',
                temp: '73\u00b0',
              },
              {
                icon: '\u2600\ufe0f',
                temp: '75\u00b0',
              },
            ],
          },
        },
      },
    ],
  },
  {
    name: 'Product Card',
    description: 'Example of product card',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-product-card',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-product-card',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['image', 'details'],
            },
            {
              id: 'image',
              component: 'Image',
              url: {
                path: '/imageUrl',
              },
              fit: 'cover',
            },
            {
              id: 'details',
              component: 'Column',
              children: ['name', 'rating-row', 'price-row', 'actions'],
            },
            {
              id: 'name',
              component: 'Text',
              text: {
                path: '/name',
              },
              variant: 'h3',
            },
            {
              id: 'rating-row',
              component: 'Row',
              children: ['stars', 'reviews'],
              align: 'center',
            },
            {
              id: 'stars',
              component: 'Text',
              text: {
                path: '/stars',
              },
              variant: 'body',
            },
            {
              id: 'reviews',
              component: 'Text',
              text: {
                path: '/reviews',
              },
              variant: 'caption',
            },
            {
              id: 'price-row',
              component: 'Row',
              children: ['price', 'original-price'],
              align: 'start',
            },
            {
              id: 'price',
              component: 'Text',
              text: {
                path: '/price',
              },
              variant: 'h2',
            },
            {
              id: 'original-price',
              component: 'Text',
              text: {
                path: '/originalPrice',
              },
              variant: 'caption',
            },
            {
              id: 'actions',
              component: 'Row',
              children: ['add-cart-btn'],
            },
            {
              id: 'add-cart-btn-text',
              component: 'Text',
              text: 'Add to Cart',
            },
            {
              id: 'add-cart-btn',
              component: 'Button',
              child: 'add-cart-btn-text',
              action: {
                event: {
                  name: 'addToCart',
                  context: {},
                },
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-product-card',
          value: {
            imageUrl:
              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop',
            name: 'Wireless Headphones Pro',
            stars: '\u2605\u2605\u2605\u2605\u2605',
            reviews: '(2,847 reviews)',
            price: '$199.99',
            originalPrice: '$249.99',
          },
        },
      },
    ],
  },
  {
    name: 'Music Player',
    description: 'Example of music player',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-music-player',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-music-player',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['album-art', 'track-info', 'progress', 'time-row', 'controls'],
              align: 'center',
            },
            {
              id: 'album-art',
              component: 'Image',
              url: {
                path: '/albumArt',
              },
              fit: 'cover',
            },
            {
              id: 'track-info',
              component: 'Column',
              children: ['song-title', 'artist'],
              align: 'center',
            },
            {
              id: 'song-title',
              component: 'Text',
              text: {
                path: '/title',
              },
              variant: 'h3',
            },
            {
              id: 'artist',
              component: 'Text',
              text: {
                path: '/artist',
              },
              variant: 'caption',
            },
            {
              id: 'progress',
              component: 'Slider',
              value: {
                path: '/progress',
              },
              max: 1,
            },
            {
              id: 'time-row',
              component: 'Row',
              children: ['current-time', 'total-time'],
              justify: 'spaceBetween',
            },
            {
              id: 'current-time',
              component: 'Text',
              text: {
                path: '/currentTime',
              },
              variant: 'caption',
            },
            {
              id: 'total-time',
              component: 'Text',
              text: {
                path: '/totalTime',
              },
              variant: 'caption',
            },
            {
              id: 'controls',
              component: 'Row',
              children: ['prev-btn', 'play-btn', 'next-btn'],
              justify: 'center',
            },
            {
              id: 'prev-btn-icon',
              component: 'Icon',
              name: 'skipPrevious',
            },
            {
              id: 'prev-btn',
              component: 'Button',
              child: 'prev-btn-icon',
              action: {
                event: {
                  name: 'previous',
                  context: {},
                },
              },
            },
            {
              id: 'play-btn-icon',
              component: 'Icon',
              name: {
                path: '/playIcon',
              },
            },
            {
              id: 'play-btn',
              component: 'Button',
              child: 'play-btn-icon',
              action: {
                event: {
                  name: 'playPause',
                  context: {},
                },
              },
            },
            {
              id: 'next-btn-icon',
              component: 'Icon',
              name: 'skipNext',
            },
            {
              id: 'next-btn',
              component: 'Button',
              child: 'next-btn-icon',
              action: {
                event: {
                  name: 'next',
                  context: {},
                },
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-music-player',
          value: {
            albumArt:
              'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
            title: 'Blinding Lights',
            artist: 'The Weeknd',
            album: 'After Hours',
            progress: 0.45,
            currentTime: '1:48',
            totalTime: '4:22',
            playIcon: 'pause',
          },
        },
      },
    ],
  },
  {
    name: 'Task Card',
    description: 'Example of task card',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-task-card',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-task-card',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-row',
            },
            {
              id: 'main-row',
              component: 'Row',
              children: ['content', 'priority'],
              align: 'start',
            },
            {
              id: 'content',
              component: 'Column',
              children: ['title', 'description', 'meta-row'],
            },
            {
              id: 'title',
              component: 'Text',
              text: {
                path: '/title',
              },
              variant: 'h3',
            },
            {
              id: 'description',
              component: 'Text',
              text: {
                path: '/description',
              },
              variant: 'body',
            },
            {
              id: 'meta-row',
              component: 'Row',
              children: ['due-date', 'project'],
            },
            {
              id: 'due-date',
              component: 'Text',
              text: {
                path: '/dueDate',
              },
              variant: 'caption',
            },
            {
              id: 'project',
              component: 'Text',
              text: {
                path: '/project',
              },
              variant: 'caption',
            },
            {
              id: 'priority',
              component: 'Icon',
              name: {
                path: '/priorityIcon',
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-task-card',
          value: {
            title: 'Review pull request',
            description: 'Review and approve the authentication module changes.',
            dueDate: 'Today',
            project: 'Backend',
            priorityIcon: 'priority_high',
          },
        },
      },
    ],
  },
  {
    name: 'User Profile',
    description: 'Example of user profile',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-user-profile',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-user-profile',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['header', 'info', 'bio', 'stats-row', 'follow-btn'],
              align: 'center',
            },
            {
              id: 'header',
              component: 'Image',
              url: {
                path: '/avatar',
              },
              fit: 'cover',
              variant: 'avatar',
            },
            {
              id: 'info',
              component: 'Column',
              children: ['name', 'username'],
              align: 'center',
            },
            {
              id: 'name',
              component: 'Text',
              text: {
                path: '/name',
              },
              variant: 'h2',
            },
            {
              id: 'username',
              component: 'Text',
              text: {
                path: '/username',
              },
              variant: 'caption',
            },
            {
              id: 'bio',
              component: 'Text',
              text: {
                path: '/bio',
              },
              variant: 'body',
            },
            {
              id: 'stats-row',
              component: 'Row',
              children: ['followers-col', 'following-col', 'posts-col'],
              justify: 'spaceAround',
            },
            {
              id: 'followers-col',
              component: 'Column',
              children: ['followers-count', 'followers-label'],
              align: 'center',
            },
            {
              id: 'followers-count',
              component: 'Text',
              text: {
                path: '/followers',
              },
              variant: 'h3',
            },
            {
              id: 'followers-label',
              component: 'Text',
              text: 'Followers',
              variant: 'caption',
            },
            {
              id: 'following-col',
              component: 'Column',
              children: ['following-count', 'following-label'],
              align: 'center',
            },
            {
              id: 'following-count',
              component: 'Text',
              text: {
                path: '/following',
              },
              variant: 'h3',
            },
            {
              id: 'following-label',
              component: 'Text',
              text: 'Following',
              variant: 'caption',
            },
            {
              id: 'posts-col',
              component: 'Column',
              children: ['posts-count', 'posts-label'],
              align: 'center',
            },
            {
              id: 'posts-count',
              component: 'Text',
              text: {
                path: '/posts',
              },
              variant: 'h3',
            },
            {
              id: 'posts-label',
              component: 'Text',
              text: 'Posts',
              variant: 'caption',
            },
            {
              id: 'follow-btn-text',
              component: 'Text',
              text: {
                path: '/followText',
              },
            },
            {
              id: 'follow-btn',
              component: 'Button',
              child: 'follow-btn-text',
              action: {
                event: {
                  name: 'follow',
                  context: {},
                },
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-user-profile',
          value: {
            avatar:
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
            name: 'Sarah Chen',
            username: '@sarahchen',
            bio: 'Product Designer at Tech Co. Creating delightful experiences.',
            followers: '12.4K',
            following: '892',
            posts: '347',
            followText: 'Follow',
          },
        },
      },
    ],
  },
  {
    name: 'Notification Permission',
    description: 'Example of notification permission',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-notification-permission',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-notification-permission',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['icon', 'title', 'description', 'actions'],
              align: 'center',
            },
            {
              id: 'icon',
              component: 'Icon',
              name: {
                path: '/icon',
              },
            },
            {
              id: 'title',
              component: 'Text',
              text: {
                path: '/title',
              },
              variant: 'h3',
            },
            {
              id: 'description',
              component: 'Text',
              text: {
                path: '/description',
              },
              variant: 'body',
            },
            {
              id: 'actions',
              component: 'Row',
              children: ['yes-btn', 'no-btn'],
              justify: 'center',
            },
            {
              id: 'yes-btn-text',
              component: 'Text',
              text: 'Yes',
            },
            {
              id: 'yes-btn',
              component: 'Button',
              child: 'yes-btn-text',
              action: {
                event: {
                  name: 'accept',
                  context: {},
                },
              },
            },
            {
              id: 'no-btn-text',
              component: 'Text',
              text: 'No',
            },
            {
              id: 'no-btn',
              component: 'Button',
              child: 'no-btn-text',
              action: {
                event: {
                  name: 'decline',
                  context: {},
                },
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-notification-permission',
          value: {
            icon: 'check',
            title: 'Enable notification',
            description: 'Get alerts for order status changes',
          },
        },
      },
    ],
  },
  {
    name: 'Purchase Complete',
    description: 'Example of purchase complete',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-purchase-complete',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-purchase-complete',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: [
                'success-icon',
                'title',
                'product-row',
                'divider',
                'details-col',
                'view-btn',
              ],
              align: 'center',
            },
            {
              id: 'success-icon',
              component: 'Icon',
              name: 'check',
            },
            {
              id: 'title',
              component: 'Text',
              text: 'Purchase Complete',
              variant: 'h2',
            },
            {
              id: 'product-row',
              component: 'Row',
              children: ['product-image', 'product-info'],
              align: 'center',
            },
            {
              id: 'product-image',
              component: 'Image',
              url: {
                path: '/productImage',
              },
              fit: 'cover',
            },
            {
              id: 'product-info',
              component: 'Column',
              children: ['product-name', 'product-price'],
            },
            {
              id: 'product-name',
              component: 'Text',
              text: {
                path: '/productName',
              },
              variant: 'h4',
            },
            {
              id: 'product-price',
              component: 'Text',
              text: {
                path: '/price',
              },
              variant: 'body',
            },
            {
              id: 'divider',
              component: 'Divider',
            },
            {
              id: 'details-col',
              component: 'Column',
              children: ['delivery-row', 'seller-row'],
            },
            {
              id: 'delivery-row',
              component: 'Row',
              children: ['delivery-icon', 'delivery-text'],
              align: 'center',
            },
            {
              id: 'delivery-icon',
              component: 'Icon',
              name: 'arrowForward',
            },
            {
              id: 'delivery-text',
              component: 'Text',
              text: {
                path: '/deliveryDate',
              },
              variant: 'body',
            },
            {
              id: 'seller-row',
              component: 'Row',
              children: ['seller-label', 'seller-name'],
            },
            {
              id: 'seller-label',
              component: 'Text',
              text: 'Sold by:',
              variant: 'caption',
            },
            {
              id: 'seller-name',
              component: 'Text',
              text: {
                path: '/seller',
              },
              variant: 'body',
            },
            {
              id: 'view-btn-text',
              component: 'Text',
              text: 'View Order Details',
            },
            {
              id: 'view-btn',
              component: 'Button',
              child: 'view-btn-text',
              action: {
                event: {
                  name: 'view_details',
                  context: {},
                },
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-purchase-complete',
          value: {
            productImage:
              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
            productName: 'Wireless Headphones Pro',
            price: '$199.99',
            deliveryDate: 'Arrives Dec 18 - Dec 20',
            seller: 'TechStore Official',
          },
        },
      },
    ],
  },
  {
    name: 'Chat Message',
    description: 'Example of chat message',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-chat-message',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-chat-message',
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
            },
            {
              id: 'header',
              component: 'Row',
              children: ['channel-icon', 'channel-name'],
              align: 'center',
            },
            {
              id: 'channel-icon',
              component: 'Icon',
              name: 'info',
            },
            {
              id: 'channel-name',
              component: 'Text',
              text: {
                path: '/channelName',
              },
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
              align: 'start',
            },
            {
              id: 'message1',
              component: 'Row',
              children: ['avatar1', 'msg1-content'],
              align: 'start',
            },
            {
              id: 'avatar1',
              component: 'Image',
              url: {
                path: '/message1/avatar',
              },
              fit: 'cover',
              variant: 'avatar',
            },
            {
              id: 'msg1-content',
              component: 'Column',
              children: ['msg1-header', 'msg1-text'],
            },
            {
              id: 'msg1-header',
              component: 'Row',
              children: ['msg1-username', 'msg1-time'],
              align: 'center',
            },
            {
              id: 'msg1-username',
              component: 'Text',
              text: {
                path: '/message1/username',
              },
              variant: 'h4',
            },
            {
              id: 'msg1-time',
              component: 'Text',
              text: {
                path: '/message1/time',
              },
              variant: 'caption',
            },
            {
              id: 'msg1-text',
              component: 'Text',
              text: {
                path: '/message1/text',
              },
              variant: 'body',
            },
            {
              id: 'message2',
              component: 'Row',
              children: ['avatar2', 'msg2-content'],
              align: 'start',
            },
            {
              id: 'avatar2',
              component: 'Image',
              url: {
                path: '/message2/avatar',
              },
              fit: 'cover',
              variant: 'avatar',
            },
            {
              id: 'msg2-content',
              component: 'Column',
              children: ['msg2-header', 'msg2-text'],
            },
            {
              id: 'msg2-header',
              component: 'Row',
              children: ['msg2-username', 'msg2-time'],
              align: 'center',
            },
            {
              id: 'msg2-username',
              component: 'Text',
              text: {
                path: '/message2/username',
              },
              variant: 'h4',
            },
            {
              id: 'msg2-time',
              component: 'Text',
              text: {
                path: '/message2/time',
              },
              variant: 'caption',
            },
            {
              id: 'msg2-text',
              component: 'Text',
              text: {
                path: '/message2/text',
              },
              variant: 'body',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-chat-message',
          value: {
            channelName: 'project-updates',
            message1: {
              avatar:
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop',
              username: 'Mike Chen',
              time: '10:32 AM',
              text: 'Just pushed the new API changes. Ready for review.',
            },
            message2: {
              avatar:
                'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop',
              username: 'Sarah Kim',
              time: '10:45 AM',
              text: "Great! I'll take a look after standup.",
            },
          },
        },
      },
    ],
  },
  {
    name: 'Coffee Order',
    description: 'Example of coffee order',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-coffee-order',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-coffee-order',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['header', 'items', 'divider', 'totals', 'actions'],
            },
            {
              id: 'header',
              component: 'Row',
              children: ['coffee-icon', 'store-name'],
              align: 'center',
            },
            {
              id: 'coffee-icon',
              component: 'Icon',
              name: 'favorite',
            },
            {
              id: 'store-name',
              component: 'Text',
              text: {
                path: '/storeName',
              },
              variant: 'h3',
            },
            {
              id: 'items',
              component: 'Column',
              children: ['item1', 'item2'],
            },
            {
              id: 'item1',
              component: 'Row',
              children: ['item1-details', 'item1-price'],
              justify: 'spaceBetween',
              align: 'start',
            },
            {
              id: 'item1-details',
              component: 'Column',
              children: ['item1-name', 'item1-size'],
            },
            {
              id: 'item1-name',
              component: 'Text',
              text: {
                path: '/item1/name',
              },
              variant: 'body',
            },
            {
              id: 'item1-size',
              component: 'Text',
              text: {
                path: '/item1/size',
              },
              variant: 'caption',
            },
            {
              id: 'item1-price',
              component: 'Text',
              text: {
                path: '/item1/price',
              },
              variant: 'body',
            },
            {
              id: 'item2',
              component: 'Row',
              children: ['item2-details', 'item2-price'],
              justify: 'spaceBetween',
              align: 'start',
            },
            {
              id: 'item2-details',
              component: 'Column',
              children: ['item2-name', 'item2-size'],
            },
            {
              id: 'item2-name',
              component: 'Text',
              text: {
                path: '/item2/name',
              },
              variant: 'body',
            },
            {
              id: 'item2-size',
              component: 'Text',
              text: {
                path: '/item2/size',
              },
              variant: 'caption',
            },
            {
              id: 'item2-price',
              component: 'Text',
              text: {
                path: '/item2/price',
              },
              variant: 'body',
            },
            {
              id: 'divider',
              component: 'Divider',
            },
            {
              id: 'totals',
              component: 'Column',
              children: ['subtotal-row', 'tax-row', 'total-row'],
            },
            {
              id: 'subtotal-row',
              component: 'Row',
              children: ['subtotal-label', 'subtotal-value'],
              justify: 'spaceBetween',
            },
            {
              id: 'subtotal-label',
              component: 'Text',
              text: 'Subtotal',
              variant: 'caption',
            },
            {
              id: 'subtotal-value',
              component: 'Text',
              text: {
                path: '/subtotal',
              },
              variant: 'body',
            },
            {
              id: 'tax-row',
              component: 'Row',
              children: ['tax-label', 'tax-value'],
              justify: 'spaceBetween',
            },
            {
              id: 'tax-label',
              component: 'Text',
              text: 'Tax',
              variant: 'caption',
            },
            {
              id: 'tax-value',
              component: 'Text',
              text: {
                path: '/tax',
              },
              variant: 'body',
            },
            {
              id: 'total-row',
              component: 'Row',
              children: ['total-label', 'total-value'],
              justify: 'spaceBetween',
            },
            {
              id: 'total-label',
              component: 'Text',
              text: 'Total',
              variant: 'h4',
            },
            {
              id: 'total-value',
              component: 'Text',
              text: {
                path: '/total',
              },
              variant: 'h4',
            },
            {
              id: 'actions',
              component: 'Row',
              children: ['purchase-btn', 'add-btn'],
            },
            {
              id: 'purchase-btn-text',
              component: 'Text',
              text: 'Purchase',
            },
            {
              id: 'purchase-btn',
              component: 'Button',
              child: 'purchase-btn-text',
              action: {
                event: {
                  name: 'purchase',
                  context: {},
                },
              },
            },
            {
              id: 'add-btn-text',
              component: 'Text',
              text: 'Add to cart',
            },
            {
              id: 'add-btn',
              component: 'Button',
              child: 'add-btn-text',
              action: {
                event: {
                  name: 'add_to_cart',
                  context: {},
                },
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-coffee-order',
          value: {
            storeName: 'Sunrise Coffee',
            item1: {
              name: 'Oat Milk Latte',
              size: 'Grande, Extra Shot',
              price: '$6.45',
            },
            item2: {
              name: 'Chocolate Croissant',
              size: 'Warmed',
              price: '$4.25',
            },
            subtotal: '$10.70',
            tax: '$0.96',
            total: '$11.66',
          },
        },
      },
    ],
  },
  {
    name: 'Sports Player',
    description: 'Example of sports player',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-sports-player',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-sports-player',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['player-image', 'player-info', 'divider', 'stats-row'],
              align: 'center',
            },
            {
              id: 'player-image',
              component: 'Image',
              url: {
                path: '/playerImage',
              },
              fit: 'cover',
            },
            {
              id: 'player-info',
              component: 'Column',
              children: ['player-name', 'player-details'],
              align: 'center',
            },
            {
              id: 'player-name',
              component: 'Text',
              text: {
                path: '/playerName',
              },
              variant: 'h2',
            },
            {
              id: 'player-details',
              component: 'Row',
              children: ['player-number', 'player-team'],
              align: 'center',
            },
            {
              id: 'player-number',
              component: 'Text',
              text: {
                path: '/number',
              },
              variant: 'h3',
            },
            {
              id: 'player-team',
              component: 'Text',
              text: {
                path: '/team',
              },
              variant: 'caption',
            },
            {
              id: 'divider',
              component: 'Divider',
            },
            {
              id: 'stats-row',
              component: 'Row',
              children: ['stat1', 'stat2', 'stat3'],
              justify: 'spaceAround',
            },
            {
              id: 'stat1',
              component: 'Column',
              children: ['stat1-value', 'stat1-label'],
              align: 'center',
            },
            {
              id: 'stat1-value',
              component: 'Text',
              text: {
                path: '/stat1/value',
              },
              variant: 'h3',
            },
            {
              id: 'stat1-label',
              component: 'Text',
              text: {
                path: '/stat1/label',
              },
              variant: 'caption',
            },
            {
              id: 'stat2',
              component: 'Column',
              children: ['stat2-value', 'stat2-label'],
              align: 'center',
            },
            {
              id: 'stat2-value',
              component: 'Text',
              text: {
                path: '/stat2/value',
              },
              variant: 'h3',
            },
            {
              id: 'stat2-label',
              component: 'Text',
              text: {
                path: '/stat2/label',
              },
              variant: 'caption',
            },
            {
              id: 'stat3',
              component: 'Column',
              children: ['stat3-value', 'stat3-label'],
              align: 'center',
            },
            {
              id: 'stat3-value',
              component: 'Text',
              text: {
                path: '/stat3/value',
              },
              variant: 'h3',
            },
            {
              id: 'stat3-label',
              component: 'Text',
              text: {
                path: '/stat3/label',
              },
              variant: 'caption',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-sports-player',
          value: {
            playerImage:
              'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=200&fit=crop',
            playerName: 'Marcus Johnson',
            number: '#23',
            team: 'LA Lakers',
            stat1: {
              value: '28.4',
              label: 'PPG',
            },
            stat2: {
              value: '7.2',
              label: 'RPG',
            },
            stat3: {
              value: '6.8',
              label: 'APG',
            },
          },
        },
      },
    ],
  },
  {
    name: 'Account Balance',
    description: 'Example of account balance',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-account-balance',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-account-balance',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['header', 'balance', 'updated', 'divider', 'actions'],
            },
            {
              id: 'header',
              component: 'Row',
              children: ['account-icon', 'account-name'],
              align: 'center',
            },
            {
              id: 'account-icon',
              component: 'Icon',
              name: 'payment',
            },
            {
              id: 'account-name',
              component: 'Text',
              text: {
                path: '/accountName',
              },
              variant: 'h4',
            },
            {
              id: 'balance',
              component: 'Text',
              text: {
                path: '/balance',
              },
              variant: 'h1',
            },
            {
              id: 'updated',
              component: 'Text',
              text: {
                path: '/lastUpdated',
              },
              variant: 'caption',
            },
            {
              id: 'divider',
              component: 'Divider',
            },
            {
              id: 'actions',
              component: 'Row',
              children: ['transfer-btn', 'pay-btn'],
            },
            {
              id: 'transfer-btn-text',
              component: 'Text',
              text: 'Transfer',
            },
            {
              id: 'transfer-btn',
              component: 'Button',
              child: 'transfer-btn-text',
              action: {
                event: {
                  name: 'transfer',
                  context: {},
                },
              },
            },
            {
              id: 'pay-btn-text',
              component: 'Text',
              text: 'Pay Bill',
            },
            {
              id: 'pay-btn',
              component: 'Button',
              child: 'pay-btn-text',
              action: {
                event: {
                  name: 'pay_bill',
                  context: {},
                },
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-account-balance',
          value: {
            accountName: 'Primary Checking',
            balance: '$12,458.32',
            lastUpdated: 'Updated just now',
          },
        },
      },
    ],
  },
  {
    name: 'Workout Summary',
    description: 'Example of workout summary',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-workout-summary',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-workout-summary',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['header', 'divider', 'metrics-row', 'date'],
            },
            {
              id: 'header',
              component: 'Row',
              children: ['workout-icon', 'title'],
              align: 'center',
            },
            {
              id: 'workout-icon',
              component: 'Icon',
              name: {
                path: '/icon',
              },
            },
            {
              id: 'title',
              component: 'Text',
              text: 'Workout Complete',
              variant: 'h3',
            },
            {
              id: 'divider',
              component: 'Divider',
            },
            {
              id: 'metrics-row',
              component: 'Row',
              children: ['duration-col', 'calories-col', 'distance-col'],
              justify: 'spaceAround',
            },
            {
              id: 'duration-col',
              component: 'Column',
              children: ['duration-value', 'duration-label'],
              align: 'center',
            },
            {
              id: 'duration-value',
              component: 'Text',
              text: {
                path: '/duration',
              },
              variant: 'h3',
            },
            {
              id: 'duration-label',
              component: 'Text',
              text: 'Duration',
              variant: 'caption',
            },
            {
              id: 'calories-col',
              component: 'Column',
              children: ['calories-value', 'calories-label'],
              align: 'center',
            },
            {
              id: 'calories-value',
              component: 'Text',
              text: {
                path: '/calories',
              },
              variant: 'h3',
            },
            {
              id: 'calories-label',
              component: 'Text',
              text: 'Calories',
              variant: 'caption',
            },
            {
              id: 'distance-col',
              component: 'Column',
              children: ['distance-value', 'distance-label'],
              align: 'center',
            },
            {
              id: 'distance-value',
              component: 'Text',
              text: {
                path: '/distance',
              },
              variant: 'h3',
            },
            {
              id: 'distance-label',
              component: 'Text',
              text: 'Distance',
              variant: 'caption',
            },
            {
              id: 'date',
              component: 'Text',
              text: {
                path: '/date',
              },
              variant: 'caption',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-workout-summary',
          value: {
            icon: 'directions_run',
            workoutType: 'Morning Run',
            duration: '32:15',
            calories: '385',
            distance: '5.2 km',
            date: 'Today at 7:30 AM',
          },
        },
      },
    ],
  },
  {
    name: 'Event Detail',
    description: 'Example of event detail',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-event-detail',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-event-detail',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['title', 'time-row', 'location-row', 'description', 'divider', 'actions'],
            },
            {
              id: 'title',
              component: 'Text',
              text: {
                path: '/title',
              },
              variant: 'h2',
            },
            {
              id: 'time-row',
              component: 'Row',
              children: ['time-icon', 'time-text'],
              align: 'center',
            },
            {
              id: 'time-icon',
              component: 'Icon',
              name: 'calendarToday',
            },
            {
              id: 'time-text',
              component: 'Text',
              text: {
                path: '/dateTime',
              },
              variant: 'body',
            },
            {
              id: 'location-row',
              component: 'Row',
              children: ['location-icon', 'location-text'],
              align: 'center',
            },
            {
              id: 'location-icon',
              component: 'Icon',
              name: 'locationOn',
            },
            {
              id: 'location-text',
              component: 'Text',
              text: {
                path: '/location',
              },
              variant: 'body',
            },
            {
              id: 'description',
              component: 'Text',
              text: {
                path: '/description',
              },
              variant: 'body',
            },
            {
              id: 'divider',
              component: 'Divider',
            },
            {
              id: 'actions',
              component: 'Row',
              children: ['accept-btn', 'decline-btn'],
            },
            {
              id: 'accept-btn-text',
              component: 'Text',
              text: 'Accept',
            },
            {
              id: 'accept-btn',
              component: 'Button',
              child: 'accept-btn-text',
              action: {
                event: {
                  name: 'accept',
                  context: {},
                },
              },
            },
            {
              id: 'decline-btn-text',
              component: 'Text',
              text: 'Decline',
            },
            {
              id: 'decline-btn',
              component: 'Button',
              child: 'decline-btn-text',
              action: {
                event: {
                  name: 'decline',
                  context: {},
                },
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-event-detail',
          value: {
            title: 'Product Launch Meeting',
            dateTime: 'Thu, Dec 19 \u2022 2:00 PM - 3:30 PM',
            location: 'Conference Room A, Building 2',
            description: 'Review final product specs and marketing materials before the Q1 launch.',
          },
        },
      },
    ],
  },
  {
    name: 'Track List',
    description: 'Example of track list',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-track-list',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-track-list',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['header', 'divider', 'tracks'],
            },
            {
              id: 'header',
              component: 'Row',
              children: ['playlist-icon', 'playlist-name'],
              align: 'center',
            },
            {
              id: 'playlist-icon',
              component: 'Icon',
              name: 'play',
            },
            {
              id: 'playlist-name',
              component: 'Text',
              text: {
                path: '/playlistName',
              },
              variant: 'h3',
            },
            {
              id: 'divider',
              component: 'Divider',
            },
            {
              id: 'tracks',
              component: 'Column',
              children: ['track1', 'track2', 'track3'],
            },
            {
              id: 'track1',
              component: 'Row',
              children: ['track1-num', 'track1-art', 'track1-info', 'track1-duration'],
              align: 'center',
            },
            {
              id: 'track1-num',
              component: 'Text',
              text: '1',
              variant: 'caption',
            },
            {
              id: 'track1-art',
              component: 'Image',
              url: {
                path: '/track1/art',
              },
              fit: 'cover',
            },
            {
              id: 'track1-info',
              component: 'Column',
              children: ['track1-title', 'track1-artist'],
            },
            {
              id: 'track1-title',
              component: 'Text',
              text: {
                path: '/track1/title',
              },
              variant: 'body',
            },
            {
              id: 'track1-artist',
              component: 'Text',
              text: {
                path: '/track1/artist',
              },
              variant: 'caption',
            },
            {
              id: 'track1-duration',
              component: 'Text',
              text: {
                path: '/track1/duration',
              },
              variant: 'caption',
            },
            {
              id: 'track2',
              component: 'Row',
              children: ['track2-num', 'track2-art', 'track2-info', 'track2-duration'],
              align: 'center',
            },
            {
              id: 'track2-num',
              component: 'Text',
              text: '2',
              variant: 'caption',
            },
            {
              id: 'track2-art',
              component: 'Image',
              url: {
                path: '/track2/art',
              },
              fit: 'cover',
            },
            {
              id: 'track2-info',
              component: 'Column',
              children: ['track2-title', 'track2-artist'],
            },
            {
              id: 'track2-title',
              component: 'Text',
              text: {
                path: '/track2/title',
              },
              variant: 'body',
            },
            {
              id: 'track2-artist',
              component: 'Text',
              text: {
                path: '/track2/artist',
              },
              variant: 'caption',
            },
            {
              id: 'track2-duration',
              component: 'Text',
              text: {
                path: '/track2/duration',
              },
              variant: 'caption',
            },
            {
              id: 'track3',
              component: 'Row',
              children: ['track3-num', 'track3-art', 'track3-info', 'track3-duration'],
              align: 'center',
            },
            {
              id: 'track3-num',
              component: 'Text',
              text: '3',
              variant: 'caption',
            },
            {
              id: 'track3-art',
              component: 'Image',
              url: {
                path: '/track3/art',
              },
              fit: 'cover',
            },
            {
              id: 'track3-info',
              component: 'Column',
              children: ['track3-title', 'track3-artist'],
            },
            {
              id: 'track3-title',
              component: 'Text',
              text: {
                path: '/track3/title',
              },
              variant: 'body',
            },
            {
              id: 'track3-artist',
              component: 'Text',
              text: {
                path: '/track3/artist',
              },
              variant: 'caption',
            },
            {
              id: 'track3-duration',
              component: 'Text',
              text: {
                path: '/track3/duration',
              },
              variant: 'caption',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-track-list',
          value: {
            playlistName: 'Focus Flow',
            track1: {
              art: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=50&h=50&fit=crop',
              title: 'Weightless',
              artist: 'Marconi Union',
              duration: '8:09',
            },
            track2: {
              art: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=50&h=50&fit=crop',
              title: 'Clair de Lune',
              artist: 'Debussy',
              duration: '5:12',
            },
            track3: {
              art: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=50&h=50&fit=crop',
              title: 'Ambient Light',
              artist: 'Brian Eno',
              duration: '6:45',
            },
          },
        },
      },
    ],
  },
  {
    name: 'Software Purchase',
    description: 'Example of software purchase',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-software-purchase',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-software-purchase',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: [
                'title',
                'product-name',
                'divider1',
                'options',
                'divider2',
                'total-row',
                'actions',
              ],
            },
            {
              id: 'title',
              component: 'Text',
              text: 'Purchase License',
              variant: 'h3',
            },
            {
              id: 'product-name',
              component: 'Text',
              text: {
                path: '/productName',
              },
              variant: 'h2',
            },
            {
              id: 'divider1',
              component: 'Divider',
            },
            {
              id: 'options',
              component: 'Column',
              children: ['seats-row', 'period-row'],
            },
            {
              id: 'seats-row',
              component: 'Row',
              children: ['seats-label', 'seats-value'],
              justify: 'spaceBetween',
              align: 'center',
            },
            {
              id: 'seats-label',
              component: 'Text',
              text: 'Number of seats',
              variant: 'body',
            },
            {
              id: 'seats-value',
              component: 'Text',
              text: {
                path: '/seats',
              },
              variant: 'h4',
            },
            {
              id: 'period-row',
              component: 'Row',
              children: ['period-label', 'period-value'],
              justify: 'spaceBetween',
              align: 'center',
            },
            {
              id: 'period-label',
              component: 'Text',
              text: 'Billing period',
              variant: 'body',
            },
            {
              id: 'period-value',
              component: 'Text',
              text: {
                path: '/billingPeriod',
              },
              variant: 'h4',
            },
            {
              id: 'divider2',
              component: 'Divider',
            },
            {
              id: 'total-row',
              component: 'Row',
              children: ['total-label', 'total-value'],
              justify: 'spaceBetween',
              align: 'center',
            },
            {
              id: 'total-label',
              component: 'Text',
              text: 'Total',
              variant: 'h4',
            },
            {
              id: 'total-value',
              component: 'Text',
              text: {
                path: '/total',
              },
              variant: 'h2',
            },
            {
              id: 'actions',
              component: 'Row',
              children: ['confirm-btn', 'cancel-btn'],
            },
            {
              id: 'confirm-btn-text',
              component: 'Text',
              text: 'Confirm Purchase',
            },
            {
              id: 'confirm-btn',
              component: 'Button',
              child: 'confirm-btn-text',
              action: {
                event: {
                  name: 'confirm',
                  context: {},
                },
              },
            },
            {
              id: 'cancel-btn-text',
              component: 'Text',
              text: 'Cancel',
            },
            {
              id: 'cancel-btn',
              component: 'Button',
              child: 'cancel-btn-text',
              action: {
                event: {
                  name: 'cancel',
                  context: {},
                },
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-software-purchase',
          value: {
            productName: 'Design Suite Pro',
            seats: '10 seats',
            billingPeriod: 'Annual',
            total: '$1,188/year',
          },
        },
      },
    ],
  },
  {
    name: 'Restaurant Card',
    description: 'Example of restaurant card',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-restaurant-card',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-restaurant-card',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['restaurant-image', 'content'],
            },
            {
              id: 'restaurant-image',
              component: 'Image',
              url: {
                path: '/image',
              },
              fit: 'cover',
            },
            {
              id: 'content',
              component: 'Column',
              children: ['name-row', 'cuisine', 'rating-row', 'details-row'],
            },
            {
              id: 'name-row',
              component: 'Row',
              children: ['restaurant-name', 'price-range'],
              justify: 'spaceBetween',
              align: 'center',
            },
            {
              id: 'restaurant-name',
              component: 'Text',
              text: {
                path: '/name',
              },
              variant: 'h3',
            },
            {
              id: 'price-range',
              component: 'Text',
              text: {
                path: '/priceRange',
              },
              variant: 'body',
            },
            {
              id: 'cuisine',
              component: 'Text',
              text: {
                path: '/cuisine',
              },
              variant: 'caption',
            },
            {
              id: 'rating-row',
              component: 'Row',
              children: ['star-icon', 'rating', 'reviews'],
              align: 'center',
            },
            {
              id: 'star-icon',
              component: 'Icon',
              name: 'star',
            },
            {
              id: 'rating',
              component: 'Text',
              text: {
                path: '/rating',
              },
              variant: 'body',
            },
            {
              id: 'reviews',
              component: 'Text',
              text: {
                path: '/reviewCount',
              },
              variant: 'caption',
            },
            {
              id: 'details-row',
              component: 'Row',
              children: ['distance', 'delivery-time'],
            },
            {
              id: 'distance',
              component: 'Text',
              text: {
                path: '/distance',
              },
              variant: 'caption',
            },
            {
              id: 'delivery-time',
              component: 'Text',
              text: {
                path: '/deliveryTime',
              },
              variant: 'caption',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-restaurant-card',
          value: {
            image:
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=150&fit=crop',
            name: 'The Italian Kitchen',
            priceRange: '$$$',
            cuisine: 'Italian \u2022 Pasta \u2022 Wine Bar',
            rating: '4.8',
            reviewCount: '(2,847 reviews)',
            distance: '0.8 mi',
            deliveryTime: '25-35 min',
          },
        },
      },
    ],
  },
  {
    name: 'Shipping Status',
    description: 'Example of shipping status',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-shipping-status',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-shipping-status',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['header', 'tracking-number', 'divider', 'steps', 'eta'],
            },
            {
              id: 'header',
              component: 'Row',
              children: ['package-icon', 'title'],
              align: 'center',
            },
            {
              id: 'package-icon',
              component: 'Icon',
              name: 'info',
            },
            {
              id: 'title',
              component: 'Text',
              text: 'Package Status',
              variant: 'h3',
            },
            {
              id: 'tracking-number',
              component: 'Text',
              text: {
                path: '/trackingNumber',
              },
              variant: 'caption',
            },
            {
              id: 'divider',
              component: 'Divider',
            },
            {
              id: 'steps',
              component: 'Column',
              children: ['step1', 'step2', 'step3', 'step4'],
            },
            {
              id: 'step1',
              component: 'Row',
              children: ['step1-icon', 'step1-text'],
              align: 'center',
            },
            {
              id: 'step1-icon',
              component: 'Icon',
              name: 'check',
            },
            {
              id: 'step1-text',
              component: 'Text',
              text: 'Order Placed',
              variant: 'body',
            },
            {
              id: 'step2',
              component: 'Row',
              children: ['step2-icon', 'step2-text'],
              align: 'center',
            },
            {
              id: 'step2-icon',
              component: 'Icon',
              name: 'check',
            },
            {
              id: 'step2-text',
              component: 'Text',
              text: 'Shipped',
              variant: 'body',
            },
            {
              id: 'step3',
              component: 'Row',
              children: ['step3-icon', 'step3-text'],
              align: 'center',
            },
            {
              id: 'step3-icon',
              component: 'Icon',
              name: {
                path: '/currentStepIcon',
              },
            },
            {
              id: 'step3-text',
              component: 'Text',
              text: 'Out for Delivery',
              variant: 'h4',
            },
            {
              id: 'step4',
              component: 'Row',
              children: ['step4-icon', 'step4-text'],
              align: 'center',
            },
            {
              id: 'step4-icon',
              component: 'Icon',
              name: 'check',
            },
            {
              id: 'step4-text',
              component: 'Text',
              text: 'Delivered',
              variant: 'caption',
            },
            {
              id: 'eta',
              component: 'Row',
              children: ['eta-icon', 'eta-text'],
              align: 'center',
            },
            {
              id: 'eta-icon',
              component: 'Icon',
              name: 'calendarToday',
            },
            {
              id: 'eta-text',
              component: 'Text',
              text: {
                path: '/eta',
              },
              variant: 'body',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-shipping-status',
          value: {
            trackingNumber: 'Tracking: 1Z999AA10123456784',
            currentStepIcon: 'send',
            eta: 'Estimated delivery: Today by 8 PM',
          },
        },
      },
    ],
  },
  {
    name: 'Credit Card',
    description: 'Example of credit card',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-credit-card',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-credit-card',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['card-type-row', 'card-number', 'card-details'],
            },
            {
              id: 'card-type-row',
              component: 'Row',
              children: ['card-icon', 'card-type'],
              justify: 'spaceBetween',
              align: 'center',
            },
            {
              id: 'card-icon',
              component: 'Icon',
              name: 'payment',
            },
            {
              id: 'card-type',
              component: 'Text',
              text: {
                path: '/cardType',
              },
              variant: 'h4',
            },
            {
              id: 'card-number',
              component: 'Text',
              text: {
                path: '/cardNumber',
              },
              variant: 'h2',
            },
            {
              id: 'card-details',
              component: 'Row',
              children: ['holder-col', 'expiry-col'],
              justify: 'spaceBetween',
            },
            {
              id: 'holder-col',
              component: 'Column',
              children: ['holder-label', 'holder-name'],
            },
            {
              id: 'holder-label',
              component: 'Text',
              text: 'CARD HOLDER',
              variant: 'caption',
            },
            {
              id: 'holder-name',
              component: 'Text',
              text: {
                path: '/holderName',
              },
              variant: 'body',
            },
            {
              id: 'expiry-col',
              component: 'Column',
              children: ['expiry-label', 'expiry-date'],
              align: 'end',
            },
            {
              id: 'expiry-label',
              component: 'Text',
              text: 'EXPIRES',
              variant: 'caption',
            },
            {
              id: 'expiry-date',
              component: 'Text',
              text: {
                path: '/expiryDate',
              },
              variant: 'body',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-credit-card',
          value: {
            cardType: 'VISA',
            cardNumber:
              '\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 4242',
            holderName: 'SARAH JOHNSON',
            expiryDate: '09/27',
          },
        },
      },
    ],
  },
  {
    name: 'Step Counter',
    description: 'Example of step counter',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-step-counter',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-step-counter',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['header', 'steps-display', 'goal-text', 'divider', 'stats-row'],
              align: 'center',
            },
            {
              id: 'header',
              component: 'Row',
              children: ['steps-icon', 'title'],
              align: 'center',
            },
            {
              id: 'steps-icon',
              component: 'Icon',
              name: 'person',
            },
            {
              id: 'title',
              component: 'Text',
              text: "Today's Steps",
              variant: 'h4',
            },
            {
              id: 'steps-display',
              component: 'Text',
              text: {
                path: '/steps',
              },
              variant: 'h1',
            },
            {
              id: 'goal-text',
              component: 'Text',
              text: {
                path: '/goalProgress',
              },
              variant: 'body',
            },
            {
              id: 'divider',
              component: 'Divider',
            },
            {
              id: 'stats-row',
              component: 'Row',
              children: ['distance-col', 'calories-col'],
              justify: 'spaceAround',
            },
            {
              id: 'distance-col',
              component: 'Column',
              children: ['distance-value', 'distance-label'],
              align: 'center',
            },
            {
              id: 'distance-value',
              component: 'Text',
              text: {
                path: '/distance',
              },
              variant: 'h3',
            },
            {
              id: 'distance-label',
              component: 'Text',
              text: 'Distance',
              variant: 'caption',
            },
            {
              id: 'calories-col',
              component: 'Column',
              children: ['calories-value', 'calories-label'],
              align: 'center',
            },
            {
              id: 'calories-value',
              component: 'Text',
              text: {
                path: '/calories',
              },
              variant: 'h3',
            },
            {
              id: 'calories-label',
              component: 'Text',
              text: 'Calories',
              variant: 'caption',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-step-counter',
          value: {
            steps: '8,432',
            goalProgress: '84% of 10,000 goal',
            distance: '3.8 mi',
            calories: '312',
          },
        },
      },
    ],
  },
  {
    name: 'Recipe Card',
    description: 'Example of recipe card',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-recipe-card',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-recipe-card',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['recipe-image', 'content'],
            },
            {
              id: 'recipe-image',
              component: 'Image',
              url: {
                path: '/image',
              },
              fit: 'cover',
            },
            {
              id: 'content',
              component: 'Column',
              children: ['title', 'rating-row', 'times-row', 'servings'],
            },
            {
              id: 'title',
              component: 'Text',
              text: {
                path: '/title',
              },
              variant: 'h3',
            },
            {
              id: 'rating-row',
              component: 'Row',
              children: ['star-icon', 'rating', 'review-count'],
              align: 'center',
            },
            {
              id: 'star-icon',
              component: 'Icon',
              name: 'star',
            },
            {
              id: 'rating',
              component: 'Text',
              text: {
                path: '/rating',
              },
              variant: 'body',
            },
            {
              id: 'review-count',
              component: 'Text',
              text: {
                path: '/reviewCount',
              },
              variant: 'caption',
            },
            {
              id: 'times-row',
              component: 'Row',
              children: ['prep-time', 'cook-time'],
            },
            {
              id: 'prep-time',
              component: 'Row',
              children: ['prep-icon', 'prep-text'],
              align: 'center',
            },
            {
              id: 'prep-icon',
              component: 'Icon',
              name: 'calendarToday',
            },
            {
              id: 'prep-text',
              component: 'Text',
              text: {
                path: '/prepTime',
              },
              variant: 'caption',
            },
            {
              id: 'cook-time',
              component: 'Row',
              children: ['cook-icon', 'cook-text'],
              align: 'center',
            },
            {
              id: 'cook-icon',
              component: 'Icon',
              name: 'warning',
            },
            {
              id: 'cook-text',
              component: 'Text',
              text: {
                path: '/cookTime',
              },
              variant: 'caption',
            },
            {
              id: 'servings',
              component: 'Text',
              text: {
                path: '/servings',
              },
              variant: 'caption',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-recipe-card',
          value: {
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=180&fit=crop',
            title: 'Mediterranean Quinoa Bowl',
            rating: '4.9',
            reviewCount: '(1,247 reviews)',
            prepTime: '15 min prep',
            cookTime: '20 min cook',
            servings: 'Serves 4',
          },
        },
      },
    ],
  },
  {
    name: 'Contact Card',
    description: 'Example of contact card',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-contact-card',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-contact-card',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['avatar-image', 'name', 'title', 'divider', 'contact-info', 'actions'],
              align: 'center',
            },
            {
              id: 'avatar-image',
              component: 'Image',
              url: {
                path: '/avatar',
              },
              fit: 'cover',
              variant: 'avatar',
            },
            {
              id: 'name',
              component: 'Text',
              text: {
                path: '/name',
              },
              variant: 'h2',
            },
            {
              id: 'title',
              component: 'Text',
              text: {
                path: '/title',
              },
              variant: 'body',
            },
            {
              id: 'divider',
              component: 'Divider',
            },
            {
              id: 'contact-info',
              component: 'Column',
              children: ['phone-row', 'email-row', 'location-row'],
            },
            {
              id: 'phone-row',
              component: 'Row',
              children: ['phone-icon', 'phone-text'],
              align: 'center',
            },
            {
              id: 'phone-icon',
              component: 'Icon',
              name: 'phone',
            },
            {
              id: 'phone-text',
              component: 'Text',
              text: {
                path: '/phone',
              },
              variant: 'body',
            },
            {
              id: 'email-row',
              component: 'Row',
              children: ['email-icon', 'email-text'],
              align: 'center',
            },
            {
              id: 'email-icon',
              component: 'Icon',
              name: 'mail',
            },
            {
              id: 'email-text',
              component: 'Text',
              text: {
                path: '/email',
              },
              variant: 'body',
            },
            {
              id: 'location-row',
              component: 'Row',
              children: ['location-icon', 'location-text'],
              align: 'center',
            },
            {
              id: 'location-icon',
              component: 'Icon',
              name: 'locationOn',
            },
            {
              id: 'location-text',
              component: 'Text',
              text: {
                path: '/location',
              },
              variant: 'body',
            },
            {
              id: 'actions',
              component: 'Row',
              children: ['call-btn', 'message-btn'],
            },
            {
              id: 'call-btn-text',
              component: 'Text',
              text: 'Call',
            },
            {
              id: 'call-btn',
              component: 'Button',
              child: 'call-btn-text',
              action: {
                event: {
                  name: 'call',
                  context: {},
                },
              },
            },
            {
              id: 'message-btn-text',
              component: 'Text',
              text: 'Message',
            },
            {
              id: 'message-btn',
              component: 'Button',
              child: 'message-btn-text',
              action: {
                event: {
                  name: 'message',
                  context: {},
                },
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-contact-card',
          value: {
            avatar:
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
            name: 'David Park',
            title: 'Engineering Manager',
            phone: '+1 (555) 234-5678',
            email: 'david.park@company.com',
            location: 'San Francisco, CA',
          },
        },
      },
    ],
  },
  {
    name: 'Podcast Episode',
    description: 'Example of podcast episode',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-podcast-episode',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-podcast-episode',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-row',
            },
            {
              id: 'main-row',
              component: 'Row',
              children: ['artwork', 'content'],
              align: 'start',
            },
            {
              id: 'artwork',
              component: 'Image',
              url: {
                path: '/artwork',
              },
              fit: 'cover',
            },
            {
              id: 'content',
              component: 'Column',
              children: ['show-name', 'episode-title', 'meta-row', 'description', 'play-btn'],
            },
            {
              id: 'show-name',
              component: 'Text',
              text: {
                path: '/showName',
              },
              variant: 'caption',
            },
            {
              id: 'episode-title',
              component: 'Text',
              text: {
                path: '/episodeTitle',
              },
              variant: 'h4',
            },
            {
              id: 'meta-row',
              component: 'Row',
              children: ['duration', 'date'],
            },
            {
              id: 'duration',
              component: 'Text',
              text: {
                path: '/duration',
              },
              variant: 'caption',
            },
            {
              id: 'date',
              component: 'Text',
              text: {
                path: '/date',
              },
              variant: 'caption',
            },
            {
              id: 'description',
              component: 'Text',
              text: {
                path: '/description',
              },
              variant: 'body',
            },
            {
              id: 'play-btn-text',
              component: 'Text',
              text: 'Play Episode',
            },
            {
              id: 'play-btn',
              component: 'Button',
              child: 'play-btn-text',
              action: {
                event: {
                  name: 'play',
                  context: {},
                },
              },
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-podcast-episode',
          value: {
            artwork:
              'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=100&h=100&fit=crop',
            showName: 'Tech Talk Daily',
            episodeTitle: 'The Future of AI in Product Design',
            duration: '45 min',
            date: 'Dec 15, 2024',
            description: 'How AI is transforming the way we design and build products.',
          },
        },
      },
    ],
  },
  {
    name: 'Stats Card',
    description: 'Example of stats card',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-stats-card',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-stats-card',
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
            },
            {
              id: 'header',
              component: 'Row',
              children: ['metric-icon', 'metric-name'],
              align: 'center',
            },
            {
              id: 'metric-icon',
              component: 'Icon',
              name: {
                path: '/icon',
              },
            },
            {
              id: 'metric-name',
              component: 'Text',
              text: {
                path: '/metricName',
              },
              variant: 'caption',
            },
            {
              id: 'value',
              component: 'Text',
              text: {
                path: '/value',
              },
              variant: 'h1',
            },
            {
              id: 'trend-row',
              component: 'Row',
              children: ['trend-icon', 'trend-text'],
              align: 'center',
            },
            {
              id: 'trend-icon',
              component: 'Icon',
              name: {
                path: '/trendIcon',
              },
            },
            {
              id: 'trend-text',
              component: 'Text',
              text: {
                path: '/trendText',
              },
              variant: 'body',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-stats-card',
          value: {
            icon: 'trending_up',
            metricName: 'Monthly Revenue',
            value: '$48,294',
            trendIcon: 'arrow_upward',
            trendText: '+12.5% from last month',
          },
        },
      },
    ],
  },
  {
    name: 'Countdown Timer',
    description: 'Example of countdown timer',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-countdown-timer',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-countdown-timer',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['event-name', 'countdown-row', 'target-date'],
              align: 'center',
            },
            {
              id: 'event-name',
              component: 'Text',
              text: {
                path: '/eventName',
              },
              variant: 'h3',
            },
            {
              id: 'countdown-row',
              component: 'Row',
              children: ['days-col', 'hours-col', 'minutes-col'],
              justify: 'spaceAround',
            },
            {
              id: 'days-col',
              component: 'Column',
              children: ['days-value', 'days-label'],
              align: 'center',
            },
            {
              id: 'days-value',
              component: 'Text',
              text: {
                path: '/days',
              },
              variant: 'h1',
            },
            {
              id: 'days-label',
              component: 'Text',
              text: 'Days',
              variant: 'caption',
            },
            {
              id: 'hours-col',
              component: 'Column',
              children: ['hours-value', 'hours-label'],
              align: 'center',
            },
            {
              id: 'hours-value',
              component: 'Text',
              text: {
                path: '/hours',
              },
              variant: 'h1',
            },
            {
              id: 'hours-label',
              component: 'Text',
              text: 'Hours',
              variant: 'caption',
            },
            {
              id: 'minutes-col',
              component: 'Column',
              children: ['minutes-value', 'minutes-label'],
              align: 'center',
            },
            {
              id: 'minutes-value',
              component: 'Text',
              text: {
                path: '/minutes',
              },
              variant: 'h1',
            },
            {
              id: 'minutes-label',
              component: 'Text',
              text: 'Minutes',
              variant: 'caption',
            },
            {
              id: 'target-date',
              component: 'Text',
              text: {
                path: '/targetDate',
              },
              variant: 'body',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-countdown-timer',
          value: {
            eventName: 'Product Launch',
            days: '14',
            hours: '08',
            minutes: '32',
            targetDate: 'January 15, 2025',
          },
        },
      },
    ],
  },
  {
    name: 'Movie Card',
    description: 'Example of movie card',
    messages: [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'gallery-movie-card',
          catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'gallery-movie-card',
          components: [
            {
              id: 'root',
              component: 'Card',
              child: 'main-column',
            },
            {
              id: 'main-column',
              component: 'Column',
              children: ['poster', 'content'],
            },
            {
              id: 'poster',
              component: 'Image',
              url: {
                path: '/poster',
              },
              fit: 'cover',
            },
            {
              id: 'content',
              component: 'Column',
              children: ['title-row', 'genre', 'rating-row', 'runtime'],
            },
            {
              id: 'title-row',
              component: 'Row',
              children: ['movie-title', 'year'],
              align: 'start',
            },
            {
              id: 'movie-title',
              component: 'Text',
              text: {
                path: '/title',
              },
              variant: 'h3',
            },
            {
              id: 'year',
              component: 'Text',
              text: {
                path: '/year',
              },
              variant: 'caption',
            },
            {
              id: 'genre',
              component: 'Text',
              text: {
                path: '/genre',
              },
              variant: 'caption',
            },
            {
              id: 'rating-row',
              component: 'Row',
              children: ['star-icon', 'rating-value'],
              align: 'center',
            },
            {
              id: 'star-icon',
              component: 'Icon',
              name: 'star',
            },
            {
              id: 'rating-value',
              component: 'Text',
              text: {
                path: '/rating',
              },
              variant: 'body',
            },
            {
              id: 'runtime',
              component: 'Row',
              children: ['time-icon', 'runtime-text'],
              align: 'center',
            },
            {
              id: 'time-icon',
              component: 'Icon',
              name: 'calendarToday',
            },
            {
              id: 'runtime-text',
              component: 'Text',
              text: {
                path: '/runtime',
              },
              variant: 'caption',
            },
          ],
        },
      },
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: 'gallery-movie-card',
          value: {
            poster:
              'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=300&fit=crop',
            title: 'Interstellar',
            year: '(2014)',
            genre: 'Sci-Fi \u2022 Adventure \u2022 Drama',
            rating: '8.7/10',
            runtime: '2h 49min',
          },
        },
      },
    ],
  },
];

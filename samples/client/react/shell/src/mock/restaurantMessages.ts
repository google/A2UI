import type { Types } from '@a2ui/react';

/**
 * Mock A2UI messages for the restaurant finder demo.
 * Based on the examples in samples/agent/adk/restaurant_finder/a2ui_examples.py
 */

// Sample restaurant data (same as restaurant_data.json)
const restaurantData = [
  {
    name: "Xi'an Famous Foods",
    detail: 'Spicy and savory hand-pulled noodles.',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    rating: '★★★★☆',
    infoLink: '[More Info](https://www.xianfoods.com/)',
    address: '81 St Marks Pl, New York, NY 10003',
  },
  {
    name: 'Han Dynasty',
    detail: 'Authentic Szechuan cuisine.',
    imageUrl: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400',
    rating: '★★★★☆',
    infoLink: '[More Info](https://www.handynasty.net/)',
    address: '90 3rd Ave, New York, NY 10003',
  },
  {
    name: 'RedFarm',
    detail: 'Modern Chinese with a farm-to-table approach.',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400',
    rating: '★★★★☆',
    infoLink: '[More Info](https://www.redfarmnyc.com/)',
    address: '529 Hudson St, New York, NY 10014',
  },
  {
    name: 'Mott 32',
    detail: 'Upscale Cantonese dining.',
    imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400',
    rating: '★★★★★',
    infoLink: '[More Info](https://mott32.com/newyork/)',
    address: '111 W 57th St, New York, NY 10019',
  },
  {
    name: 'Hwa Yuan Szechuan',
    detail: 'Famous for its cold noodles with sesame sauce.',
    imageUrl: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400',
    rating: '★★★★☆',
    infoLink: '[More Info](https://hwayuannyc.com/)',
    address: '40 E Broadway, New York, NY 10002',
  },
];

/**
 * Creates mock messages for a restaurant list display.
 * This simulates what the agent would return for a "find restaurants" query.
 */
export function createRestaurantListMessages(): Types.ServerToClientMessage[] {
  return [
    {
      beginRendering: {
        surfaceId: 'default',
        root: 'root-column',
        styles: { primaryColor: '#FF0000', font: 'Roboto' },
      },
    },
    {
      surfaceUpdate: {
        surfaceId: 'default',
        components: [
          {
            id: 'root-column',
            component: {
              Column: {
                children: { explicitList: ['title-heading', 'item-list'] },
              },
            },
          },
          {
            id: 'title-heading',
            component: {
              Text: { usageHint: 'h1', text: { path: '/title' } },
            },
          },
          {
            id: 'item-list',
            component: {
              List: {
                direction: 'vertical',
                children: {
                  template: {
                    componentId: 'item-card-template',
                    dataBinding: '/items',
                  },
                },
              },
            },
          },
          {
            id: 'item-card-template',
            component: { Card: { child: 'card-layout' } },
          },
          {
            id: 'card-layout',
            component: {
              Row: {
                children: { explicitList: ['template-image', 'card-details'] },
              },
            },
          },
          {
            id: 'template-image',
            weight: 1,
            component: { Image: { url: { path: 'imageUrl' } } },
          },
          {
            id: 'card-details',
            weight: 2,
            component: {
              Column: {
                children: {
                  explicitList: [
                    'template-name',
                    'template-rating',
                    'template-detail',
                    'template-link',
                    'template-book-button',
                  ],
                },
              },
            },
          },
          {
            id: 'template-name',
            component: { Text: { usageHint: 'h3', text: { path: 'name' } } },
          },
          {
            id: 'template-rating',
            component: { Text: { text: { path: 'rating' } } },
          },
          {
            id: 'template-detail',
            component: { Text: { text: { path: 'detail' } } },
          },
          {
            id: 'template-link',
            component: { Text: { text: { path: 'infoLink' } } },
          },
          {
            id: 'template-book-button',
            component: {
              Button: {
                child: 'book-now-text',
                primary: true,
                action: {
                  name: 'book_restaurant',
                  context: [
                    { key: 'restaurantName', value: { path: 'name' } },
                    { key: 'imageUrl', value: { path: 'imageUrl' } },
                    { key: 'address', value: { path: 'address' } },
                  ],
                },
              },
            },
          },
          {
            id: 'book-now-text',
            component: { Text: { text: { literalString: 'Book Now' } } },
          },
        ],
      },
    },
    {
      dataModelUpdate: {
        surfaceId: 'default',
        path: '/',
        contents: [
          { key: 'title', valueString: 'Top 5 Chinese Restaurants in New York' },
          {
            key: 'items',
            valueMap: restaurantData.map((restaurant, index) => ({
              key: `item${index + 1}`,
              valueMap: [
                { key: 'name', valueString: restaurant.name },
                { key: 'rating', valueString: restaurant.rating },
                { key: 'detail', valueString: restaurant.detail },
                { key: 'infoLink', valueString: restaurant.infoLink },
                { key: 'imageUrl', valueString: restaurant.imageUrl },
                { key: 'address', valueString: restaurant.address },
              ],
            })),
          },
        ],
      },
    },
  ];
}

/**
 * Creates mock messages for a booking form.
 * This simulates what the agent would return when user clicks "Book Now".
 */
export function createBookingFormMessages(
  restaurantName: string,
  imageUrl: string,
  address: string
): Types.ServerToClientMessage[] {
  return [
    {
      beginRendering: {
        surfaceId: 'booking-form',
        root: 'booking-form-column',
        styles: { primaryColor: '#FF0000', font: 'Roboto' },
      },
    },
    {
      surfaceUpdate: {
        surfaceId: 'booking-form',
        components: [
          {
            id: 'booking-form-column',
            component: {
              Column: {
                children: {
                  explicitList: [
                    'booking-title',
                    'restaurant-image',
                    'restaurant-address',
                    'party-size-field',
                    'datetime-field',
                    'dietary-field',
                    'submit-button',
                  ],
                },
              },
            },
          },
          {
            id: 'booking-title',
            component: { Text: { usageHint: 'h2', text: { path: '/title' } } },
          },
          {
            id: 'restaurant-image',
            component: { Image: { url: { path: '/imageUrl' } } },
          },
          {
            id: 'restaurant-address',
            component: { Text: { text: { path: '/address' } } },
          },
          {
            id: 'party-size-field',
            component: {
              TextField: {
                label: { literalString: 'Party Size' },
                text: { path: '/partySize' },
                type: 'number',
              },
            },
          },
          {
            id: 'datetime-field',
            component: {
              DateTimeInput: {
                label: { literalString: 'Date & Time' },
                value: { path: '/reservationTime' },
                enableDate: true,
                enableTime: true,
              },
            },
          },
          {
            id: 'dietary-field',
            component: {
              TextField: {
                label: { literalString: 'Dietary Requirements' },
                text: { path: '/dietary' },
              },
            },
          },
          {
            id: 'submit-button',
            component: {
              Button: {
                child: 'submit-reservation-text',
                primary: true,
                action: {
                  name: 'submit_booking',
                  context: [
                    { key: 'restaurantName', value: { path: '/restaurantName' } },
                    { key: 'partySize', value: { path: '/partySize' } },
                    { key: 'reservationTime', value: { path: '/reservationTime' } },
                    { key: 'dietary', value: { path: '/dietary' } },
                    { key: 'imageUrl', value: { path: '/imageUrl' } },
                  ],
                },
              },
            },
          },
          {
            id: 'submit-reservation-text',
            component: { Text: { text: { literalString: 'Submit Reservation' } } },
          },
        ],
      },
    },
    {
      dataModelUpdate: {
        surfaceId: 'booking-form',
        path: '/',
        contents: [
          { key: 'title', valueString: `Book a Table at ${restaurantName}` },
          { key: 'address', valueString: address },
          { key: 'restaurantName', valueString: restaurantName },
          { key: 'partySize', valueString: '2' },
          { key: 'reservationTime', valueString: '' },
          { key: 'dietary', valueString: '' },
          { key: 'imageUrl', valueString: imageUrl },
        ],
      },
    },
  ];
}

/**
 * Creates mock messages for a booking confirmation.
 * This simulates what the agent would return after submitting a booking.
 */
export function createConfirmationMessages(
  restaurantName: string,
  partySize: string,
  reservationTime: string,
  dietary: string,
  imageUrl: string
): Types.ServerToClientMessage[] {
  return [
    {
      beginRendering: {
        surfaceId: 'confirmation',
        root: 'confirmation-card',
        styles: { primaryColor: '#FF0000', font: 'Roboto' },
      },
    },
    {
      surfaceUpdate: {
        surfaceId: 'confirmation',
        components: [
          {
            id: 'confirmation-card',
            component: { Card: { child: 'confirmation-column' } },
          },
          {
            id: 'confirmation-column',
            component: {
              Column: {
                children: {
                  explicitList: [
                    'confirm-title',
                    'confirm-image',
                    'divider1',
                    'confirm-details',
                    'divider2',
                    'confirm-dietary',
                    'divider3',
                    'confirm-text',
                  ],
                },
              },
            },
          },
          {
            id: 'confirm-title',
            component: { Text: { usageHint: 'h2', text: { path: '/title' } } },
          },
          {
            id: 'confirm-image',
            component: { Image: { url: { path: '/imageUrl' } } },
          },
          {
            id: 'confirm-details',
            component: { Text: { text: { path: '/bookingDetails' } } },
          },
          {
            id: 'confirm-dietary',
            component: { Text: { text: { path: '/dietaryRequirements' } } },
          },
          {
            id: 'confirm-text',
            component: {
              Text: {
                usageHint: 'h5',
                text: { literalString: 'We look forward to seeing you!' },
              },
            },
          },
          { id: 'divider1', component: { Divider: {} } },
          { id: 'divider2', component: { Divider: {} } },
          { id: 'divider3', component: { Divider: {} } },
        ],
      },
    },
    {
      dataModelUpdate: {
        surfaceId: 'confirmation',
        path: '/',
        contents: [
          { key: 'title', valueString: `Booking Confirmed at ${restaurantName}` },
          {
            key: 'bookingDetails',
            valueString: `${partySize} people at ${reservationTime || 'TBD'}`,
          },
          {
            key: 'dietaryRequirements',
            valueString: dietary
              ? `Dietary Requirements: ${dietary}`
              : 'No dietary requirements specified',
          },
          { key: 'imageUrl', valueString: imageUrl },
        ],
      },
    },
  ];
}

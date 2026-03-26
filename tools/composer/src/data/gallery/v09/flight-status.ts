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

export const V09_FLIGHT_STATUS_WIDGET: Widget = {
  id: 'gallery-v09-flight-status',
  name: 'Flight Status',
  description: 'Real-time flight tracking with route and timing information',
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
      children: ['header-row', 'route-row', 'divider', 'times-row'],
      gap: 'small',
      align: 'stretch',
    },
    // Header: Flight indicator + Flight Number + Date
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
      gap: 'small',
      align: 'center',
    },
    {
      id: 'flight-indicator',
      component: 'Icon',
      name: 'flight',
    },
    {
      id: 'flight-number',
      component: 'Text',
      text: { path: '/flightNumber' },
      variant: 'h3',
    },
    {
      id: 'date',
      component: 'Text',
      text: { path: '/date' },
      variant: 'caption',
    },
    // Route: Origin -> Destination
    {
      id: 'route-row',
      component: 'Row',
      children: ['origin', 'arrow', 'destination'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'origin',
      component: 'Text',
      text: { path: '/origin' },
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
      text: { path: '/destination' },
      variant: 'h2',
    },
    // Divider
    {
      id: 'divider',
      component: 'Divider',
    },
    // Times: Departure | Status | Arrival
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
      gap: 'none',
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
      text: { path: '/departureTime' },
      variant: 'h3',
    },
    {
      id: 'status-col',
      component: 'Column',
      children: ['status-label', 'status-value'],
      align: 'center',
      gap: 'none',
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
      text: { path: '/status' },
      variant: 'body',
    },
    {
      id: 'arrival-col',
      component: 'Column',
      children: ['arrival-label', 'arrival-time'],
      align: 'end',
      gap: 'none',
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
      text: { path: '/arrivalTime' },
      variant: 'h3',
    },
  ],
  dataStates: [
    {
      name: 'On Time',
      data: {
        flightNumber: 'OS 87',
        date: 'Mon, Dec 15',
        origin: 'Vienna',
        destination: 'New York',
        departureTime: '10:15 AM',
        status: 'On Time',
        arrivalTime: '2:30 PM',
      },
    },
    {
      name: 'Delayed',
      data: {
        flightNumber: 'OS 87',
        date: 'Mon, Dec 15',
        origin: 'Vienna',
        destination: 'New York',
        departureTime: '11:45 AM',
        status: 'Delayed',
        arrivalTime: '4:00 PM',
      },
    },
    {
      name: 'Boarding',
      data: {
        flightNumber: 'OS 87',
        date: 'Mon, Dec 15',
        origin: 'Vienna',
        destination: 'New York',
        departureTime: '10:15 AM',
        status: 'Boarding',
        arrivalTime: '2:30 PM',
      },
    },
  ],
};

export const V09_FLIGHT_STATUS_GALLERY = {
  widget: V09_FLIGHT_STATUS_WIDGET,
  height: 200,
};

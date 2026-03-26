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

export const V09_WEATHER_CURRENT_WIDGET: Widget = {
  id: 'gallery-v09-weather-current',
  name: 'Weather',
  description: 'Current weather conditions with temperature and forecast',
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
      children: ['temp-row', 'location', 'description', 'forecast-row'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'temp-row',
      component: 'Row',
      children: ['temp-high', 'temp-low'],
      gap: 'small',
      align: 'center',
    },
    {
      id: 'temp-high',
      component: 'Text',
      text: { path: '/tempHigh' },
      variant: 'h1',
    },
    {
      id: 'temp-low',
      component: 'Text',
      text: { path: '/tempLow' },
      variant: 'h2',
    },
    {
      id: 'location',
      component: 'Text',
      text: { path: '/location' },
      variant: 'h3',
    },
    {
      id: 'description',
      component: 'Text',
      text: { path: '/description' },
      variant: 'caption',
    },
    {
      id: 'forecast-row',
      component: 'Row',
      children: ['day1', 'day2', 'day3', 'day4', 'day5'],
      justify: 'spaceAround',
      gap: 'small',
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
      text: { path: '/forecast/0/icon' },
      variant: 'h3',
    },
    {
      id: 'day1-temp',
      component: 'Text',
      text: { path: '/forecast/0/temp' },
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
      text: { path: '/forecast/1/icon' },
      variant: 'h3',
    },
    {
      id: 'day2-temp',
      component: 'Text',
      text: { path: '/forecast/1/temp' },
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
      text: { path: '/forecast/2/icon' },
      variant: 'h3',
    },
    {
      id: 'day3-temp',
      component: 'Text',
      text: { path: '/forecast/2/temp' },
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
      text: { path: '/forecast/3/icon' },
      variant: 'h3',
    },
    {
      id: 'day4-temp',
      component: 'Text',
      text: { path: '/forecast/3/temp' },
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
      text: { path: '/forecast/4/icon' },
      variant: 'h3',
    },
    {
      id: 'day5-temp',
      component: 'Text',
      text: { path: '/forecast/4/temp' },
      variant: 'caption',
    },
  ],
  dataStates: [
    {
      name: 'Sunny',
      data: {
        tempHigh: '72\u00b0',
        tempLow: '58\u00b0',
        location: 'Austin, TX',
        description: 'Clear skies with light breeze',
        forecast: [
          { icon: '\u2600\ufe0f', temp: '74\u00b0' },
          { icon: '\u2600\ufe0f', temp: '76\u00b0' },
          { icon: '\u26c5', temp: '71\u00b0' },
          { icon: '\u2600\ufe0f', temp: '73\u00b0' },
          { icon: '\u2600\ufe0f', temp: '75\u00b0' },
        ],
      },
    },
  ],
};

export const V09_WEATHER_CURRENT_GALLERY = {
  widget: V09_WEATHER_CURRENT_WIDGET,
  height: 240,
};

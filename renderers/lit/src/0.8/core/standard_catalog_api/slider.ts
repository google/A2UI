/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import {
  ComponentApi,
  SliderNode,
} from '../types/types';
import { NumberValue } from '../types/primitives';

export const sliderApi: ComponentApi<'Slider', SliderNode> = {
  name: 'Slider',

  resolveProperties(unresolved) {
    if (!unresolved || typeof unresolved.value !== 'object') {
      throw new Error('Invalid properties for Slider: missing value.');
    }

    return {
      properties: {
        value: unresolved.value as NumberValue,
        minValue: unresolved.minValue as number,
        maxValue: unresolved.maxValue as number,
      }
    };
  },
};

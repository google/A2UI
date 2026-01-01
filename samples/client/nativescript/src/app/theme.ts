/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Types } from '@a2ui/lit/0.8';

/**
 * Default theme for NativeScript A2UI renderer.
 * This is a minimal theme configuration - you can extend it as needed.
 */
export const defaultTheme: Types.Theme = {
  components: {
    AudioPlayer: {},
    Button: {},
    Card: {},
    CheckBox: {
      container: {},
      element: {},
      label: {},
    },
    Column: {},
    DateTimeInput: {
      container: {},
      element: {},
      label: {},
    },
    Divider: {},
    Icon: {},
    Image: {
      all: {},
      avatar: {},
      header: {},
      icon: {},
      largeFeature: {},
      mediumFeature: {},
      smallFeature: {},
    },
    List: {},
    Modal: {
      backdrop: {},
      element: {},
    },
    MultipleChoice: {
      container: {},
      element: {},
      label: {},
    },
    Row: {},
    Slider: {
      container: {},
      element: {},
      label: {},
    },
    Tabs: {
      container: {},
      controls: { all: {}, selected: {} },
      element: {},
    },
    Text: {
      all: {},
      h1: {},
      h2: {},
      h3: {},
      h4: {},
      h5: {},
      body: {},
      caption: {},
    },
    TextField: {
      container: {},
      element: {},
      label: {},
    },
    Video: {},
  },
  elements: {
    a: {},
    audio: {},
    body: {},
    button: {},
    h1: {},
    h2: {},
    h3: {},
    h4: {},
    h5: {},
    iframe: {},
    input: {},
    p: {},
    pre: {},
    textarea: {},
    video: {},
  },
  markdown: {
    p: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    ul: [],
    ol: [],
    li: [],
    a: [],
    strong: [],
    em: [],
  },
};

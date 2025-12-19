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

import React from "react";
import ReactDOM from "react-dom/client";
import { A2UIProvider, ThemeProvider } from "@a2ui/react";
import { Types } from "@a2ui/lit/0.8";
import App from "./App";
import "./index.css";

const restaurantTheme: Types.Theme = {
  components: {
    AudioPlayer: {},
    Button: {
      "a2ui-button": true,
    },
    Card: {
      "a2ui-card": true,
    },
    Column: {
      "a2ui-column": true,
    },
    CheckBox: {
      container: { "a2ui-checkbox-container": true },
      element: { "a2ui-checkbox": true },
      label: { "a2ui-checkbox-label": true },
    },
    DateTimeInput: {
      container: { "a2ui-datetime-container": true },
      element: { "a2ui-datetime": true },
      label: { "a2ui-datetime-label": true },
    },
    Divider: { "a2ui-divider": true },
    Image: {
      all: { "a2ui-image": true },
      icon: { "a2ui-image-icon": true },
      avatar: { "a2ui-image-avatar": true },
      smallFeature: { "a2ui-image-small": true },
      mediumFeature: { "a2ui-image-medium": true },
      largeFeature: { "a2ui-image-large": true },
      header: { "a2ui-image-header": true },
    },
    Icon: {
      container: { "a2ui-icon-container": true },
      element: { "a2ui-icon": true },
    } as unknown as Record<string, boolean>,
    List: { "a2ui-list": true },
    Modal: {
      backdrop: { "a2ui-modal-backdrop": true },
      element: { "a2ui-modal": true },
    },
    MultipleChoice: {
      container: { "a2ui-multiple-choice-container": true },
      element: { "a2ui-multiple-choice": true },
      label: { "a2ui-multiple-choice-label": true },
    },
    Row: { "a2ui-row": true },
    Slider: {
      container: { "a2ui-slider-container": true },
      element: { "a2ui-slider": true },
      label: { "a2ui-slider-label": true },
    },
    Tabs: {
      container: { "a2ui-tabs-container": true },
      element: { "a2ui-tabs": true },
      controls: {
        all: { "a2ui-tabs-control": true },
        selected: { "a2ui-tabs-control-selected": true },
      },
    },
    Text: {
      all: { "a2ui-text": true },
      h1: { "a2ui-text-h1": true },
      h2: { "a2ui-text-h2": true },
      h3: { "a2ui-text-h3": true },
      h4: { "a2ui-text-h4": true },
      h5: { "a2ui-text-h5": true },
      caption: { "a2ui-text-caption": true },
      body: { "a2ui-text-body": true },
    },
    TextField: {
      container: { "a2ui-textfield-container": true },
      element: { "a2ui-textfield": true },
      label: { "a2ui-textfield-label": true },
    },
    Video: { "a2ui-video": true },
  },
  elements: {
    a: { "a2ui-link": true },
    audio: { "a2ui-audio": true },
    body: {},
    button: {},
    h1: { "a2ui-h1": true },
    h2: { "a2ui-h2": true },
    h3: { "a2ui-h3": true },
    h4: { "a2ui-h4": true },
    h5: { "a2ui-h5": true },
    iframe: { "a2ui-iframe": true },
    input: {},
    p: { "a2ui-p": true },
    pre: { "a2ui-pre": true },
    textarea: {},
    video: { "a2ui-video-element": true },
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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={restaurantTheme}>
      <A2UIProvider>
        <App />
      </A2UIProvider>
    </ThemeProvider>
  </React.StrictMode>
);

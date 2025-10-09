/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BeginRenderingMessage } from "./begin-rendering";
import type { Component, ComponentUpdateMessage } from "./component-update";
import type { DataModelUpdateMessage, DataObject } from "./data-update";
import { StreamHeaderMessage } from "./stream-header";

export interface GulfData {
  version?: string;
  rootName?: string;
  root?: Component;
  data?: DataObject;
}

export type {
  StreamHeaderMessage,
  BeginRenderingMessage,
  ComponentUpdateMessage,
  DataModelUpdateMessage,
};

export type UnifiedMessage =
  | StreamHeaderMessage
  | BeginRenderingMessage
  | ComponentUpdateMessage
  | DataModelUpdateMessage;

export type UnifiedMesssages = Array<UnifiedMessage>;

export type Theme = {
  components: {
    AudioPlayer: Record<string, boolean | string>;
    Button: Record<string, boolean | string>;
    Card: Record<string, boolean | string>;
    Column: Record<string, boolean | string>;
    CheckBox: {
      container: Record<string, boolean | string>;
      element: Record<string, boolean | string>;
      label: Record<string, boolean | string>;
    };
    DateTimeInput: Record<string, boolean | string>;
    Divider: Record<string, boolean | string>;
    Heading: Record<string, boolean | string>;
    Image: Record<string, boolean | string>;
    List: Record<string, boolean | string>;
    Modal: Record<string, boolean | string>;
    MultipleChoice: Record<string, boolean | string>;
    Row: Record<string, boolean | string>;
    Slider: Record<string, boolean | string>;
    Tabs: Record<string, boolean | string>;
    Text: Record<string, boolean | string>;
    TextField: Record<string, boolean | string>;
    Video: Record<string, boolean | string>;
  };
  elements: {
    a: Record<string, boolean>;
    audio: Record<string, boolean>;
    body: Record<string, boolean>;
    button: Record<string, boolean>;
    h1: Record<string, boolean>;
    h2: Record<string, boolean>;
    h3: Record<string, boolean>;
    iframe: Record<string, boolean>;
    input: Record<string, boolean>;
    p: Record<string, boolean>;
    pre: Record<string, boolean>;
    textarea: Record<string, boolean>;
    video: Record<string, boolean>;
  };
  markdown: {
    p: string[];
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
    ul: string[];
    ol: string[];
    li: string[];
    a: string[];
    strong: string[];
    em: string[];
  };
  additionalStyles?: {
    AudioPlayer?: Record<string, string>;
    Button?: Record<string, string>;
    Card?: Record<string, string>;
    Column?: Record<string, string>;
    CheckBox?: Record<string, string>;
    DateTimeInput?: Record<string, string>;
    Divider?: Record<string, string>;
    Heading?: Record<string, string>;
    Image?: Record<string, string>;
    List?: Record<string, string>;
    Modal?: Record<string, string>;
    MultipleChoice?: Record<string, string>;
    Row?: Record<string, string>;
    Slider?: Record<string, string>;
    Tabs?: Record<string, string>;
    Text?: Record<string, string>;
    TextField?: Record<string, string>;
    Video?: Record<string, string>;
  };
};

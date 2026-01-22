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

import { StringValue } from "./primitives.js";

export interface Action {
  name: string;
  context?: {
    key: string;
    value: {
      path?: string;
      literalString?: string;
      literalNumber?: number;
      literalBoolean?: boolean;
    };
  }[];
}

export interface Text {
  text: StringValue;
  usageHint: "h1" | "h2" | "h3" | "h4" | "h5" | "caption" | "body";
}

export interface Image {
  url: StringValue;
  usageHint:
    | "icon"
    | "avatar"
    | "smallFeature"
    | "mediumFeature"
    | "largeFeature"
    | "header";
  fit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

export interface Icon {
  name: StringValue;
}

export interface Video {
  url: StringValue;
}

export interface AudioPlayer {
  url: StringValue;
  description?: StringValue;
}

export interface Tabs {
  tabItems: {
    title: {
      path?: string;
      literalString?: string;
    };
    child: string;
  }[];
}

export interface Divider {
  axis?: "horizontal" | "vertical";
  color?: string;
  thickness?: number;
}

export interface Modal {
  entryPointChild: string;
  contentChild: string;
}

export interface Button {
  child: string;
  action: Action;
}

export interface Checkbox {
  label: StringValue;
  value: {
    path?: string;
    literalBoolean?: boolean;
  };
}

export interface TextField {
  text?: StringValue;
  label: StringValue;
  type?: "shortText" | "number" | "date" | "longText";
  validationRegexp?: string;
}

export interface DateTimeInput {
  value: StringValue;
  enableDate?: boolean;
  enableTime?: boolean;
  outputFormat?: string;
}

export interface MultipleChoice {
  selections: {
    path?: string;
    literalArray?: string[];
  };
  options?: {
    label: {
      path?: string;
      literalString?: string;
    };
    value: string;
  }[];
  maxAllowedSelections?: number;
}

export interface Slider {
  value: {
    path?: string;
    literalNumber?: number;
  };
  minValue?: number;
  maxValue?: number;
}

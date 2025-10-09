/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export type TagName = keyof GulfTagNameMap;

// A type that describes a constructor function which returns an instance of T
export type CustomElementConstructorOf<T extends HTMLElement> = {
  // The 'new' signature ensures it can be instantiated
  new (): T;
} & typeof HTMLElement;

import { Audio } from "./audio.js";
import { Button } from "./button.js";
import { Card } from "./card.js";
import { Checkbox } from "./checkbox.js";
import { Column } from "./column.js";
import { DateTimeInput } from "./datetime-input.js";
import { Divider } from "./divider.js";
import { Heading } from "./heading.js";
import { Image } from "./image.js";
import { List } from "./list.js";
import { MultipleChoice } from "./multiple-choice.js";
import { Root } from "./root.js";
import { Row } from "./row.js";
import { Slider } from "./slider.js";
import { TextField } from "./text-field.js";
import { Text } from "./text.js";
import { Video } from "./video.js";

export * as Utils from "./utils/utils.js";

export {
  Audio,
  Button,
  Card,
  Column,
  Checkbox,
  DateTimeInput,
  Divider,
  Heading,
  Image,
  List,
  MultipleChoice,
  Root,
  Row,
  Slider,
  Text,
  TextField,
  Video,
};

// TODO: Checkbox, Modal, Slider, Tabs

interface GulfTagNameMap {
  "gulf-audioplayer": Audio;
  "gulf-button": Button;
  "gulf-card": Card;
  "gulf-checkbox": Checkbox;
  "gulf-column": Column;
  "gulf-datetimeinput": DateTimeInput;
  "gulf-divider": Divider;
  "gulf-heading": Heading;
  "gulf-image": Image;
  "gulf-list": List;
  "gulf-multiplechoice": MultipleChoice;
  "gulf-root": Root;
  "gulf-row": Row;
  "gulf-slider": Slider;
  "gulf-text": Text;
  "gulf-textfield": TextField;
  "gulf-video": Video;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface HTMLElementTagNameMap extends GulfTagNameMap {}
}

/**
 * Type-safely retrieves a custom element constructor using the tagName map.
 * @param tagName The tag name to look up (must exist in HTMLElementTagNameMap).
 * @returns The specific constructor type or undefined.
 */
export function instanceOf<T extends keyof GulfTagNameMap>(tagName: T) {
  // Use a type assertion: we tell TypeScript to trust that the value returned
  // by customElements.get(tagName) matches the type defined in our map.
  const ctor = customElements.get(tagName) as
    | CustomElementConstructorOf<GulfTagNameMap[T]>
    | undefined;
  if (!ctor) {
    console.warn("No element definition for", tagName);
    return;
  }

  return new ctor();
}

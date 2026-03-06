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

import type { z } from "zod";
import type {
  ActionSchema,
  AudioPlayerSchema,
  ButtonSchema,
  CardSchema,
  CheckboxSchema,
  ColumnSchema,
  DateTimeInputSchema,
  DividerSchema,
  IconSchema,
  ImageSchema,
  ListSchema,
  ModalSchema,
  MultipleChoiceSchema,
  RowSchema,
  SliderSchema,
  TabsSchema,
  TextFieldSchema,
  TextSchema,
  VideoSchema,
} from "../schema/common-types.js";

export type Action = z.infer<typeof ActionSchema>;
export type Text = z.infer<typeof TextSchema>;
export type Image = z.infer<typeof ImageSchema>;
export type Icon = z.infer<typeof IconSchema>;
export type Video = z.infer<typeof VideoSchema>;
export type AudioPlayer = z.infer<typeof AudioPlayerSchema>;
export type Tabs = z.infer<typeof TabsSchema>;
export type Row = z.infer<typeof RowSchema>;
export type Column = z.infer<typeof ColumnSchema>;
export type List = z.infer<typeof ListSchema>;
export type Button = z.infer<typeof ButtonSchema>;
export type Modal = z.infer<typeof ModalSchema>;
export type Card = z.infer<typeof CardSchema>;
export type Divider = z.infer<typeof DividerSchema>;
export type TextField = z.infer<typeof TextFieldSchema>;
export type Checkbox = z.infer<typeof CheckboxSchema>;
export type DateTimeInput = z.infer<typeof DateTimeInputSchema>;
export type MultipleChoice = z.infer<typeof MultipleChoiceSchema>;
export type Slider = z.infer<typeof SliderSchema>;

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

import type {
  Action as IAction,
  AudioPlayer as IAudioPlayer,
  Button as IButton,
  Card as ICard,
  Checkbox as ICheckbox,
  Column as IColumn,
  DateTimeInput as IDateTimeInput,
  Divider as IDivider,
  Icon as IIcon,
  Image as IImage,
  List as IList,
  Modal as IModal,
  MultipleChoice as IMultipleChoice,
  Row as IRow,
  Slider as ISlider,
  Tabs as ITabs,
  TextField as ITextField,
  Text as IText,
  Video as IVideo,
} from "../schema/common-types.js";

export declare interface Action extends IAction {}
export declare interface Text extends IText {}
export declare interface Image extends IImage {}
export declare interface Icon extends IIcon {}
export declare interface Video extends IVideo {}
export declare interface AudioPlayer extends IAudioPlayer {}
export declare interface Tabs extends ITabs {}
export declare interface Row extends IRow {}
export declare interface Column extends IColumn {}
export declare interface List extends IList {}
export declare interface Button extends IButton {}
export declare interface Modal extends IModal {}
export declare interface Card extends ICard {}
export declare interface Divider extends IDivider {}
export declare interface TextField extends ITextField {}
export declare interface Checkbox extends ICheckbox {}
export declare interface DateTimeInput extends IDateTimeInput {}
export declare interface MultipleChoice extends IMultipleChoice {}
export declare interface Slider extends ISlider {}

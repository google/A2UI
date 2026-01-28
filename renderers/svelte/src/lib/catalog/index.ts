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

// Default catalog
export { DEFAULT_CATALOG } from './default.js';

// Surface component (main entry point for rendering)
export { default as Surface } from './Surface.svelte';

// Content components
export { default as Text } from './Text.svelte';
export { default as Image } from './Image.svelte';
export { default as Icon } from './Icon.svelte';
export { default as Video } from './Video.svelte';
export { default as AudioPlayer } from './AudioPlayer.svelte';

// Layout components
export { default as Row } from './Row.svelte';
export { default as Column } from './Column.svelte';
export { default as List } from './List.svelte';
export { default as Card } from './Card.svelte';
export { default as Tabs } from './Tabs.svelte';
export { default as Divider } from './Divider.svelte';

// Interactive components
export { default as Button } from './Button.svelte';
export { default as CheckBox } from './CheckBox.svelte';
export { default as TextField } from './TextField.svelte';
export { default as DateTimeInput } from './DateTimeInput.svelte';
export { default as MultipleChoice } from './MultipleChoice.svelte';
export { default as Slider } from './Slider.svelte';
export { default as Modal } from './Modal.svelte';

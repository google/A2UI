import type { ComponentRegistry } from '../core/types.js';

import { Text } from './Text.js';
import { Image } from './Image.js';
import { Icon } from './Icon.js';
import { Video } from './Video.js';
import { AudioPlayer } from './AudioPlayer.js';
import { Row } from './Row.js';
import { Column } from './Column.js';
import { List } from './List.js';
import { Card } from './Card.js';
import { Tabs } from './Tabs.js';
import { Modal } from './Modal.js';
import { Divider } from './Divider.js';
import { Button } from './Button.js';
import { TextField } from './TextField.js';
import { CheckBox } from './CheckBox.js';
import { ChoicePicker } from './ChoicePicker.js';
import { Slider } from './Slider.js';
import { DateTimeInput } from './DateTimeInput.js';

/**
 * Creates a default component registry with all 18 basic A2UI components.
 */
export function createDefaultRegistry(): ComponentRegistry {
  const registry: ComponentRegistry = new Map();

  // Content components
  registry.set('Text', Text);
  registry.set('Image', Image);
  registry.set('Icon', Icon);
  registry.set('Video', Video);
  registry.set('AudioPlayer', AudioPlayer);

  // Layout components
  registry.set('Row', Row);
  registry.set('Column', Column);
  registry.set('List', List);
  registry.set('Card', Card);
  registry.set('Tabs', Tabs);
  registry.set('Modal', Modal);
  registry.set('Divider', Divider);

  // Interactive components
  registry.set('Button', Button);
  registry.set('TextField', TextField);
  registry.set('CheckBox', CheckBox);
  registry.set('ChoicePicker', ChoicePicker);
  registry.set('Slider', Slider);
  registry.set('DateTimeInput', DateTimeInput);

  return registry;
}


import { Component, Catalog } from '../catalog/types.js';
import { TextComponent } from './components/text.js';
import { ButtonComponent } from './components/button.js';
import { ContainerComponent } from './shared/container-component.js';
import { RowComponent } from './components/row.js';
import { ColumnComponent } from './components/column.js';
import { CardComponent } from './components/card.js';
import { ImageComponent } from './components/image.js';
import { IconComponent } from './components/icon.js';
import { VideoComponent } from './components/video.js';
import { AudioPlayerComponent } from './components/audio-player.js';
import { ListComponent } from './components/list.js';
import { TabsComponent } from './components/tabs.js';
import { ModalComponent } from './components/modal.js';
import { DividerComponent } from './components/divider.js';
import { TextFieldComponent } from './components/text-field.js';
import { CheckBoxComponent } from './components/check-box.js';
import { ChoicePickerComponent } from './components/choice-picker.js';
import { SliderComponent } from './components/slider.js';
import { DateTimeInputComponent } from './components/date-time-input.js';

/**
 * Strict contract for the Standard Catalog. 
 * Add all standard components here to enforce implementation in all renderers.
 */
export interface StandardCatalogComponents<T> {
  Button: ButtonComponent<T>;
  Text: TextComponent<T>;
  Column: ColumnComponent<T>;
  Row: RowComponent<T>;
  Card: CardComponent<T>;
  Image: ImageComponent<T>;
  Icon: IconComponent<T>;
  Video: VideoComponent<T>;
  AudioPlayer: AudioPlayerComponent<T>;
  List: ListComponent<T>;
  Tabs: TabsComponent<T>;
  Modal: ModalComponent<T>;
  Divider: DividerComponent<T>;
  TextField: TextFieldComponent<T>;
  CheckBox: CheckBoxComponent<T>;
  ChoicePicker: ChoicePickerComponent<T>;
  Slider: SliderComponent<T>;
  DateTimeInput: DateTimeInputComponent<T>;
}

export function createStandardCatalog<T>(
  components: StandardCatalogComponents<T>
): Catalog<T> {
  // We can't just use Object.entries(components) easily because values are instances, 
  // and we want to map by keys.
  // Actually, StandardCatalogComponents values ARE components. 

  const componentMap = new Map<string, Component<T>>();

  // We iterate over the keys strictly or just use the passed object?
  // The passed object 'components' has keys matching the names.
  for (const [key, value] of Object.entries(components)) {
    componentMap.set(key, value as Component<T>);
  }

  return {
    id: 'https://a2ui.org/specification/v0_9/standard_catalog.json',
    components: componentMap
  };
}

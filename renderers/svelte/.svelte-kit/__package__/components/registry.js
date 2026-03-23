import Text from './Text.svelte';
import Image from './Image.svelte';
import Icon from './Icon.svelte';
import Video from './Video.svelte';
import AudioPlayer from './AudioPlayer.svelte';
import Row from './Row.svelte';
import Column from './Column.svelte';
import List from './List.svelte';
import Card from './Card.svelte';
import Tabs from './Tabs.svelte';
import Modal from './Modal.svelte';
import Divider from './Divider.svelte';
import Button from './Button.svelte';
import TextField from './TextField.svelte';
import CheckBox from './CheckBox.svelte';
import ChoicePicker from './ChoicePicker.svelte';
import Slider from './Slider.svelte';
import DateTimeInput from './DateTimeInput.svelte';
/**
 * Creates the default component registry mapping A2UI component type names
 * to their Svelte 5 implementations.
 *
 * Users can modify the returned map to override or extend individual components.
 */
export function createDefaultRegistry() {
    const registry = new Map();
    registry.set('Text', Text);
    registry.set('Image', Image);
    registry.set('Icon', Icon);
    registry.set('Video', Video);
    registry.set('AudioPlayer', AudioPlayer);
    registry.set('Row', Row);
    registry.set('Column', Column);
    registry.set('List', List);
    registry.set('Card', Card);
    registry.set('Tabs', Tabs);
    registry.set('Modal', Modal);
    registry.set('Divider', Divider);
    registry.set('Button', Button);
    registry.set('TextField', TextField);
    registry.set('CheckBox', CheckBox);
    registry.set('ChoicePicker', ChoicePicker);
    registry.set('Slider', Slider);
    registry.set('DateTimeInput', DateTimeInput);
    return registry;
}

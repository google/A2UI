import React from 'react';
import { Types } from '@a2ui/lit/0.8';

// Layout components
import { Row } from './Row';
import { Column } from './Column';
import { Card } from './Card';
import { List } from './List';
import { Tabs } from './Tabs';
import { Modal } from './Modal';
import { Divider } from './Divider';

// Content components
import { Text } from './Text';
import { Image } from './Image';
import { Icon } from './Icon';
import { Video } from './Video';
import { Audio } from './Audio';
import { Button } from './Button';

// Input components
import { TextField } from './TextField';
import { Checkbox } from './Checkbox';
import { DateTimeInput } from './DateTimeInput';
import { MultipleChoice } from './MultipleChoice';
import { Slider } from './Slider';

export interface CatalogComponentProps {
  surfaceId: string;
  component: Types.AnyComponentNode;
}

export type CatalogComponent = React.ComponentType<CatalogComponentProps>;

const catalog: Record<string, CatalogComponent> = {
  // Layout
  Row,
  Column,
  Card,
  List,
  Tabs,
  Modal,
  Divider,

  // Content
  Text,
  Image,
  Icon,
  Video,
  AudioPlayer: Audio,
  Button,

  // Input
  TextField,
  CheckBox: Checkbox,
  DateTimeInput,
  MultipleChoice,
  Slider,
};

export function getCatalogComponent(type: string): CatalogComponent | null {
  return catalog[type] ?? null;
}

export function registerComponent(type: string, component: CatalogComponent): void {
  catalog[type] = component;
}

export {
  Row,
  Column,
  Card,
  List,
  Tabs,
  Modal,
  Divider,
  Text,
  Image,
  Icon,
  Video,
  Audio,
  Button,
  TextField,
  Checkbox,
  DateTimeInput,
  MultipleChoice,
  Slider,
};


/**
 * A2UI React Native Renderer
 *
 * A React Native renderer for Google's A2UI declarative UI specification.
 *
 * @example
 * ```tsx
 * import { A2UIRenderer } from 'a2ui-react-native';
 *
 * const App = () => {
 *   const spec = {
 *     surfaceId: 'main',
 *     rootId: 'root',
 *     components: [
 *       { id: 'root', type: 'Column', children: ['text1', 'btn1'] },
 *       { id: 'text1', type: 'Text', content: 'Hello A2UI!' },
 *       { id: 'btn1', type: 'Button', label: 'Click me', action: 'doSomething' },
 *     ],
 *   };
 *
 *   return <A2UIRenderer spec={spec} onAction={handleAction} />;
 * };
 * ```
 */

// =============================================================================
// Main Renderer
// =============================================================================

export { A2UIRenderer } from './renderer/A2UIRenderer';

// =============================================================================
// Components
// =============================================================================

export {
  A2UIText,
  A2UIButton,
  A2UIImage,
  A2UIRow,
  A2UIColumn,
  A2UICard,
  A2UIList,
  A2UITextField,
  A2UIModal,
  A2UITabs,
  A2UICheckbox,
  A2UISlider,
  A2UIDateTimeInput,
  A2UIMultipleChoice,
  A2UIIcon,
  A2UIDivider,
  A2UIVideo,
  A2UIAudioPlayer,
} from './components';

export type {
  A2UITextProps,
  A2UIButtonProps,
  A2UIImageProps,
  A2UIRowProps,
  A2UIColumnProps,
  A2UICardProps,
  A2UIListProps,
  A2UITextFieldProps,
  A2UIModalProps,
  A2UITabsProps,
  A2UICheckboxProps,
  A2UISliderProps,
  A2UIDateTimeInputProps,
  A2UIMultipleChoiceProps,
  A2UIIconProps,
  A2UIDividerProps,
  A2UIVideoProps,
  A2UIAudioPlayerProps,
} from './components';

// =============================================================================
// Parser
// =============================================================================

export {
  createJSONLParser,
  parseJSONL,
  validateA2UIMessage,
} from './parser/jsonl-parser';

export type {
  JSONLParserOptions,
  JSONLParserResult,
} from './parser/jsonl-parser';

// =============================================================================
// Dispatcher
// =============================================================================

export {
  createMessageDispatcher,
  isBeginRenderingMessage,
  isSurfaceUpdateMessage,
  isDataModelUpdateMessage,
  isDeleteSurfaceMessage,
  isErrorMessage,
} from './dispatcher/message-dispatcher';

export type {
  MessageHandlers,
  MessageDispatcherOptions,
  MessageDispatcher,
} from './dispatcher/message-dispatcher';

// =============================================================================
// State Management
// =============================================================================

export {
  createSurfaceRegistry,
  getComponentFromSurface,
  getRootComponent,
} from './state/surface-registry';

export type {
  SurfaceRegistryOptions,
  SurfaceRegistry,
} from './state/surface-registry';

export {
  createComponentBuffer,
  traverseComponents,
  findComponentsByType,
  findComponent,
  getComponentTree,
} from './state/component-buffer';

export type {
  ComponentBuffer,
} from './state/component-buffer';

export {
  isBoundValue,
  isLiteralBoundValue,
  isPathBoundValue,
  getValueAtPath,
  setValueAtPath,
  resolveBoundValue,
  resolveValue,
  resolveStyleValues,
  createRelativeDataContext,
  cloneDataModel,
} from './state/data-model-store';

// =============================================================================
// Types
// =============================================================================

export type {
  // Bound Values
  BoundValue,
  LiteralBoundValue,
  PathBoundValue,

  // Base Component
  BaseComponent,

  // Content Components
  TextComponent,
  ImageComponent,
  IconComponent,
  DividerComponent,

  // Layout Components
  RowComponent,
  ColumnComponent,
  CardComponent,
  ListComponent,

  // Interactive Components
  ButtonComponent,
  TextFieldComponent,
  CheckboxComponent,
  SliderComponent,
  DateTimeInputComponent,
  MultipleChoiceComponent,

  // Container Components
  ModalComponent,
  TabsComponent,

  // Media Components
  VideoComponent,
  AudioPlayerComponent,

  // Union Type
  A2UIComponent,

  // Messages
  A2UIMessage,
  BeginRenderingMessage,
  SurfaceUpdateMessage,
  DataModelUpdateMessage,
  DeleteSurfaceMessage,
  ErrorMessage,

  // Actions
  ActionPayload,
  CapabilityReport,

  // Surface
  Surface,

  // Renderer Props
  A2UIRendererProps,

  // Custom Component Props
  CustomComponentProps,
} from './types/a2ui-types';

// =============================================================================
// Hooks
// =============================================================================

export {
  useA2UIStream,
} from './hooks/useA2UIStream';

export type {
  A2UISpec,
  UseA2UIStreamOptions,
  UseA2UIStreamResult,
} from './hooks/useA2UIStream';

// =============================================================================
// Theming
// =============================================================================

export {
  A2UIThemeProvider,
  useA2UITheme,
  createTheme,
  lightTheme,
  darkTheme,
} from './theme';

export type {
  A2UITheme,
  ColorPalette,
  Typography,
  Spacing,
  BorderRadius,
  ComponentStyles,
} from './theme';

/**
 * A2UI Components - Main Export
 *
 * This file imports all component modules, triggering their registration
 * with the A2UI renderer. Components are organized by category:
 *
 * - Display: Text, Image, Icon, Video, AudioPlayer
 * - Layout: Row, Column, List, Card, Tabs, Divider, Modal
 * - Interactive: Button, CheckBox, TextField, Slider, DateTimeInput, ChoicePicker
 */

// Side-effect imports to ensure component registration
// (export * alone may be tree-shaken if exports aren't used)
import './display';
import './layout';
import './interactive';

// Helpers (shared utilities)
export * from './helpers';

// Display components
export * from './display';

// Layout components
export * from './layout';

// Interactive components
export * from './interactive';

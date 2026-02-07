
import { TemplateResult } from 'lit';
import { ComponentContext as CoreComponentContext } from '@a2ui/web_core/v0_9';

// Lit currently doesn't add much on top of the generic context in v0.9 design,
// as the reactivity is handled by the `updateCallback` passed from the Surface.
// However, we might want to specialize 'renderChild' if needed, or just alias it.

export type LitComponentContext = CoreComponentContext<TemplateResult>;

/**
 * A2UI Action System
 * Utilities for creating and normalizing actions across both
 * spec-based and protocol-based formats
 */

import type { A2UIAction } from '../types';
import type { A2UIClientAction } from '../processor/types';

/**
 * Normalize an action to the canonical format
 * Handles both spec-based { type, params } and protocol { name, context } formats
 */
export function normalizeAction(action: A2UIAction | string): A2UIAction {
  // Handle string shorthand
  if (typeof action === 'string') {
    return { name: action, action };
  }

  // Normalize to use both formats for compatibility
  const name = action.name || action.type || action.action || 'unknown';
  const context = action.context || action.params || {};

  return {
    name,
    type: name, // Keep backwards compatibility
    action: name,
    context,
    params: context,
    componentId: action.componentId,
  };
}

/**
 * Create an action from various input formats
 */
export function createAction(
  nameOrAction: string | A2UIAction,
  context?: Record<string, unknown>,
  componentId?: string
): A2UIAction {
  if (typeof nameOrAction === 'string') {
    return {
      name: nameOrAction,
      type: nameOrAction,
      action: nameOrAction,
      context,
      params: context,
      componentId,
    };
  }

  const normalized = normalizeAction(nameOrAction);
  if (componentId) {
    normalized.componentId = componentId;
  }
  return normalized;
}

/**
 * Convert a local A2UIAction to the protocol A2UIClientAction format
 */
export function toClientAction(
  action: A2UIAction,
  surfaceId: string,
  componentId?: string
): A2UIClientAction {
  const normalized = normalizeAction(action);

  return {
    surfaceId,
    componentId: componentId || normalized.componentId,
    action: {
      name: normalized.name || 'unknown',
      context: normalized.context,
    },
  };
}

/**
 * Convert a protocol A2UIClientAction to local A2UIAction format
 */
export function fromClientAction(clientAction: A2UIClientAction): A2UIAction {
  return {
    name: clientAction.action.name,
    type: clientAction.action.name,
    action: clientAction.action.name,
    context: clientAction.action.context,
    params: clientAction.action.context,
    componentId: clientAction.componentId,
  };
}

/**
 * Get the action name from any action format
 */
export function getActionName(action: A2UIAction | string): string {
  if (typeof action === 'string') return action;
  return action.name || action.type || action.action || 'unknown';
}

/**
 * Get the action context/params from any action format
 */
export function getActionContext(action: A2UIAction | string): Record<string, unknown> {
  if (typeof action === 'string') return {};
  return action.context || action.params || {};
}

/**
 * Check if two actions are equivalent (same name and context)
 */
export function actionsEqual(a: A2UIAction, b: A2UIAction): boolean {
  const nameA = getActionName(a);
  const nameB = getActionName(b);
  if (nameA !== nameB) return false;

  const ctxA = getActionContext(a);
  const ctxB = getActionContext(b);
  return JSON.stringify(ctxA) === JSON.stringify(ctxB);
}

/**
 * Create a typed action builder for common action patterns
 */
export const Actions = {
  /** Submit action with optional form data */
  submit: (context?: Record<string, unknown>) => createAction('submit', context),

  /** Cancel/dismiss action */
  cancel: () => createAction('cancel'),

  /** Navigate action */
  navigate: (target: string, params?: Record<string, unknown>) =>
    createAction('navigate', { target, ...params }),

  /** Change action (for form inputs) */
  change: (value: unknown, field?: string) =>
    createAction('change', { value, field }),

  /** Select action (for choices) */
  select: (value: string | string[], index?: number) =>
    createAction('select', { value, index }),

  /** Toggle action (for checkboxes) */
  toggle: (value: boolean) => createAction('toggle', { value }),

  /** Custom action */
  custom: (name: string, context?: Record<string, unknown>) =>
    createAction(name, context),
};

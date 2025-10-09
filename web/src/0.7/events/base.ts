/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BaseEventDetail<EventType extends string> {
  readonly eventType: EventType;
}

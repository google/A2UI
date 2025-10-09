/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A schema for a BeginRendering message in the A2A streaming UI protocol. This message signals that the UI can now be rendered and provides initial root component and styling information.
 */
export interface BeginRenderingMessage {
  /**
   * The ID of the root component from which rendering should begin. This is a reference to a component instance by its unique ID.
   */
  root: string;
}

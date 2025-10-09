/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { css } from "lit";

/**
 * CSS classes for Google Symbols.
 *
 * Usage:
 *
 * ```html
 * <span class="g-icon">pen_spark</span>
 * ```
 */
export const icons = css`
  .g-icon {
    font-family: "Google Symbols";
    font-weight: normal;
    font-style: normal;
    font-display: optional;
    font-size: 20px;
    width: 1em;
    height: 1em;
    user-select: none;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-feature-settings: "liga";
    -webkit-font-smoothing: antialiased;
    overflow: hidden;

    font-variation-settings:
      "FILL" 0,
      "wght" 300,
      "GRAD" 0,
      "opsz" 48,
      "ROND" 100;

    &.filled {
      font-variation-settings:
        "FILL" 1,
        "wght" 300,
        "GRAD" 0,
        "opsz" 48,
        "ROND" 100;
    }

    &.filled-heavy {
      font-variation-settings:
        "FILL" 1,
        "wght" 700,
        "GRAD" 0,
        "opsz" 48,
        "ROND" 100;
    }
  }
`;

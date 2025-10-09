/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { css, CSSResultGroup, unsafeCSS } from "lit";

export const opacity = css`
  ${unsafeCSS(
    new Array(21)
      .fill(0)
      .map((_, idx) => {
        return `.opacity-el-${idx * 5} { opacity: ${idx / 20}; }`;
      })
      .join("\n")
  )}
` as CSSResultGroup;

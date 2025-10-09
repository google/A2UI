/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { css, CSSResultArray, CSSResultGroup, unsafeCSS } from "lit";
import { PaletteKey, PaletteKeyVals, shades } from "../../types/colors.js";
import { toProp } from "../utils/utils.js";

const color = <C extends PaletteKeyVals>(src: PaletteKey<C>) =>
  css`
    ${unsafeCSS(
      src
        .map((key: string) => {
          return `.color-bc-${key} { border-color: var(${toProp(key)}); }`;
        })
        .join("\n")
    )}

    ${unsafeCSS(
      src
        .map((key: string) => {
          return `.color-bgc-${key} { background-color: var(${toProp(key)}); }`;
        })
        .join("\n")
    )}

  ${unsafeCSS(
      src
        .map((key: string) => {
          return `.color-c-${key} { color: var(${toProp(key)}); }`;
        })
        .join("\n")
    )}
  ` as CSSResultGroup;

const keyFactory = <K extends PaletteKeyVals>(prefix: K) => {
  return shades.map((v) => `${prefix}${v}`) as PaletteKey<K>;
};

export const colors = [
  color(keyFactory("p")),
  color(keyFactory("s")),
  color(keyFactory("t")),
  color(keyFactory("n")),
  color(keyFactory("nv")),
  color(keyFactory("e")),
] as CSSResultArray;

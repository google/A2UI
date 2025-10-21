/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
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
  css`
    .color-bgc-transparent {
      background-color: transparent;
    }
  `,
] as CSSResultArray;

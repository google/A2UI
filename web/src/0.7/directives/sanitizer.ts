/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { html, render } from "lit";

/**
 * This is only safe for (and intended to be used for) text node positions. If
 * you are using attribute position, then this is only safe if the attribute
 * value is surrounded by double-quotes, and is unsafe otherwise (because the
 * value could break out of the attribute value and e.g. add another attribute).
 */
export function escapeNodeText(str: string | null | undefined) {
  const frag = document.createElement("div");
  render(html`${str}`, frag);

  return frag.innerHTML.replaceAll(/<!--([^-]*)-->/gim, "");
}

export function unescapeNodeText(str: string | null | undefined) {
  if (!str) {
    return "";
  }

  const frag = document.createElement("textarea");
  frag.innerHTML = str;
  return frag.value;
}

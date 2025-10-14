/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type Theme } from "../../src/0.8/types/types.js";
import * as Utils from "../../src/0.8/ui/utils/utils.js";

/** Elements */

const a = {
  "typography-f-sf": true,
  "typography-fs-n": true,
  "typography-w-500": true,
  "layout-as-n": true,
  "layout-dis-iflx": true,
  "layout-al-c": true,
};

const audio = {
  "layout-w-100": true,
};

const body = {
  "typography-f-s": true,
  "typography-fs-n": true,
  "typography-w-400": true,
  "layout-mt-0": true,
  "layout-mb-2": true,
  "typography-sz-bm": true,
  "color-c-n10": true,
};

const button = {
  "typography-f-sf": true,
  "typography-fs-n": true,
  "typography-w-500": true,
  "layout-pt-3": true,
  "layout-pb-3": true,
  "layout-pl-5": true,
  "layout-pr-5": true,
  "layout-mb-1": true,
  "border-br-16": true,
  "border-bw-0": true,
  "border-c-n70": true,
  "border-bs-s": true,
  "color-bgc-s30": true,
  "color-c-n100": true,
  "behavior-ho-80": true,
};

const heading = {
  "typography-f-sf": true,
  "typography-fs-n": true,
  "typography-w-500": true,
  "layout-mt-0": true,
  "layout-mb-2": true,
  "color-c-n10": true,
};

const h1 = {
  ...heading,
  "typography-sz-tl": true,
};

const h2 = {
  ...heading,
  "typography-sz-tm": true,
};

const h3 = {
  ...heading,
  "typography-sz-ts": true,
};

const iframe = {
  "behavior-sw-n": true,
};

const input = {
  "typography-f-sf": true,
  "typography-fs-n": true,
  "typography-w-400": true,
  "layout-pl-4": true,
  "layout-pr-4": true,
  "layout-pt-2": true,
  "layout-pb-2": true,
  "border-br-6": true,
  "border-bw-1": true,
  "color-bc-s70": true,
  "border-bs-s": true,
  "layout-as-n": true,
  "color-c-n10": true,
};

const p = {
  "typography-f-s": true,
  "typography-fs-n": true,
  "typography-w-400": true,
  "layout-m-0": true,
  "typography-sz-bm": true,
  "layout-as-n": true,
  "color-c-n10": true,
};

const orderedList = {
  "typography-f-s": true,
  "typography-fs-n": true,
  "typography-w-400": true,
  "layout-m-0": true,
  "typography-sz-bm": true,
  "layout-as-n": true,
};

const unorderedList = {
  "typography-f-s": true,
  "typography-fs-n": true,
  "typography-w-400": true,
  "layout-m-0": true,
  "typography-sz-bm": true,
  "layout-as-n": true,
};

const listItem = {
  "typography-f-s": true,
  "typography-fs-n": true,
  "typography-w-400": true,
  "layout-m-0": true,
  "typography-sz-bm": true,
  "layout-as-n": true,
};

const pre = {
  "typography-f-c": true,
  "typography-fs-n": true,
  "typography-w-400": true,
  "typography-sz-bm": true,
  "typography-ws-p": true,
  "layout-as-n": true,
};

const textarea = {
  ...input,
  "layout-r-none": true,
  "layout-fs-c": true,
};

const video = {
  "layout-el-cv": true,
};

const aLight = Utils.merge(a, { "color-c-n5": true });
const inputLight = Utils.merge(input, { "color-c-n5": true });
const textareaLight = Utils.merge(textarea, { "color-c-n5": true });
const buttonLight = Utils.merge(button, { "color-c-n100": true });
const h1Light = Utils.merge(h1, { "color-c-n5": true });
const h2Light = Utils.merge(h2, { "color-c-n5": true });
const h3Light = Utils.merge(h3, { "color-c-n5": true });
const bodyLight = Utils.merge(body, { "color-c-n5": true });
const pLight = Utils.merge(p, { "color-c-n35": true });
const preLight = Utils.merge(pre, { "color-c-n35": true });
const orderedListLight = Utils.merge(orderedList, {
  "color-c-n35": true,
});
const unorderedListLight = Utils.merge(unorderedList, {
  "color-c-n35": true,
});
const listItemLight = Utils.merge(listItem, {
  "color-c-n35": true,
});

export const theme: Theme = {
  additionalStyles: {},
  components: {
    AudioPlayer: {},
    Button: {
      "layout-pt-2": true,
      "layout-pb-2": true,
      "layout-pl-3": true,
      "layout-pr-3": true,
      "border-br-12": true,
      "border-bw-0": true,
      "border-bs-s": true,
      "color-bgc-p30": true,
      "color-c-n100": true,
      "behavior-ho-70": true,
    },
    Card: { "border-br-9": true, "color-bgc-p100": true, "layout-p-4": true },
    CheckBox: {
      element: {
        "layout-m-0": true,
        "layout-mr-2": true,
        "layout-p-2": true,
        "border-br-12": true,
        "border-bw-1": true,
        "border-bs-s": true,
        "color-bgc-p100": true,
        "color-bc-p60": true,
        "color-c-n30": true,
        "color-c-p30": true,
      },
      label: {
        "color-c-p30": true,
        "typography-f-sf": true,
        "typography-v-r": true,
        "typography-w-400": true,
        "layout-flx-1": true,
        "typography-sz-ll": true,
      },
      container: {
        "layout-dsp-iflex": true,
        "layout-al-c": true,
      },
    },
    Column: {
      "layout-g-2": true,
    },
    DateTimeInput: {
      "layout-pt-2": true,
      "layout-pb-2": true,
      "layout-pl-3": true,
      "layout-pr-3": true,
      "border-br-12": true,
      "border-bw-1": true,
      "border-bs-s": true,
      "color-bgc-p100": true,
      "color-bc-p60": true,
      "color-c-n30": true,
      "color-c-p30": true,
    },
    Divider: {},
    Heading: {
      "color-c-p30": true,
      "typography-f-sf": true,
      "typography-v-r": true,
      "typography-w-400": true,
    },
    Image: {
      "border-br-5": true,
      "layout-el-cv": true,
      "layout-w-100": true,
      "layout-h-100": true,
    },
    List: {
      "layout-g-4": true,
      "layout-p-2": true,
    },
    Modal: {},
    MultipleChoice: {},
    Row: {
      "layout-g-4": true,
    },
    Slider: {},
    Tabs: {},
    Text: {
      "layout-w-100": true,
      "layout-g-2": true,
      "color-c-p30": true,
    },
    TextField: {
      "layout-pt-2": true,
      "layout-pb-2": true,
      "layout-pl-3": true,
      "layout-pr-3": true,
      "border-br-12": true,
      "border-bw-1": true,
      "border-bs-s": true,
      "color-bgc-p100": true,
      "color-bc-p60": true,
      "color-c-n30": true,
      "color-c-p30": true,
    },
    Video: {
      "border-br-5": true,
      "layout-el-cv": true,
    },
  },
  elements: {
    a: aLight,
    audio,
    body: bodyLight,
    button: buttonLight,
    h1: h1Light,
    h2: h2Light,
    h3: h3Light,
    iframe,
    input: inputLight,
    p: pLight,
    pre: preLight,
    textarea: textareaLight,
    video,
  },
  markdown: {
    p: [...Object.keys(pLight)],
    h1: [...Object.keys(h1Light)],
    h2: [...Object.keys(h2Light)],
    h3: [...Object.keys(h3Light)],
    h4: [],
    h5: [],
    h6: [],
    ul: [...Object.keys(unorderedListLight)],
    ol: [...Object.keys(orderedListLight)],
    li: [...Object.keys(listItemLight)],
    a: [...Object.keys(aLight)],
    strong: [],
    em: [],
  },
};

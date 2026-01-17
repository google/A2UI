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

import { v0_8 } from "@a2ui/lit";

export const theme: v0_8.Types.Theme = {
    additionalStyles: {
        Card: {
            "min-width": "100%",
            "padding": "12px",
            "background": "white",
            "border-radius": "16px",
            "box-shadow": "0 4px 12px rgba(46, 125, 50, 0.15)",
            "margin-bottom": "12px"
        },
        Button: {
            "--n-60": "var(--n-100)",
        },
        Image: {
            "width": "140px",
            "min-width": "140px",
            "height": "100px",
            "border-radius": "12px",
            "overflow": "hidden",
            "flex-shrink": "0"
        },
        Row: {
            "gap": "16px"
        },
        Column: {
            "gap": "4px"
        }
    },
    components: {
        AudioPlayer: {},
        Button: {
            "layout-pt-2": true,
            "layout-pb-2": true,
            "layout-pl-5": true,
            "layout-pr-5": true,
            "border-br-2": true,
            "border-bw-0": true,
            "border-bs-s": true,
            "color-bgc-p30": true,
            "color-c-n100": true,
            "behavior-ho-70": true,
        },
        Card: {
            "border-br-4": true,
            "color-bgc-n100": true,
            "layout-p-3": true,
        },
        Column: {
            "layout-g-1": true,
        },
        CheckBox: {
            container: {},
            element: {},
            label: {},
        },
        DateTimeInput: {
            container: {},
            element: {},
            label: {},
        },
        Divider: {
            "color-bgc-n90": true,
            "layout-mt-4": true,
            "layout-mb-4": true,
        },
        Image: {
            all: {
                "border-br-3": true,
                "layout-el-cv": true,
            },
            icon: {},
            avatar: {},
            smallFeature: {},
            mediumFeature: {},
            largeFeature: {},
            header: {},
        },
        Icon: {
            "border-br-1": true,
            "layout-p-2": true,
            "color-bgc-n98": true,
            "layout-dsp-flexhor": true,
            "layout-al-c": true,
            "layout-sp-c": true,
            "color-c-p30": true,
        },
        List: {
            "layout-g-3": true,
            "layout-p-0": true,
        },
        Modal: {
            backdrop: { "color-bbgc-p60_20": true },
            element: {
                "border-br-2": true,
                "color-bgc-p100": true,
                "layout-p-4": true,
            },
        },
        MultipleChoice: {
            container: {},
            element: {},
            label: {},
        },
        Row: {
            "layout-g-4": true,
            "layout-al-c": true,
        },
        Slider: {
            container: {},
            element: {},
            label: {},
        },
        Tabs: {
            container: {},
            element: {},
            controls: {
                all: {},
                selected: {},
            },
        },
        Text: {
            all: {
                "layout-w-100": true,
                "color-c-p30": true,
            },
            h1: {
                "typography-f-sf": true,
                "typography-v-r": true,
                "typography-w-600": true,
                "layout-m-0": true,
                "layout-p-0": true,
                "typography-sz-tl": true,
                "color-c-p20": true,
            },
            h2: {
                "typography-f-sf": true,
                "typography-v-r": true,
                "typography-w-500": true,
                "layout-m-0": true,
                "layout-p-0": true,
                "typography-sz-tm": true,
                "color-c-p25": true,
            },
            h3: {
                "typography-f-sf": true,
                "typography-v-r": true,
                "typography-w-600": true,
                "layout-m-0": true,
                "layout-p-0": true,
                "typography-sz-ts": true,
                "color-c-p20": true,
            },
            h4: {
                "typography-f-sf": true,
                "typography-v-r": true,
                "typography-w-500": true,
                "layout-m-0": true,
                "layout-p-0": true,
                "typography-sz-bl": true,
            },
            h5: {
                "typography-f-sf": true,
                "typography-v-r": true,
                "typography-w-400": true,
                "layout-m-0": true,
                "layout-p-0": true,
                "typography-sz-bm": true,
                "color-c-n40": true,
            },
            caption: {},
            body: {
                "typography-f-sf": true,
                "typography-v-r": true,
                "typography-w-400": true,
                "layout-m-0": true,
                "layout-p-0": true,
                "typography-sz-bm": true,
                "color-c-n30": true,
            },
        },
        TextField: {
            container: {},
            element: {},
            label: {},
        },
        Video: {},
    },
    elements: {
        a: {},
        audio: {},
        body: {},
        button: {},
        h1: {},
        h2: {},
        h3: {},
        h4: {},
        h5: {},
        iframe: {},
        input: {},
        p: {},
        pre: {},
        textarea: {},
        video: {},
    },
    markdown: {
        p: [],
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        ul: [],
        ol: [],
        li: [],
        a: [],
        strong: [],
        em: [],
    },
};

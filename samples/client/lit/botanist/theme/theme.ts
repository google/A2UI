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
    components: {
        AudioPlayer: {},
        Button: {
            "botanist-button": true
        },
        Card: {
            "botanist-card": true
        },
        Column: {
            "botanist-column": true
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
            "botanist-divider": true
        },
        Image: {
            all: { "botanist-image": true },
            icon: {},
            avatar: {},
            smallFeature: {},
            mediumFeature: {},
            largeFeature: {},
            header: {},
        },
        Icon: {
            "botanist-icon": true
        },
        List: {
            "botanist-list": true
        },
        Modal: {
            backdrop: {},
            element: {},
        },
        MultipleChoice: {
            container: {},
            element: {},
            label: {},
        },
        Row: {
            "botanist-row": true
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
            all: { "botanist-text": true },
            h1: { "botanist-h1": true },
            h2: { "botanist-h2": true },
            h3: { "botanist-h3": true },
            h4: { "botanist-h4": true },
            h5: { "botanist-h5": true },
            caption: { "botanist-caption": true },
            body: { "botanist-body": true },
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
    additionalStyles: {
        Text: {
            body: {
                "font-family": "Nunito, sans-serif",
                "color": "#1B5E20"
            },
            h1: {
                "font-family": "Nunito, sans-serif",
                "color": "#2E7D32",
                "font-weight": "700"
            },
            h2: {},
            h3: {},
            h4: {},
            h5: {},
            caption: {}
        },
        Card: {
            "background": "#FFFFFF",
            "border-radius": "16px",
            "box-shadow": "0 4px 12px rgba(46, 125, 50, 0.15)",
            "border": "1px solid rgba(46, 125, 50, 0.1)"
        }
    }
};

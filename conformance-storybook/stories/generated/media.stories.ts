// AUTO-GENERATED — do not edit. Run: node scripts/generate-stories.mjs
import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/a2ui-story-wrapper.js";
import { translateToV08 } from "../helpers/version-adapter.js";
import type { V010Message } from "../helpers/version-adapter.js";

const meta: Meta = { title: "Generated/Components/Media" };
export default meta;

const Image_Basic_messages: V010Message[] = [
  {
    "createSurface": {
      "surfaceId": "s1",
      "catalogId": "https://a2ui.org/specification/v0_10/standard_catalog.json"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "s1",
      "components": [
        {
          "id": "root",
          "component": "Image",
          "url": "https://picsum.photos/400/300",
          "alt": "Sample image"
        }
      ]
    }
  }
];

export const Image_Basic_v08_Lit: StoryObj = {
  name: "Image Basic [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Image_Basic_messages), "s1"),
};

const Image_Cover_Fit_messages: V010Message[] = [
  {
    "createSurface": {
      "surfaceId": "s1",
      "catalogId": "https://a2ui.org/specification/v0_10/standard_catalog.json"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "s1",
      "components": [
        {
          "id": "root",
          "component": "Image",
          "url": "https://picsum.photos/800/400",
          "alt": "Wide image",
          "fit": "cover"
        }
      ]
    }
  }
];

export const Image_Cover_Fit_v08_Lit: StoryObj = {
  name: "Image Cover Fit [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Image_Cover_Fit_messages), "s1"),
};

const Icon_Single_messages: V010Message[] = [
  {
    "createSurface": {
      "surfaceId": "s1",
      "catalogId": "https://a2ui.org/specification/v0_10/standard_catalog.json"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "s1",
      "components": [
        {
          "id": "root",
          "component": "Icon",
          "name": "favorite"
        }
      ]
    }
  }
];

export const Icon_Single_v08_Lit: StoryObj = {
  name: "Icon Single [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Icon_Single_messages), "s1"),
};

const Icon_Row_messages: V010Message[] = [
  {
    "createSurface": {
      "surfaceId": "s1",
      "catalogId": "https://a2ui.org/specification/v0_10/standard_catalog.json"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "s1",
      "components": [
        {
          "id": "root",
          "component": "Row",
          "children": [
            "i1",
            "i2",
            "i3",
            "i4"
          ]
        },
        {
          "id": "i1",
          "component": "Icon",
          "name": "home"
        },
        {
          "id": "i2",
          "component": "Icon",
          "name": "settings"
        },
        {
          "id": "i3",
          "component": "Icon",
          "name": "favorite"
        },
        {
          "id": "i4",
          "component": "Icon",
          "name": "search"
        }
      ]
    }
  }
];

export const Icon_Row_v08_Lit: StoryObj = {
  name: "Icon Row [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Icon_Row_messages), "s1"),
};

const Video_Basic_messages: V010Message[] = [
  {
    "createSurface": {
      "surfaceId": "s1",
      "catalogId": "https://a2ui.org/specification/v0_10/standard_catalog.json"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "s1",
      "components": [
        {
          "id": "root",
          "component": "Video",
          "url": "https://www.w3schools.com/html/mov_bbb.mp4"
        }
      ]
    }
  }
];

export const Video_Basic_v08_Lit: StoryObj = {
  name: "Video Basic [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Video_Basic_messages), "s1"),
};

const AudioPlayer_Basic_messages: V010Message[] = [
  {
    "createSurface": {
      "surfaceId": "s1",
      "catalogId": "https://a2ui.org/specification/v0_10/standard_catalog.json"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "s1",
      "components": [
        {
          "id": "root",
          "component": "AudioPlayer",
          "url": "https://www.w3schools.com/html/horse.mp3",
          "title": "Horse Sound"
        }
      ]
    }
  }
];

export const AudioPlayer_Basic_v08_Lit: StoryObj = {
  name: "AudioPlayer Basic [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(AudioPlayer_Basic_messages), "s1"),
};


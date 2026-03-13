// AUTO-GENERATED — do not edit. Run: node scripts/generate-stories.mjs
import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/a2ui-story-wrapper.js";
import { translateToV08 } from "../helpers/version-adapter.js";
import type { V010Message } from "../helpers/version-adapter.js";

const meta: Meta = { title: "Generated/Components/Form Inputs" };
export default meta;

const TextField_Short_messages: V010Message[] = [
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
          "component": "TextField",
          "label": "Name",
          "value": {
            "path": "/name"
          },
          "variant": "shortText"
        }
      ]
    }
  }
];

export const TextField_Short_v08_Lit: StoryObj = {
  name: "TextField Short [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(TextField_Short_messages), "s1"),
};

const TextField_Long_messages: V010Message[] = [
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
          "component": "TextField",
          "label": "Description",
          "value": {
            "path": "/desc"
          },
          "variant": "longText"
        }
      ]
    }
  }
];

export const TextField_Long_v08_Lit: StoryObj = {
  name: "TextField Long [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(TextField_Long_messages), "s1"),
};

const CheckBox_Unchecked_messages: V010Message[] = [
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
          "component": "CheckBox",
          "label": "Accept terms",
          "value": {
            "path": "/terms"
          }
        }
      ]
    }
  }
];

export const CheckBox_Unchecked_v08_Lit: StoryObj = {
  name: "CheckBox Unchecked [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(CheckBox_Unchecked_messages), "s1"),
};

const CheckBox_Checked_messages: V010Message[] = [
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
          "component": "CheckBox",
          "label": "Accept terms",
          "value": {
            "path": "/terms"
          }
        }
      ]
    }
  },
  {
    "updateDataModel": {
      "surfaceId": "s1",
      "path": "/terms",
      "value": true
    }
  }
];

export const CheckBox_Checked_v08_Lit: StoryObj = {
  name: "CheckBox Checked [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(CheckBox_Checked_messages), "s1"),
};

const Slider_Basic_messages: V010Message[] = [
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
          "component": "Slider",
          "label": "Volume",
          "value": {
            "path": "/volume"
          }
        }
      ]
    }
  }
];

export const Slider_Basic_v08_Lit: StoryObj = {
  name: "Slider Basic [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Slider_Basic_messages), "s1"),
};

const Slider_Custom_Range_messages: V010Message[] = [
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
          "component": "Slider",
          "label": "Temperature",
          "value": {
            "path": "/temp"
          },
          "min": 0,
          "max": 100,
          "step": 5
        }
      ]
    }
  },
  {
    "updateDataModel": {
      "surfaceId": "s1",
      "path": "/temp",
      "value": 50
    }
  }
];

export const Slider_Custom_Range_v08_Lit: StoryObj = {
  name: "Slider Custom Range [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Slider_Custom_Range_messages), "s1"),
};

const DateTimeInput_Date_messages: V010Message[] = [
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
          "component": "DateTimeInput",
          "label": "Birthday",
          "value": {
            "path": "/birthday"
          },
          "variant": "date"
        }
      ]
    }
  }
];

export const DateTimeInput_Date_v08_Lit: StoryObj = {
  name: "DateTimeInput Date [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(DateTimeInput_Date_messages), "s1"),
};

const DateTimeInput_Time_messages: V010Message[] = [
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
          "component": "DateTimeInput",
          "label": "Alarm",
          "value": {
            "path": "/alarm"
          },
          "variant": "time"
        }
      ]
    }
  }
];

export const DateTimeInput_Time_v08_Lit: StoryObj = {
  name: "DateTimeInput Time [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(DateTimeInput_Time_messages), "s1"),
};

const DateTimeInput_DateTime_messages: V010Message[] = [
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
          "component": "DateTimeInput",
          "label": "Meeting",
          "value": {
            "path": "/meeting"
          },
          "variant": "dateTime"
        }
      ]
    }
  }
];

export const DateTimeInput_DateTime_v08_Lit: StoryObj = {
  name: "DateTimeInput DateTime [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(DateTimeInput_DateTime_messages), "s1"),
};

const ChoicePicker_MutuallyExclusive_messages: V010Message[] = [
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
          "component": "ChoicePicker",
          "variant": "mutuallyExclusive",
          "options": [
            {
              "label": "Option A",
              "value": "a"
            },
            {
              "label": "Option B",
              "value": "b"
            },
            {
              "label": "Option C",
              "value": "c"
            }
          ],
          "value": {
            "path": "/choice"
          }
        }
      ]
    }
  }
];

export const ChoicePicker_MutuallyExclusive_v08_Lit: StoryObj = {
  name: "ChoicePicker MutuallyExclusive [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(ChoicePicker_MutuallyExclusive_messages), "s1"),
};

const ChoicePicker_MultiSelect_messages: V010Message[] = [
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
          "component": "ChoicePicker",
          "variant": "multiSelect",
          "options": [
            {
              "label": "Red",
              "value": "red"
            },
            {
              "label": "Blue",
              "value": "blue"
            },
            {
              "label": "Green",
              "value": "green"
            }
          ],
          "value": {
            "path": "/colors"
          }
        }
      ]
    }
  }
];

export const ChoicePicker_MultiSelect_v08_Lit: StoryObj = {
  name: "ChoicePicker MultiSelect [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(ChoicePicker_MultiSelect_messages), "s1"),
};

const ChoicePicker_Chips_messages: V010Message[] = [
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
          "component": "ChoicePicker",
          "variant": "chips",
          "options": [
            {
              "label": "Small",
              "value": "s"
            },
            {
              "label": "Medium",
              "value": "m"
            },
            {
              "label": "Large",
              "value": "l"
            }
          ],
          "value": {
            "path": "/size"
          }
        }
      ]
    }
  }
];

export const ChoicePicker_Chips_v08_Lit: StoryObj = {
  name: "ChoicePicker Chips [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(ChoicePicker_Chips_messages), "s1"),
};


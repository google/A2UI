// AUTO-GENERATED — do not edit. Run: node scripts/generate-stories.mjs
import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/a2ui-story-wrapper.js";
import { translateToV08 } from "../helpers/version-adapter.js";
import type { V010Message } from "../helpers/version-adapter.js";

const meta: Meta = { title: "Generated/Integration/Contact Form" };
export default meta;

const Filled_Form_messages: V010Message[] = [
  {
    "createSurface": {
      "surfaceId": "contact_form_1",
      "catalogId": "https://a2ui.org/specification/v0_10/standard_catalog.json"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "contact_form_1",
      "components": [
        {
          "id": "root",
          "component": "Card",
          "child": "form_container"
        },
        {
          "id": "form_container",
          "component": "Column",
          "children": [
            "header_row",
            "name_row",
            "email_group",
            "phone_group",
            "pref_group",
            "divider_1",
            "newsletter_checkbox",
            "submit_button"
          ],
          "justify": "start",
          "align": "stretch"
        },
        {
          "id": "header_row",
          "component": "Row",
          "children": [
            "header_icon",
            "header_text"
          ],
          "align": "center"
        },
        {
          "id": "header_icon",
          "component": "Icon",
          "name": "mail"
        },
        {
          "id": "header_text",
          "component": "Text",
          "text": "# Contact Us",
          "variant": "h2"
        },
        {
          "id": "name_row",
          "component": "Row",
          "children": [
            "first_name_group",
            "last_name_group"
          ],
          "justify": "spaceBetween"
        },
        {
          "id": "first_name_group",
          "component": "Column",
          "children": [
            "first_name_label",
            "first_name_field"
          ],
          "weight": 1
        },
        {
          "id": "first_name_label",
          "component": "Text",
          "text": "First Name",
          "variant": "caption"
        },
        {
          "id": "first_name_field",
          "component": "TextField",
          "label": "First Name",
          "value": {
            "path": "/contact/firstName"
          },
          "variant": "shortText"
        },
        {
          "id": "last_name_group",
          "component": "Column",
          "children": [
            "last_name_label",
            "last_name_field"
          ],
          "weight": 1
        },
        {
          "id": "last_name_label",
          "component": "Text",
          "text": "Last Name",
          "variant": "caption"
        },
        {
          "id": "last_name_field",
          "component": "TextField",
          "label": "Last Name",
          "value": {
            "path": "/contact/lastName"
          },
          "variant": "shortText"
        },
        {
          "id": "email_group",
          "component": "Column",
          "children": [
            "email_label",
            "email_field"
          ]
        },
        {
          "id": "email_label",
          "component": "Text",
          "text": "Email Address",
          "variant": "caption"
        },
        {
          "id": "email_field",
          "component": "TextField",
          "label": "Email",
          "value": {
            "path": "/contact/email"
          },
          "variant": "shortText"
        },
        {
          "id": "phone_group",
          "component": "Column",
          "children": [
            "phone_label",
            "phone_field"
          ]
        },
        {
          "id": "phone_label",
          "component": "Text",
          "text": "Phone Number",
          "variant": "caption"
        },
        {
          "id": "phone_field",
          "component": "TextField",
          "label": "Phone",
          "value": {
            "path": "/contact/phone"
          },
          "variant": "shortText"
        },
        {
          "id": "pref_group",
          "component": "Column",
          "children": [
            "pref_label",
            "pref_picker"
          ]
        },
        {
          "id": "pref_label",
          "component": "Text",
          "text": "Preferred Contact Method",
          "variant": "caption"
        },
        {
          "id": "pref_picker",
          "component": "ChoicePicker",
          "variant": "mutuallyExclusive",
          "options": [
            {
              "label": "Email",
              "value": "email"
            },
            {
              "label": "Phone",
              "value": "phone"
            },
            {
              "label": "SMS",
              "value": "sms"
            }
          ],
          "value": {
            "path": "/contact/preference"
          }
        },
        {
          "id": "divider_1",
          "component": "Divider",
          "axis": "horizontal"
        },
        {
          "id": "newsletter_checkbox",
          "component": "CheckBox",
          "label": "Subscribe to our newsletter",
          "value": {
            "path": "/contact/subscribe"
          }
        },
        {
          "id": "submit_button",
          "component": "Button",
          "child": "submit_button_label",
          "variant": "primary",
          "action": {
            "event": {
              "name": "submitContactForm"
            }
          }
        },
        {
          "id": "submit_button_label",
          "component": "Text",
          "text": "Send Message"
        }
      ]
    }
  },
  {
    "updateDataModel": {
      "surfaceId": "contact_form_1",
      "path": "/contact",
      "value": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "1234567890",
        "preference": [
          "email"
        ],
        "subscribe": true
      }
    }
  }
];

export const Filled_Form_v08_Lit: StoryObj = {
  name: "Filled Form [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Filled_Form_messages), "contact_form_1"),
};

const Empty_Form_messages: V010Message[] = [
  {
    "createSurface": {
      "surfaceId": "contact_form_1",
      "catalogId": "https://a2ui.org/specification/v0_10/standard_catalog.json"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "contact_form_1",
      "components": [
        {
          "id": "root",
          "component": "Card",
          "child": "form_container"
        },
        {
          "id": "form_container",
          "component": "Column",
          "children": [
            "header_row",
            "name_row",
            "email_group",
            "phone_group",
            "pref_group",
            "divider_1",
            "newsletter_checkbox",
            "submit_button"
          ],
          "justify": "start",
          "align": "stretch"
        },
        {
          "id": "header_row",
          "component": "Row",
          "children": [
            "header_icon",
            "header_text"
          ],
          "align": "center"
        },
        {
          "id": "header_icon",
          "component": "Icon",
          "name": "mail"
        },
        {
          "id": "header_text",
          "component": "Text",
          "text": "# Contact Us",
          "variant": "h2"
        },
        {
          "id": "name_row",
          "component": "Row",
          "children": [
            "first_name_group",
            "last_name_group"
          ],
          "justify": "spaceBetween"
        },
        {
          "id": "first_name_group",
          "component": "Column",
          "children": [
            "first_name_label",
            "first_name_field"
          ],
          "weight": 1
        },
        {
          "id": "first_name_label",
          "component": "Text",
          "text": "First Name",
          "variant": "caption"
        },
        {
          "id": "first_name_field",
          "component": "TextField",
          "label": "First Name",
          "value": {
            "path": "/contact/firstName"
          },
          "variant": "shortText"
        },
        {
          "id": "last_name_group",
          "component": "Column",
          "children": [
            "last_name_label",
            "last_name_field"
          ],
          "weight": 1
        },
        {
          "id": "last_name_label",
          "component": "Text",
          "text": "Last Name",
          "variant": "caption"
        },
        {
          "id": "last_name_field",
          "component": "TextField",
          "label": "Last Name",
          "value": {
            "path": "/contact/lastName"
          },
          "variant": "shortText"
        },
        {
          "id": "email_group",
          "component": "Column",
          "children": [
            "email_label",
            "email_field"
          ]
        },
        {
          "id": "email_label",
          "component": "Text",
          "text": "Email Address",
          "variant": "caption"
        },
        {
          "id": "email_field",
          "component": "TextField",
          "label": "Email",
          "value": {
            "path": "/contact/email"
          },
          "variant": "shortText"
        },
        {
          "id": "phone_group",
          "component": "Column",
          "children": [
            "phone_label",
            "phone_field"
          ]
        },
        {
          "id": "phone_label",
          "component": "Text",
          "text": "Phone Number",
          "variant": "caption"
        },
        {
          "id": "phone_field",
          "component": "TextField",
          "label": "Phone",
          "value": {
            "path": "/contact/phone"
          },
          "variant": "shortText"
        },
        {
          "id": "pref_group",
          "component": "Column",
          "children": [
            "pref_label",
            "pref_picker"
          ]
        },
        {
          "id": "pref_label",
          "component": "Text",
          "text": "Preferred Contact Method",
          "variant": "caption"
        },
        {
          "id": "pref_picker",
          "component": "ChoicePicker",
          "variant": "mutuallyExclusive",
          "options": [
            {
              "label": "Email",
              "value": "email"
            },
            {
              "label": "Phone",
              "value": "phone"
            },
            {
              "label": "SMS",
              "value": "sms"
            }
          ],
          "value": {
            "path": "/contact/preference"
          }
        },
        {
          "id": "divider_1",
          "component": "Divider",
          "axis": "horizontal"
        },
        {
          "id": "newsletter_checkbox",
          "component": "CheckBox",
          "label": "Subscribe to our newsletter",
          "value": {
            "path": "/contact/subscribe"
          }
        },
        {
          "id": "submit_button",
          "component": "Button",
          "child": "submit_button_label",
          "variant": "primary",
          "action": {
            "event": {
              "name": "submitContactForm"
            }
          }
        },
        {
          "id": "submit_button_label",
          "component": "Text",
          "text": "Send Message"
        }
      ]
    }
  }
];

export const Empty_Form_v08_Lit: StoryObj = {
  name: "Empty Form [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Empty_Form_messages), "contact_form_1"),
};


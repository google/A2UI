/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { UnifiedMesssages } from "../../0.7/types/types";

export const data: UnifiedMesssages = [
  {
    version: "0.7",
  },
  {
    root: "location_list",
  },
  {
    components: [
      {
        id: "location_list",
        componentProperties: {
          List: {
            children: {
              template: {
                componentId: "location_card_template",
                dataBinding: "/locations",
              },
            },
          },
        },
      },
      {
        id: "location_card_template",
        componentProperties: {
          Card: {
            child: "card_content_column",
            children: [],
          },
        },
      },
      {
        id: "card_content_column",
        componentProperties: {
          Column: {
            children: {
              explicitList: ["location_header_column", "location_details_row"],
            },
          },
        },
      },
      {
        id: "location_header_column",
        componentProperties: {
          Column: {
            children: {
              explicitList: ["location_name_heading", "location_price_heading"],
            },
          },
        },
      },
      {
        id: "location_name_heading",
        componentProperties: {
          Heading: {
            text: {
              path: "/name",
            },
            level: "1",
          },
        },
      },
      {
        id: "location_price_heading",
        componentProperties: {
          Heading: {
            text: {
              path: "/price",
            },
            level: "4",
          },
        },
      },
      {
        id: "location_details_row",
        componentProperties: {
          Row: {
            children: {
              explicitList: ["location_image", "location_description_column"],
            },
          },
        },
      },
      {
        id: "location_image",
        weight: 1,
        componentProperties: {
          Image: {
            url: {
              path: "/imageUrl",
            },
          },
        },
      },
      {
        id: "location_description_column",
        weight: 2,
        componentProperties: {
          Column: {
            children: {
              explicitList: [
                "location_description_text",
                "location_audio_player",
              ],
            },
          },
        },
      },
      {
        id: "location_description_text",
        componentProperties: {
          Text: {
            text: {
              path: "/description",
            },
          },
        },
      },
      {
        id: "location_audio_player",
        componentProperties: {
          AudioPlayer: {
            url: {
              path: "/audioUrl",
            },
          },
        },
      },
    ],
  },
  {
    path: "/",
    contents: {
      locations: [
        {
          name: "The Tower of London",
          price: "£33.60",
          imageUrl: "/images/london/gen-tol.jpg",
          description:
            "Her Majesty's Royal Palace and Fortress, more commonly known as the Tower of London, is a historic castle on the north bank of the River Thames in central London. It lies within the London Borough of Tower Hamlets, separated from the eastern edge of the square mile of the City of London by the open space known as Tower Hill.",
          audioUrl: "/audio/missing.wav",
        },
        {
          name: "The British Museum",
          price: "Free",
          imageUrl: "/images/london/gen-bm.jpg",
          description:
            "A public institution dedicated to human history, art and culture. Its permanent collection of some eight million works is among the largest and most comprehensive in existence, having been widely sourced during the era of the British Empire. It documents the story of human culture from its beginnings to the present.",
          audioUrl: "/audio/missing.wav",
        },
        {
          name: "The London Eye",
          price: "£29.50",
          imageUrl: "/images/london/gen-le.jpg",
          description:
            "A cantilevered observation wheel on the South Bank of the River Thames in London. It is Europe's tallest cantilevered observation wheel, and is the most popular paid tourist attraction in the United Kingdom with over 3.75 million visitors annually.",
          audioUrl: "/audio/missing.wav",
        },
      ],
    },
  },
];

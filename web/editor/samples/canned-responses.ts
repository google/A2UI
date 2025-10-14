/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { A2UIProtocolMessage } from "../../src/0.8/types/types";

export const simpleCard: A2UIProtocolMessage[] = [
  {
    surfaceUpdate: {
      components: [
        {
          id: "image1",
          componentProperties: {
            Image: {
              url: {
                literalString: "/images/placeholder.jpg",
              },
              fit: "cover",
            },
          },
        },
        {
          id: "heading1",
          componentProperties: {
            Heading: {
              text: {
                literalString: "A Wonderful View",
              },
              level: "2",
            },
          },
        },
        {
          id: "text1",
          componentProperties: {
            Text: {
              text: {
                literalString:
                  "This is a beautiful landscape image captured during sunset, showcasing vibrant colors and serene surroundings. Perfect for a relaxing evening.",
              },
            },
          },
        },
        {
          id: "column1",
          componentProperties: {
            Column: {
              children: {
                explicitList: ["image1", "heading1", "text1"],
              },
              distribution: "start",
              alignment: "stretch",
            },
          },
        },
        {
          id: "card1",
          componentProperties: {
            Card: {
              child: "column1",
            },
          },
        },
      ],
    },
  },
  {
    beginRendering: {
      root: "card1",
    },
  },
];

export const response1: A2UIProtocolMessage[] = [
  {
    surfaceUpdate: {
      components: [
        {
          id: "list_of_cards",
          componentProperties: {
            List: {
              children: {
                template: {
                  componentId: "card_template",
                  dataBinding: "/cardsData",
                },
              },
              direction: "vertical",
              alignment: "stretch",
            },
          },
        },
        {
          id: "card_template",
          componentProperties: { Card: { child: "card_content_column" } },
        },
        {
          id: "card_content_column",
          componentProperties: {
            Column: {
              children: {
                explicitList: ["card_image", "card_heading", "card_text"],
              },
              alignment: "stretch",
              distribution: "start",
            },
          },
        },
        {
          id: "card_image",
          componentProperties: {
            Image: { url: { path: "/imageUrl" }, fit: "cover" },
          },
        },
        {
          id: "card_heading",
          componentProperties: {
            Heading: { text: { path: "/title" }, level: "3" },
          },
        },
        {
          id: "card_text",
          componentProperties: { Text: { text: { path: "/description" } } },
        },
      ],
    },
  },
  {
    dataModelUpdate: {
      path: "/",
      contents: {
        cardsData: [
          {
            imageUrl: "/sample/scenic_view.jpg",
            title: "Majestic Mountains",
            description:
              "Explore the breathtaking views and serene landscapes of the grand mountain ranges. A perfect escape for nature lovers.",
          },
          {
            imageUrl: "/sample/city_skyline.jpg",
            title: "Vibrant City Life",
            description:
              "Immerse yourself in the bustling energy of the city. Discover iconic landmarks, diverse cultures, and endless entertainment.",
          },
          {
            imageUrl: "/sample/forest_path.jpg",
            title: "Tranquil Forest Trail",
            description:
              "Wander through ancient trees and listen to the sounds of nature on this peaceful forest trail. Ideal for quiet reflection.",
          },
        ],
      },
    },
  },
  { beginRendering: { root: "list_of_cards" } },
];

export const response2: A2UIProtocolMessage[] = [
  {
    dataModelUpdate: {
      path: "/cards",
      contents: [
        {
          imageUrl: "/images/card1.jpg",
          title: "Exploring Ancient Ruins",
          description:
            "Journey through the remnants of forgotten civilizations, uncovering stories etched in stone and time.",
        },
        {
          imageUrl: "/images/card2.png",
          title: "Modern Cityscapes",
          description:
            "A vibrant collection of urban photography, showcasing the dynamic energy of contemporary metropolises.",
        },
        {
          imageUrl: "/images/card3.gif",
          title: "Nature's Serenity",
          description:
            "Discover the tranquil beauty of untouched landscapes, from misty mountains to serene forests.",
        },
      ],
    },
  },
  {
    surfaceUpdate: {
      components: [
        {
          id: "card_image_template",
          componentProperties: {
            Image: {
              url: {
                path: "/item/imageUrl",
              },
              fit: "cover",
            },
          },
        },
        {
          id: "card_heading_template",
          componentProperties: {
            Heading: {
              text: {
                path: "/item/title",
              },
              level: "3",
            },
          },
        },
        {
          id: "card_text_template",
          componentProperties: {
            Text: {
              text: {
                path: "/item/description",
              },
            },
          },
        },
        {
          id: "card_content_column",
          componentProperties: {
            Column: {
              children: {
                explicitList: [
                  "card_image_template",
                  "card_heading_template",
                  "card_text_template",
                ],
              },
              alignment: "stretch",
              distribution: "start",
            },
          },
        },
        {
          id: "card_wrapper_template",
          componentProperties: {
            Card: {
              child: "card_content_column",
            },
          },
        },
        {
          id: "main_list_of_cards",
          componentProperties: {
            List: {
              children: {
                template: {
                  componentId: "card_wrapper_template",
                  dataBinding: "/cards",
                },
              },
              direction: "vertical",
              alignment: "stretch",
            },
          },
        },
      ],
    },
  },
  {
    beginRendering: {
      root: "main_list_of_cards",
    },
  },
];

export const response3 = [
  {
    dataModelUpdate: {
      contents: {
        carouselItems: [
          {
            imageUrl: "/images/nature-card-1.jpg",
            title: "Serene Mountain View",
            description:
              "Experience the breathtaking beauty of the tranquil mountains. A perfect escape into nature's embrace, offering peace and spectacular vistas.",
          },
          {
            imageUrl: "/images/city-card-2.jpg",
            title: "Vibrant Urban Landscape",
            description:
              "Discover the dynamic energy of the city that never sleeps. Explore bustling streets, iconic landmarks, and a thriving cultural scene.",
          },
          {
            imageUrl: "/images/ocean-card-3.jpg",
            title: "Calm Ocean Sunset",
            description:
              "Witness the mesmerizing hues of a sunset over the calm ocean. A moment of reflection, as the sun dips below the horizon in a blaze of glory.",
          },
          {
            imageUrl: "/images/forest-card-4.jpg",
            title: "Ancient Forest Trails",
            description:
              "Journey through the ancient, towering trees of the mystical forest. A path less traveled, where every turn reveals a new wonder and sound.",
          },
        ],
      },
    },
  },
  {
    surfaceUpdate: {
      components: [
        {
          id: "card_image_instance",
          componentProperties: {
            Image: {
              url: {
                path: "/imageUrl",
              },
              fit: "cover",
            },
          },
        },
        {
          id: "card_heading_instance",
          componentProperties: {
            Heading: {
              text: {
                path: "/title",
              },
              level: "3",
            },
          },
        },
        {
          id: "card_text_instance",
          componentProperties: {
            Text: {
              text: {
                path: "/description",
              },
            },
          },
        },
        {
          id: "card_content_column_instance",
          componentProperties: {
            Column: {
              children: {
                explicitList: [
                  "card_image_instance",
                  "card_heading_instance",
                  "card_text_instance",
                ],
              },
              distribution: "start",
              alignment: "stretch",
            },
          },
        },
        {
          id: "single_card_template",
          componentProperties: {
            Card: {
              child: "card_content_column_instance",
            },
          },
        },
        {
          id: "main_carousel",
          componentProperties: {
            List: {
              children: {
                template: {
                  componentId: "single_card_template",
                  dataBinding: "/carouselItems",
                },
              },
              direction: "horizontal",
              alignment: "start",
            },
          },
        },
      ],
    },
  },
  {
    beginRendering: {
      root: "main_carousel",
    },
  },
];

/** FIX */
export const fix1 = [
  {
    surfaceUpdate: {
      components: [
        {
          id: "heading1",
          componentProperties: {
            Heading: {
              text: {
                literalString: "Card Title",
              },
              level: "2",
            },
          },
        },
        {
          id: "text1",
          componentProperties: {
            Text: {
              text: {
                literalString:
                  "This is some descriptive text for the card content.",
              },
            },
          },
        },
        {
          id: "textColumn",
          componentProperties: {
            Column: {
              children: {
                explicitList: ["heading1", "text1"],
              },
            },
          },
        },
        {
          id: "image1",
          componentProperties: {
            Image: {
              url: {
                literalString: "/images/placeholder.jpg",
              },
              fit: "cover",
            },
          },
        },
        {
          id: "mainColumn",
          componentProperties: {
            Column: {
              children: {
                explicitList: ["image1", "textColumn"],
              },
            },
          },
        },
        {
          id: "card1",
          componentProperties: {
            Card: {
              child: "mainColumn",
            },
          },
        },
      ],
    },
    beginRendering: {
      root: "card1",
    },
  },
];

export const fix2 = [
  {
    dataModelUpdate: {
      path: "/carouselItems",
      contents: [
        {
          imageUrl: "/assets/carousel-item-1.jpg",
          title: "Explore the Mountains",
          description:
            "Discover breathtaking landscapes and serene trails. Perfect for adventurers and nature lovers.",
        },
        {
          imageUrl: "/assets/carousel-item-2.jpg",
          title: "City Lights at Night",
          description:
            "Experience the vibrant energy of the metropolis after dark, with dazzling architecture.",
        },
        {
          imageUrl: "/assets/carousel-item-3.jpg",
          title: "Relaxing Beach Retreat",
          description:
            "Unwind on pristine sands with the soothing sound of waves. Your ultimate getaway.",
        },
      ],
    },
  },
  {
    surfaceUpdate: {
      components: [
        {
          id: "cardImageTemplate",
          componentProperties: {
            Image: {
              url: {
                path: "./imageUrl",
              },
              fit: "cover",
            },
          },
        },
        {
          id: "cardTitleTemplate",
          componentProperties: {
            Heading: {
              text: {
                path: "./title",
              },
              level: "3",
            },
          },
        },
        {
          id: "cardDescriptionTemplate",
          componentProperties: {
            Text: {
              text: {
                path: "./description",
              },
            },
          },
        },
        {
          id: "cardRightColumn",
          componentProperties: {
            Column: {
              children: {
                explicitList: ["cardTitleTemplate", "cardDescriptionTemplate"],
              },
              distribution: "spaceBetween",
              alignment: "start",
            },
          },
        },
        {
          id: "cardRowContent",
          componentProperties: {
            Row: {
              children: {
                explicitList: ["cardImageTemplate", "cardRightColumn"],
              },
              alignment: "center",
            },
          },
        },
        {
          id: "singleCardTemplate",
          componentProperties: {
            Card: {
              child: "cardRowContent",
            },
          },
        },
        {
          id: "carouselContainer",
          componentProperties: {
            List: {
              children: {
                template: {
                  componentId: "singleCardTemplate",
                  dataBinding: "/carouselItems",
                },
              },
              direction: "horizontal",
              alignment: "stretch",
            },
          },
        },
      ],
    },
  },
  {
    beginRendering: {
      root: "carouselContainer",
    },
  },
];

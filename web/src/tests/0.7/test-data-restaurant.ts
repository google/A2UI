import { UnifiedMesssages } from "../../0.7/types/types";

export const data: UnifiedMesssages = [
  {
    version: "0.7",
  },
  {
    root: "root-column",
  },
  {
    components: [
      {
        id: "root-column",
        componentProperties: {
          Column: {
            children: {
              explicitList: ["title-heading", "item-list"],
            },
          },
        },
      },
      {
        id: "title-heading",
        componentProperties: {
          Heading: {
            level: "1",
            text: {
              literalString: "Restaurants in Mountain View",
            },
          },
        },
      },
      {
        id: "item-list",
        componentProperties: {
          List: {
            direction: "vertical",
            children: {
              template: {
                componentId: "item-card-template",
                dataBinding: "/items",
              },
            },
          },
        },
      },
      {
        id: "item-card-template",
        componentProperties: {
          Card: {
            child: "card-details",
            children: [],
          },
        },
      },
      {
        id: "card-details",
        componentProperties: {
          Column: {
            children: {
              explicitList: [
                "template-image",
                "template-name",
                "template-detail",
                "template-book-button",
              ],
            },
          },
        },
      },
      {
        id: "template-image",
        componentProperties: {
          Image: {
            url: {
              path: "imageUrl",
            },
          },
        },
      },
      {
        id: "template-name",
        componentProperties: {
          Text: {
            text: {
              path: "name",
            },
          },
        },
      },
      {
        id: "template-detail",
        componentProperties: {
          Text: {
            text: {
              path: "detail",
            },
          },
        },
      },
      {
        id: "template-book-button",
        componentProperties: {
          Button: {
            label: {
              literalString: "Book Now",
            },
            action: {
              action: "book_restaurant",
              context: [
                {
                  key: "restaurantName",
                  value: {
                    path: "name",
                  },
                },
              ],
            },
          },
        },
      },
    ],
  },
  {
    path: "/",
    contents: {
      items: [
        {
          name: "Restaurant 1",
          details: "Restaurant 1 details",
          imageUrl: "imageurl-1",
        },
        {
          name: "Restaurant 2",
          details: "Restaurant 2 details",
          imageUrl: "imageurl-2",
        },
        {
          name: "Restaurant 3",
          details: "Restaurant 3 details",
          imageUrl: "imageurl-3",
        },
      ],
    },
  },
];

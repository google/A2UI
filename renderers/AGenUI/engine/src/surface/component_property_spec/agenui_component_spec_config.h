#pragma once

namespace agenui {

/// Baseline component property spec config (JSON static string)
/// Contains a flat mapping of component type -> property spec (no theme layer).
/// When loadFromString processes each theme, it merges the theme config on top of this base.
static const char* const kBaseComponentSpecConfig = R"JSON({
    "Text": {
      "text": {"default": ""},
      "variant": {
        "default": "body",
        "enum": {
          "h1": {"styles": {"font-size": "40px", "font-weight": "bold", "line-height": "56px", "color": {"call": "token", "args": {"name": "Color_Text_Heading"}}}},
          "h2": {"styles": {"font-size": "36px", "font-weight": "bold", "line-height": "50px", "color": {"call": "token", "args": {"name": "Color_Text_Heading"}}}},
          "h3": {"styles": {"font-size": "32px", "font-weight": "bold", "line-height": "44px", "color": {"call": "token", "args": {"name": "Color_Text_Heading"}}}},
          "h4": {"styles": {"font-size": "30px", "font-weight": "bold", "line-height": "42px", "color": {"call": "token", "args": {"name": "Color_Text_Heading"}}}},
          "h5": {"styles": {"font-size": "28px", "font-weight": "bold", "line-height": "40px", "color": {"call": "token", "args": {"name": "Color_Text_Heading"}}}},
          "body": {"styles": {"font-size": "28px", "line-height": "40px", "color": {"call": "token", "args": {"name": "Color_Text_Body"}}}},
          "caption": {"styles": {"font-size": "24px", "line-height": "34px", "color": {"call": "token", "args": {"name": "Color_Text_Caption"}}}}
        }
      },
      "styles": {
        "default": {
          "width": "auto",
          "height": "auto",
          "font-family": "system",
          "line-clamp": 0,
          "text-align": "left"
        }
      }
    },
    "Card": {
      "child": {"default": ""},
      "styles": {
        "default": {
          "width": "auto",
          "height": "auto",
          "padding": "24px",
          "border-radius": "16px",
          "background-color": "#FFFFFF",
          "filter": "drop-shadow(0px 6px 24px rgba(0, 0, 0, 0.08))"
        }
      }
    },
    "Divider": {
      "axis": {
        "default": "horizontal",
        "enum": {
          "horizontal": {
            "styles": {
              "width": "100%",
              "height": "1px",
              "margin-top": "8px",
              "margin-bottom": "8px"
            }
          },
          "vertical": {
            "styles": {
              "width": "1px",
              "height": "80px",
              "margin-left": "8px",
              "margin-right": "8px"
            }
          }
        }
      },
      "styles": {
        "default": {
          "background-color": {"call": "token", "args": {"name": "Color_Gray_06"}}
        }
      }
    },
    "Image": {
      "url": {"default": ""},
      "fit": {
        "default": "cover",
        "enum": ["contain", "cover", "fill", "none", "scale-down"]
      },
      "variant": {
        "enum": {
          "icon": {"styles": {"width": "48px", "height": "48px", "border-radius": "0px"}},
          "avatar": {"styles": {"width": "88px", "height": "88px", "border-radius": "44px"}},
          "smallFeature": {"styles": {"width": "100%", "aspect-ratio": "4 / 3", "border-radius": "8px"}},
          "mediumFeature": {"styles": {"width": "100%", "aspect-ratio": "3 / 2","border-radius": "16px"}},
          "largeFeature": {"styles": {"width": "100%", "aspect-ratio": "16 / 9","border-radius": "24px"}},
          "header": {"styles": {"width": "100%", "aspect-ratio": "16 / 9","border-radius": "0px"}}
        }
      },
      "styles": {
        "default": {
          "width": "auto",
          "height": "auto",
          "border-width": "0px",
          "border-color": "#0000001A"
        }
      }
    },
    "Icon": {
      "styles": {
        "default": {
          "width": "24px",
          "height": "24px"
        }
      }
    },
    "TextField": {
      "label": {"default": ""},
      "value": {"default": ""},
      "variant": {
        "default": "longText",
        "enum": {
          "shortText": {"styles": {}},
          "longText": {"styles": {}},
          "number": {"styles": {}},
          "obscured": {"styles": {}}
        }
      },
      "styles": {
        "default": {
          "width": "100%",
          "height": "150px",
          "border-radius": "16px",
          "background-color": "rgba(0, 0, 0, 0.03)",
          "border-width": "1px",
          "border-color": "rgba(0, 0, 0, 0.06)"
        }
      }
    },
    "CheckBox": {
      "label": {"default": ""},
      "value": {"default": false},
      "styles": {
        "default": {
          "font-size": "32px",
          "color": "#000000"
        }
      }
    },
    "ChoicePicker": {
      "label": {"default": ""},
      "variant": {
        "default": "mutuallyExclusive",
        "enum": {
          "multipleSelection": {"styles": {}},
          "mutuallyExclusive": {"styles": {}}
        }
      },
      "options": {"default": []},
      "value": {"default": []},
      "styles": {
        "default": {
          "orientation": "vertical",
          "padding": "24px"
        }
      }
    },
    "Table": {
      "headers": {"default": []},
      "rows": {"default": []},
      "styles": {
        "default": {
            "border-width": "1px",
            "border-radius": "16px",
            "border-color": "#E1E4E9"
        }
      }
    },
    "Markdown": {
      "styles": {
        "default": {
            "margin-bottom": "24px"
        }
      }
    },
    "Carousel": {
      "autoplay": {"default": false},
      "draggable": {"default": true},
      "content": {"default": []},
      "styles": {
        "default": {
          "width": "100%",
          "height": "auto"
        }
      }
    },
    "Web": {
      "url": {"default": ""},
      "styles": {
        "default": {
          "width": "100%",
          "min-height": "240px",
          "max-height": "1600px",
          "height": "auto"
        }
      }
    },
    "Button": {
      "child": {"default": ""},
      "variant": {
        "default": "primary",
        "enum": {
          "primary": {"styles": {}},
          "borderless": {"styles": {
            "border-width": "0px"
          }}
        }
      },
      "styles": {
        "default": {
          "width": "auto",
          "height": "auto",
          "background-color": "#FFFFFF",
          "border-radius": "16px",
          "border-width": "1px",
          "border-color": "rgba(0, 0, 0, 0.06)"
        }
      }
    }
})JSON";

}  // namespace agenui

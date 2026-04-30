#pragma once

namespace agenui {

/// Default design token config (JSON static string)
static const char* const kDesignTokenConfig = R"JSON({
  "designTokens": {

    "Color_Text_Heading": {"type": "color", "light": "#000000", "dark": "#FFFFFF"},
    "Color_Text_Body": {"type": "color", "light": "#000000E6", "dark": "#FFFFFFE6"},
    "Color_Text_Caption": {"type": "color", "light": "#00000099", "dark": "#FFFFFF99"},

    "Color_Text_L1": {"type": "color", "light": "#000000", "dark": "#FFFFFFE6"},
    "Color_Text_L2": {"type": "color", "light": "#00000099", "dark": "#FFFFFF99"},
    "Color_Text_L3": {"type": "color", "light": "#00000066", "dark": "#FFFFFF66"},
    "Color_Text_L4": {"type": "color", "light": "#00000033", "dark": "#FFFFFF33"},
    "Color_Text_Highlight": {"type": "color", "light": "#FFFFFF", "dark": "#FFFFFF"},
    "Color_Text_Brand": {"type": "color", "light": "#2273F7", "dark": "#4D95E5"},
    "Color_Text_Red": {"type": "color", "light": "#FF4B4B", "dark": "#FF4B4B"},
    "Color_Text_Orange": {"type": "color", "light": "#FF8027", "dark": "#FF8027"},
    "Color_Text_Trade": {"type": "color", "light": "#FF5E33", "dark": "#FF5E33"},
    "Color_Text_Green": {"type": "color", "light": "#2AB352", "dark": "#2AB352"},

    "Color_BG_L1": {"type": "color", "light": "#F6F7F8", "dark": "#1C1F25"},
    "Color_BG_L2": {"type": "color", "light": "#FFFFFF", "dark": "#21252B"},
    "Color_BG_L3": {"type": "color", "light": "#FFFFFF", "dark": "#292C36"},
    "Color_BG_L4": {"type": "color", "light": "#FFFFFF", "dark": "#2A303B"},
    "Color_BG_L5": {"type": "color", "light": "#FFFFFF", "dark": "#363E4D"},
    "Color_BG_Brand": {"type": "color", "light": "#2E82FF", "dark": "#197CE6"},

    "Color_Gray_03": {"type": "color", "light": "#00000008", "dark": "#FFFFFF08"},
    "Color_Gray_06": {"type": "color", "light": "#0000000F", "dark": "#FFFFFF0F"},
    "Color_Gray_10": {"type": "color", "light": "#0000001A", "dark": "#FFFFFF1A"},
    "Color_Gray_20": {"type": "color", "light": "#00000033", "dark": "#FFFFFF33"},
    "Color_Mask_L1": {"type": "color", "light": "#00000066", "dark": "#00000088"},
    "Color_Mask_L2": {"type": "color", "light": "#000000CC", "dark": "#000000CC"},
    "Color_Mask_L1_N": {"type": "color", "light": "#00000033", "dark": "#00000033"},
    "Color_Black": {"type": "color", "light": "#000000", "dark": "#FFFFFF"},
    "Color_White": {"type": "color", "light": "#FFFFFF", "dark": "#000000"},
    "Color_White(E6)": {"type": "color", "light": "#FFFFFFE6", "dark": "#000000E6"},
    "Color_Black_All": {"type": "color", "light": "#000000", "dark": "#000000"},
    "Color_White_All": {"type": "color", "light": "#FFFFFF", "dark": "#FFFFFF"},

    "Color_Ink_L1": {"type": "color", "light": "#F6F7F8", "dark": "#2B303B"},
    "Color_Ink_L2": {"type": "color", "light": "#EEEFF2", "dark": "#21252B"},
    "Color_Ink_L3": {"type": "color", "light": "#E1E4E9", "dark": "#576175"},
    "Color_Ink_L4": {"type": "color", "light": "#C4C9D4", "dark": "#6C7993"},
    "Color_Ink_L5": {"type": "color", "light": "#8A94A8", "dark": "#8A94A8"},
    "Color_Ink_L6": {"type": "color", "light": "#576175", "dark": "#C4C9D4"},
    "Color_Ink_L7": {"type": "color", "light": "#2B303B", "dark": "#F6F7F8"},

    "Color_Red": {"type": "color", "light": "#FF4B4B", "dark": "#FF4B4B"},
    "Color_Ink": {"type": "color", "light": "#415886", "dark": "#6481B9"},
    "Color_NewEnergy": {"type": "color", "light": "#00BD9D", "dark": "#00BD9D"},
    "Color_Brand_Xiaopeng": {"type": "color", "light": "#393E4F", "dark": "#565D75"},
    "Color_Brand_Starbucks": {"type": "color", "light": "#006241", "dark": "#006241"},
    "Color_BG_AI_Input_N": {"type": "color", "light": "#FBFAF9", "dark": "#2A303B"},
    "Color_BG_AI_Input_Listen_N": {"type": "color", "light": "#2273F7", "dark": "#2273F7"},
    "Color_Loading_L1": {"type": "color", "light": "#415886", "dark": "#FFFFFF"},
    "Color_Loading_L2": {"type": "color", "light": "#F0F2F6", "dark": "#686666"},
    "Color_BG_Tips": {"type": "color", "light": "#4C4E52F2", "dark": "#676B74F2"},

    "primary_main": {"type": "color", "light": "#2273F7"},
    "primary_light": {"type": "color", "light": "#5294F9"},
    "primary_dark": {"type": "color", "light": "#1456C9"},

    "semantic_success": {"type": "color", "light": "#2AB352"},
    "semantic_warning": {"type": "color", "light": "#FF8207"},
    "semantic_error": {"type": "color", "light": "#FF4B4B"},
    "semantic_info": {"type": "color", "light": "#2273F7"},
    "semantic_trade": {"type": "color", "light": "#FF5E33"},

    "neutral_100": {"type": "color", "light": "#FFFFFF1A"},
    "neutral_200": {"type": "color", "light": "#00000033"},
    "neutral_400": {"type": "color", "light": "#00000066"},
    "neutral_600": {"type": "color", "light": "#00000099"},
    "neutral_678": {"type": "color", "light": "#F6F7F8"},
    "neutral_800": {"type": "color", "light": "#000000CC"},
    "neutral_900": {"type": "color", "light": "#000000E6"},
    "neutral_001": {"type": "color", "light": "#FFFFFF"}

  }
})JSON";

} // namespace agenui

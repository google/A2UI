// Copyright (c) Alibaba, Inc. and its affiliates.
//
// Centralized font-weight utilities for the Harmony platform.
//
// Eliminates the highly-repeated 100~900 -> ArkUI_FontWeight if-else chains
// that previously appeared in multiple components (text_component, table_component, ...).
//
// Numeric weight values follow the CSS font-weight specification:
//   https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight
#pragma once

#include <arkui/native_type.h>
#include <cstdint>

namespace a2ui {
namespace font_weight {

// CSS-spec numeric font weight constants (100 .. 900).
// Use these in lieu of bare integer literals when expressing font weight in code.
constexpr int kNumericThin       = 100;  // Thin / Hairline
constexpr int kNumericExtraLight = 200;  // Extra Light / Ultra Light
constexpr int kNumericLight      = 300;  // Light
constexpr int kNumericNormal     = 400;  // Normal / Regular
constexpr int kNumericMedium     = 500;  // Medium
constexpr int kNumericSemiBold   = 600;  // Semi Bold / Demi Bold
constexpr int kNumericBold       = 700;  // Bold
constexpr int kNumericExtraBold  = 800;  // Extra Bold / Ultra Bold
constexpr int kNumericBlack      = 900;  // Black / Heavy

// Map a CSS numeric font-weight value to its corresponding ArkUI_FontWeight enum.
//
// Range handling matches the historical behavior used in text_component / table_component:
//   numericWeight <= 100  -> W100
//   numericWeight <= 200  -> W200
//   ... (every 100 step)
//   numericWeight  > 800  -> W900
//
// When useNormalBoldAlias is true, the canonical CSS aliases are returned for the
// two most commonly used weights:
//   400 -> ARKUI_FONT_WEIGHT_NORMAL   (instead of W400)
//   700 -> ARKUI_FONT_WEIGHT_BOLD     (instead of W700)
// This preserves the exact return values that TextComponent::mapFontWeight has
// historically produced. Pass false (the default) to get the explicit W400 / W700
// values used by TableComponent::parseFontWeight.
inline int32_t mapNumericToArkUIFontWeight(int numericWeight, bool useNormalBoldAlias = false) {
    if (numericWeight <= kNumericThin)       return ARKUI_FONT_WEIGHT_W100;
    if (numericWeight <= kNumericExtraLight) return ARKUI_FONT_WEIGHT_W200;
    if (numericWeight <= kNumericLight)      return ARKUI_FONT_WEIGHT_W300;
    if (numericWeight <= kNumericNormal)     return useNormalBoldAlias ? ARKUI_FONT_WEIGHT_NORMAL : ARKUI_FONT_WEIGHT_W400;
    if (numericWeight <= kNumericMedium)     return ARKUI_FONT_WEIGHT_W500;
    if (numericWeight <= kNumericSemiBold)   return ARKUI_FONT_WEIGHT_W600;
    if (numericWeight <= kNumericBold)       return useNormalBoldAlias ? ARKUI_FONT_WEIGHT_BOLD : ARKUI_FONT_WEIGHT_W700;
    if (numericWeight <= kNumericExtraBold)  return ARKUI_FONT_WEIGHT_W800;
    return ARKUI_FONT_WEIGHT_W900;
}

}  // namespace font_weight
}  // namespace a2ui

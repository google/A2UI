#ifndef A2UI_COLOR_PALETTE_H
#define A2UI_COLOR_PALETTE_H

#include <cstdint>

/**
 * @file a2ui_color_palette.h
 * @brief Centralized 32-bit ARGB color constants used across the rendering layer.
 *
 * All colors are encoded as 0xAARRGGBB. Components must reference these constants
 * instead of hard-coded literals so that themes and design tokens can override
 * defaults from a single location.
 */

namespace a2ui {
namespace colors {

// Fully transparent. Used as the fallback for failed color parsing and for
// rendering layers that should not draw a fill (e.g. button background reset).
constexpr uint32_t kColorTransparent      = 0x00000000;

// Transparent white. Used as the start/end stop in white-to-clear gradients.
constexpr uint32_t kColorTransparentWhite = 0x00FFFFFF;

// Opaque pure black. Default foreground color for text, icons and video chrome.
constexpr uint32_t kColorBlack            = 0xFF000000;

// Opaque pure white. Default surface color for cards, indicators and overlays.
constexpr uint32_t kColorWhite            = 0xFFFFFFFF;

// Brand primary blue. Used for selected states, audio player chrome and
// active tab indicators.
constexpr uint32_t kColorPrimaryBlue      = 0xFF2273F7;

// Light gray border. Default color for dividers and component borders.
constexpr uint32_t kColorBorderGray       = 0xFFE0E0E0;

// 20% opacity black (alpha 0x33). Default elevation / drop shadow color.
constexpr uint32_t kColorShadow20         = 0x33000000;

}  // namespace colors
}  // namespace a2ui

#endif  // A2UI_COLOR_PALETTE_H

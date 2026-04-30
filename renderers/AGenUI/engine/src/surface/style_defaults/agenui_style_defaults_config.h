#pragma once

namespace agenui {

/// Baseline style defaults config (JSON static string)
///
/// Format: { "style-property": value, ... }
/// - Shared across all component types
/// - Values may be strings (e.g. "auto", "0px") or numbers (e.g. 0, 1)
/// - After parsing, all values are stored as JSON strings to match ComponentSnapshot.styles format
static const char* const kStyleDefaultsConfig =
#ifdef IOS
R"JSON({
    "width": "auto",
    "height": "auto",
    "justify-content": "flex-start",
    "align-items": "stretch",
    "flex-wrap": "nowrap",
    "flex-direction": "column",
    "align-content": "flex-start",
    "align-self": "auto",
    "flex-grow": 0,
    "flex-shrink": 0,
    "background-color": "transparent",
    "border-radius": "0px",
    "border-color": "#0000001A",
    "border-style": "solid",
    "border-width": "0px",
    "opacity": 1,
    "visibility": "visible",
    "filter": "none"
})JSON";
#else
R"JSON({

})JSON";
#endif
}  // namespace agenui

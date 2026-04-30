#pragma once

#include "agenui_component_snapshot.h"
#include <string>

#if defined(__OHOS__)
#include <yoga/Yoga.h>
#include "nlohmann/json.hpp"
#endif

namespace agenui {

#if defined(__OHOS__)

// Static mapping table of CSS property names (W3C standard naming)
namespace CSSPropertyNames {
    // Dimension properties
    static const char* kWidth = "width";
    static const char* kHeight = "height";
    static const char* kMinWidth = "min-width";
    static const char* kMaxWidth = "max-width";
    static const char* kMinHeight = "min-height";
    static const char* kMaxHeight = "max-height";
    
    // Flexbox layout properties
    static const char* kFlexDirection = "flex-direction";
    static const char* kFlexWrap = "flex-wrap";
    static const char* kJustifyContent = "justify-content";
    static const char* kAlignItems = "align-items";
    static const char* kAlignSelf = "align-self";
    static const char* kAlignContent = "align-content";
    static const char* kFlex = "flex";
    static const char* kFlexGrow = "flex-grow";
    static const char* kFlexShrink = "flex-shrink";
    static const char* kFlexBasis = "flex-basis";
    
    // Spacing properties
    static const char* kPadding = "padding";
    static const char* kPaddingLeft = "padding-left";
    static const char* kPaddingRight = "padding-right";
    static const char* kPaddingTop = "padding-top";
    static const char* kPaddingBottom = "padding-bottom";
    static const char* kMargin = "margin";
    static const char* kMarginLeft = "margin-left";
    static const char* kMarginRight = "margin-right";
    static const char* kMarginTop = "margin-top";
    static const char* kMarginBottom = "margin-bottom";
    static const char* kBorder = "border";
    static const char* kBorderWidth = "border-width";
    static const char* kGap = "gap";
    
    // Positioning properties
    static const char* kPosition = "position";
    static const char* kTop = "top";
    static const char* kRight = "right";
    static const char* kBottom = "bottom";
    static const char* kLeft = "left";
    
    // Display and overflow properties
    static const char* kDisplay = "display";
    static const char* kOverflow = "overflow";
    static const char* kDirection = "direction";
    
    // Other properties
    static const char* kAspectRatio = "aspect-ratio";
    
    // Divider-specific properties
    static const char* kThickness = "thickness";
    
    // Table-specific properties
    static const char* kCellPadding = "cell-padding";
    static const char* kColumnWeights = "column-weights";

    // ChoicePicker-specific properties
    static const char* kOrientation = "orientation";   // ChoicePicker layout direction (horizontal/vertical)

    // CSS Logical Properties
    // Inset logical properties
    static const char* kInsetInlineStart = "inset-inline-start";
    static const char* kInsetInlineEnd = "inset-inline-end";
    static const char* kInsetBlockStart = "inset-block-start";
    static const char* kInsetBlockEnd = "inset-block-end";
    
    // Margin logical properties
    static const char* kMarginInlineStart = "margin-inline-start";
    static const char* kMarginInlineEnd = "margin-inline-end";
    static const char* kMarginBlockStart = "margin-block-start";
    static const char* kMarginBlockEnd = "margin-block-end";

    // Padding logical properties
    static const char* kPaddingInlineStart = "padding-inline-start";
    static const char* kPaddingInlineEnd = "padding-inline-end";
    static const char* kPaddingBlockStart = "padding-block-start";
    static const char* kPaddingBlockEnd = "padding-block-end";

    // camelCase aliases (equivalent to standard kebab-case properties)
    static const char* kJustifyContentCC     = "justifyContent";
    static const char* kAlignItemsCC         = "alignItems";
    static const char* kFlexWrapCC           = "flexWrap";
    static const char* kAlignContentCC       = "alignContent";
    static const char* kAlignSelfCC          = "alignSelf";
    static const char* kFlexGrowCC           = "flexGrow";
    static const char* kFlexShrinkCC         = "flexShrink";
    static const char* kFlexBasisCC          = "flexBasis";
    static const char* kBorderWidthCC        = "borderWidth";
    // Inset logical property camelCase aliases
    static const char* kInsetInlineStartCC   = "insetInlineStart";
    static const char* kInsetInlineEndCC     = "insetInlineEnd";
    static const char* kInsetBlockStartCC    = "insetBlockStart";
    static const char* kInsetBlockEndCC      = "insetBlockEnd";
    // Margin logical property camelCase aliases
    static const char* kMarginInlineStartCC  = "marginInlineStart";
    static const char* kMarginInlineEndCC    = "marginInlineEnd";
    static const char* kMarginBlockStartCC   = "marginBlockStart";
    static const char* kMarginBlockEndCC     = "marginBlockEnd";
    // Padding logical property camelCase aliases
    static const char* kPaddingInlineStartCC = "paddingInlineStart";
    static const char* kPaddingInlineEndCC   = "paddingInlineEnd";
    static const char* kPaddingBlockStartCC  = "paddingBlockStart";
    static const char* kPaddingBlockEndCC    = "paddingBlockEnd";
}

/**
 * @brief CSS style converter
 * @remark Converts CSS style properties in ComponentSnapshot to Yoga layout properties
 */
class CSSStyleConverter {
public:
    /**
     * @brief Convert CSS styles to Yoga layout properties
     * @param snapshot Component snapshot (input source)
     * @param yogaNode Yoga layout node (output target)
     * @param clearAfterConvert Whether to clear CSS styles from snapshot after conversion; defaults to false
     * @remark Processes CSS style properties in the styles field
     */
    static void convertToYoga(ComponentSnapshot& snapshot, YGNodeRef yogaNode, bool clearAfterConvert = false);
    
    static bool isRichText(const std::string& text);

public:    
    static void applyCellPadding(YGNodeRef yogaNode, ComponentSnapshot& snapshot);
    
    /**
     * @brief Get the JSON object of device component style configuration
     * @return JSON object containing all component style configurations
     */
    static const nlohmann::json& getDeviceComponentStylesJson();

    /**
     * @brief Parse a style dimension value
     * @param styleConfig Style configuration JSON object
     * @param key Key name to parse
     * @param fallbackValue Default value
     * @return Parsed float value
     */
    static float parseStyleDimension(const nlohmann::json& styleConfig, const char* key, float fallbackValue);

public:
    // CSS-specific apply functions (handle CSS standard value formats)
    
    // Dimension properties
    static void applyWidth(YGNodeRef yogaNode, const SerializableData& value, bool hasMeasureFunc);
    static void applyHeight(YGNodeRef yogaNode, const SerializableData& value, bool hasMeasureFunc);
    static void applyMinWidth(YGNodeRef yogaNode, const SerializableData& value);
    static void applyMaxWidth(YGNodeRef yogaNode, const SerializableData& value);
    static void applyMinHeight(YGNodeRef yogaNode, const SerializableData& value);
    static void applyMaxHeight(YGNodeRef yogaNode, const SerializableData& value);
    
    // Flexbox layout properties
    static void applyFlexDirection(YGNodeRef yogaNode, const SerializableData& value);
    static void applyFlexWrap(YGNodeRef yogaNode, const SerializableData& value);
    static void applyJustifyContent(YGNodeRef yogaNode, const SerializableData& value);
    static void applyAlignItems(YGNodeRef yogaNode, const SerializableData& value);
    static void applyAlignSelf(YGNodeRef yogaNode, const SerializableData& value);
    static void applyAlignContent(YGNodeRef yogaNode, const SerializableData& value);
    static void applyFlex(YGNodeRef yogaNode, const SerializableData& value);
    static void applyFlexGrow(YGNodeRef yogaNode, const SerializableData& value);
    static void applyFlexShrink(YGNodeRef yogaNode, const SerializableData& value);
    static void applyFlexBasis(YGNodeRef yogaNode, const SerializableData& value);
    
    // Spacing properties
    static void applyPadding(YGNodeRef yogaNode, const SerializableData& value);
    static void applyPaddingLeft(YGNodeRef yogaNode, const SerializableData& value);
    static void applyPaddingRight(YGNodeRef yogaNode, const SerializableData& value);
    static void applyPaddingTop(YGNodeRef yogaNode, const SerializableData& value);
    static void applyPaddingBottom(YGNodeRef yogaNode, const SerializableData& value);
    static void applyMargin(YGNodeRef yogaNode, const SerializableData& value);
    static void applyMarginLeft(YGNodeRef yogaNode, const SerializableData& value);
    static void applyMarginRight(YGNodeRef yogaNode, const SerializableData& value);
    static void applyMarginTop(YGNodeRef yogaNode, const SerializableData& value);
    static void applyMarginBottom(YGNodeRef yogaNode, const SerializableData& value);
    static void applyBorder(YGNodeRef yogaNode, const SerializableData& value);
    static void applyBorderWidth(YGNodeRef yogaNode, const SerializableData& value);
    static void applyGap(YGNodeRef yogaNode, const SerializableData& value);
    
    // Positioning properties
    static void applyPosition(YGNodeRef yogaNode, const SerializableData& value);
    static void applyTop(YGNodeRef yogaNode, const SerializableData& value);
    static void applyRight(YGNodeRef yogaNode, const SerializableData& value);
    static void applyBottom(YGNodeRef yogaNode, const SerializableData& value);
    static void applyLeft(YGNodeRef yogaNode, const SerializableData& value);
    
    // Display and overflow properties
    static void applyDisplay(YGNodeRef yogaNode, const SerializableData& value);
    static void applyOverflow(YGNodeRef yogaNode, const SerializableData& value);
    static void applyDirection(YGNodeRef yogaNode, const SerializableData& value);
    
    // Other properties
    static void applyAspectRatio(YGNodeRef yogaNode, const SerializableData& value);
    
    // CSS Logical Properties
    // Inset logical properties
    static void applyInsetInlineStart(YGNodeRef yogaNode, const SerializableData& value);
    static void applyInsetInlineEnd(YGNodeRef yogaNode, const SerializableData& value);
    static void applyInsetBlockStart(YGNodeRef yogaNode, const SerializableData& value);
    static void applyInsetBlockEnd(YGNodeRef yogaNode, const SerializableData& value);
    
    // Margin logical properties
    static void applyMarginInlineStart(YGNodeRef yogaNode, const SerializableData& value);
    static void applyMarginInlineEnd(YGNodeRef yogaNode, const SerializableData& value);
    static void applyMarginBlockStart(YGNodeRef yogaNode, const SerializableData& value);
    static void applyMarginBlockEnd(YGNodeRef yogaNode, const SerializableData& value);
    
    // Padding logical properties
    static void applyPaddingInlineStart(YGNodeRef yogaNode, const SerializableData& value);
    static void applyPaddingInlineEnd(YGNodeRef yogaNode, const SerializableData& value);
    static void applyPaddingBlockStart(YGNodeRef yogaNode, const SerializableData& value);
    static void applyPaddingBlockEnd(YGNodeRef yogaNode, const SerializableData& value);
};
#endif

}  // namespace agenui

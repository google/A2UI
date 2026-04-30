#include "agenui_css_style_converter.h"
#include "agenui_platform_layout_bridge.h"
#include "agenui_ivirtual_define.h"
#include <cctype>
#include <sstream>
#include <vector>
#include "nlohmann/json.hpp"

namespace agenui {

#if defined(__OHOS__)

namespace {

std::string trimWhitespace(const std::string& value) {
    size_t start = 0;
    while (start < value.size() && std::isspace(static_cast<unsigned char>(value[start]))) {
        ++start;
    }

    size_t end = value.size();
    while (end > start && std::isspace(static_cast<unsigned char>(value[end - 1]))) {
        --end;
    }

    return value.substr(start, end - start);
}

bool parseAspectRatioValue(const std::string& rawValue, float& aspectRatio) {
    const std::string value = trimWhitespace(rawValue);
    if (value.empty()) {
        return false;
    }

    const size_t slashPos = value.find('/');
    if (slashPos == std::string::npos) {
        aspectRatio = std::stof(value);
        return aspectRatio > 0.0f;
    }

    const std::string numeratorStr = trimWhitespace(value.substr(0, slashPos));
    const std::string denominatorStr = trimWhitespace(value.substr(slashPos + 1));
    if (numeratorStr.empty() || denominatorStr.empty()) {
        return false;
    }

    const float numerator = std::stof(numeratorStr);
    const float denominator = std::stof(denominatorStr);
    if (numerator <= 0.0f || denominator <= 0.0f) {
        return false;
    }

    aspectRatio = numerator / denominator;
    return true;
}

}  // namespace

bool CSSStyleConverter::isRichText(const std::string& text) {
    // Check for HTML tags (using find instead of regex for performance and C++11 compatibility)
    if (text.find('<') != std::string::npos && text.find('>') != std::string::npos) {
        return true;
    }

    // Check for Markdown bold: **text** or __text__
    if (text.find("**") != std::string::npos || text.find("__") != std::string::npos) {
        return true;
    }

    // Check for Markdown italic: *text* or _text_
    size_t asteriskPos = text.find('*');
    if (asteriskPos != std::string::npos && asteriskPos + 1 < text.size()) {
        if (text.find('*', asteriskPos + 1) != std::string::npos) {
            return true;
        }
    }

    size_t underscorePos = text.find('_');
    if (underscorePos != std::string::npos && underscorePos + 1 < text.size()) {
        if (text.find('_', underscorePos + 1) != std::string::npos) {
            return true;
        }
    }

    return false;
}

void CSSStyleConverter::convertToYoga(ComponentSnapshot& snapshot, YGNodeRef yogaNode, bool clearAfterConvert) {
    if (yogaNode == nullptr) {
        return;
    }
    
    bool hasMeasureFunc = YGNodeHasMeasureFunc(yogaNode);
    
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kWidth);
        if (styleIt != snapshot.styles.end()) {
            applyWidth(yogaNode, styleIt->second, hasMeasureFunc);
        } else if (hasMeasureFunc) {
            // No explicit width, but node has measure function: set auto so Yoga defers to it
            YGNodeStyleSetWidthAuto(yogaNode);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kHeight);
        if (styleIt != snapshot.styles.end()) {
            applyHeight(yogaNode, styleIt->second, hasMeasureFunc);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kFlexDirection);
        if (styleIt != snapshot.styles.end()) {
            applyFlexDirection(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kJustifyContent);
        if (styleIt != snapshot.styles.end()) {
            applyJustifyContent(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kAlignItems);
        if (styleIt != snapshot.styles.end()) {
            applyAlignItems(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kAlignSelf);
        if (styleIt != snapshot.styles.end()) {
            applyAlignSelf(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kFlex);
        if (styleIt != snapshot.styles.end()) {
            applyFlex(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kFlexGrow);
        if (styleIt != snapshot.styles.end()) {
            applyFlexGrow(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kFlexShrink);
        if (styleIt != snapshot.styles.end()) {
            applyFlexShrink(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kPadding);
        if (styleIt != snapshot.styles.end()) {
            applyPadding(yogaNode, styleIt->second);
        }
    }
    // Individual padding sides (override the shorthand padding value)
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kPaddingLeft);
        if (it != snapshot.styles.end()) applyPaddingLeft(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kPaddingRight);
        if (it != snapshot.styles.end()) applyPaddingRight(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kPaddingTop);
        if (it != snapshot.styles.end()) applyPaddingTop(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kPaddingBottom);
        if (it != snapshot.styles.end()) applyPaddingBottom(yogaNode, it->second);
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kMargin);
        if (styleIt != snapshot.styles.end()) {
            applyMargin(yogaNode, styleIt->second);
        }
    }
    // Individual margin sides (override the shorthand margin value)
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kMarginLeft);
        if (it != snapshot.styles.end()) applyMarginLeft(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kMarginRight);
        if (it != snapshot.styles.end()) applyMarginRight(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kMarginTop);
        if (it != snapshot.styles.end()) applyMarginTop(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kMarginBottom);
        if (it != snapshot.styles.end()) applyMarginBottom(yogaNode, it->second);
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kGap);
        if (styleIt != snapshot.styles.end()) {
            applyGap(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kMinWidth);
        if (styleIt != snapshot.styles.end()) {
            applyMinWidth(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kMaxWidth);
        if (styleIt != snapshot.styles.end()) {
            applyMaxWidth(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kMinHeight);
        if (styleIt != snapshot.styles.end()) {
            applyMinHeight(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kMaxHeight);
        if (styleIt != snapshot.styles.end()) {
            applyMaxHeight(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kFlexWrap);
        if (styleIt != snapshot.styles.end()) {
            applyFlexWrap(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kAlignContent);
        if (styleIt != snapshot.styles.end()) {
            applyAlignContent(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kFlexBasis);
        if (styleIt != snapshot.styles.end()) {
            applyFlexBasis(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kBorder);
        if (styleIt != snapshot.styles.end()) {
            applyBorder(yogaNode, styleIt->second);
        }
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kBorderWidth);
        if (it != snapshot.styles.end()) applyBorderWidth(yogaNode, it->second);
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kPosition);
        if (styleIt != snapshot.styles.end()) {
            applyPosition(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kTop);
        if (styleIt != snapshot.styles.end()) {
            applyTop(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kRight);
        if (styleIt != snapshot.styles.end()) {
            applyRight(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kBottom);
        if (styleIt != snapshot.styles.end()) {
            applyBottom(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kLeft);
        if (styleIt != snapshot.styles.end()) {
            applyLeft(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kDisplay);
        if (styleIt != snapshot.styles.end()) {
            applyDisplay(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kOverflow);
        if (styleIt != snapshot.styles.end()) {
            applyOverflow(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kDirection);
        if (styleIt != snapshot.styles.end()) {
            applyDirection(yogaNode, styleIt->second);
        }
    }
    {
        auto styleIt = snapshot.styles.find(CSSPropertyNames::kAspectRatio);
        if (styleIt != snapshot.styles.end()) {
            applyAspectRatio(yogaNode, styleIt->second);
        }
    }

    // CSS Logical Properties — Inset
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kInsetInlineStart);
        if (it != snapshot.styles.end()) applyInsetInlineStart(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kInsetInlineEnd);
        if (it != snapshot.styles.end()) applyInsetInlineEnd(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kInsetBlockStart);
        if (it != snapshot.styles.end()) applyInsetBlockStart(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kInsetBlockEnd);
        if (it != snapshot.styles.end()) applyInsetBlockEnd(yogaNode, it->second);
    }
    
    // CSS Logical Properties — Margin
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kMarginInlineStart);
        if (it != snapshot.styles.end()) applyMarginInlineStart(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kMarginInlineEnd);
        if (it != snapshot.styles.end()) applyMarginInlineEnd(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kMarginBlockStart);
        if (it != snapshot.styles.end()) applyMarginBlockStart(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kMarginBlockEnd);
        if (it != snapshot.styles.end()) applyMarginBlockEnd(yogaNode, it->second);
    }
    
    // CSS Logical Properties — Padding
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kPaddingInlineStart);
        if (it != snapshot.styles.end()) applyPaddingInlineStart(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kPaddingInlineEnd);
        if (it != snapshot.styles.end()) applyPaddingInlineEnd(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kPaddingBlockStart);
        if (it != snapshot.styles.end()) applyPaddingBlockStart(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kPaddingBlockEnd);
        if (it != snapshot.styles.end()) applyPaddingBlockEnd(yogaNode, it->second);
    }
    

    // camelCase aliases (equivalent to their kebab-case counterparts)
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kJustifyContentCC);
        if (it != snapshot.styles.end()) applyJustifyContent(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kAlignItemsCC);
        if (it != snapshot.styles.end()) applyAlignItems(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kFlexWrapCC);
        if (it != snapshot.styles.end()) applyFlexWrap(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kAlignContentCC);
        if (it != snapshot.styles.end()) applyAlignContent(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kAlignSelfCC);
        if (it != snapshot.styles.end()) applyAlignSelf(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kFlexGrowCC);
        if (it != snapshot.styles.end()) applyFlexGrow(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kFlexShrinkCC);
        if (it != snapshot.styles.end()) applyFlexShrink(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kFlexBasisCC);
        if (it != snapshot.styles.end()) applyFlexBasis(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kBorderWidthCC);
        if (it != snapshot.styles.end()) applyBorderWidth(yogaNode, it->second);
    }
    // CSS Logical Properties — Inset (camelCase aliases)
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kInsetInlineStartCC);
        if (it != snapshot.styles.end()) applyInsetInlineStart(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kInsetInlineEndCC);
        if (it != snapshot.styles.end()) applyInsetInlineEnd(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kInsetBlockStartCC);
        if (it != snapshot.styles.end()) applyInsetBlockStart(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kInsetBlockEndCC);
        if (it != snapshot.styles.end()) applyInsetBlockEnd(yogaNode, it->second);
    }
    // CSS Logical Properties — Margin (camelCase aliases)
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kMarginInlineStartCC);
        if (it != snapshot.styles.end()) applyMarginInlineStart(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kMarginInlineEndCC);
        if (it != snapshot.styles.end()) applyMarginInlineEnd(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kMarginBlockStartCC);
        if (it != snapshot.styles.end()) applyMarginBlockStart(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kMarginBlockEndCC);
        if (it != snapshot.styles.end()) applyMarginBlockEnd(yogaNode, it->second);
    }
    // CSS Logical Properties — Padding (camelCase aliases)
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kPaddingInlineStartCC);
        if (it != snapshot.styles.end()) applyPaddingInlineStart(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kPaddingInlineEndCC);
        if (it != snapshot.styles.end()) applyPaddingInlineEnd(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kPaddingBlockStartCC);
        if (it != snapshot.styles.end()) applyPaddingBlockStart(yogaNode, it->second);
    }
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kPaddingBlockEndCC);
        if (it != snapshot.styles.end()) applyPaddingBlockEnd(yogaNode, it->second);
    }

    if (clearAfterConvert) {
        snapshot.styles.erase(CSSPropertyNames::kWidth);
        snapshot.styles.erase(CSSPropertyNames::kHeight);
        snapshot.styles.erase(CSSPropertyNames::kMinWidth);
        snapshot.styles.erase(CSSPropertyNames::kMaxWidth);
        snapshot.styles.erase(CSSPropertyNames::kMinHeight);
        snapshot.styles.erase(CSSPropertyNames::kMaxHeight);
        snapshot.styles.erase(CSSPropertyNames::kFlexDirection);
        snapshot.styles.erase(CSSPropertyNames::kFlexWrap);
        snapshot.styles.erase(CSSPropertyNames::kJustifyContent);
        snapshot.styles.erase(CSSPropertyNames::kAlignItems);
        snapshot.styles.erase(CSSPropertyNames::kAlignSelf);
        snapshot.styles.erase(CSSPropertyNames::kAlignContent);
        snapshot.styles.erase(CSSPropertyNames::kFlex);
        snapshot.styles.erase(CSSPropertyNames::kFlexGrow);
        snapshot.styles.erase(CSSPropertyNames::kFlexShrink);
        snapshot.styles.erase(CSSPropertyNames::kFlexBasis);
        snapshot.styles.erase(CSSPropertyNames::kPadding);
        snapshot.styles.erase(CSSPropertyNames::kMargin);
        snapshot.styles.erase(CSSPropertyNames::kBorder);
        snapshot.styles.erase(CSSPropertyNames::kGap);
        snapshot.styles.erase(CSSPropertyNames::kPosition);
        snapshot.styles.erase(CSSPropertyNames::kTop);
        snapshot.styles.erase(CSSPropertyNames::kRight);
        snapshot.styles.erase(CSSPropertyNames::kBottom);
        snapshot.styles.erase(CSSPropertyNames::kLeft);
        snapshot.styles.erase(CSSPropertyNames::kDisplay);
        snapshot.styles.erase(CSSPropertyNames::kOverflow);
        snapshot.styles.erase(CSSPropertyNames::kDirection);
        snapshot.styles.erase(CSSPropertyNames::kAspectRatio);
        
        // Clear CSS logical properties
        snapshot.styles.erase(CSSPropertyNames::kInsetInlineStart);
        snapshot.styles.erase(CSSPropertyNames::kInsetInlineEnd);
        snapshot.styles.erase(CSSPropertyNames::kInsetBlockStart);
        snapshot.styles.erase(CSSPropertyNames::kInsetBlockEnd);
        snapshot.styles.erase(CSSPropertyNames::kMarginInlineStart);
        snapshot.styles.erase(CSSPropertyNames::kMarginInlineEnd);
        snapshot.styles.erase(CSSPropertyNames::kMarginBlockStart);
        snapshot.styles.erase(CSSPropertyNames::kMarginBlockEnd);
        snapshot.styles.erase(CSSPropertyNames::kPaddingInlineStart);
        snapshot.styles.erase(CSSPropertyNames::kPaddingInlineEnd);
        snapshot.styles.erase(CSSPropertyNames::kPaddingBlockStart);
        snapshot.styles.erase(CSSPropertyNames::kPaddingBlockEnd);
        // camelCase aliases
        snapshot.styles.erase(CSSPropertyNames::kJustifyContentCC);
        snapshot.styles.erase(CSSPropertyNames::kAlignItemsCC);
        snapshot.styles.erase(CSSPropertyNames::kFlexWrapCC);
        snapshot.styles.erase(CSSPropertyNames::kAlignContentCC);
        snapshot.styles.erase(CSSPropertyNames::kAlignSelfCC);
        snapshot.styles.erase(CSSPropertyNames::kFlexGrowCC);
        snapshot.styles.erase(CSSPropertyNames::kFlexShrinkCC);
        snapshot.styles.erase(CSSPropertyNames::kFlexBasisCC);
        snapshot.styles.erase(CSSPropertyNames::kBorderWidthCC);
        snapshot.styles.erase(CSSPropertyNames::kInsetInlineStartCC);
        snapshot.styles.erase(CSSPropertyNames::kInsetInlineEndCC);
        snapshot.styles.erase(CSSPropertyNames::kInsetBlockStartCC);
        snapshot.styles.erase(CSSPropertyNames::kInsetBlockEndCC);
        snapshot.styles.erase(CSSPropertyNames::kMarginInlineStartCC);
        snapshot.styles.erase(CSSPropertyNames::kMarginInlineEndCC);
        snapshot.styles.erase(CSSPropertyNames::kMarginBlockStartCC);
        snapshot.styles.erase(CSSPropertyNames::kMarginBlockEndCC);
        snapshot.styles.erase(CSSPropertyNames::kPaddingInlineStartCC);
        snapshot.styles.erase(CSSPropertyNames::kPaddingInlineEndCC);
        snapshot.styles.erase(CSSPropertyNames::kPaddingBlockStartCC);
        snapshot.styles.erase(CSSPropertyNames::kPaddingBlockEndCC);
    }
}

void CSSStyleConverter::applyWidth(YGNodeRef yogaNode, const SerializableData& value, bool hasMeasureFunc) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetWidth(yogaNode, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (actualValue == "auto") {
        YGNodeStyleSetWidthAuto(yogaNode);
    } else if (!actualValue.empty() && actualValue.back() == '%') {
        float percent = std::stof(actualValue.substr(0, actualValue.size() - 1));
        YGNodeStyleSetWidthPercent(yogaNode, percent);
    } else if (!actualValue.empty()) {
        std::string numericPart = actualValue;
        size_t unitPos = actualValue.find_first_not_of("0123456789.-");
        if (unitPos != std::string::npos) {
            numericPart = actualValue.substr(0, unitPos);
        }
        float width = std::stof(numericPart);
        YGNodeStyleSetWidth(yogaNode, width);
    } else if (hasMeasureFunc) {
        YGNodeStyleSetWidthAuto(yogaNode);
    }
}

void CSSStyleConverter::applyHeight(YGNodeRef yogaNode, const SerializableData& value, bool hasMeasureFunc) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetHeight(yogaNode, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (actualValue == "auto") {
        YGNodeStyleSetHeightAuto(yogaNode);
    } else if (!actualValue.empty() && actualValue.back() == '%') {
        float percent = std::stof(actualValue.substr(0, actualValue.size() - 1));
        YGNodeStyleSetHeightPercent(yogaNode, percent);
    } else if (!actualValue.empty()) {
        std::string numericPart = actualValue;
        size_t unitPos = actualValue.find_first_not_of("0123456789.-");
        if (unitPos != std::string::npos) {
            numericPart = actualValue.substr(0, unitPos);
        }
        float height = std::stof(numericPart);
        YGNodeStyleSetHeight(yogaNode, height);
    } else if (hasMeasureFunc) {
        YGNodeStyleSetHeightAuto(yogaNode);
    }
}

void CSSStyleConverter::applyFlexDirection(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (actualValue == "row") {
        YGNodeStyleSetFlexDirection(yogaNode, YGFlexDirectionRow);
    } else if (actualValue == "row-reverse") {
        YGNodeStyleSetFlexDirection(yogaNode, YGFlexDirectionRowReverse);
    } else if (actualValue == "column") {
        YGNodeStyleSetFlexDirection(yogaNode, YGFlexDirectionColumn);
    } else if (actualValue == "column-reverse") {
        YGNodeStyleSetFlexDirection(yogaNode, YGFlexDirectionColumnReverse);
    }
}

void CSSStyleConverter::applyJustifyContent(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (actualValue == "flex-start") {
        YGNodeStyleSetJustifyContent(yogaNode, YGJustifyFlexStart);
    } else if (actualValue == "center") {
        YGNodeStyleSetJustifyContent(yogaNode, YGJustifyCenter);
    } else if (actualValue == "flex-end") {
        YGNodeStyleSetJustifyContent(yogaNode, YGJustifyFlexEnd);
    } else if (actualValue == "space-between") {
        YGNodeStyleSetJustifyContent(yogaNode, YGJustifySpaceBetween);
    } else if (actualValue == "space-around") {
        YGNodeStyleSetJustifyContent(yogaNode, YGJustifySpaceAround);
    } else if (actualValue == "space-evenly") {
        YGNodeStyleSetJustifyContent(yogaNode, YGJustifySpaceEvenly);
    }
}

void CSSStyleConverter::applyAlignItems(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (actualValue == "flex-start") {
        
        YGNodeStyleSetAlignItems(yogaNode, YGAlignFlexStart);
    } else if (actualValue == "center") {
        YGNodeStyleSetAlignItems(yogaNode, YGAlignCenter);
    } else if (actualValue == "flex-end") {
        YGNodeStyleSetAlignItems(yogaNode, YGAlignFlexEnd);
    } else if (actualValue == "stretch") {
        YGNodeStyleSetAlignItems(yogaNode, YGAlignStretch);
    } else if (actualValue == "baseline") {
        YGNodeStyleSetAlignItems(yogaNode, YGAlignBaseline);
    }
}

void CSSStyleConverter::applyAlignSelf(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (actualValue == "auto") {
        YGNodeStyleSetAlignSelf(yogaNode, YGAlignAuto);
    } else if (actualValue == "flex-start") {
        YGNodeStyleSetAlignSelf(yogaNode, YGAlignFlexStart);
    } else if (actualValue == "center") {
        YGNodeStyleSetAlignSelf(yogaNode, YGAlignCenter);
    } else if (actualValue == "flex-end") {
        YGNodeStyleSetAlignSelf(yogaNode, YGAlignFlexEnd);
    } else if (actualValue == "stretch") {
        YGNodeStyleSetAlignSelf(yogaNode, YGAlignStretch);
    } else if (actualValue == "baseline") {
        YGNodeStyleSetAlignSelf(yogaNode, YGAlignBaseline);
    }
}

void CSSStyleConverter::applyFlex(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetFlex(yogaNode, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    if (!actualValue.empty()) {
        float flex = std::stof(actualValue);
        YGNodeStyleSetFlex(yogaNode, flex);
    }
}

void CSSStyleConverter::applyFlexGrow(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetFlexGrow(yogaNode, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    if (!actualValue.empty()) {
        float flexGrow = std::stof(actualValue);
        YGNodeStyleSetFlexGrow(yogaNode, flexGrow);
    }
}

void CSSStyleConverter::applyFlexShrink(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetFlexShrink(yogaNode, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    if (!actualValue.empty()) {
        float flexShrink = std::stof(actualValue);
        YGNodeStyleSetFlexShrink(yogaNode, flexShrink);
    }
}

void CSSStyleConverter::applyPadding(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        float val = static_cast<float>(value.asDouble());
        YGNodeStyleSetPadding(yogaNode, YGEdgeAll, val);
        return;
    }
    
    std::string actualValue = value.asString();
    if (actualValue.empty()) {
        return;
    }
    
    std::vector<float> values;
    std::istringstream iss(actualValue);
    std::string token;
    while (iss >> token) {
        values.push_back(std::stof(token));
    }
    
    if (values.size() == 1) {
        YGNodeStyleSetPadding(yogaNode, YGEdgeAll, values[0]);
    } else if (values.size() == 2) {
        YGNodeStyleSetPadding(yogaNode, YGEdgeVertical, values[0]);
        YGNodeStyleSetPadding(yogaNode, YGEdgeHorizontal, values[1]);
    } else if (values.size() == 4) {
        YGNodeStyleSetPadding(yogaNode, YGEdgeTop, values[0]);
        YGNodeStyleSetPadding(yogaNode, YGEdgeRight, values[1]);
        YGNodeStyleSetPadding(yogaNode, YGEdgeBottom, values[2]);
        YGNodeStyleSetPadding(yogaNode, YGEdgeLeft, values[3]);
    }
}

void CSSStyleConverter::applyMargin(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        float val = static_cast<float>(value.asDouble());
        YGNodeStyleSetMargin(yogaNode, YGEdgeAll, val);
        return;
    }
    
    std::string actualValue = value.asString();
    if (actualValue.empty()) {
        return;
    }
    
    std::vector<float> values;
    std::istringstream iss(actualValue);
    std::string token;
    while (iss >> token) {
        values.push_back(std::stof(token));
    }
    
    if (values.size() == 1) {
        YGNodeStyleSetMargin(yogaNode, YGEdgeAll, values[0]);
    } else if (values.size() == 2) {
        YGNodeStyleSetMargin(yogaNode, YGEdgeVertical, values[0]);
        YGNodeStyleSetMargin(yogaNode, YGEdgeHorizontal, values[1]);
    } else if (values.size() == 4) {
        YGNodeStyleSetMargin(yogaNode, YGEdgeTop, values[0]);
        YGNodeStyleSetMargin(yogaNode, YGEdgeRight, values[1]);
        YGNodeStyleSetMargin(yogaNode, YGEdgeBottom, values[2]);
        YGNodeStyleSetMargin(yogaNode, YGEdgeLeft, values[3]);
    }
}

void CSSStyleConverter::applyGap(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetGap(yogaNode, YGGutterAll, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    if (!actualValue.empty()) {
        float gap = std::stof(actualValue);
        YGNodeStyleSetGap(yogaNode, YGGutterAll, gap);
    }
}

void CSSStyleConverter::applyPosition(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (actualValue == "relative") {
        YGNodeStyleSetPositionType(yogaNode, YGPositionTypeRelative);
    } else if (actualValue == "absolute") {
        YGNodeStyleSetPositionType(yogaNode, YGPositionTypeAbsolute);
    }
}

void CSSStyleConverter::applyMinWidth(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetMinWidth(yogaNode, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    if (actualValue.empty()) {
        return;
    }
    
    if (actualValue.back() == '%') {
        float percent = std::stof(actualValue.substr(0, actualValue.size() - 1));
        YGNodeStyleSetMinWidthPercent(yogaNode, percent);
    } else {
        std::string numericPart = actualValue;
        size_t unitPos = actualValue.find_first_not_of("0123456789.-");
        if (unitPos != std::string::npos) {
            numericPart = actualValue.substr(0, unitPos);
        }
        float minWidth = std::stof(numericPart);
        YGNodeStyleSetMinWidth(yogaNode, minWidth);
    }
}

void CSSStyleConverter::applyMaxWidth(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetMaxWidth(yogaNode, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    if (actualValue.empty()) {
        return;
    }
    
    if (actualValue.back() == '%') {
        float percent = std::stof(actualValue.substr(0, actualValue.size() - 1));
        YGNodeStyleSetMaxWidthPercent(yogaNode, percent);
    } else {
        std::string numericPart = actualValue;
        size_t unitPos = actualValue.find_first_not_of("0123456789.-");
        if (unitPos != std::string::npos) {
            numericPart = actualValue.substr(0, unitPos);
        }
        float maxWidth = std::stof(numericPart);
        YGNodeStyleSetMaxWidth(yogaNode, maxWidth);
    }
}

void CSSStyleConverter::applyMinHeight(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetMinHeight(yogaNode, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    if (actualValue.empty()) {
        return;
    }
    
    if (actualValue.back() == '%') {
        float percent = std::stof(actualValue.substr(0, actualValue.size() - 1));
        YGNodeStyleSetMinHeightPercent(yogaNode, percent);
    } else {
        std::string numericPart = actualValue;
        size_t unitPos = actualValue.find_first_not_of("0123456789.-");
        if (unitPos != std::string::npos) {
            numericPart = actualValue.substr(0, unitPos);
        }
        float minHeight = std::stof(numericPart);
        YGNodeStyleSetMinHeight(yogaNode, minHeight);
    }
}

void CSSStyleConverter::applyMaxHeight(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetMaxHeight(yogaNode, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    if (actualValue.empty()) {
        return;
    }
    
    if (actualValue.back() == '%') {
        float percent = std::stof(actualValue.substr(0, actualValue.size() - 1));
        YGNodeStyleSetMaxHeightPercent(yogaNode, percent);
    } else {
        std::string numericPart = actualValue;
        size_t unitPos = actualValue.find_first_not_of("0123456789.-");
        if (unitPos != std::string::npos) {
            numericPart = actualValue.substr(0, unitPos);
        }
        float maxHeight = std::stof(numericPart);
        YGNodeStyleSetMaxHeight(yogaNode, maxHeight);
    }
}

void CSSStyleConverter::applyFlexWrap(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (actualValue == "nowrap") {
        YGNodeStyleSetFlexWrap(yogaNode, YGWrapNoWrap);
    } else if (actualValue == "wrap") {
        YGNodeStyleSetFlexWrap(yogaNode, YGWrapWrap);
    } else if (actualValue == "wrap-reverse") {
        YGNodeStyleSetFlexWrap(yogaNode, YGWrapWrapReverse);
    }
}

void CSSStyleConverter::applyAlignContent(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (actualValue == "flex-start") {
        YGNodeStyleSetAlignContent(yogaNode, YGAlignFlexStart);
    } else if (actualValue == "center") {
        YGNodeStyleSetAlignContent(yogaNode, YGAlignCenter);
    } else if (actualValue == "flex-end") {
        YGNodeStyleSetAlignContent(yogaNode, YGAlignFlexEnd);
    } else if (actualValue == "stretch") {
        YGNodeStyleSetAlignContent(yogaNode, YGAlignStretch);
    } else if (actualValue == "space-between") {
        YGNodeStyleSetAlignContent(yogaNode, YGAlignSpaceBetween);
    } else if (actualValue == "space-around") {
        YGNodeStyleSetAlignContent(yogaNode, YGAlignSpaceAround);
    }
}

void CSSStyleConverter::applyFlexBasis(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetFlexBasis(yogaNode, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (actualValue == "auto") {
        YGNodeStyleSetFlexBasisAuto(yogaNode);
    } else if (!actualValue.empty() && actualValue.back() == '%') {
        float percent = std::stof(actualValue.substr(0, actualValue.size() - 1));
        YGNodeStyleSetFlexBasisPercent(yogaNode, percent);
    } else if (!actualValue.empty()) {
        std::string numericPart = actualValue;
        size_t unitPos = actualValue.find_first_not_of("0123456789.-");
        if (unitPos != std::string::npos) {
            numericPart = actualValue.substr(0, unitPos);
        }
        float flexBasis = std::stof(numericPart);
        YGNodeStyleSetFlexBasis(yogaNode, flexBasis);
    }
}

void CSSStyleConverter::applyBorder(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        float val = static_cast<float>(value.asDouble());
        YGNodeStyleSetBorder(yogaNode, YGEdgeAll, val);
        return;
    }
    
    std::string actualValue = value.asString();
    if (actualValue.empty()) {
        return;
    }
    
    std::vector<float> values;
    std::istringstream iss(actualValue);
    std::string token;
    while (iss >> token) {
        // Only process tokens that start with a digit or '.'; skip keywords like "solid" or "#fff"
        if (!token.empty() && (std::isdigit(static_cast<unsigned char>(token[0])) || token[0] == '.')) {
            try {
                values.push_back(std::stof(token));
            } catch (...) {
                // Ignore unparseable tokens
            }
        }
    }
    
    if (values.size() == 1) {
        YGNodeStyleSetBorder(yogaNode, YGEdgeAll, values[0]);
    } else if (values.size() == 2) {
        YGNodeStyleSetBorder(yogaNode, YGEdgeVertical, values[0]);
        YGNodeStyleSetBorder(yogaNode, YGEdgeHorizontal, values[1]);
    } else if (values.size() == 4) {
        YGNodeStyleSetBorder(yogaNode, YGEdgeTop, values[0]);
        YGNodeStyleSetBorder(yogaNode, YGEdgeRight, values[1]);
        YGNodeStyleSetBorder(yogaNode, YGEdgeBottom, values[2]);
        YGNodeStyleSetBorder(yogaNode, YGEdgeLeft, values[3]);
    }
}

void CSSStyleConverter::applyTop(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetPosition(yogaNode, YGEdgeTop, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    if (actualValue.empty()) {
        return;
    }
    
    if (actualValue.back() == '%') {
        float percent = std::stof(actualValue.substr(0, actualValue.size() - 1));
        YGNodeStyleSetPositionPercent(yogaNode, YGEdgeTop, percent);
    } else {
        std::string numericPart = actualValue;
        size_t unitPos = actualValue.find_first_not_of("0123456789.-");
        if (unitPos != std::string::npos) {
            numericPart = actualValue.substr(0, unitPos);
        }
        float top = std::stof(numericPart);
        YGNodeStyleSetPosition(yogaNode, YGEdgeTop, top);
    }
}

void CSSStyleConverter::applyRight(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetPosition(yogaNode, YGEdgeRight, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    if (actualValue.empty()) {
        return;
    }
    
    if (actualValue.back() == '%') {
        float percent = std::stof(actualValue.substr(0, actualValue.size() - 1));
        YGNodeStyleSetPositionPercent(yogaNode, YGEdgeRight, percent);
    } else {
        std::string numericPart = actualValue;
        size_t unitPos = actualValue.find_first_not_of("0123456789.-");
        if (unitPos != std::string::npos) {
            numericPart = actualValue.substr(0, unitPos);
        }
        float right = std::stof(numericPart);
        YGNodeStyleSetPosition(yogaNode, YGEdgeRight, right);
    }
}

void CSSStyleConverter::applyBottom(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetPosition(yogaNode, YGEdgeBottom, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    if (actualValue.empty()) {
        return;
    }
    
    if (actualValue.back() == '%') {
        float percent = std::stof(actualValue.substr(0, actualValue.size() - 1));
        YGNodeStyleSetPositionPercent(yogaNode, YGEdgeBottom, percent);
    } else {
        std::string numericPart = actualValue;
        size_t unitPos = actualValue.find_first_not_of("0123456789.-");
        if (unitPos != std::string::npos) {
            numericPart = actualValue.substr(0, unitPos);
        }
        float bottom = std::stof(numericPart);
        YGNodeStyleSetPosition(yogaNode, YGEdgeBottom, bottom);
    }
}

void CSSStyleConverter::applyLeft(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetPosition(yogaNode, YGEdgeLeft, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    if (actualValue.empty()) {
        return;
    }
    
    if (actualValue.back() == '%') {
        float percent = std::stof(actualValue.substr(0, actualValue.size() - 1));
        YGNodeStyleSetPositionPercent(yogaNode, YGEdgeLeft, percent);
    } else {
        std::string numericPart = actualValue;
        size_t unitPos = actualValue.find_first_not_of("0123456789.-");
        if (unitPos != std::string::npos) {
            numericPart = actualValue.substr(0, unitPos);
        }
        float left = std::stof(numericPart);
        YGNodeStyleSetPosition(yogaNode, YGEdgeLeft, left);
    }
}

void CSSStyleConverter::applyDisplay(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (actualValue == "flex") {
        YGNodeStyleSetDisplay(yogaNode, YGDisplayFlex);
    } else if (actualValue == "none") {
        YGNodeStyleSetDisplay(yogaNode, YGDisplayNone);
    }
}

void CSSStyleConverter::applyOverflow(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (actualValue == "visible") {
        YGNodeStyleSetOverflow(yogaNode, YGOverflowVisible);
    } else if (actualValue == "hidden") {
        YGNodeStyleSetOverflow(yogaNode, YGOverflowHidden);
    } else if (actualValue == "scroll") {
        YGNodeStyleSetOverflow(yogaNode, YGOverflowScroll);
    }
}

void CSSStyleConverter::applyDirection(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    std::string actualValue = value.asString();
    
    if (actualValue == "ltr") {
        YGNodeStyleSetDirection(yogaNode, YGDirectionLTR);
    } else if (actualValue == "rtl") {
        YGNodeStyleSetDirection(yogaNode, YGDirectionRTL);
    } else if (actualValue == "inherit") {
        YGNodeStyleSetDirection(yogaNode, YGDirectionInherit);
    }
}

void CSSStyleConverter::applyAspectRatio(YGNodeRef yogaNode, const SerializableData& value) {
    if (yogaNode == nullptr) {
        return;
    }
    
    if (value.isNumber()) {
        YGNodeStyleSetAspectRatio(yogaNode, static_cast<float>(value.asDouble()));
        return;
    }
    
    std::string actualValue = value.asString();
    if (!actualValue.empty()) {
        float aspectRatio = 0.0f;
        if (parseAspectRatioValue(actualValue, aspectRatio)) {
            YGNodeStyleSetAspectRatio(yogaNode, aspectRatio);
        }
    }
}

static float parseLengthValue(const std::string& val) {
    if (val.empty()) return 0.0f;
    std::string numericPart = val;
    size_t unitPos = val.find_first_not_of("0123456789.-");
    if (unitPos != std::string::npos) {
        numericPart = val.substr(0, unitPos);
    }
    return std::stof(numericPart);
}

void CSSStyleConverter::applyMarginLeft(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    if (value.isNumber()) {
        YGNodeStyleSetMargin(yogaNode, YGEdgeLeft, static_cast<float>(value.asDouble()));
        return;
    }
    std::string v = value.asString();
    if (v == "auto") { YGNodeStyleSetMarginAuto(yogaNode, YGEdgeLeft); }
    else if (!v.empty() && v.back() == '%') { YGNodeStyleSetMarginPercent(yogaNode, YGEdgeLeft, std::stof(v.substr(0, v.size()-1))); }
    else if (!v.empty()) { YGNodeStyleSetMargin(yogaNode, YGEdgeLeft, parseLengthValue(v)); }
}

void CSSStyleConverter::applyMarginRight(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    if (value.isNumber()) {
        YGNodeStyleSetMargin(yogaNode, YGEdgeRight, static_cast<float>(value.asDouble()));
        return;
    }
    std::string v = value.asString();
    if (v == "auto") { YGNodeStyleSetMarginAuto(yogaNode, YGEdgeRight); }
    else if (!v.empty() && v.back() == '%') { YGNodeStyleSetMarginPercent(yogaNode, YGEdgeRight, std::stof(v.substr(0, v.size()-1))); }
    else if (!v.empty()) { YGNodeStyleSetMargin(yogaNode, YGEdgeRight, parseLengthValue(v)); }
}

void CSSStyleConverter::applyMarginTop(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    if (value.isNumber()) {
        YGNodeStyleSetMargin(yogaNode, YGEdgeTop, static_cast<float>(value.asDouble()));
        return;
    }
    std::string v = value.asString();
    if (v == "auto") { YGNodeStyleSetMarginAuto(yogaNode, YGEdgeTop); }
    else if (!v.empty() && v.back() == '%') { YGNodeStyleSetMarginPercent(yogaNode, YGEdgeTop, std::stof(v.substr(0, v.size()-1))); }
    else if (!v.empty()) { YGNodeStyleSetMargin(yogaNode, YGEdgeTop, parseLengthValue(v)); }
}

void CSSStyleConverter::applyMarginBottom(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    if (value.isNumber()) {
        YGNodeStyleSetMargin(yogaNode, YGEdgeBottom, static_cast<float>(value.asDouble()));
        return;
    }
    std::string v = value.asString();
    if (v == "auto") { YGNodeStyleSetMarginAuto(yogaNode, YGEdgeBottom); }
    else if (!v.empty() && v.back() == '%') { YGNodeStyleSetMarginPercent(yogaNode, YGEdgeBottom, std::stof(v.substr(0, v.size()-1))); }
    else if (!v.empty()) { YGNodeStyleSetMargin(yogaNode, YGEdgeBottom, parseLengthValue(v)); }
}

void CSSStyleConverter::applyPaddingLeft(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    if (value.isNumber()) {
        YGNodeStyleSetPadding(yogaNode, YGEdgeLeft, static_cast<float>(value.asDouble()));
        return;
    }
    std::string v = value.asString();
    if (!v.empty() && v.back() == '%') { YGNodeStyleSetPaddingPercent(yogaNode, YGEdgeLeft, std::stof(v.substr(0, v.size()-1))); }
    else if (!v.empty()) { YGNodeStyleSetPadding(yogaNode, YGEdgeLeft, parseLengthValue(v)); }
}

void CSSStyleConverter::applyPaddingRight(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    if (value.isNumber()) {
        YGNodeStyleSetPadding(yogaNode, YGEdgeRight, static_cast<float>(value.asDouble()));
        return;
    }
    std::string v = value.asString();
    if (!v.empty() && v.back() == '%') { YGNodeStyleSetPaddingPercent(yogaNode, YGEdgeRight, std::stof(v.substr(0, v.size()-1))); }
    else if (!v.empty()) { YGNodeStyleSetPadding(yogaNode, YGEdgeRight, parseLengthValue(v)); }
}

void CSSStyleConverter::applyPaddingTop(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    if (value.isNumber()) {
        YGNodeStyleSetPadding(yogaNode, YGEdgeTop, static_cast<float>(value.asDouble()));
        return;
    }
    std::string v = value.asString();
    if (!v.empty() && v.back() == '%') { YGNodeStyleSetPaddingPercent(yogaNode, YGEdgeTop, std::stof(v.substr(0, v.size()-1))); }
    else if (!v.empty()) { YGNodeStyleSetPadding(yogaNode, YGEdgeTop, parseLengthValue(v)); }
}

void CSSStyleConverter::applyPaddingBottom(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    if (value.isNumber()) {
        YGNodeStyleSetPadding(yogaNode, YGEdgeBottom, static_cast<float>(value.asDouble()));
        return;
    }
    std::string v = value.asString();
    if (!v.empty() && v.back() == '%') { YGNodeStyleSetPaddingPercent(yogaNode, YGEdgeBottom, std::stof(v.substr(0, v.size()-1))); }
    else if (!v.empty()) { YGNodeStyleSetPadding(yogaNode, YGEdgeBottom, parseLengthValue(v)); }
}

void CSSStyleConverter::applyBorderWidth(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    if (value.isNumber()) {
        YGNodeStyleSetBorder(yogaNode, YGEdgeAll, static_cast<float>(value.asDouble()));
        return;
    }
    std::string v = value.asString();
    if (!v.empty()) {
        YGNodeStyleSetBorder(yogaNode, YGEdgeAll, parseLengthValue(v));
    }
}

void CSSStyleConverter::applyCellPadding(YGNodeRef yogaNode, ComponentSnapshot& snapshot) {
    {
        auto it = snapshot.styles.find(CSSPropertyNames::kCellPadding);
        if (it != snapshot.styles.end()) applyPadding(yogaNode, it->second);
    }
}

// Inset
void CSSStyleConverter::applyInsetInlineStart(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    YGDirection direction = YGNodeStyleGetDirection(yogaNode);
    if (direction == YGDirectionRTL) {
        applyRight(yogaNode, value);
    } else {
        applyLeft(yogaNode, value);
    }
}

void CSSStyleConverter::applyInsetInlineEnd(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    YGDirection direction = YGNodeStyleGetDirection(yogaNode);
    if (direction == YGDirectionRTL) {
        applyLeft(yogaNode, value);
    } else {
        applyRight(yogaNode, value);
    }
}

void CSSStyleConverter::applyInsetBlockStart(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    applyTop(yogaNode, value);
}

void CSSStyleConverter::applyInsetBlockEnd(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    applyBottom(yogaNode, value);
}

// Margin
void CSSStyleConverter::applyMarginInlineStart(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    YGDirection direction = YGNodeStyleGetDirection(yogaNode);
    if (direction == YGDirectionRTL) {
        applyMarginRight(yogaNode, value);
    } else {
        applyMarginLeft(yogaNode, value);
    }
}

void CSSStyleConverter::applyMarginInlineEnd(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    YGDirection direction = YGNodeStyleGetDirection(yogaNode);
    if (direction == YGDirectionRTL) {
        applyMarginLeft(yogaNode, value);
    } else {
        applyMarginRight(yogaNode, value);
    }
}

void CSSStyleConverter::applyMarginBlockStart(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    applyMarginTop(yogaNode, value);
}

void CSSStyleConverter::applyMarginBlockEnd(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    applyMarginBottom(yogaNode, value);
}

// Padding
void CSSStyleConverter::applyPaddingInlineStart(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    YGDirection direction = YGNodeStyleGetDirection(yogaNode);
    if (direction == YGDirectionRTL) {
        applyPaddingRight(yogaNode, value);
    } else {
        applyPaddingLeft(yogaNode, value);
    }
}

void CSSStyleConverter::applyPaddingInlineEnd(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    YGDirection direction = YGNodeStyleGetDirection(yogaNode);
    if (direction == YGDirectionRTL) {
        applyPaddingLeft(yogaNode, value);
    } else {
        applyPaddingRight(yogaNode, value);
    }
}

void CSSStyleConverter::applyPaddingBlockStart(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    applyPaddingTop(yogaNode, value);
}

void CSSStyleConverter::applyPaddingBlockEnd(YGNodeRef yogaNode, const SerializableData& value) {
    if (!yogaNode) return;
    applyPaddingBottom(yogaNode, value);
}

const nlohmann::json& CSSStyleConverter::getDeviceComponentStylesJson() {
    static std::string cachedRaw;
    static nlohmann::json cachedJson = nlohmann::json::object();

    IPlatformLayoutBridge* platformLayoutBridge = AGenUIVirtualDefine::getPlatformLayoutBridge();
    if (platformLayoutBridge == nullptr) {
        return cachedJson;
    }

    const char* rawStyles = platformLayoutBridge->getComponentStyles();
    if (rawStyles == nullptr) {
        return cachedJson;
    }

    const std::string rawString(rawStyles);
    if (rawString == cachedRaw) {
        return cachedJson;
    }

    cachedRaw = rawString;
    try {
        cachedJson = nlohmann::json::parse(rawString);
    } catch (...) {
        cachedJson = nlohmann::json::object();
    }
    return cachedJson;
}

float CSSStyleConverter::parseStyleDimension(const nlohmann::json& styleConfig, const char* key, float fallbackValue) {
    if (!styleConfig.is_object() || !styleConfig.contains(key)) {
        return fallbackValue;
    }

    const nlohmann::json& value = styleConfig[key];
    try {
        if (value.is_number()) {
            return value.get<float>();
        }
        if (value.is_string()) {
            return std::stof(value.get<std::string>());
        }
    } catch (...) {
    }
    return fallbackValue;
}

#endif

}  // namespace agenui

#include "text_component.h"
#include "log/a2ui_capi_log.h"
#include <cstdlib>
#include <cstring>
#include "../../measure/a2ui_platform_layout_bridge.h"
#include "a2ui/utils/a2ui_unit_utils.h"
#include "a2ui/utils/a2ui_color_palette.h"
#include "a2ui/utils/a2ui_font_weight_utils.h"


namespace a2ui {

TextComponent::TextComponent(const std::string& id, const nlohmann::json& properties) : A2UIComponent(id, "Text") {
    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_TEXT);
    
    // Merge initial properties.
    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    HM_LOGI( "TextComponent - Created: id=%s, handle=%s", id.c_str(), m_nodeHandle ? "valid" : "null");
}

TextComponent::~TextComponent() {
    HM_LOGI( "TextComponent - Destroyed: id=%s", m_id.c_str());
}

void TextComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        HM_LOGE( "handle or nodeApi is null, id=%s",m_id.c_str());
        return;
    }

    applyTextContent(properties);
    applyStyles(properties);

    HM_LOGI( "Applied properties, id=%s", m_id.c_str());
}

// ---- Text Content ----

void TextComponent::applyTextContent(const nlohmann::json& properties) {
    if (properties.find("text") == properties.end()) {
        return;
    }

    std::string textContent;
    const auto& textValue = properties["text"];

    // Format 1: {"text": {"literalString": "Hello"}}
    if (textValue.is_object()) {
        if (textValue.find("literalString") != textValue.end() && textValue["literalString"].is_string()) {
            textContent = textValue["literalString"].get<std::string>();
        }
    }
    // Format 2: {"text": "Hello"}
    else if (textValue.is_string()) {
        textContent = textValue.get<std::string>();
    }

    if (!textContent.empty()) {
        A2UITextNode node(m_nodeHandle);
        node.setTextContent(textContent);
    }
}

void TextComponent::applyVariant(const nlohmann::json& properties) {
    if (properties.find("variant") == properties.end() || !properties["variant"].is_string()) {
        return;
    }

    std::string variant = properties["variant"].get<std::string>();

    float fontSize = 14.0f;  // Default body style.
    ArkUI_FontWeight fontWeight = ARKUI_FONT_WEIGHT_NORMAL;

    if (variant == "h1") {
        fontSize = 96.0f;
        fontWeight = ARKUI_FONT_WEIGHT_BOLD;
    } else if (variant == "h2") {
        fontSize = 24.0f;
        fontWeight = ARKUI_FONT_WEIGHT_BOLD;
    } else if (variant == "h3") {
        fontSize = 20.0f;
        fontWeight = ARKUI_FONT_WEIGHT_BOLD;
    } else if (variant == "h4") {
        fontSize = 18.0f;
        fontWeight = ARKUI_FONT_WEIGHT_BOLD;
    } else if (variant == "h5") {
        fontSize = 16.0f;
        fontWeight = ARKUI_FONT_WEIGHT_BOLD;
    } else if (variant == "caption") {
        fontSize = 12.0f;
        fontWeight = ARKUI_FONT_WEIGHT_NORMAL;
    }
    // Default to the body style.

    A2UITextNode node(m_nodeHandle);
    node.setFontSize(fontSize);
    node.setFontWeight(fontWeight);
}

// ---- Custom Styles ----

void TextComponent::applyStyles(const nlohmann::json& properties) {
    if (properties.find("styles") == properties.end() || !properties["styles"].is_object()) {
        return;
    }

    const auto& styles = properties["styles"];
    A2UITextNode node(m_nodeHandle);

    // Support both kebab-case and camelCase background color keys.
    {
        std::string bgColorStr;
        if (styles.find("background-color") != styles.end() && styles["background-color"].is_string()) {
            bgColorStr = styles["background-color"].get<std::string>();
        } else if (styles.find("backgroundColor") != styles.end() && styles["backgroundColor"].is_string()) {
            bgColorStr = styles["backgroundColor"].get<std::string>();
        }
        if (!bgColorStr.empty()) {
            node.setBackgroundColor(parseColor(bgColorStr));
        }
    }

    // color -> NODE_FONT_COLOR
    if (styles.find("color") != styles.end() && styles["color"].is_string()) {
        uint32_t color = parseColor(styles["color"].get<std::string>());
        node.setFontColor(color);
    }
    float size = 14.0f;
    // font-size overrides the variant-derived font size.
    if (styles.find("font-size") != styles.end()) {
        const auto& fontSizeVal = styles["font-size"];
        if (fontSizeVal.is_number()) {
            size = fontSizeVal.get<float>();
        } else if (fontSizeVal.is_string()) {
            size = static_cast<float>(std::atof(fontSizeVal.get<std::string>().c_str()));
        }
        node.setFontSize(size);
    }

    // font-weight -> NODE_FONT_WEIGHT
    if (styles.find("font-weight") != styles.end()) {
        ArkUI_FontWeight weight = (ArkUI_FontWeight)mapFontWeight(styles["font-weight"]);
        node.setFontWeight(weight);
    }

    // Support both kebab-case and camelCase font family keys.
    {
        std::string fontFamily;
        if (styles.find("font-family") != styles.end() && styles["font-family"].is_string()) {
            fontFamily = styles["font-family"].get<std::string>();
        } else if (styles.find("fontFamily") != styles.end() && styles["fontFamily"].is_string()) {
            fontFamily = styles["fontFamily"].get<std::string>();
        }
        if (!fontFamily.empty()) {
            node.setFontFamily(fontFamily);
        }
    }

    // Support both kebab-case and camelCase text alignment keys.
    {
        std::string alignStr;
        if (styles.find("text-align") != styles.end() && styles["text-align"].is_string()) {
            alignStr = styles["text-align"].get<std::string>();
        } else if (styles.find("textAlign") != styles.end() && styles["textAlign"].is_string()) {
            alignStr = styles["textAlign"].get<std::string>();
        }
        
        // Tabs always force START alignment.
        if (m_parent && m_parent->getComponentType() == "Tabs") {
            node.setTextAlign(ARKUI_TEXT_ALIGNMENT_START);
            HM_LOGI("Parent is Tabs, forcing text-align to START, id=%s", m_id.c_str());
        } else if (!alignStr.empty()) {
            ArkUI_TextAlignment align = (ArkUI_TextAlignment)mapTextAlign(alignStr);
            node.setTextAlign(align);
        }
    }

    // line-clamp -> NODE_TEXT_MAX_LINES
    if (styles.find("line-clamp") != styles.end()) {
        int32_t maxLines = 0;
        const auto& lineClampVal = styles["line-clamp"];
        if (lineClampVal.is_number_integer()) {
            maxLines = lineClampVal.get<int32_t>();
        } else if (lineClampVal.is_string()) {
            maxLines = std::atoi(lineClampVal.get<std::string>().c_str());
        }
        node.setTextMaxLines(maxLines);
    }

    // line-height -> NODE_TEXT_LINE_HEIGHT
    if (styles.find("line-height") != styles.end()) {
        float lineHeight = 0.0f;
        const auto& lineHeightVal = styles["line-height"];
        if (lineHeightVal.is_number()) {
            lineHeight = lineHeightVal.get<float>();
        } else if (lineHeightVal.is_string()) {
            lineHeight = static_cast<float>(std::atof(lineHeightVal.get<std::string>().c_str()));
        }
        if (lineHeight > 0.0f) {
            int lines = 1;
            if (styles.find("lines") != styles.end()) {
                const auto& linesVal = styles["lines"];
                if (linesVal.is_number_integer()) {
                    lines = linesVal.get<int>();
                } else if (linesVal.is_string()) {
                    lines = std::atoi(linesVal.get<std::string>().c_str());
                }
            }
            // Small values act as multipliers; larger values are treated as absolute sizes.
            if (lineHeight < 5.0) {
                // Multiplier values are already normalized.
                lineHeight = lineHeight;
            } else {
                // Convert absolute sizes to a multiplier.
                lineHeight = lineHeight / size;
            }
            float newLineHeight = lineHeight * UnitConverter::a2uiToVp(size);
            const ArkUI_AttributeItem* heightItem = g_nodeAPI->getAttribute(m_nodeHandle, NODE_HEIGHT);
            float currentHeight = (heightItem && heightItem->size > 0) ? heightItem->value[0].f32 : 0.0f;
            if (newLineHeight > currentHeight) {
                node.setLineHeight(currentHeight);
            }else {
                node.setLineHeight(newLineHeight);
            }
        }
    }

    // text-overflow -> NODE_TEXT_OVERFLOW
    if (styles.find("text-overflow") != styles.end() && styles["text-overflow"].is_string()) {
        std::string overflow = styles["text-overflow"].get<std::string>();
        if (overflow == "ellipsis") {
            node.setTextOverflowEllipsis();
        } else {
            node.setTextOverflowClip();
        }
    }

    // border-radius -> NODE_BORDER_RADIUS
    {
        std::string radiusKey;
        if (styles.find("border-radius") != styles.end()) {
            radiusKey = "border-radius";
        } else if (styles.find("borderRadius") != styles.end()) {
            radiusKey = "borderRadius";
        }
        if (!radiusKey.empty()) {
            float radius = 0.0f;
            const auto& radiusVal = styles[radiusKey];
            if (radiusVal.is_number()) {
                radius = radiusVal.get<float>();
            } else if (radiusVal.is_string()) {
                radius = static_cast<float>(std::atof(radiusVal.get<std::string>().c_str()));
            }
            if (radius > 0.0f) {
                node.setBorderRadius(radius);
            } else {
                node.resetBorderRadius();
            }
        }
    }

    // text-decoration-line, text-decoration-style, text-decoration-color -> NODE_TEXT_DECORATION
    if (styles.find("text-decoration-line") != styles.end() && styles["text-decoration-line"].is_string()) {
        std::string decorationLine = styles["text-decoration-line"].get<std::string>();
        
        // Default to black.
        uint32_t decorationColor = colors::kColorBlack;
        if (styles.find("text-decoration-color") != styles.end() && styles["text-decoration-color"].is_string()) {
            decorationColor = parseColor(styles["text-decoration-color"].get<std::string>());
        }

        // Resolve the decoration type.
        ArkUI_TextDecorationType decorationType = ARKUI_TEXT_DECORATION_TYPE_NONE;
        if (decorationLine == "underline") {
            decorationType = ARKUI_TEXT_DECORATION_TYPE_UNDERLINE;
        } else if (decorationLine == "overline") {
            decorationType = ARKUI_TEXT_DECORATION_TYPE_OVERLINE;
        } else if (decorationLine == "line-through") {
            decorationType = ARKUI_TEXT_DECORATION_TYPE_LINE_THROUGH;
        }

        // Apply text decoration.
        if (decorationType != ARKUI_TEXT_DECORATION_TYPE_NONE) {
            node.setTextDecoration(decorationType, decorationColor);
        }
    }
}

int32_t TextComponent::mapFontWeight(const nlohmann::json& weight) {
    if (weight.is_string()) {
        const std::string weightStr = weight.get<std::string>();
        if (weightStr == "bold") {
            return ARKUI_FONT_WEIGHT_BOLD;
        } else if (weightStr == "normal") {
            return ARKUI_FONT_WEIGHT_NORMAL;
        } else if (weightStr == "medium") {
            return ARKUI_FONT_WEIGHT_MEDIUM;
        }
        // Try to parse numeric font-weight values (e.g. "100" .. "900").
        const int numWeight = std::atoi(weightStr.c_str());
        if (numWeight > 0) {
            return font_weight::mapNumericToArkUIFontWeight(numWeight, /*useNormalBoldAlias=*/true);
        }
    } else if (weight.is_number_integer()) {
        return font_weight::mapNumericToArkUIFontWeight(weight.get<int>(), /*useNormalBoldAlias=*/true);
    }
    return ARKUI_FONT_WEIGHT_NORMAL;
}

int32_t TextComponent::mapTextAlign(const std::string& align) {
    if (align == "center") {
        return ARKUI_TEXT_ALIGNMENT_CENTER;
    } else if (align == "end" || align == "right") {
        return ARKUI_TEXT_ALIGNMENT_END;
    }
    // Default to START.
    return ARKUI_TEXT_ALIGNMENT_START;
}

} // namespace a2ui

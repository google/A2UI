#include "textfield_component.h"
#include "../a2ui_node.h"
#include "a2ui/utils/a2ui_color_palette.h"

#include "log/a2ui_capi_log.h"

#include <cmath>
#include <cstdlib>

namespace a2ui {

// Constant definitions
namespace {
constexpr float kDefaultFontSize = 32.0f;                           // Default font size.
constexpr float kDefaultHeight = 100.0f;                            // Default height.
constexpr uint32_t kDefaultColor = a2ui::colors::kColorBlack;       // Default text color.

/**
 * @brief Extract a string from a JSON value.
 * @param value JSON value, either a plain string or a DynamicString object.
 * @return The extracted string, or an empty string on failure.
 */
static std::string extractStringValue(const nlohmann::json& value) {
    if (value.is_string()) {
        return value.get<std::string>();
    }

    // DynamicString format: {"literalString": "..."}
    if (value.is_object() && value.contains("literalString") && value["literalString"].is_string()) {
        return value["literalString"].get<std::string>();
    }

    return "";
}

/**
 * @brief Parse a CSS-like size string.
 * @param sizeStr Size string such as "10px" or "10".
 * @return Parsed numeric value.
 */
static float parseSizeValue(const std::string& sizeStr) {
    if (sizeStr.empty()) {
        return 0.0f;
    }

    // Strip the "px" suffix
    size_t pxPos = sizeStr.rfind("px");
    std::string num = (pxPos != std::string::npos) ? sizeStr.substr(0, pxPos) : sizeStr;
    return static_cast<float>(std::atof(num.c_str()));
}

/**
 * @brief Map an input variant string to an ArkUI input type.
 * @param variant Input variant string.
 * @return ArkUI input type.
 */
static int32_t mapInputType(const std::string& variant) {
    if (variant == "number") {
        return ARKUI_TEXTINPUT_TYPE_NUMBER;
    }
    
    if (variant == "obscured") {
        return ARKUI_TEXTINPUT_TYPE_PASSWORD;
    }
    
    return ARKUI_TEXTINPUT_TYPE_NORMAL;
}

} // anonymous namespace

/**
 * @brief Constructor
 * @param id Unique component identifier.
 * @param properties Initial properties JSON object.
 */
TextFieldComponent::TextFieldComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, ComponentType::kTextField) {
    // Create the TEXT_INPUT node.
    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_TEXT_INPUT);

    // Apply the default font size.
    getTextFiledNode().setFontSize(kDefaultFontSize);

    // Merge initial properties.
    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }
}

/**
 * @brief Destructor
 */
TextFieldComponent::~TextFieldComponent() {
    HM_LOGI("TextFieldComponent - Destroyed: id=%s", m_id.c_str());
}

/**
 * @brief Update component properties.
 * @param properties Property JSON object.
 */
void TextFieldComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        HM_LOGE("handle is null, id=%s", m_id.c_str());
        return;
    }

    applyPlaceholder(properties);
    applyValue(properties);
    applyVariant(properties);
    applyStyles(properties);
    
    // Enforce the minimum height.
    if (getHeight() <= m_borderWidth * 2) {
        setHeight(kDefaultHeight);
    }
}

/**
 * @brief Apply the placeholder text.
 * @param properties Property JSON object.
 */
void TextFieldComponent::applyPlaceholder(const nlohmann::json& properties) {
    // Fall back to label when placeholder is absent.
    std::string placeholder;
    if (properties.contains("placeholder")) {
        placeholder = extractStringValue(properties["placeholder"]);
    } else if (properties.contains("label")) {
        placeholder = extractStringValue(properties["label"]);
    }

    if (placeholder.empty()) {
        return;
    }

    A2UITextInputNode(m_nodeHandle).setPlaceholder(placeholder);
}

/**
 * @brief Apply the input value.
 * @param properties Property JSON object.
 */
void TextFieldComponent::applyValue(const nlohmann::json& properties) {
    if (!properties.contains("value")) {
        return;
    }

    std::string text = extractStringValue(properties["value"]);

    // Set text content
    A2UITextInputNode(m_nodeHandle).setTextContent(text);

    HM_LOGI("Set text value, length=%zu", text.length());
}

/**
 * @brief Apply the input variant.
 * @param properties Property JSON object.
 */
void TextFieldComponent::applyVariant(const nlohmann::json& properties) {
    if (!properties.contains("variant") || !properties["variant"].is_string()) {
        return;
    }

    int32_t inputType = mapInputType(properties["variant"].get<std::string>());
    A2UITextInputNode(m_nodeHandle).setInputType(static_cast<ArkUI_TextInputType>(inputType));
}

/**
 * @brief Apply style properties.
 * @param properties Property JSON object.
 */
void TextFieldComponent::applyStyles(const nlohmann::json& properties) {
    if (!properties.contains("styles") || !properties["styles"].is_object()) {
        HM_LOGI("id=%s, no styles field", m_id.c_str());
        return;
    }

    const auto& styles = properties["styles"];
    applyBorderRadius(styles);
    applyBackgroundColor(styles);
    applyBorderWidth(styles);
    applyBorderColor(styles);
}

/**
 * @brief Apply the border radius.
 * @param styles Style JSON object.
 */
void TextFieldComponent::applyBorderRadius(const nlohmann::json& styles) {
    if (!styles.contains("border-radius")) {
        return;
    }

    const auto& r = styles["border-radius"];
    float radius = 0.0f;
    
    if (r.is_number()) {
        radius = r.get<float>();
    } else if (r.is_string()) {
        radius = parseSizeValue(r.get<std::string>());
    }
    
    if (radius > 0.0f) {
        getTextFiledNode().setBorderRadius(radius);
        HM_LOGI("id=%s, radius=%f", m_id.c_str(), radius);
    }
    m_borderRadius = radius;
}

/**
 * @brief Apply the background color.
 * @param styles Style JSON object.
 */
void TextFieldComponent::applyBackgroundColor(const nlohmann::json& styles) {
    if (!styles.contains("background-color") || !styles["background-color"].is_string()) {
        return;
    }

    uint32_t color = A2UIComponent::parseColor(styles["background-color"].get<std::string>());
    getTextFiledNode().setBackgroundColor(color);
    HM_LOGI("id=%s, color=0x%X", m_id.c_str(), color);
}

/**
 * @brief Apply the border width.
 * @param styles Style JSON object.
 */
void TextFieldComponent::applyBorderWidth(const nlohmann::json& styles) {
    if (!styles.contains("border-width")) {
        return;
    }

    const auto& bw = styles["border-width"];
    float width = 0.0f;
    
    if (bw.is_number()) {
        width = bw.get<float>();
    } else if (bw.is_string()) {
        width = parseSizeValue(bw.get<std::string>());
    }
    
    if (width > 0.0f) {
        getTextFiledNode().setBorderWidth(width, width, width, width);
        getTextFiledNode().setBorderStyle(ARKUI_BORDER_STYLE_SOLID);
    }
    
    m_borderWidth = width;
}

/**
 * @brief Apply the border color.
 * @param styles Style JSON object.
 */
void TextFieldComponent::applyBorderColor(const nlohmann::json& styles) {
    if (!styles.contains("border-color") || !styles["border-color"].is_string()) {
        return;
    }

    uint32_t color = A2UIComponent::parseColor(styles["border-color"].get<std::string>());
    getTextFiledNode().setBorderColor(color);
}

} // namespace a2ui

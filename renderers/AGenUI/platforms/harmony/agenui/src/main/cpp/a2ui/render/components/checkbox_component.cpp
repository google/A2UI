#include "checkbox_component.h"
#include "../a2ui_node.h"
#include "../../utils/a2ui_color_palette.h"
#include "log/a2ui_capi_log.h"
#include "../../measure/a2ui_platform_layout_bridge.h"
#include <cstdlib>

namespace a2ui {

struct CheckBoxComponent::CheckBoxStyle {
    float checkboxSize   = 32.0f;
    float borderWidth    = 3.0f;
    float borderRadius   = 12.0f;
    float textMargin     = 16.0f;
    float textSize       = 32.0f;
    uint32_t selectedBgColor       = 0xFF2E82FF;
    uint32_t selectedBorderColor   = 0xFF2E82FF;
    uint32_t uncheckedBgColor      = colors::kColorTransparent;
    uint32_t unselectedBorderColor = 0x1A000000;
    uint32_t disabledBgColor       = 0xFFEBEBEB;
    uint32_t disabledBorderColor   = 0x1A000000;
    uint32_t textColor             = colors::kColorBlack;
    uint32_t textDisabledColor     = 0x66000000;
};

CheckBoxComponent::CheckBoxComponent(const std::string& id, const nlohmann::json& properties): A2UIComponent(id, "CheckBox") {

    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_ROW);
    
    m_checkboxHandle = g_nodeAPI->createNode(ARKUI_NODE_CHECKBOX);
    g_nodeAPI->addChild(m_nodeHandle, m_checkboxHandle);
    
    m_labelHandle = g_nodeAPI->createNode(ARKUI_NODE_TEXT);
    g_nodeAPI->addChild(m_nodeHandle, m_labelHandle);
    
    // Merge initial properties.
    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }
    
    setupDefaultStyles();
}

CheckBoxComponent::~CheckBoxComponent() {
    // Dispose child nodes explicitly.
    if (m_checkboxHandle) {
        g_nodeAPI->disposeNode(m_checkboxHandle);
        m_checkboxHandle = nullptr;
    }
    if (m_labelHandle) {
        g_nodeAPI->disposeNode(m_labelHandle);
        m_labelHandle = nullptr;
    }

    HM_LOGI( "CheckBoxComponent - Destroyed: id=%s", m_id.c_str());
}

void a2ui::CheckBoxComponent::setupDefaultStyles() {
    const bool checked = m_properties.contains("value") && extractBooleanValue(m_properties["value"]);
    const bool disabled = extractDisabledValue(m_properties);
    applyCheckBoxStyles(resolveStyle(m_properties), checked, disabled);
    applyLabel(m_properties);
    applyValue(m_properties);
}

CheckBoxComponent::CheckBoxStyle CheckBoxComponent::resolveStyle(const nlohmann::json& properties) {
    CheckBoxStyle style;

    auto applyStyleBlock = [this, &style](const nlohmann::json& styles) {
        if (!styles.is_object()) {
            return;
        }

        auto parseFloatStyle = [&styles](const char* key, float& outValue) {
            if (!styles.contains(key)) {
                return;
            }
            const auto& rawValue = styles[key];
            if (rawValue.is_number()) {
                outValue = rawValue.get<float>();
                return;
            }
            if (!rawValue.is_string()) {
                return;
            }
            std::string val = rawValue.get<std::string>();
            if (!val.empty()) {
                outValue = static_cast<float>(std::atof(val.c_str()));
            }
        };

        auto parseColorStyle = [this, &styles](const char* key, uint32_t& outValue) {
            if (!styles.contains(key) || !styles[key].is_string()) {
                return;
            }
            outValue = parseColor(styles[key].get<std::string>());
        };

        parseFloatStyle("checkbox-size", style.checkboxSize);
        parseFloatStyle("checkbox-border-width", style.borderWidth);
        parseFloatStyle("checkbox-border-radius", style.borderRadius);
        parseFloatStyle("text-margin", style.textMargin);
        parseFloatStyle("text-size", style.textSize);

        parseColorStyle("checkbox-background-color-selected", style.selectedBgColor);
        parseColorStyle("checkbox-border-color-selected", style.selectedBorderColor);
        parseColorStyle("checkbox-background-color", style.uncheckedBgColor);
        parseColorStyle("checkbox-border-color", style.unselectedBorderColor);
        parseColorStyle("checkbox-background-color-disabled", style.disabledBgColor);
        parseColorStyle("checkbox-border-color-disabled", style.disabledBorderColor);
        parseColorStyle("text-color", style.textColor);
        parseColorStyle("text-color-disabled", style.textDisabledColor);
    };

    applyStyleBlock(getComponentStylesFor("CheckBox"));
    if (properties.contains("styles")) {
        applyStyleBlock(properties["styles"]);
    }

    return style;
}

bool CheckBoxComponent::extractDisabledValue(const nlohmann::json& properties) {
    if (!properties.contains("checks") || !properties["checks"].is_object()) {
        return false;
    }

    const auto& checks = properties["checks"];
    if (!checks.contains("result")) {
        return false;
    }

    const auto& result = checks["result"];
    if (result.is_boolean()) {
        return !result.get<bool>();
    }
    if (result.is_string()) {
        return result.get<std::string>() != "true";
    }
    return false;
}

void CheckBoxComponent::applyCheckBoxStyles(const CheckBoxStyle& style, bool checked, bool disabled) {
    (void)checked;

    // Configure the container layout.
    A2UIRowNode(m_nodeHandle).setAlignItems(ARKUI_VERTICAL_ALIGNMENT_CENTER);
//    A2UINode(m_nodeHandle).setPadding(16);

    // Apply base checkbox styling.
    A2UINode checkboxNode(m_checkboxHandle);
    A2UICheckboxNode checkbox(m_checkboxHandle);
    checkboxNode.setWidth(style.checkboxSize);
    checkboxNode.setHeight(style.checkboxSize);

    // Clear the generic border so ArkUI's native checkbox chrome stays clean.
    checkboxNode.resetBorderWidth();
    checkboxNode.resetBorderColor();
    checkboxNode.resetBorderRadius();

    // Use the rounded-square checkbox shape.
    checkbox.setShape(ArkUI_CHECKBOX_SHAPE_ROUNDED_SQUARE);

    // Apply checkbox spacing and colors.
    checkboxNode.setMargin(8, 8, 8, 8);
    checkbox.setSelectedColor(disabled ? style.disabledBgColor : style.selectedBgColor);
    checkbox.setUnselectedColor(disabled ? style.disabledBorderColor : style.unselectedBorderColor);

    // Apply label styling.
    A2UITextNode(m_labelHandle).setMargin(0.0f, 0.0f, 0.0f, style.textMargin);
    A2UITextNode(m_labelHandle).setFontSize(style.textSize);
    A2UITextNode(m_labelHandle).setFontColor(disabled ? style.textDisabledColor : style.textColor);
    // Let the label consume the remaining row width.
    A2UINode(m_labelHandle).setLayoutWeight(1);
}

void CheckBoxComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle || !m_checkboxHandle || !m_labelHandle) {
        HM_LOGE( "handle is null, id=%s", m_id.c_str());
        return;
    }

    const bool checked = properties.contains("value") && extractBooleanValue(properties["value"]);
    const bool disabled = extractDisabledValue(properties);
    applyCheckBoxStyles(resolveStyle(properties), checked, disabled);
    applyLabel(properties);
    applyValue(properties);

    if (getHeight() > 0) {
        A2UINode(m_labelHandle).setHeight(getHeight());
    }
    HM_LOGI( "Applied properties, id=%s", m_id.c_str());
}

// ---- Label ----

void CheckBoxComponent::applyLabel(const nlohmann::json& properties) {
    if (!properties.contains("label")) {
        return;
    }

    std::string label = extractStringValue(properties["label"]);
    if (label.empty()) {
        return;
    }

    // Update the label text.
    A2UITextNode(m_labelHandle).setTextContent(label);

    HM_LOGI( "Set label: %s", label.c_str());
}

// ---- Value ----

void CheckBoxComponent::applyValue(const nlohmann::json& properties) {
    if (!properties.contains("value")) {
        return;
    }

    bool checked = extractBooleanValue(properties["value"]);

    // Update the checked state.
    A2UICheckboxNode(m_checkboxHandle).setChecked(checked);

    HM_LOGI( "Set checked: %s", checked ? "true" : "false");
}

// ---- String Extraction ----

std::string CheckBoxComponent::extractStringValue(const nlohmann::json& value) {
    if (value.is_string()) {
        return value.get<std::string>();
    }

    // DynamicString format: {"literalString": "..."}
    if (value.is_object() && value.contains("literalString") && value["literalString"].is_string()) {
        return value["literalString"].get<std::string>();
    }

    return "";
}

// ---- Boolean Extraction ----

bool CheckBoxComponent::extractBooleanValue(const nlohmann::json& value) {
    // Raw boolean.
    if (value.is_boolean()) {
        return value.get<bool>();
    }

    // String boolean.
    if (value.is_string()) {
        return value.get<std::string>() == "true";
    }

    // DynamicBoolean format: {"literalBoolean": true}
    if (value.is_object() && value.contains("literalBoolean")) {
        const auto& literalBoolean = value["literalBoolean"];
        if (literalBoolean.is_boolean()) {
            return literalBoolean.get<bool>();
        }
        if (literalBoolean.is_string()) {
            return literalBoolean.get<std::string>() == "true";
        }
    }

    return false;
}

} // namespace a2ui

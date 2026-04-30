#pragma once

#include "../a2ui_component.h"

namespace a2ui {

/**
 * Checkbox component with label text.
 *
 * Layout structure:
 *   ARKUI_NODE_ROW (root node)
 *     ├── ARKUI_NODE_CHECKBOX (checkbox)
 *     └── ARKUI_NODE_TEXT (label)
 *
 * Supported properties:
 *   - label: text shown to the right of the checkbox
 *   - value: checked state, including DynamicBoolean input
 */
class CheckBoxComponent : public A2UIComponent {
public:
    CheckBoxComponent(const std::string& id, const nlohmann::json& properties);
    ~CheckBoxComponent() override;

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    struct CheckBoxStyle;

    /**
     * @brief Apply default styles
     */
    void setupDefaultStyles();

    /**
     * @brief Apply resolved checkbox styles to the UI nodes.
     * @param style Resolved checkbox style
     * @param checked Current checked state
     * @param disabled Current disabled state
     */
    void applyCheckBoxStyles(const CheckBoxStyle& style, bool checked, bool disabled);

    /** Resolve the final style from defaults plus component overrides. */
    CheckBoxStyle resolveStyle(const nlohmann::json& properties);

    /** Extract the disabled state derived from checks.result. */
    static bool extractDisabledValue(const nlohmann::json& properties);
    
    /** Apply the label text. */
    void applyLabel(const nlohmann::json& properties);

    /** Apply the checked state. */
    void applyValue(const nlohmann::json& properties);

    /** Extract a string value, including DynamicString input. */
    static std::string extractStringValue(const nlohmann::json& value);

    /** Extract a boolean value, including DynamicBoolean input. */
    static bool extractBooleanValue(const nlohmann::json& value);

    ArkUI_NodeHandle m_checkboxHandle = nullptr;  // Checkbox node
    ArkUI_NodeHandle m_labelHandle = nullptr;     // Label text node
};

} // namespace a2ui

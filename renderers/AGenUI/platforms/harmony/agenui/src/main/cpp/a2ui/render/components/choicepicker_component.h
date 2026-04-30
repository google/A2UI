#pragma once

#include "../a2ui_component.h"
#include <vector>

namespace a2ui {

/** Native handles and value for a single option item. */
struct OptionItem {
    ArkUI_NodeHandle rowHandle = nullptr;      // Option row container
    ArkUI_NodeHandle checkboxHandle = nullptr; // CheckBox handle
    ArkUI_NodeHandle labelHandle = nullptr;    // Label text handle
    std::string value;                         // Option value
};

/**
 * Choice picker component with single- and multi-select modes.
 *
 * Layout structure (composite layout):
 *   ARKUI_NODE_COLUMN or ARKUI_NODE_ROW (root node, decided by orientation)
 *     ├── ARKUI_NODE_ROW (first option row)
 *     │     ├── ARKUI_NODE_CHECKBOX (first checkbox)
 *     │     └── ARKUI_NODE_TEXT (first label)
 *     ├── ...
 *
 * Supported properties:
 *   - variant: "mutuallyExclusive" for single-select or "multipleSelection" for multi-select
 *   - options: option array [{label, value}, ...]
 *   - value: selected value, either a string or an array of strings
 *   - styles.orientation: "vertical" by default, or "horizontal"
 */
class ChoicePickerComponent : public A2UIComponent {
public:
    ChoicePickerComponent(const std::string& id, const nlohmann::json& properties);
    ~ChoicePickerComponent() override;

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    /** Build option UI from options. */
    void buildOptions(const nlohmann::json& properties);

    /** Remove all option nodes. */
    void clearOptions();

    /** Apply the selected state to each option. */
    void applySelectedValues(const nlohmann::json& properties);

    /** Parse orientation from properties. */
    std::string parseOrientation(const nlohmann::json& properties) const;

    /** Parse variant from properties. */
    std::string parseVariant(const nlohmann::json& properties) const;

    /** Check whether an option value is selected. */
    bool isValueSelected(const nlohmann::json& valueField, const std::string& optionValue) const;

    /** Extract a string value, including DynamicString input. */
    static std::string extractStringValue(const nlohmann::json& value);

    std::string m_variant = "mutuallyExclusive";
    std::string m_orientation = "vertical";
    std::vector<OptionItem> m_optionItems;
};

} // namespace a2ui

#include "choicepicker_component.h"
#include "../a2ui_node.h"
#include "log/a2ui_capi_log.h"
#include "a2ui/measure/a2ui_platform_layout_bridge.h"
#include "a2ui/utils/a2ui_unit_utils.h"
#include <nlohmann/json.hpp>

namespace a2ui {

ChoicePickerComponent::ChoicePickerComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "ChoicePicker") {

    // Resolve variant and orientation.
    m_variant = parseVariant(properties);
    m_orientation = parseOrientation(properties);

    // Create the root node from the requested orientation.
    if (m_orientation == "horizontal") {
        m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_ROW);
    } else {
        m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_COLUMN);
    }

    // Merge initial properties.
    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    HM_LOGI("ChoicePickerComponent - Created: id=%s, variant=%s, orientation=%s",
                id.c_str(), m_variant.c_str(), m_orientation.c_str());
}

ChoicePickerComponent::~ChoicePickerComponent() {
    clearOptions();
    HM_LOGI("ChoicePickerComponent - Destroyed: id=%s", m_id.c_str());
}

// ---- Property Updates ----

void ChoicePickerComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        HM_LOGE("handle is null, id=%s", m_id.c_str());
        return;
    }

    // Rebuild from merged properties because later updates often omit options.
    const nlohmann::json& mergedProperties = m_properties;

    // Refresh variant and orientation.
    m_variant = parseVariant(mergedProperties);
    m_orientation = parseOrientation(mergedProperties);

    // Clear and rebuild all options.
    clearOptions();
    buildOptions(mergedProperties);
    applySelectedValues(mergedProperties);

    HM_LOGI("Built %zu options, id=%s",
                m_optionItems.size(), m_id.c_str());
}

// ---- Build Options ----

void ChoicePickerComponent::buildOptions(const nlohmann::json& properties) {
    if (!properties.contains("options") || !properties["options"].is_array()) {
        return;
    }

    const auto& optionsArray = properties["options"];

    // Read choice-gap from component styles.
    float choiceGap = 0.0f;
    const nlohmann::json cpStyles = getComponentStylesFor("ChoicePicker");
    if (cpStyles.is_object() && cpStyles.contains("choice-gap")) {
        const auto& gapVal = cpStyles["choice-gap"];
        if (gapVal.is_number()) {
            choiceGap = gapVal.get<float>();
        } else if (gapVal.is_string()) {
            choiceGap = static_cast<float>(std::atof(gapVal.get<std::string>().c_str()));
        }
    }

    int itemIndex = 0;
    for (const auto& option : optionsArray) {
        if (!option.is_object()) {
            continue;
        }

        OptionItem item;

        // Resolve the option label and value.
        std::string label;
        if (option.contains("label")) {
            label = extractStringValue(option["label"]);
        }
        if (option.contains("value") && option["value"].is_string()) {
            item.value = option["value"].get<std::string>();
        }

        // Create the option row.
        item.rowHandle = g_nodeAPI->createNode(ARKUI_NODE_ROW);
 
        // Match the default row padding.
        A2UINode(item.rowHandle).setPadding(16);

        // Apply inter-item spacing after the first option.
        if (itemIndex > 0 && choiceGap > 0.0f) {
            if (m_orientation == "horizontal") {
                A2UINode(item.rowHandle).setMargin(0.0f, 0.0f, 0.0f, choiceGap); // leftMargin
            } else {
                A2UINode(item.rowHandle).setMargin(choiceGap, 0.0f, 0.0f, 0.0f); // topMargin
            }
        }

        // Create the checkbox node.
        item.checkboxHandle = g_nodeAPI->createNode(ARKUI_NODE_CHECKBOX);
        A2UICheckboxNode(item.checkboxHandle).setShape(ArkUI_CHECKBOX_SHAPE_ROUNDED_SQUARE);
        g_nodeAPI->addChild(item.rowHandle, item.checkboxHandle);
        A2UIColumnNode(item.checkboxHandle).setAlignItems(ARKUI_ITEM_ALIGNMENT_CENTER);
        
        A2UINode(item.checkboxHandle).setWidth(32.0f);
        A2UINode(item.checkboxHandle).setHeight(32.0f);
        
        // Override the default margin so layout measurements stay stable.
        A2UINode(item.checkboxHandle).setMargin(8, 8, 8, 8);
        
         // Create the label node.
         item.labelHandle = g_nodeAPI->createNode(ARKUI_NODE_TEXT);
        
         // Set text content
         if (!label.empty()) {
             A2UITextNode(item.labelHandle).setTextContent(label);
         }

         {
             A2UITextNode t(item.labelHandle);
             t.setFontSize(32.0f);
             t.setMargin(0.0f, 0.0f, 0, 32.0f);
         }
        
         g_nodeAPI->addChild(item.rowHandle, item.labelHandle);

        // Attach the option row to the root node.
        g_nodeAPI->addChild(m_nodeHandle, item.rowHandle);
        A2UIColumnNode(m_nodeHandle).setAlignItems(ARKUI_ITEM_ALIGNMENT_AUTO);
        m_optionItems.push_back(item);
        itemIndex++;
    }
}

// ---- Clear Options ----

void ChoicePickerComponent::clearOptions() {
    for (auto& item : m_optionItems) {
        // Remove the option row from the root node.
        if (m_nodeHandle && item.rowHandle) {
            g_nodeAPI->removeChild(m_nodeHandle, item.rowHandle);
        }

        // Dispose the child nodes explicitly.
        if (item.labelHandle) {
            g_nodeAPI->disposeNode(item.labelHandle);
            item.labelHandle = nullptr;
        }
        if (item.checkboxHandle) {
            g_nodeAPI->disposeNode(item.checkboxHandle);
            item.checkboxHandle = nullptr;
        }
        if (item.rowHandle) {
            g_nodeAPI->disposeNode(item.rowHandle);
            item.rowHandle = nullptr;
        }
    }
    m_optionItems.clear();
}

// ---- Apply Selected Values ----

void ChoicePickerComponent::applySelectedValues(const nlohmann::json& properties) {
    if (!properties.contains("value")) {
        return;
    }

    const auto& valueField = properties["value"];

    for (auto& item : m_optionItems) {
        bool selected = isValueSelected(valueField, item.value);
        A2UICheckboxNode(item.checkboxHandle).setChecked(selected);
    }
}

// ---- Selection Checks ----

bool ChoicePickerComponent::isValueSelected(const nlohmann::json& valueField, const std::string& optionValue) const {
    // Single-select mode stores value as a string.
    if (valueField.is_string()) {
        return valueField.get<std::string>() == optionValue;
    }

    // Multi-select mode stores value as a string array.
    if (valueField.is_array()) {
        for (const auto& arrayItem : valueField) {
            if (arrayItem.is_string() && arrayItem.get<std::string>() == optionValue) {
                return true;
            }
        }
    }

    return false;
}

// ---- Parse Properties ----

std::string ChoicePickerComponent::parseVariant(const nlohmann::json& properties) const {
    if (properties.contains("variant") && properties["variant"].is_string()) {
        return properties["variant"].get<std::string>();
    }
    return "mutuallyExclusive";
}

std::string ChoicePickerComponent::parseOrientation(const nlohmann::json& properties) const {
    if (properties.contains("styles") && properties["styles"].is_object()) {
        const auto& styles = properties["styles"];
        if (styles.contains("orientation") && styles["orientation"].is_string()) {
            return styles["orientation"].get<std::string>();
        }
    }
    return "vertical";
}

// ---- String Extraction ----

std::string ChoicePickerComponent::extractStringValue(const nlohmann::json& value) {
    if (value.is_string()) {
        return value.get<std::string>();
    }

    // DynamicString format: {"literalString": "..."}
    if (value.is_object() && value.contains("literalString") && value["literalString"].is_string()) {
        return value["literalString"].get<std::string>();
    }

    return "";
}

} // namespace a2ui

#pragma once

#include "../a2ui_component.h"

namespace a2ui {

/**
 * Text input component backed by ARKUI_NODE_TEXT_INPUT.
 *
 * Supported properties:
 *   - label: fallback text for the placeholder
 *   - placeholder: placeholder text
 *   - value: text value, including DynamicString input
 *   - variant: shortText by default, longText, number, or obscured
 *   - styles:
 *     - width: "100%" or a numeric value
 *     - height: "100%" or a numeric value
 *     - border-radius: "16px" or a numeric value
 *     - background-color: #hex or rgba()
 *     - border-width: "1px" or a numeric value
 *     - border-color: #hex or rgba()
 */
class TextFieldComponent : public A2UIComponent {
public:
    TextFieldComponent(const std::string& id, const nlohmann::json& properties);
    ~TextFieldComponent() override;
    
public:
    A2UITextInputNode getTextFiledNode() {
        return A2UITextInputNode(m_nodeHandle);
    }

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    /**
     * @brief Apply the placeholder text.
     * @param properties Property JSON object
     */
    void applyPlaceholder(const nlohmann::json& properties);

    /**
     * @brief Apply the text value.
     * @param properties Property JSON object
     */
    void applyValue(const nlohmann::json& properties);

    /**
     * @brief Apply the input type variant.
     * @param properties Property JSON object
     */
    void applyVariant(const nlohmann::json& properties);

    /**
     * @brief Apply style attributes.
     * @param properties Property JSON object
     */
    void applyStyles(const nlohmann::json& properties);

    /**
     * @brief Apply the border radius.
     * @param styles Style JSON object
     */
    void applyBorderRadius(const nlohmann::json& styles);

    /**
     * @brief Apply the background color.
     * @param styles Style JSON object
     */
    void applyBackgroundColor(const nlohmann::json& styles);

    /**
     * @brief Apply the border width.
     * @param styles Style JSON object
     */
    void applyBorderWidth(const nlohmann::json& styles);

    /**
     * @brief Apply the border color.
     * @param styles Style JSON object
     */
    void applyBorderColor(const nlohmann::json& styles);

private:
    float m_borderWidth = 0.0f;   // Border width
    float m_borderRadius = 0.0f;  // Border radius
};

} // namespace a2ui

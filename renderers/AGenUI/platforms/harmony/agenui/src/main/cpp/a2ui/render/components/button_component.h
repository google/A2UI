#pragma once

#include "../a2ui_component.h"

namespace a2ui {

/**
 * Clickable button container backed by ARKUI_NODE_STACK.
 *
 * Supported properties:
 *   - child: child component ID, usually Text or Icon
 *   - variant: borderless or primary
 *   - action: click action definition, including functionCall
 *   - disable: disabled state
 *   - styles:
 *       - background-color: #RRGGBB / #RRGGBBAA / rgba(r,g,b,a)
 *       - border-radius: "16px" or a plain numeric string
 *       - border-width: "1px" or a plain numeric string, applied to all sides
 *       - border-color: #RRGGBB / #RRGGBBAA / rgba(r,g,b,a)
 *   - checks: condition checks that control clickability
 */
class ButtonComponent : public A2UIComponent {
public:
    ButtonComponent(const std::string& id, const nlohmann::json& properties);
    ~ButtonComponent() override;

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;
    bool shouldApplyChildLayoutPosition(const A2UIComponent* child) const override;
    float resolveAppearTargetOpacity(const nlohmann::json& properties) const override;

    /**
     * Disable clicks when m_disabled is true.
     */
    bool isClickDisabled() const override;

private:
    /** Apply the child property and clear any previous child. */
    void applyChild(const nlohmann::json& properties);

    /** Apply the variant style. */
    void applyVariant(const nlohmann::json& properties);

    /** Apply the disabled state. */
    void applyDisable(const nlohmann::json& properties);

    /** Apply custom styles. */
    void applyStyles(const nlohmann::json& properties);

    /** Apply click checks. */
    void applyChecks(const nlohmann::json& properties);

    bool m_disabled;
};

} // namespace a2ui

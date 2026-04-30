#pragma once

#include "../a2ui_component.h"
#include <string>

namespace a2ui {

/**
 * Divider component backed by primitive ArkUI nodes.
 *
 * Node structure:
 *   ARKUI_NODE_STACK (m_nodeHandle)
 *     └── ARKUI_NODE_COLUMN (m_lineHandle, the actual divider bar)
 *
 * Supported properties:
 *   - axis: "horizontal" by default, or "vertical"
 *   - styles.thickness: line thickness in vp, default 1
 *   - styles.color: line color, default #E0E0E0
 *   - styles.width: explicit width overriding the thickness-derived width
 *   - styles.height: explicit height overriding the default 100% height
 *   - styles.margin-left / styles.margin-right: horizontal margins
 */
class DividerComponent : public A2UIComponent {
public:
    DividerComponent(const std::string& id, const nlohmann::json& properties);
    ~DividerComponent() override;

    void destroy() override;

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    /** Apply the axis. */
    void applyAxis(const nlohmann::json& properties);

    /** Apply style-derived thickness and color. */
    void applyStyles(const nlohmann::json& properties);

    /** Update layout from the current axis and thickness. */
    void updateLayout();

    ArkUI_NodeHandle m_lineHandle = nullptr;   // Divider bar node

    std::string m_axis;                       // "horizontal" | "vertical"
    float       m_thickness     = 1.0f;       // Line thickness in vp
    uint32_t    m_color         = 0xFFE0E0E0; // Line color in ARGB (default light gray)

    // Explicit size values. Negative means unset and falls back to axis-derived defaults.
    float       m_explicitWidth  = -1.0f;     // styles.width
    float       m_explicitHeight = -1.0f;     // styles.height

    // Margins
    float       m_marginLeft     = 0.0f;      // styles.margin-left
    float       m_marginRight    = 0.0f;      // styles.margin-right
};

} // namespace a2ui

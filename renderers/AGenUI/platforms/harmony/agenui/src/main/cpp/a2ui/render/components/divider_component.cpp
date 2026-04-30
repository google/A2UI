#include "divider_component.h"
#include "../a2ui_node.h"
#include "a2ui/measure/a2ui_platform_layout_bridge.h"
#include "a2ui/utils/a2ui_color_palette.h"
#include "log/a2ui_capi_log.h"
#include <cstdlib>

namespace a2ui {

// ---- Default Constants ----
static constexpr float    kDefaultThickness = 1.0f;                 // Default divider thickness in vp.
static constexpr uint32_t kDefaultColor     = colors::kColorBorderGray; // Default divider color.

// ---- Constructors ----

DividerComponent::DividerComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "Divider")
    , m_lineHandle(nullptr)
    , m_axis("horizontal")
    , m_thickness(kDefaultThickness)
    , m_color(kDefaultColor)
    , m_explicitWidth(-1.0f)
    , m_explicitHeight(-1.0f)
    , m_marginLeft(0.0f)
    , m_marginRight(0.0f) {

    // Use a STACK root so future overlays can share the container.
    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_STACK);

    // Divider line node.
    m_lineHandle = g_nodeAPI->createNode(ARKUI_NODE_COLUMN);

    // Default divider color, consistent with the cross-platform spec.
    A2UINode(m_lineHandle).setBackgroundColor(kDefaultColor);

    // Attach the line node.
    g_nodeAPI->addChild(m_nodeHandle, m_lineHandle);

    // Apply the default horizontal layout.
    updateLayout();

    // Merge initial properties.
    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    HM_LOGI( "DividerComponent - Created: id=%s", id.c_str());
}

DividerComponent::~DividerComponent() {
    HM_LOGI( "DividerComponent - Destructor: id=%s", m_id.c_str());
}

// ---- destroy ----

void DividerComponent::destroy() {
    // Clear child handles before the root node is disposed.
    m_lineHandle = nullptr;
    A2UIComponent::destroy();
}

// ---- Property Updates ----

void DividerComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle || !m_lineHandle) {
        HM_LOGE( "handle is null, id=%s", m_id.c_str());
        return;
    }

    applyAxis(properties);
    applyStyles(properties);

    HM_LOGI( "axis=%s, thickness=%.1f, id=%s",
                m_axis.c_str(), m_thickness, m_id.c_str());
}

// ---- applyAxis ----

void DividerComponent::applyAxis(const nlohmann::json& properties) {
    if (!properties.contains("axis") || !properties["axis"].is_string()) {
        return;
    }

    std::string axis = properties["axis"].get<std::string>();
    if (axis != m_axis) {
        m_axis = axis;
        updateLayout();
    }
}

// ---- applyStyles ----

void DividerComponent::applyStyles(const nlohmann::json& properties) {
    HM_LOGI("properties JSON: %s", properties.dump().c_str());

    if (!properties.contains("styles") || !properties["styles"].is_object()) {
        return;
    }

    const auto& styles = properties["styles"];
    HM_LOGI("styles JSON: %s", styles.dump().c_str());
    bool needsLayoutUpdate = false;

    // Divider thickness.
    if (styles.contains("thickness")) {
        float t = kDefaultThickness;
        if (styles["thickness"].is_number()) {
            t = styles["thickness"].get<float>();
        } else if (styles["thickness"].is_string()) {
            std::string ts = styles["thickness"].get<std::string>();
            // Ignore unit suffixes and keep the numeric value.
            t = static_cast<float>(std::atof(ts.c_str()));
        }
        if (t > 0.0f && t != m_thickness) {
            m_thickness = t;
            needsLayoutUpdate = true;
        }
    }

    // Divider color.
    if (styles.contains("color") && styles["color"].is_string()) {
        m_color = parseColor(styles["color"].get<std::string>());
        A2UINode(m_lineHandle).setBackgroundColor(m_color);
    }

    // backgroundColor overrides background-color.
    if (styles.contains("backgroundColor") && styles["backgroundColor"].is_string()) {
        m_color = parseColor(styles["backgroundColor"].get<std::string>());
        A2UINode(m_lineHandle).setBackgroundColor(m_color);
    } else if (styles.contains("background-color") && styles["background-color"].is_string()) {
        m_color = parseColor(styles["background-color"].get<std::string>());
        A2UINode(m_lineHandle).setBackgroundColor(m_color);
    }

    // Explicit width.
    if (styles.contains("width")) {
        float w = -1.0f;
        if (styles["width"].is_number()) {
            w = styles["width"].get<float>();
        } else if (styles["width"].is_string()) {
            w = static_cast<float>(std::atof(styles["width"].get<std::string>().c_str()));
        }
        if (w != m_explicitWidth) {
            m_explicitWidth = w;
            needsLayoutUpdate = true;
        }
    }

    // Explicit height.
    if (styles.contains("height")) {
        float h = -1.0f;
        if (styles["height"].is_number()) {
            h = styles["height"].get<float>();
        } else if (styles["height"].is_string()) {
            h = static_cast<float>(std::atof(styles["height"].get<std::string>().c_str()));
        }
        if (h != m_explicitHeight) {
            m_explicitHeight = h;
            needsLayoutUpdate = true;
        }
    }

    // margin-left
    if (styles.contains("margin-left")) {
        float ml = 0.0f;
        if (styles["margin-left"].is_number()) {
            ml = styles["margin-left"].get<float>();
        } else if (styles["margin-left"].is_string()) {
            ml = static_cast<float>(std::atof(styles["margin-left"].get<std::string>().c_str()));
        }
        if (ml != m_marginLeft) {
            m_marginLeft = ml;
            needsLayoutUpdate = true;
        }
    }

    // margin-right
    if (styles.contains("margin-right")) {
        float mr = 0.0f;
        if (styles["margin-right"].is_number()) {
            mr = styles["margin-right"].get<float>();
        } else if (styles["margin-right"].is_string()) {
            mr = static_cast<float>(std::atof(styles["margin-right"].get<std::string>().c_str()));
        }
        if (mr != m_marginRight) {
            m_marginRight = mr;
            needsLayoutUpdate = true;
        }
    }

    if (needsLayoutUpdate) {
        updateLayout();
    }
}

// ---- updateLayout ----

void DividerComponent::updateLayout() {
    if (!m_nodeHandle || !m_lineHandle) {
        return;
    }

    A2UINode outerNode(m_nodeHandle);
    A2UINode innerNode(m_lineHandle);

    if (m_axis == "vertical") {
        // Vertical divider: explicit width wins, otherwise use thickness.
        float w = (m_explicitWidth > 0.0f) ? m_explicitWidth : m_thickness;
        outerNode.setWidth(w);
        innerNode.setWidth(w);

        // Explicit height wins; otherwise stretch to full height.
        if (m_explicitHeight > 0.0f) {
            outerNode.setHeight(m_explicitHeight);
            innerNode.setHeight(m_explicitHeight);
        } else {
            outerNode.setPercentHeight(1.0f);
            innerNode.setPercentHeight(1.0f);
        }

    } else {
        // Horizontal divider: explicit height wins, otherwise use thickness.
        float h = (m_explicitHeight > 0.0f) ? m_explicitHeight : m_thickness;
        // Explicit width wins; otherwise let layout clip the full-width sentinel.
        if (m_explicitWidth > 0.0f) {
            outerNode.setWidth(m_explicitWidth);
            innerNode.setWidth(m_explicitWidth);
        } else {
            outerNode.setWidth(9999.0f);
            innerNode.setWidth(9999.0f);
        }
        outerNode.setHeight(h);
        innerNode.setHeight(h);
    }

    // Apply outer margins on the root node.
    outerNode.setMargin(0.0f, m_marginRight, 0.0f, m_marginLeft);

    HM_LOGI(
        "axis=%s, thickness=%.1f, "
        "explicitW=%.1f, explicitH=%.1f, marginL=%.1f, marginR=%.1f",
        m_axis.c_str(), m_thickness, m_explicitWidth, m_explicitHeight,
        m_marginLeft, m_marginRight);
}

} // namespace a2ui

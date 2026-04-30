#include "column_component.h"
#include "log/a2ui_capi_log.h"


namespace a2ui {

ColumnComponent::ColumnComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "Column") {
    
    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_COLUMN);
    
    // Merge initial properties.
    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    HM_LOGI( "ColumnComponent - Created: id=%s, handle=%s", id.c_str(), m_nodeHandle ? "valid" : "null");
}

ColumnComponent::~ColumnComponent() {
    HM_LOGI( "ColumnComponent - Destroyed: id=%s", m_id.c_str());
}

// ---- Property Updates ----

void ColumnComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        HM_LOGE( "handle or nodeApi is null, id=%s",m_id.c_str());
        return;
    }

    applyJustify(properties);
    applyAlign(properties);
    applyStyles(properties);

    HM_LOGI( "Applied properties, id=%s", m_id.c_str());
}

// ---- Justify ----

void ColumnComponent::applyJustify(const nlohmann::json& properties) {
    if (properties.find("justify") == properties.end() || !properties["justify"].is_string()) {
        return;
    }

    ArkUI_FlexAlignment justifyValue = (ArkUI_FlexAlignment)mapJustifyContent(properties["justify"].get<std::string>());
    A2UIColumnNode node(m_nodeHandle);
    node.setJustifyContent(justifyValue);
}

// ---- Align ----

void ColumnComponent::applyAlign(const nlohmann::json& properties) {
    if (properties.find("align") == properties.end() || !properties["align"].is_string()) {
        return;
    }

    ArkUI_ItemAlignment alignValue = (ArkUI_ItemAlignment)mapAlignItems(properties["align"].get<std::string>());
    A2UIColumnNode node(m_nodeHandle);
    node.setAlignItems(alignValue);
}

// ---- Custom Styles ----

void ColumnComponent::applyStyles(const nlohmann::json& properties) {
    if (properties.find("styles") == properties.end() || !properties["styles"].is_object()) {
        return;
    }

    const auto& styles = properties["styles"];
    A2UIColumnNode node(m_nodeHandle);

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
            HM_LOGI("background-color=%s, id=%s", bgColorStr.c_str(), m_id.c_str());
        }
    }

    // Support numeric and string border radius values.
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
}

// ---- Enum Mappings ----

int32_t ColumnComponent::mapJustifyContent(const std::string& justify) {
    if (justify == "center") {
        return ARKUI_FLEX_ALIGNMENT_CENTER;
    } else if (justify == "end") {
        return ARKUI_FLEX_ALIGNMENT_END;
    } else if (justify == "spaceBetween") {
        return ARKUI_FLEX_ALIGNMENT_SPACE_BETWEEN;
    } else if (justify == "spaceAround") {
        return ARKUI_FLEX_ALIGNMENT_SPACE_AROUND;
    } else if (justify == "spaceEvenly") {
        return ARKUI_FLEX_ALIGNMENT_SPACE_EVENLY;
    }
    // Default to START.
    return ARKUI_FLEX_ALIGNMENT_START;
}

int32_t ColumnComponent::mapAlignItems(const std::string& align) {
    if (align == "center") {
        return ARKUI_ITEM_ALIGNMENT_CENTER;
    } else if (align == "end") {
        return ARKUI_ITEM_ALIGNMENT_END;
    } else if (align == "stretch") {
        return ARKUI_ITEM_ALIGNMENT_STRETCH;
    }
    // Default to START.
    return ARKUI_ITEM_ALIGNMENT_START;
}

} // namespace a2ui

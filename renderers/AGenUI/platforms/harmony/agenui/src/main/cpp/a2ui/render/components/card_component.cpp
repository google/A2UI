#include "card_component.h"
#include "../a2ui_node.h"
#include "a2ui/utils/a2ui_color_palette.h"
#include "log/a2ui_capi_log.h"
#include <cstdlib>
#include <cstdio>
#include <cstring>
#include <string>
#include <cctype>

#undef LOG_DOMAIN
#undef LOG_TAG
#define LOG_DOMAIN 0x0000
#define LOG_TAG "A2UI_CardComponent"

namespace a2ui {

using colors::kColorWhite;
using colors::kColorBorderGray;
using colors::kColorTransparent;
using colors::kColorShadow20;

CardComponent::CardComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "Card") {

    // Use a COLUMN node as the card container.
    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_COLUMN);

    // Apply the default card chrome.
    {
        A2UINode node(m_nodeHandle);
        node.setBackgroundColor(kColorWhite);
        node.setBorderRadius(16.0f);
        node.setBorderWidth(1.0f, 1.0f, 1.0f, 1.0f);
        node.setBorderColor(kColorBorderGray);
    }

    // Merge initial properties.
    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    HM_LOGI("CardComponent - Created: id=%s, handle=%s", id.c_str(), m_nodeHandle ? "valid" : "null");
}

CardComponent::~CardComponent() {
    HM_LOGI("CardComponent - Destroyed: id=%s", m_id.c_str());
}

// ---- Property Updates ----

void CardComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        HM_LOGE("handle is null, id=%s", m_id.c_str());
        return;
    }

    // W3C properties live under styles; legacy ones stay at the top level.
    const nlohmann::json& styles = properties.contains("styles") && properties["styles"].is_object()
                                   ? properties["styles"]
                                   : properties;

    applyRadius(styles);
    applyBackgroundColor(styles);
    applyFilter(styles);
    applyElevation(properties);  // Legacy elevation remains a top-level property.

    HM_LOGI("Applied properties, id=%s", m_id.c_str());
}

// ---- CSS Length Parsing ----

float CardComponent::parseCssLength(const nlohmann::json& val, float fallback) {
    if (val.is_number()) {
        float f = val.get<float>();
        return f >= 0.0f ? f : fallback;
    }
    if (val.is_string()) {
        std::string s = val.get<std::string>();
        // Drop the optional "px" suffix.
        if (s.size() > 2 && s.substr(s.size() - 2) == "px") {
            s = s.substr(0, s.size() - 2);
        }
        float f = static_cast<float>(std::atof(s.c_str()));
        return f >= 0.0f ? f : fallback;
    }
    return fallback;
}

// ---- Radius ----

void CardComponent::applyRadius(const nlohmann::json& properties) {
    // Prefer border-radius, with radius kept for legacy input.
    if (properties.contains("border-radius")) {
        float r = parseCssLength(properties["border-radius"], -1.0f);
        if (r >= 0.0f) A2UINode(m_nodeHandle).setBorderRadius(r);
    } else if (properties.contains("radius") && properties["radius"].is_number()) {
        float r = properties["radius"].get<float>();
        A2UINode(m_nodeHandle).setBorderRadius(r);
    }
}

// ---- Background Color ----

void CardComponent::applyBackgroundColor(const nlohmann::json& properties) {
    // Prefer background-color, with backgroundColor kept for compatibility.
    std::string colorStr;
    if (properties.contains("background-color") && properties["background-color"].is_string()) {
        colorStr = properties["background-color"].get<std::string>();
    } else if (properties.contains("backgroundColor") && properties["backgroundColor"].is_string()) {
        colorStr = properties["backgroundColor"].get<std::string>();
    }
    if (!colorStr.empty()) {
        A2UINode(m_nodeHandle).setBackgroundColor(parseColor(colorStr));
    }
}

// ---- Filter: drop-shadow ----

void CardComponent::applyFilter(const nlohmann::json& properties) {
    if (!properties.contains("filter") || !properties["filter"].is_string()) return;

    std::string filterVal = properties["filter"].get<std::string>();

    // Find the drop-shadow payload.
    const std::string dsPrefix = "drop-shadow(";
    size_t dsStart = filterVal.find(dsPrefix);
    if (dsStart == std::string::npos) return;
    dsStart += dsPrefix.size();

    size_t dsEnd = filterVal.rfind(')');
    if (dsEnd == std::string::npos || dsEnd < dsStart) return;

    // Examples:
    // "10px 10px 16px rgba(0, 0, 0, 0.2)"
    // "10px 10px 16px 0px rgba(0, 0, 0, 0.2)"
    std::string inner = filterVal.substr(dsStart, dsEnd - dsStart);
    const char* p = inner.c_str();
    char* endPtr;

    auto skipSeparators = [](const char*& cursor) {
        while (*cursor == ' ' || *cursor == ',') cursor++;
    };

    auto parseLength = [&](float& outValue) -> bool {
        skipSeparators(p);
        outValue = std::strtof(p, &endPtr);
        if (endPtr == p) return false;
        p = endPtr;
        // Skip unit suffixes such as px, vp, or em.
        while (*p && *p != ' ' && *p != ',' && *p != '(') p++;
        return true;
    };

    // Support both 3-length and 4-length drop-shadow forms.
    float vals[4] = {0.0f, 0.0f, 0.0f, 0.0f};
    for (int i = 0; i < 3; i++) {
        if (!parseLength(vals[i])) return;
    }

    // Parse spread when present, but ignore it because ArkUI does not expose it yet.
    {
        const char* lookahead = p;
        skipSeparators(lookahead);
        if (*lookahead != '\0' && *lookahead != 'r' && *lookahead != '#' && *lookahead != 't') {
            p = lookahead;
            if (!parseLength(vals[3])) return;
        } else {
            p = lookahead;
        }
    }

    // Treat the remaining payload as the color string.
    skipSeparators(p);
    std::string colorStr = p;
    if (colorStr.empty()) return;

    // Parse the shadow color.
    uint32_t color = parseColor(colorStr);
    if (color == kColorTransparent && colorStr != "#00000000" && colorStr != "rgba(0, 0, 0, 0)" &&
        colorStr != "rgba(0,0,0,0)" && colorStr != "rgb(0, 0, 0)") {
        return;
    }

    // Apply the shadow.
    A2UINode(m_nodeHandle).setCustomShadow(vals[2], vals[0], vals[1], color);
}

// ---- Elevation ----

void CardComponent::applyElevation(const nlohmann::json& properties) {
    if (!properties.contains("elevation") || !properties["elevation"].is_number()) return;
    float elev = properties["elevation"].get<float>();
    if (elev <= 0.0f) return;
    // Map elevation to a vertical shadow.
    A2UINode(m_nodeHandle).setCustomShadow(elev * 2.0f, 0.0f, elev, kColorShadow20);
}

} // namespace a2ui

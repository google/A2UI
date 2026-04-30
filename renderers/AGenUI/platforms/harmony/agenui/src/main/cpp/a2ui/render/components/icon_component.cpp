#include "icon_component.h"
#include "../a2ui_node.h"
#include "a2ui/measure/a2ui_platform_layout_bridge.h"
#include "a2ui/utils/a2ui_unit_utils.h"
#include "a2ui/utils/a2ui_color_palette.h"
#include "hilog/log.h"
#include <cstdlib>
#include <algorithm>
#include <cctype>
#include "log/a2ui_capi_log.h"

// filesDir accessor defined in napi_init.cpp.
extern const std::string& a2ui_get_files_dir();

#undef LOG_DOMAIN
#undef LOG_TAG
#define LOG_DOMAIN 0x0000
#define LOG_TAG "A2UI_IconComponent"

namespace a2ui {

// ---- Construction / Destruction ----

IconComponent::IconComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "Icon"), m_currentSize(48.0f), m_currentColor(colors::kColorBlack) {
    // Render SVG icons with an IMAGE node.
    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_IMAGE);

    // Default to 48x48 with contain fit.
    {
        A2UIImageNode node(m_nodeHandle);
        node.setWidth(48.0f);
        node.setHeight(48.0f);
        node.setObjectFitContain();
    }

    // Merge initial properties.
    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    HM_LOGI("IconComponent - Created: id=%s, handle=%s", id.c_str(), m_nodeHandle ? "valid" : "null");
}

IconComponent::~IconComponent() {
    HM_LOGI("IconComponent - Destroyed: id=%s", m_id.c_str());
}

// ---- Property Updates ----

void IconComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        HM_LOGE("handle is null, id=%s", m_id.c_str());
        return;
    }

    applyIconSize(properties);
    applyIconName(properties);  // Apply size first to keep dimensions in sync.
    applyIconColor(properties);

    HM_LOGI("Applied properties, id=%s", m_id.c_str());
}

// ---- Icon Name ----

void IconComponent::applyIconName(const nlohmann::json& properties) {
    if (properties.find("name") == properties.end()) {
        return;
    }

    std::string iconName;
    const auto& nameValue = properties["name"];

    // Format 1: {"name": "favorite"}
    if (nameValue.is_string()) {
        iconName = nameValue.get<std::string>();
    }
    // Format 2: {"name": {"path": "favorite"}}
    else if (nameValue.is_object()) {
        if (nameValue.find("path") != nameValue.end() && nameValue["path"].is_string()) {
            iconName = nameValue["path"].get<std::string>();
        }
    }

    if (!iconName.empty()) {
        // Map to a Lucide asset name.
        std::string lucideName = mapIconToLucideName(iconName);
        // Use the sandboxed absolute asset path.
        const std::string& filesDir = a2ui_get_files_dir();
        std::string src;
        if (!filesDir.empty()) {
            src = "file://" + filesDir + "/data/icons/" + lucideName + ".svg";
        } else {
            // Fall back to a relative path if filesDir is unavailable.
            src = lucideName + ".svg";
            HM_LOGW("filesDir not set, icon may not display");
        }
        A2UIImageNode(m_nodeHandle).setSrc(src);
        HM_LOGI("name=%s, src=%s", iconName.c_str(), src.c_str());
    }
}

// ---- Icon Size ----

void IconComponent::applyIconSize(const nlohmann::json& properties) {
    if (properties.find("size") == properties.end()) {
        return;
    }

    float sizeFp = 48.0f;
    const auto& sizeValue = properties["size"];

    if (sizeValue.is_number()) {
        sizeFp = sizeValue.get<float>();
    } else if (sizeValue.is_string()) {
        sizeFp = static_cast<float>(std::atof(sizeValue.get<std::string>().c_str()));
    }

    if (sizeFp <= 0) {
        sizeFp = 48.0f;
    }

    m_currentSize = sizeFp;

    // Update the IMAGE node size.
    {
        A2UIImageNode node(m_nodeHandle);
        node.setWidth(sizeFp);
        node.setHeight(sizeFp);
    }
}

// ---- Icon Color ----

void IconComponent::applyIconColor(const nlohmann::json& properties) {
    if (properties.find("color") == properties.end()) {
        return;
    }

    const auto& colorValue = properties["color"];
    if (!colorValue.is_string()) {
        return;
    }

    m_currentColor = parseColor(colorValue.get<std::string>());
    // Tint the SVG through NODE_IMAGE_FILL_COLOR.
    A2UIImageNode(m_nodeHandle).setFillColor(m_currentColor);
}

// ---- Material Design Name -> Lucide Asset ----

std::string IconComponent::mapIconToLucideName(const std::string& iconName) {
    std::string name = toLower(iconName);

    // Mappings backed by existing Lucide assets.
    if (name == "accountcircle")   return "circle-user";
    if (name == "add")              return "plus";
    if (name == "arrowback")        return "arrow-left";
    if (name == "arrowforward")     return "arrow-right";
    if (name == "attachfile")       return "paperclip";
    if (name == "calendartoday")    return "calendar";
    if (name == "call")             return "phone";
    if (name == "camera")           return "camera";
    if (name == "check")            return "check";
    if (name == "close")            return "x";
    if (name == "delete")           return "trash";
    if (name == "download")         return "download";
    if (name == "edit")             return "pencil";
    if (name == "event")            return "calendar";
    if (name == "error")            return "circle-alert";
    if (name == "favorite")         return "heart";
    if (name == "favoriteoff")      return "heart-off";
    if (name == "folder")           return "folder";
    if (name == "help")             return "circle-question-mark";
    if (name == "home")             return "house";
    if (name == "info")             return "info";
    if (name == "locationon")       return "map-pin";
    if (name == "lock")             return "lock";
    if (name == "lockopen")         return "lock-open";
    if (name == "mail")             return "mail";
    if (name == "menu")             return "menu";
    if (name == "morevert")         return "ellipsis-vertical";
    if (name == "morehoriz")        return "ellipsis";
    if (name == "notificationsoff") return "bell-off";
    if (name == "notifications")    return "bell";
    if (name == "payment")          return "credit-card";
    if (name == "person")           return "user";
    if (name == "phone")            return "phone";
    if (name == "photo")            return "image";
    if (name == "print")            return "printer";
    if (name == "refresh")          return "refresh-cw";
    if (name == "search")           return "search";
    if (name == "send")             return "send";
    if (name == "settings")         return "settings";
    if (name == "share")            return "share";
    if (name == "shoppingcart")     return "shopping-cart";
    if (name == "star")             return "star";
    if (name == "starhalf")         return "star-half";
    if (name == "staroff")          return "star-off";
    if (name == "upload")           return "upload";
    if (name == "visibility")       return "eye";
    if (name == "visibilityoff")    return "eye-off";
    if (name == "warning")          return "triangle-alert";

    // Fall back to the info icon.
    return "info";
}

// ---- Helper Methods ----

std::string IconComponent::toLower(const std::string& str) {
    std::string result = str;
    std::transform(result.begin(), result.end(), result.begin(),
                   [](unsigned char ch) { return std::tolower(ch); });
    return result;
}

} // namespace a2ui

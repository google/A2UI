#pragma once

#include "../a2ui_component.h"

namespace a2ui {

/**
 * Icon component rendered from Lucide SVG assets in rawfile/icons/.
 *
 * Supported properties:
 *   - name: icon name, as either a string or an object such as {path: "xxx"}
 *   - size: icon size, default 48 a2ui units
 *   - color: icon color, default black, applied to SVG via fillColor
 */
class IconComponent : public A2UIComponent {
public:
    IconComponent(const std::string& id, const nlohmann::json& properties);
    ~IconComponent() override;

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    /** Parse and apply the icon name. */
    void applyIconName(const nlohmann::json& properties);

    /** Parse and apply the icon size. */
    void applyIconSize(const nlohmann::json& properties);

    /** Parse and apply the icon color. */
    void applyIconColor(const nlohmann::json& properties);

    /**
     * Map a Material Design icon name to a Lucide SVG asset name.
     */
    static std::string mapIconToLucideName(const std::string& iconName);

    /** Convert a string to lowercase. */
    static std::string toLower(const std::string& str);

    float m_currentSize;      // Current icon size in a2ui units
    uint32_t m_currentColor;  // Current icon color
};

} // namespace a2ui

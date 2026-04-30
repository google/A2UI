#pragma once

#include "../a2ui_component.h"

namespace a2ui {

/**
 * Card container with a white background, rounded corners, and shadow.
 *
 * Supported properties:
 *   - radius / border-radius: numeric a2ui value or a string such as "16px"
 *   - backgroundColor / background-color: hex color string
 *   - padding: numeric value or a string such as "24px", applied to all sides
 *   - filter: CSS filter, currently supporting "drop-shadow(offsetX offsetY blur color)"
 *   - elevation: reserved legacy field, replaced by filter
 */
class CardComponent : public A2UIComponent {
public:
    CardComponent(const std::string& id, const nlohmann::json& properties);
    ~CardComponent() override;

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    /** Parse radius / border-radius and apply NODE_BORDER_RADIUS. */
    void applyRadius(const nlohmann::json& properties);

    /** Parse backgroundColor / background-color and apply NODE_BACKGROUND_COLOR. */
    void applyBackgroundColor(const nlohmann::json& properties);

    /** Parse filter: drop-shadow(...) and apply NODE_CUSTOM_SHADOW. */
    void applyFilter(const nlohmann::json& properties);

    /** Parse the legacy elevation property and map it to NODE_CUSTOM_SHADOW. */
    void applyElevation(const nlohmann::json& properties);

    /** Parse a CSS length from JSON and return an a2ui value. */
    static float parseCssLength(const nlohmann::json& val, float fallback);
};

} // namespace a2ui

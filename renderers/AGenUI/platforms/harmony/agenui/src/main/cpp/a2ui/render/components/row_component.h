#pragma once

#include "../a2ui_component.h"

namespace a2ui {

/**
 * Horizontal layout component backed by ARKUI_NODE_ROW.
 *
 * Supported properties:
 *   - justify: main-axis alignment in the horizontal direction
 *   - align: cross-axis alignment in the vertical direction
 */
class RowComponent : public A2UIComponent {
public:
    RowComponent(const std::string& id, const nlohmann::json& properties);
    ~RowComponent() override;

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    /** Parse styles such as background-color. */
    void applyStyles(const nlohmann::json& properties);

    /** Parse justify and map it to NODE_ROW_JUSTIFY_CONTENT. */
    void applyJustify(const nlohmann::json& properties);

    /** Parse align and map it to NODE_ROW_ALIGN_ITEMS. */
    void applyAlign(const nlohmann::json& properties);

    /** Map justify strings to ArkUI enum values. */
    static int32_t mapJustifyContent(const std::string& justify);

    /** Map align strings to ArkUI enum values. */
    static int32_t mapAlignItems(const std::string& align);
};

} // namespace a2ui

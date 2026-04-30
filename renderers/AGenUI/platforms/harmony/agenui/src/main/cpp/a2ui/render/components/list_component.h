#pragma once

#include "../a2ui_component.h"
#include <vector>

namespace a2ui {

/**
 * List component (list layout with scrolling support)
 * Implemented with HarmonyOS ArkUI C-API ARKUI_NODE_LIST. Each child node is wrapped automatically in ARKUI_NODE_LIST_ITEM
 *
 * Supported properties:
 *   - direction:  Layout direction - vertical (default), horizontal
 *   - align:      Cross-axis alignment - start (default), center, end, stretch
 *   - scrollable: Scrollable - true (default), false
 */
class ListComponent : public A2UIComponent {
public:
    ListComponent(const std::string& id, const nlohmann::json& properties);
    ~ListComponent() override;

    void addChild(A2UIComponent* child) override;
    void removeChild(A2UIComponent* child) override;
    bool shouldAutoAddChildView() const override { return false; }

    /**
     * Child content nodes are mounted under ListItem, and coordinates must be relative to the ListItem origin
     * The framework must not apply absolute coordinates calculated against the List container to child content nodes
     */
    bool shouldApplyChildLayoutPosition(const A2UIComponent* child) const override { return false; }

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    void applyScrollable(const nlohmann::json& properties);
    void applyDirection(const nlohmann::json& properties);
    void applyAlign(const nlohmann::json& properties);
    static int32_t mapAlignItems(const std::string& align);
    bool isHorizontal() const;
    /** Apply unified size constraints (percentages) to ListItem and its child content */
    void applyListItemConstraints(ArkUI_NodeHandle listItemHandle, ArkUI_NodeHandle childHandle);

    ArkUI_NodeHandle createListItemWrapper(ArkUI_NodeHandle childHandle);
    ArkUI_NodeHandle findListItemWrapper(ArkUI_NodeHandle childHandle) const;
    void removeListItemWrapper(ArkUI_NodeHandle childHandle);

    std::vector<std::pair<ArkUI_NodeHandle, ArkUI_NodeHandle>> m_listItemWrappers;
    bool m_scrollable = true;
    bool m_horizontal = false;
};

} // namespace a2ui

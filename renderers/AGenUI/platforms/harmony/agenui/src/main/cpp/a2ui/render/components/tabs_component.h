#pragma once

#include "../a2ui_component.h"
#include <vector>

namespace a2ui {

/**
 * Tabs component built from primitive ArkUI nodes.
 *
 * Node structure:
 *   ARKUI_NODE_COLUMN (root container m_nodeHandle)
 *     ├── ARKUI_NODE_ROW (tab bar m_tabBarHandle)
 *     │     ├── ARKUI_NODE_STACK (tab container with text and underline)
 *     │     │     ├── ARKUI_NODE_TEXT (tab label)
 *     │     │     └── ARKUI_NODE_COLUMN (underline, visible when selected)
 *     │     └── ...
 *     └── ARKUI_NODE_COLUMN (content container m_contentContainerHandle)
 *           └── [nodeHandle of the selected tab child]
 *
 * Supported properties:
 *   - tabs: tab descriptors such as [{title: "Tab 1", child: "child-id-1"}, ...]
 *   - selectedIndex: initial selected index, default 0
 */
class TabsComponent : public A2UIComponent {
public:
    TabsComponent(const std::string& id, const nlohmann::json& properties);
    ~TabsComponent() override;

    /** Tabs manages child node mounting itself. */
    bool shouldAutoAddChildView() const override;

    /** Clean internal handles before delegating to the base destroy path. */
    void destroy() override;

    /**
     * Called by Surface when an orphan child is mounted later.
     * Shows the first tab once all tab children are ready.
     */
    void onChildMounted(A2UIComponent* child);

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    /** Indicator style settings. */
    struct IndicatorStyle;

    /** UI handles for one tab. */
    struct TabInfo {
        std::string title;
        std::string childId;
        ArkUI_NodeHandle tabContainerHandle;  // COLUMN container
        ArkUI_NodeHandle textHandle;          // Tab label
        ArkUI_NodeHandle indicatorHandle;     // Underline
    };

    /** Resolve indicator styling. */
    IndicatorStyle resolveIndicatorStyle();

    /** Build the tab bar UI from properties["tabs"]. */
    void buildTabBar(const nlohmann::json& properties);

    /** Show the content of the specified tab index. */
    void showTabContent(int index);

    /** Refresh selected and unselected tab styles. */
    void updateTabStyles();

    /** Show the first tab once all tab children are ready. */
    void tryShowFirstTab();

    /** Tab click event callback. */
    static void onTabClickEvent(ArkUI_NodeEvent* event);

    ArkUI_NodeHandle m_tabBarHandle;              // Tab bar row
    ArkUI_NodeHandle m_contentContainerHandle;    // Content container column
    std::vector<TabInfo> m_tabInfos;              // Tab metadata
    int m_selectedIndex;                          // Current selected index
    bool m_contentShown;                          // Whether content has been shown
};

} // namespace a2ui

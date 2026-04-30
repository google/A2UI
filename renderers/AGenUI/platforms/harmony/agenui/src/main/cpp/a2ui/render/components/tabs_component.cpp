#include "tabs_component.h"
#include "../a2ui_node.h"
#include "../../utils/a2ui_color_palette.h"
#include "log/a2ui_capi_log.h"
#include "../../measure/a2ui_platform_layout_bridge.h"
#include "../../utils/a2ui_unit_utils.h"
#include <cstdlib>

namespace a2ui {

using colors::kColorPrimaryBlue;
using colors::kColorBlack;
using colors::kColorBorderGray;

// ---- Indicator Style ----

struct TabsComponent::IndicatorStyle {
    float width = 48.0f;
    float height = 8.0f;
    float radius = 4.0f;
    uint32_t color = kColorPrimaryBlue;
    float fontSize = 32.0f;
};
// ---- Construction / Destruction ----

TabsComponent::TabsComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "Tabs")
    , m_tabBarHandle(nullptr)
    , m_contentContainerHandle(nullptr)
    , m_selectedIndex(0)
    , m_contentShown(false) {

    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_COLUMN);

    A2UINode mainContainer(m_nodeHandle);
    mainContainer.setWidth(-1.0f);

    m_tabBarHandle = g_nodeAPI->createNode(ARKUI_NODE_ROW);

    {
        A2UINode bar(m_tabBarHandle);
        bar.setWidth(-1.0f);
        bar.setHeight(96.0f);
        bar.setBorderWidth(0.0f, 0.0f, 2.0f, 0.0f);
        bar.setBorderColor(kColorBorderGray);
    }

    m_contentContainerHandle = g_nodeAPI->createNode(ARKUI_NODE_COLUMN);

    {
        A2UIColumnNode content(m_contentContainerHandle);
        content.setWidth(-1.0f);
        content.setMargin(16.0f, 0.0f, 0.0f, 0.0f);
        content.setJustifyContent(ARKUI_FLEX_ALIGNMENT_START);
        content.setAlignItems(ARKUI_ITEM_ALIGNMENT_START);
        // Allow the content container to shrink inside constrained parents.
        ArkUI_NumberValue shrinkValue[] = {{.f32 = 1.0f}};
        ArkUI_AttributeItem shrinkItem = {shrinkValue, 1};
        g_nodeAPI->setAttribute(m_contentContainerHandle, NODE_FLEX_SHRINK, &shrinkItem);
    }

    g_nodeAPI->addChild(m_nodeHandle, m_tabBarHandle);
    g_nodeAPI->addChild(m_nodeHandle, m_contentContainerHandle);

    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    HM_LOGI( "TabsComponent - Created: id=%s", id.c_str());
}

TabsComponent::~TabsComponent() {
    HM_LOGI( "TabsComponent - Destructor: id=%s", m_id.c_str());
}

void TabsComponent::destroy() {
    HM_LOGI( "id=%s, tabs=%zu",
                m_id.c_str(), m_tabInfos.size());

    if (m_selectedIndex >= 0 && m_selectedIndex < static_cast<int>(m_children.size())) {
        A2UIComponent* currentChild = m_children[m_selectedIndex];
        if (currentChild && currentChild->getNodeHandle() && m_contentContainerHandle) {
            g_nodeAPI->removeChild(m_contentContainerHandle, currentChild->getNodeHandle());
        }
    }

    for (auto& tabInfo : m_tabInfos) {
        if (tabInfo.tabContainerHandle) {
            g_nodeAPI->unregisterNodeEvent(tabInfo.tabContainerHandle, NODE_ON_CLICK);
        }
    }

    // Child nodes are released when the base class disposes the root node.
    for (auto& tabInfo : m_tabInfos) {
        tabInfo.tabContainerHandle = nullptr;
        tabInfo.textHandle = nullptr;
        tabInfo.indicatorHandle = nullptr;
    }
    m_tabInfos.clear();
    m_tabBarHandle = nullptr;
    m_contentContainerHandle = nullptr;
    m_contentShown = false;

    A2UIComponent::destroy();
}

// ---- shouldAutoAddChildView ----

bool TabsComponent::shouldAutoAddChildView() const {
    // Tabs mount children into the content container explicitly.
    return false;
}

// ---- Property Updates ----

void TabsComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        return;
    }

    if (properties.contains("selectedIndex") && properties["selectedIndex"].is_number_integer()) {
        m_selectedIndex = properties["selectedIndex"].get<int>();
    }

    if (properties.contains("tabs") && properties["tabs"].is_array()) {
        buildTabBar(properties);
    }

    HM_LOGI( "id=%s, selectedIndex=%d",
                m_id.c_str(), m_selectedIndex);
}

// ---- Resolve Indicator Style ----

TabsComponent::IndicatorStyle TabsComponent::resolveIndicatorStyle() {
    IndicatorStyle style;
    
    const nlohmann::json tabsStyles = getComponentStylesFor("Tabs");
    if (!tabsStyles.is_object()) {
        HM_LOGW("No Tabs styles found, using defaults");
        return style;
    }
    
    auto parseFloatStyle = [&tabsStyles](const char* key, float& outValue) {
        if (!tabsStyles.contains(key)) {
            return;
        }
        const auto& rawValue = tabsStyles[key];
        if (rawValue.is_number()) {
            outValue = rawValue.get<float>();
            return;
        }
        if (!rawValue.is_string()) {
            return;
        }
        std::string val = rawValue.get<std::string>();
        if (!val.empty()) {
            outValue = static_cast<float>(std::atof(val.c_str()));
        }
    };
    
    auto parseColorStyle = [this, &tabsStyles](const char* key, uint32_t& outValue) {
        if (!tabsStyles.contains(key) || !tabsStyles[key].is_string()) {
            return;
        }
        outValue = parseColor(tabsStyles[key].get<std::string>());
    };
    
    parseFloatStyle("indicator-width", style.width);
    parseFloatStyle("indicator-height", style.height);
    parseFloatStyle("indicator-radius", style.radius);
    parseColorStyle("indicator-color", style.color);
    parseFloatStyle("tab-font-size", style.fontSize);
    
    HM_LOGI("width=%.1f, height=%.1f, radius=%.1f, color=0x%08X, fontSize=%.1f",
            style.width, style.height, style.radius, style.color, style.fontSize);
    
    return style;
}

// ---- Build Tab Bar ----

void TabsComponent::buildTabBar(const nlohmann::json& properties) {
    if (!properties.contains("tabs") || !properties["tabs"].is_array()) {
        return;
    }

    const auto& tabs = properties["tabs"];

    // Keep existing nodes when only the titles change.
    if (!m_tabInfos.empty() && m_tabInfos.size() == tabs.size()) {
        for (size_t i = 0; i < tabs.size(); i++) {
            const auto& tab = tabs[i];
            if (tab.contains("title") && tab["title"].is_string()) {
                const std::string newTitle = tab["title"].get<std::string>();
                if (m_tabInfos[i].title != newTitle) {
                    m_tabInfos[i].title = newTitle;
                    A2UITextNode(m_tabInfos[i].textHandle).setTextContent(newTitle);
                    HM_LOGI("Updated title[%zu]: %s", i, newTitle.c_str());
                }
            }
        }
        updateTabStyles();
        return;
    }

    for (auto& tabInfo : m_tabInfos) {
        if (tabInfo.tabContainerHandle) {
            g_nodeAPI->unregisterNodeEvent(tabInfo.tabContainerHandle, NODE_ON_CLICK);
        }
        g_nodeAPI->removeChild(m_tabBarHandle, tabInfo.tabContainerHandle);
        g_nodeAPI->disposeNode(tabInfo.indicatorHandle);
        g_nodeAPI->disposeNode(tabInfo.textHandle);
        g_nodeAPI->disposeNode(tabInfo.tabContainerHandle);
    }
    m_tabInfos.clear();

    const IndicatorStyle indicatorStyle = resolveIndicatorStyle();

    for (size_t i = 0; i < tabs.size(); i++) {
        const auto& tab = tabs[i];
        TabInfo tabInfo;

        tabInfo.title = tab.contains("title") && tab["title"].is_string()
                        ? tab["title"].get<std::string>() : "Tab";
        tabInfo.childId = tab.contains("child") && tab["child"].is_string()
                          ? tab["child"].get<std::string>() : "";

        tabInfo.tabContainerHandle = g_nodeAPI->createNode(ARKUI_NODE_COLUMN);

        // Stretch the tab cell so the entire bar stays clickable.
        {
            A2UIColumnNode tab(tabInfo.tabContainerHandle);
            tab.setLayoutWeight(1.0f);
            tab.setAlignItems(ARKUI_ITEM_ALIGNMENT_END);
        }

        tabInfo.textHandle = g_nodeAPI->createNode(ARKUI_NODE_TEXT);
        {
            A2UITextNode text(tabInfo.textHandle);
            text.setTextContent(tabInfo.title);
            text.setFontSize(indicatorStyle.fontSize);
            
            ArkUI_NumberValue weightValue[] = {{.f32 = 1.0f}};
            ArkUI_AttributeItem weightItem = {weightValue, 1};
            g_nodeAPI->setAttribute(tabInfo.textHandle, NODE_LAYOUT_WEIGHT, &weightItem);
            text.setPercentWidth(1.0f);
            text.setTextAlign(ARKUI_TEXT_ALIGNMENT_CENTER);
        }

        tabInfo.indicatorHandle = g_nodeAPI->createNode(ARKUI_NODE_COLUMN);
        {
            A2UINode indicator(tabInfo.indicatorHandle);
            indicator.setWidth(indicatorStyle.width);
            indicator.setHeight(indicatorStyle.height);
            indicator.setBackgroundColor(indicatorStyle.color);
            indicator.setBorderRadius(indicatorStyle.radius);
        }

        g_nodeAPI->addChild(tabInfo.tabContainerHandle, tabInfo.textHandle);
        g_nodeAPI->addChild(tabInfo.tabContainerHandle, tabInfo.indicatorHandle);

        // Register the click event
        g_nodeAPI->addNodeEventReceiver(tabInfo.tabContainerHandle, onTabClickEvent);
        g_nodeAPI->registerNodeEvent(tabInfo.tabContainerHandle, NODE_ON_CLICK, static_cast<int32_t>(i), this);

        g_nodeAPI->addChild(m_tabBarHandle, tabInfo.tabContainerHandle);

        m_tabInfos.push_back(tabInfo);

        HM_LOGI( "Tab[%zu]: title=%s, childId=%s",
                    i, tabInfo.title.c_str(), tabInfo.childId.c_str());
    }
    // Children may already be mounted before the tab bar is rebuilt.
    m_contentShown = false;
    tryShowFirstTab();

    updateTabStyles();

    HM_LOGI( "Built %zu tabs", m_tabInfos.size());
}

// ---- Tab Clicks ----

void TabsComponent::onTabClickEvent(ArkUI_NodeEvent* event) {
    void* userData = OH_ArkUI_NodeEvent_GetUserData(event);
    if (!userData) {
        return;
    }

    TabsComponent* self = static_cast<TabsComponent*>(userData);

    int32_t tabIndex = OH_ArkUI_NodeEvent_GetTargetId(event);

    if (tabIndex >= 0 && tabIndex < static_cast<int32_t>(self->m_tabInfos.size())) {
        HM_LOGI( "Clicked tab %d", tabIndex);
        self->showTabContent(tabIndex);
    }
}

// ---- Switch Content ----

void TabsComponent::showTabContent(int index) {
    if (index < 0 || index >= static_cast<int>(m_tabInfos.size())) {
        return;
    }

    if (m_selectedIndex >= 0 && m_selectedIndex < static_cast<int>(m_children.size())) {
        A2UIComponent* currentChild = m_children[m_selectedIndex];
        if (currentChild && currentChild->getNodeHandle()) {
            g_nodeAPI->removeChild(m_contentContainerHandle, currentChild->getNodeHandle());
        }
    }

    m_selectedIndex = index;

    if (m_selectedIndex >= 0 && m_selectedIndex < static_cast<int>(m_children.size())) {
        A2UIComponent* newChild = m_children[m_selectedIndex];
        if (newChild && newChild->getNodeHandle()) {
            g_nodeAPI->addChild(m_contentContainerHandle, newChild->getNodeHandle());
        }
    }

    updateTabStyles();

    HM_LOGI( "Showing tab %d, children=%zu",
                index, m_children.size());
}

// ---- Update Tab Styles ----

void TabsComponent::updateTabStyles() {
    uint32_t fontColor         = kColorPrimaryBlue;
    uint32_t fontColorSelected = kColorBlack;
    float    fontSize          = 32.0f;
    float    fontSizeSelected  = 32.0f;
    bool     fontWeightBold         = false;
    bool     fontWeightSelectedBold = true;

    const nlohmann::json tabsStyles = getComponentStylesFor("Tabs");
    if (tabsStyles.is_object()) {
        if (tabsStyles.contains("tab-font-color") && tabsStyles["tab-font-color"].is_string()) {
            fontColor = parseColor(tabsStyles["tab-font-color"].get<std::string>());
        }
        if (tabsStyles.contains("tab-font-color-selected") && tabsStyles["tab-font-color-selected"].is_string()) {
            fontColorSelected = parseColor(tabsStyles["tab-font-color-selected"].get<std::string>());
        }

        auto readFontSize = [&tabsStyles](const char* key, float& out) {
            if (!tabsStyles.contains(key)) return;
            const auto& v = tabsStyles[key];
            if (v.is_number()) {
                out = v.get<float>();
            } else if (v.is_string()) {
                out = static_cast<float>(std::atof(v.get<std::string>().c_str()));
            }
        };
        readFontSize("tab-font-size",          fontSize);
        readFontSize("tab-font-size-selected",  fontSizeSelected);

        if (tabsStyles.contains("tab-font-weight") && tabsStyles["tab-font-weight"].is_string()) {
            fontWeightBold = (tabsStyles["tab-font-weight"].get<std::string>() == "bold");
        }
        if (tabsStyles.contains("tab-font-weight-selected") && tabsStyles["tab-font-weight-selected"].is_string()) {
            fontWeightSelectedBold = (tabsStyles["tab-font-weight-selected"].get<std::string>() == "bold");
        }
    }

    for (size_t i = 0; i < m_tabInfos.size(); i++) {
        bool isSelected = (static_cast<int>(i) == m_selectedIndex);
        TabInfo& tabInfo = m_tabInfos[i];

        A2UITextNode text(tabInfo.textHandle);
        text.setFontColor(isSelected ? fontColorSelected : fontColor);
        text.setFontSize(isSelected ? fontSizeSelected : fontSize);
        text.setFontWeight(isSelected
            ? (fontWeightSelectedBold ? ARKUI_FONT_WEIGHT_BOLD : ARKUI_FONT_WEIGHT_NORMAL)
            : (fontWeightBold         ? ARKUI_FONT_WEIGHT_BOLD : ARKUI_FONT_WEIGHT_NORMAL));

        A2UINode(tabInfo.indicatorHandle).setVisibility(
            isSelected ? ARKUI_VISIBILITY_VISIBLE : ARKUI_VISIBILITY_HIDDEN);
    }
}

// ---- Child Mounts ----

void TabsComponent::onChildMounted(A2UIComponent* child) {
    HM_LOGI( "child=%s, total children=%zu, expected=%zu",
                child ? child->getId().c_str() : "null", m_children.size(), m_tabInfos.size());
    tryShowFirstTab();
}

void TabsComponent::tryShowFirstTab() {
    if (m_contentShown) {
        return;
    }

    if (m_tabInfos.empty() || m_children.size() < m_tabInfos.size()) {
        return;
    }

    m_contentShown = true;
    showTabContent(m_selectedIndex);

    HM_LOGI( "All %zu tabs ready, showing index %d",
                m_tabInfos.size(), m_selectedIndex);
}

} // namespace a2ui

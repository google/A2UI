#include "list_component.h"
#include "../a2ui_node.h"
#include "log/a2ui_capi_log.h"

namespace a2ui {

// ---- Construction / Destruction ----

ListComponent::ListComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "List") {

    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_LIST);

    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
        if (properties.contains("direction") && properties["direction"].is_string()) {
            m_horizontal = (properties["direction"].get<std::string>() == "horizontal");
        }
        if (properties.contains("scrollable") && properties["scrollable"].is_boolean()) {
            m_scrollable = properties["scrollable"].get<bool>();
        }
    }

    A2UIListNode node(m_nodeHandle);
    node.setScrollBarDisplayOff();
    if (m_horizontal) {
        node.setScrollDirectionHorizontal();
    } else {
        node.setScrollDirectionVertical();
    }
    if (m_scrollable) {
        node.setEdgeEffectSpring();
    } else {
        node.setEdgeEffectNone();
    }

    // Use a fixed item gap.
    node.setItemSpace(15.0f);

    // Only horizontal lists allow gesture scrolling.
    node.setScrollInteraction(m_horizontal);

    HM_LOGI("ListComponent - Created: id=%s, handle=%s, scrollable=%d, horizontal=%d",
             id.c_str(), m_nodeHandle ? "valid" : "null", m_scrollable, m_horizontal);
}

ListComponent::~ListComponent() {
    for (auto& pair : m_listItemWrappers) {
        if (pair.second) {
            g_nodeAPI->disposeNode(pair.second);
        }
    }
    m_listItemWrappers.clear();
    HM_LOGI("ListComponent - Destroyed: id=%s", m_id.c_str());
}

// ---- Child Management ----

void ListComponent::addChild(A2UIComponent* child) {
    if (!child) {
        return;
    }
    A2UIComponent::addChild(child);

    if (!m_nodeHandle || !child->getNodeHandle()) {
        return;
    }

    ArkUI_NodeHandle listItemHandle = createListItemWrapper(child->getNodeHandle());
    g_nodeAPI->addChild(m_nodeHandle, listItemHandle);

    HM_LOGI("id=%s wrapped child=%s in ListItem",
             m_id.c_str(), child->getId().c_str());
}

void ListComponent::removeChild(A2UIComponent* child) {
    if (!child) {
        return;
    }
    if (m_nodeHandle && child->getNodeHandle()) {
        ArkUI_NodeHandle listItemHandle = findListItemWrapper(child->getNodeHandle());
        if (listItemHandle) {
            g_nodeAPI->removeChild(m_nodeHandle, listItemHandle);
            g_nodeAPI->disposeNode(listItemHandle);
            removeListItemWrapper(child->getNodeHandle());
        }
    }
    A2UIComponent::removeChild(child);

    HM_LOGI("id=%s removed child=%s",
             m_id.c_str(), child->getId().c_str());
}

// ---- Property Updates ----

void ListComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        HM_LOGE("handle is null, id=%s", m_id.c_str());
        return;
    }

    applyDirection(properties);
    applyScrollable(properties);
    applyAlign(properties);

    HM_LOGI("id=%s, properties=%s", m_id.c_str(), properties.dump().c_str());
}

// ---- direction ----

void ListComponent::applyDirection(const nlohmann::json& properties) {
    if (!properties.contains("direction") || !properties["direction"].is_string()) {
        return;
    }

    const std::string& dir = properties["direction"].get<std::string>();
    bool nowHorizontal = (dir == "horizontal");
    if (nowHorizontal == m_horizontal) {
        return;
    }
    m_horizontal = nowHorizontal;

    A2UIListNode node(m_nodeHandle);
    if (m_horizontal) {
        node.setScrollDirectionHorizontal();
    } else {
        node.setScrollDirectionVertical();
    }

    for (auto& pair : m_listItemWrappers) {
        applyListItemConstraints(pair.second, pair.first);
    }

    // Only horizontal lists allow gesture scrolling.
    node.setScrollInteraction(m_horizontal);

}

// ---- scrollable ----

void ListComponent::applyScrollable(const nlohmann::json& properties) {
    if (!properties.contains("scrollable") || !properties["scrollable"].is_boolean()) {
        return;
    }

    bool newScrollable = properties["scrollable"].get<bool>();
    if (newScrollable == m_scrollable) {
        return;
    }
    m_scrollable = newScrollable;

    A2UIListNode node(m_nodeHandle);
    if (m_scrollable) {
        node.setEdgeEffectSpring();
    } else {
        node.setEdgeEffectNone();
    }
}

// ---- align ----

void ListComponent::applyAlign(const nlohmann::json& properties) {
    if (!properties.contains("align") || !properties["align"].is_string()) {
        return;
    }
    int32_t alignValue = mapAlignItems(properties["align"].get<std::string>());
    ArkUI_NumberValue value[] = {{.i32 = alignValue}};
    ArkUI_AttributeItem item = {value, 1};
    g_nodeAPI->setAttribute(m_nodeHandle, NODE_LIST_ALIGN_LIST_ITEM, &item);
}

// ---- Enum Mappings ----

int32_t ListComponent::mapAlignItems(const std::string& align) {
    if (align == "center") {
        return ARKUI_LIST_ITEM_ALIGNMENT_CENTER;
    } else if (align == "end") {
        return ARKUI_LIST_ITEM_ALIGNMENT_END;
    }
    return ARKUI_LIST_ITEM_ALIGNMENT_START;
}

// ---- Helper Methods ----

bool ListComponent::isHorizontal() const {
    return m_horizontal;
}

/**
 * Apply unified size constraints (percentages) to ListItem and its child content:
 *
 * Vertical mode (default):
 *   - ListItem: width=100%, height follows its child
 *   - Child node: width=100%, matching the ListItem
 *
 * Horizontal mode:
 *   - ListItem: height=100%, width follows its child
 *   - Child node: height=100%, matching the ListItem
 */
void ListComponent::applyListItemConstraints(ArkUI_NodeHandle listItemHandle,
                                              ArkUI_NodeHandle childHandle) {
    if (!listItemHandle || !childHandle) {
        return;
    }

    A2UINode listItemNode(listItemHandle);
    A2UINode childNode(childHandle);

    if (m_horizontal) {
        listItemNode.setPercentHeight(1.0f);
        childNode.setPercentHeight(1.0f);
        // Clear vertical-only constraints in horizontal mode.
        listItemNode.resetPadding();
        listItemNode.resetLayoutWeight();
    } else {
        listItemNode.setPercentWidth(1.0f);
        childNode.setPercentWidth(1.0f);
        // Add horizontal padding and distribute vertical items evenly.
        listItemNode.setPadding(10.0f, 15.0f, 10.0f, 15.0f);
        listItemNode.setLayoutWeight(1.0f);
    }
}

ArkUI_NodeHandle ListComponent::createListItemWrapper(ArkUI_NodeHandle childHandle) {
    ArkUI_NodeHandle listItemHandle = g_nodeAPI->createNode(ARKUI_NODE_LIST_ITEM);

    g_nodeAPI->addChild(listItemHandle, childHandle);

    applyListItemConstraints(listItemHandle, childHandle);

    m_listItemWrappers.push_back({childHandle, listItemHandle});
    return listItemHandle;
}

ArkUI_NodeHandle ListComponent::findListItemWrapper(ArkUI_NodeHandle childHandle) const {
    for (const auto& pair : m_listItemWrappers) {
        if (pair.first == childHandle) {
            return pair.second;
        }
    }
    return nullptr;
}

void ListComponent::removeListItemWrapper(ArkUI_NodeHandle childHandle) {
    for (auto it = m_listItemWrappers.begin(); it != m_listItemWrappers.end(); ++it) {
        if (it->first == childHandle) {
            m_listItemWrappers.erase(it);
            return;
        }
    }
}

} // namespace a2ui

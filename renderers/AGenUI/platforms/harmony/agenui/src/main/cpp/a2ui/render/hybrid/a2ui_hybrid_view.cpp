#include "a2ui_hybrid_view.h"
#include "a2ui_hybrid_factory.h"
#include "a2ui/render/a2ui_node.h"
#include <arkui/native_node_napi.h>
#include "a2ui/render/a2ui_component_state.h"
#include "a2ui/utils/a2ui_unit_utils.h"

namespace a2ui {

A2UIHybridView::A2UIHybridView(const std::string &id, const std::string &componentType, const nlohmann::json& properties,
                               ArkUI_NodeHandle arkuiHandle, const ArkTSObject& componentContent): A2UIComponent(id, componentType), m_arkuiHandle(arkuiHandle), m_componentContent(componentContent) {
    
    m_properties = properties; // Temporary initialization.
    // Create the STACK placeholder node for the ArkTS view.
    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_STACK);
    
    // Attach the ArkUI node to the root container.
    if (m_arkuiHandle) {
        g_nodeAPI->addChild(m_nodeHandle, m_arkuiHandle);
    }
}

A2UIHybridView::~A2UIHybridView() {
    // Release the NAPI reference.
    napi_delete_reference(m_componentContent.env, m_componentContent.ref);
    
    // Notify the factory to destroy the hybrid view
    A2UIHybridFactory::destroyHybridView(this);
    
    // Release the ArkUI node.
    if (m_arkuiHandle) {
        g_nodeAPI->disposeNode(m_arkuiHandle);
        m_arkuiHandle = nullptr;
    }

    // Release the ComponentState.  Ownership was transferred to this view by
    // createHybridComponent() via state.release(); we are the sole owner.
    delete m_state;
    m_state = nullptr;
}

void A2UIHybridView::updateView() {
    // Propagate dirty state updates to the hybrid factory.
    
    if (!m_state) {
        // Fall back to the base implementation when no state is attached.
        A2UIComponent::updateView();
        return;
    }
    
    // Collect dirty properties.
    const auto& dirtyProps = m_state->getDirtyProperties();
    
    // Build the UpdateState list.
    std::vector<UpdateState> updateStates;
    updateStates.reserve(dirtyProps.size());
    
    for (const auto& key : dirtyProps) {
        // Mark the attribute as changed.
        updateStates.emplace_back(UpdateType::AttributeChanged, key);
        
        // Refresh the local property value.
        const auto& props = getProperties();
        if (props.contains(key)) {
            onUpdateProperty(key, props[key]);
        }
    }
    
    // Clear the dirty flags.
    m_state->clearDirty();
    
    // Notify the factory to update the hybrid view
    if (!updateStates.empty()) {
        A2UIHybridFactory::updateHybridView(this, updateStates);
    }
}

void A2UIHybridView::updateLayout() {
    // Only push the computed layout size to ArkTS.
    const auto& props = getProperties();
    float width = getWidth();
    float height = getHeight();
    // height == 0 means the ArkTS side owns height sizing.

    if (width == 0.0f) {
        // Use 100% placeholders when width is still unknown.
        A2UINode node(m_nodeHandle);
        node.setPercentWidth(1.0f);
        node.setPercentHeight(1.0f);
    } else {
        // Convert a2ui units to vp before syncing to ArkTS.
        updateAttributeToHybridView("__width__", std::to_string(UnitConverter::a2uiToVp(width)));
        if (height > 0.0f) {
            // Only push height when it is explicitly known.
            updateAttributeToHybridView("__height__", std::to_string(UnitConverter::a2uiToVp(height)));
        }
    }
}

void A2UIHybridView::onSetHitTestMode(ArkUI_HitTestMode mode) {
    // Forward hit-test changes to the embedded ArkUI node.
    if (m_arkuiHandle) {
        A2UINode arkuiNode(m_arkuiHandle);
        arkuiNode.setHitTestBehavior(mode);
    }
}

void A2UIHybridView::onInvokeEx(const std::string& key, const nlohmann::json& params) {
    // Keep the base view state in sync before invoking ArkTS.
    A2UIComponent::updateView();
    
    // Notify the factory to invoke the hybrid view method
    A2UIHybridFactory::onInvokeHybridView(this, key, params);
}

void A2UIHybridView::updateAttributeToHybridView(const std::string &key, const std::string &value) {
    std::vector<UpdateState> updateStates;
    updateStates.emplace_back(UpdateType::AttributeChanged, key);
    nlohmann::json json;
    json[key] = value;
    m_state->updateProperties(json);
    A2UIHybridFactory::updateHybridView(this, updateStates);
}

void A2UIHybridView::onPageShow(bool appSwitch) {
    // Reserved for subclass behavior.
}

void A2UIHybridView::onPageHide(bool appSwitch) {
    // Reserved for subclass behavior.
}

void A2UIHybridView::onUpdateProperty(const std::string& key, const nlohmann::json& value) {
    // Subclasses can override this to handle attribute updates locally.
    std::vector<UpdateState> updateStates;
    updateStates.emplace_back(UpdateType::AttributeChanged, key);
    A2UIHybridFactory::updateHybridView(this, updateStates);
}

} // namespace a2ui

#include "modal_component.h"
#include "../a2ui_node.h"
#include "../../utils/a2ui_color_palette.h"
#include <arkui/native_interface.h>
#include "log/a2ui_capi_log.h"

namespace a2ui {

ModalComponent::ModalComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "Modal") {

    // Load the NativeDialog API.
    OH_ArkUI_GetModuleInterface(ARKUI_NATIVE_DIALOG, ArkUI_NativeDialogAPI_1, m_dialogAPI);

    // Create the root node.
    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_COLUMN);

    // Stretch the root to keep a reliable hit area.
    A2UINode(m_nodeHandle).setPercentWidth(100.0f);

    // Register click handling on the root node.
    g_nodeAPI->addNodeEventReceiver(m_nodeHandle, onTriggerClickCallback);
    g_nodeAPI->registerNodeEvent(m_nodeHandle, NODE_ON_CLICK, 0, this);

    // Pre-create the dialog content container.
    m_dialogContentContainer = g_nodeAPI->createNode(ARKUI_NODE_STACK);
    A2UINode(m_dialogContentContainer).setBackgroundColor(colors::kColorTransparent);
    
    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    HM_LOGI("ModalComponent - Created: id=%s", id.c_str());
}

ModalComponent::~ModalComponent() {
    // Close the dialog if it is still visible.
    dismissDialog();

    // Unregister the root click handler.
    if (m_nodeHandle) {
        g_nodeAPI->unregisterNodeEvent(m_nodeHandle, NODE_ON_CLICK);
    }
    // Detach the content node before disposing the dialog container.
    if (m_contentComponent && m_contentComponent->getNodeHandle() && m_dialogContentContainer) {
        g_nodeAPI->removeChild(m_dialogContentContainer, m_contentComponent->getNodeHandle());
    }
    if (m_dialogContentContainer) {
        g_nodeAPI->disposeNode(m_dialogContentContainer);
        m_dialogContentContainer = nullptr;
    }

    HM_LOGI("ModalComponent - Destroyed: id=%s", m_id.c_str());
}

// ---- shouldAutoAddChildView ----

bool ModalComponent::shouldAutoAddChildView() const {
    // Modal manages native child mounting itself.
    return false;
}

// ---- onChildMounted ----

void ModalComponent::onChildMounted(A2UIComponent* child) {
    if (!child) {
        return;
    }

    if (!m_triggerComponent) {
        // The first child becomes the trigger.
        m_triggerComponent = child;

        // Attach the trigger node to the root.
        if (m_nodeHandle && child->getNodeHandle()) {
            g_nodeAPI->addChild(m_nodeHandle, child->getNodeHandle());
        }

        // Refresh layout so the tap region stays in sync.
        if (m_nodeHandle) {
            g_nodeAPI->markDirty(m_nodeHandle, NODE_NEED_MEASURE);
            g_nodeAPI->markDirty(m_nodeHandle, NODE_NEED_LAYOUT);
        }

        HM_LOGI("Set trigger: %s", child->getId().c_str());

    } else if (!m_contentComponent) {
        // The second child becomes the dialog content.
        m_contentComponent = child;

        // Mount the content node into the dialog container.
        if (m_dialogContentContainer && child->getNodeHandle()) {
            ArkUI_NodeHandle contentNode = child->getNodeHandle();
            g_nodeAPI->addChild(m_dialogContentContainer, contentNode);
            A2UINode(contentNode).setBackgroundColor(0xFFFFFFFFu);
            // Apply the default outer margin.
            A2UINode(contentNode).setMargin(8.0f);
            // Apply the default left padding.
            A2UINode(contentNode).setPadding(0.0f, 0.0f, 0.0f, 12.0f);
        }

        HM_LOGI("Set content: %s", child->getId().c_str());
    } else {
        HM_LOGW("Ignoring extra child: %s (already have trigger and content)",
                    child->getId().c_str());
    }
}

// ---- Show Dialog ----

void ModalComponent::showDialog() {
    if (!m_dialogAPI) {
        HM_LOGE("Dialog API is null");
        return;
    }

    if (m_dialogHandle) {
        HM_LOGW("Dialog already showing");
        return;
    }

    // Create the dialog handle.
    m_dialogHandle = m_dialogAPI->create();
    if (!m_dialogHandle) {
        HM_LOGE("Failed to create dialog");
        return;
    }

    // Attach the dialog content.
    m_dialogAPI->setContent(m_dialogHandle, m_dialogContentContainer);

    // Enable modal behavior.
    m_dialogAPI->setModalMode(m_dialogHandle, true);
    
    // Use a 50% black mask.
    m_dialogAPI->setMask(m_dialogHandle, 0x80000000u, nullptr);
    
    // Allow tapping the mask to dismiss the dialog.
    m_dialogAPI->setAutoCancel(m_dialogHandle, true);

    // Reset the handle when the dialog is dismissed externally.
    m_dialogAPI->registerOnWillDismissWithUserData(m_dialogHandle, this, [](ArkUI_DialogDismissEvent* event) {
        // Allow the dialog to dismiss normally.
        OH_ArkUI_DialogDismissEvent_SetShouldBlockDismiss(event, false);
        // Recover the bound instance and clear its handle.
        auto* component = static_cast<ModalComponent*>(OH_ArkUI_DialogDismissEvent_GetUserData(event));
        if (component) {
            component->m_dialogHandle = nullptr;
            HM_LOGI("handle reset, id=%s", component->m_id.c_str());
        }
    });

    // Keep the dialog background transparent.
    m_dialogAPI->setBackgroundColor(m_dialogHandle, 0x00000000u);
    // Let the custom content drive the dialog chrome.
    m_dialogAPI->enableCustomStyle(m_dialogHandle, true);

    // Center the dialog content.
    m_dialogAPI->setContentAlignment(m_dialogHandle, ARKUI_ALIGNMENT_CENTER, 0, 0);

    // Show the dialog.
    m_dialogAPI->show(m_dialogHandle, false);

    HM_LOGI("Dialog shown, id=%s", m_id.c_str());
}

// ---- Dismiss Dialog ----

void ModalComponent::dismissDialog() {
    if (!m_dialogAPI || !m_dialogHandle) {
        return;
    }

    // Close the dialog.
    m_dialogAPI->close(m_dialogHandle);

    // Detach the dialog content.
    m_dialogAPI->removeContent(m_dialogHandle);

    // Dispose the dialog handle.
    m_dialogAPI->dispose(m_dialogHandle);
    m_dialogHandle = nullptr;

    HM_LOGI("Dialog dismissed, id=%s", m_id.c_str());
}

// ---- Trigger Click Callback ----

void ModalComponent::onTriggerClickCallback(ArkUI_NodeEvent* event) {
    auto* component = static_cast<ModalComponent*>(OH_ArkUI_NodeEvent_GetUserData(event));
    if (component) {
        HM_LOGI("Trigger clicked, showing dialog");
        component->showDialog();
    }
}

void ModalComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        HM_LOGE("handle is null, id=%s", m_id.c_str());
        return;
    }

    HM_LOGI("Applied properties, id=%s", m_id.c_str());
}

} // namespace a2ui

#pragma once

#include <arkui/native_dialog.h>
#include "../a2ui_component.h"

namespace a2ui {

/**
 * Modal dialog component backed by native_dialog.h.
 *
 * Layout structure:
 *   ARKUI_NODE_COLUMN (root node that hosts the trigger child)
 *     └── [trigger child nodeHandle] -- first child, used to open the dialog
 *
 *   ArkUI_NativeDialogHandle (dialog outside the component tree)
 *     └── ARKUI_NODE_COLUMN (dialog content container)
 *           ├── [content child nodeHandle] -- second child content
 *           └── ARKUI_NODE_BUTTON ("Close" button)
 *
 * Supported properties:
 *   - title: reserved dialog title
 *   - visible: reserved visibility flag
 *   - child management: first child = trigger, second child = content
 */
class ModalComponent : public A2UIComponent {
public:
    ModalComponent(const std::string& id, const nlohmann::json& properties);
    ~ModalComponent() override;

    /** Modal manages child mounting itself. */
    bool shouldAutoAddChildView() const override;

    /**
     * Child mount callback invoked by Surface after addChild.
     * Since the base addChild is not virtual, mounting is handled through
     * the same dynamic_cast + onChildMounted pattern used by TabsComponent.
     */
    void onChildMounted(A2UIComponent* child);

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    /** Show the modal dialog. */
    void showDialog();

    /** Dismiss the modal dialog. */
    void dismissDialog();

    /** Static trigger click callback that routes through userData. */
    static void onTriggerClickCallback(ArkUI_NodeEvent* event);

    A2UIComponent* m_triggerComponent = nullptr;
    A2UIComponent* m_contentComponent = nullptr;

    ArkUI_NativeDialogAPI_1* m_dialogAPI = nullptr;
    ArkUI_NativeDialogHandle m_dialogHandle = nullptr;
    ArkUI_NodeHandle m_dialogContentContainer = nullptr;
};

} // namespace a2ui

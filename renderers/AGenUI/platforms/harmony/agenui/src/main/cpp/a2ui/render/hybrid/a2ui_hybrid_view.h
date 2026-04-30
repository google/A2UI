#pragma once

#include "a2ui/render/a2ui_component.h"
#include "napi/native_api.h"
#include <arkui/native_node.h>
#include "a2ui_api.h"

namespace a2ui {

/**
 * Hybrid view wrapper for ArkTS-backed components.
 *
 * It supports mixed C++ / ArkTS composition and custom business components.
 */
class A2UIHybridView : public A2UIComponent {
public:
    /**
     * Constructor
     * @param id Component ID
     * @param componentType Component type
     * @param arkuiHandle Native ArkUI node handle
     * @param componentContent ArkTS component content object, including env and ref
     */
    A2UIHybridView(const std::string& id, const std::string& componentType, const nlohmann::json& properties, 
                   ArkUI_NodeHandle arkuiHandle, const ArkTSObject& componentContent);
    
    virtual ~A2UIHybridView();
    
    /**
     * Perform an incremental view update.
     */
    void updateView() override;
    
    /**
     * Forward an updated attribute to the hybrid view.
     * @param key Attribute key
     * @param value Attribute value
     */
    void updateAttributeToHybridView(const std::string& key, const std::string& value);
    
    /**
     * Page show callback
     * @param appSwitch Whether the page transition was triggered by app switching
     */
    virtual void onPageShow(bool appSwitch);
    
    /**
     * Page hide callback
     * @param appSwitch Whether the page transition was triggered by app switching
     */
    virtual void onPageHide(bool appSwitch);
    
    /**
     * Return the native ArkUI node handle.
     */
    ArkUI_NodeHandle getArkUIHandle() const { return m_arkuiHandle; }

protected:
    /**
     * Hook for single-property updates.
     */
    void onUpdateProperty(const std::string& key, const nlohmann::json& value) override;
    
    /**
     * Refresh layout.
     */
    virtual void updateLayout();
    
    /**
     * Set the hit-test mode.
     * @param mode Hit-test mode
     */
    virtual void onSetHitTestMode(ArkUI_HitTestMode mode);
    
    /**
     * Invoke an extension method.
     * @param key Method key
     * @param params Parameter list
     */
    virtual void onInvokeEx(const std::string& key, const nlohmann::json& params);

protected:
    // Native ArkUI node handle
    ArkUI_NodeHandle m_arkuiHandle = nullptr;
    
    ArkTSObject m_componentContent;
};

} // namespace a2ui

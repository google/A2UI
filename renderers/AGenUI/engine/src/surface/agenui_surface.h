#pragma once

// Standard library headers
#include <map>
#include <memory>
#include <string>
#include <vector>

// Third-party library headers
#include "nlohmann/json.hpp"

// Project headers
#include "agenui_dispatcher_types.h"
#include "agenui_expression_parser.h"
#include "agenui_component_render_observable.h"
#include "agenui_surface_layout_observable.h"
#include "component_manager/agenui_icomponent_manager.h"
#include "virtual_dom/agenui_virtual_dom_observer.h"
#include "virtual_dom/agenui_ivirtual_dom.h"
#include "datamodel/agenui_idata_model.h"
#include "agenui_errorcode_define.h"

namespace agenui {

class SurfaceManager;

// Represents a UI surface that manages component tree and data model
class Surface : public IVirtualDOMObserver {
public:
    // Lifecycle
    Surface(const std::string& surfaceId, const std::string& theme, SurfaceManager* surfaceManager);
    ~Surface();
    
    // Getters
    const std::string& getSurfaceId() const;
    IDataModel* getDataModel() const;
    
    // Markdown size update
    void updateComponentSize(const ComponentRenderInfo& info);
    
    // Surface size update
    void updateSurfaceSize(const SurfaceLayoutInfo& info);
    
    // Component management
    AGenUIExeCode updateComponents(const nlohmann::json& componentsData);
    void onNodeUpdate(const std::string& componentId, const std::string& nodeJson) override;
    void onNodeAdded(const std::string& parentId, const std::string& nodeJson) override;
    void onNodeRemoved(const std::string& parentId, const std::string& id) override;
    
    // Data model management
    void updateDataModel(const nlohmann::json& dataModelData);
    void appendDataModel(const nlohmann::json& dataModelData);
    void syncUIToData(const std::string& componentId, const std::string& changingData);
    
    // User interaction
    void handleUserAction(const std::string& sourceComponentId);
    
    // Style management
    void refreshStyleTokens();

private:
    void sendCachedComponentMessages();
    
    std::string _surfaceId;
    std::string _theme;
    IDataModel* _dataModel;
    IVirtualDOM* _virtualDom;
    IComponentManager* _componentManager;
    SurfaceManager* _surfaceManager = nullptr;
    std::map<std::string, std::string> _cachedComponentMessages;
    bool _isDestroying = false;  // Destruction guard: prevents VirtualDOMNode callbacks from triggering triggerLayoutUpdate during destruction
};

}  // namespace agenui

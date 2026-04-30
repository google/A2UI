#include "a2ui_message_listener.h"
#include "hilog/log.h"
#include "log/a2ui_capi_log.h"
#include "render/a2ui_surface.h"
#include "render/a2ui_component_types.h"
#include "render/factory/a2ui_component_creator.h"
#include <nlohmann/json.hpp>
#include "utils/a2ui_log_utils.h"

#undef LOG_DOMAIN
#undef LOG_TAG
#define LOG_DOMAIN 0x0000
#define LOG_TAG "A2UIMessageListener"

extern napi_env a2ui_get_napi_env();

namespace agenui {

// Static member initialization
std::map<std::string, int> A2UIMessageListener::s_surfaceIdToEngineId_;
std::mutex A2UIMessageListener::s_mappingMutex_;

A2UIMessageListener::A2UIMessageListener(int engineId)
    : engineId_(engineId), surfaceManager_(nullptr), tsfn_(nullptr) {
    initGlobalRegistry();
    surfaceManager_ = new a2ui::A2UISurfaceManager(&globalRegistry_);
    HM_LOGI("A2UIMessageListener created, engineId=%d, factories=%d",
            engineId_, globalRegistry_.getRegisteredFactoryCount());
}

A2UIMessageListener::~A2UIMessageListener() {
    // tsfn_ is owned by napi_init.cpp and must not be released here.
    tsfn_ = nullptr;

    napi_env env = a2ui_get_napi_env();
    for (auto& ref : listeners_) {
        napi_delete_reference(env, ref);
    }
    listeners_.clear();

    if (surfaceManager_) {
        delete surfaceManager_;
        surfaceManager_ = nullptr;
    }

    HM_LOGI("A2UIMessageListener destroyed, engineId=%d", engineId_);
}

void A2UIMessageListener::setTsfn(napi_threadsafe_function tsfn) {
    tsfn_ = tsfn;
    HM_LOGI("setTsfn: tsfn assigned, engineId=%d, tsfn=%p", engineId_, (void*)tsfn);
}

void A2UIMessageListener::postToMainThread(MainThreadTask task) {
    if (!tsfn_) {
        HM_LOGE("postToMainThread: tsfn not initialized, engineId=%d, dropping task", engineId_);
        return;
    }
    auto* taskPtr = new MainThreadTask(std::move(task));
    napi_status status = napi_call_threadsafe_function(tsfn_, taskPtr, napi_tsfn_nonblocking);
    if (status != napi_ok) {
        HM_LOGE("postToMainThread: napi_call_threadsafe_function failed, engineId=%d, status=%d", engineId_, status);
        delete taskPtr;
    }
}

void A2UIMessageListener::initGlobalRegistry() {
    auto makeCreator = [](const std::string& type) -> a2ui::A2UIComponentCreator* {
        auto* creator = new a2ui::A2UIComponentCreator();
        creator->setType(type);
        return creator;
    };

    globalRegistry_.registerFactory(a2ui::ComponentType::kText,         makeCreator(a2ui::ComponentType::kText));
    globalRegistry_.registerFactory(a2ui::ComponentType::kColumn,       makeCreator(a2ui::ComponentType::kColumn));
    globalRegistry_.registerFactory(a2ui::ComponentType::kIcon,         makeCreator(a2ui::ComponentType::kIcon));
    globalRegistry_.registerFactory(a2ui::ComponentType::kTabs,         makeCreator(a2ui::ComponentType::kTabs));
    globalRegistry_.registerFactory(a2ui::ComponentType::kCard,         makeCreator(a2ui::ComponentType::kCard));
    globalRegistry_.registerFactory(a2ui::ComponentType::kList,         makeCreator(a2ui::ComponentType::kList));
    globalRegistry_.registerFactory(a2ui::ComponentType::kButton,       makeCreator(a2ui::ComponentType::kButton));
    globalRegistry_.registerFactory(a2ui::ComponentType::kImage,        makeCreator(a2ui::ComponentType::kImage));
    globalRegistry_.registerFactory(a2ui::ComponentType::kTextField,    makeCreator(a2ui::ComponentType::kTextField));
    globalRegistry_.registerFactory(a2ui::ComponentType::kRow,          makeCreator(a2ui::ComponentType::kRow));
    globalRegistry_.registerFactory(a2ui::ComponentType::kSlider,       makeCreator(a2ui::ComponentType::kSlider));
    globalRegistry_.registerFactory(a2ui::ComponentType::kCheckBox,     makeCreator(a2ui::ComponentType::kCheckBox));
    globalRegistry_.registerFactory(a2ui::ComponentType::kChoicePicker, makeCreator(a2ui::ComponentType::kChoicePicker));
    globalRegistry_.registerFactory(a2ui::ComponentType::kDateTimeInput,makeCreator(a2ui::ComponentType::kDateTimeInput));
    globalRegistry_.registerFactory(a2ui::ComponentType::kModal,        makeCreator(a2ui::ComponentType::kModal));
    globalRegistry_.registerFactory(a2ui::ComponentType::kRichText,     makeCreator(a2ui::ComponentType::kRichText));
    globalRegistry_.registerFactory(a2ui::ComponentType::kTable,        makeCreator(a2ui::ComponentType::kTable));
    globalRegistry_.registerFactory(a2ui::ComponentType::kVideo,        makeCreator(a2ui::ComponentType::kVideo));
    globalRegistry_.registerFactory(a2ui::ComponentType::kAudioPlayer,  makeCreator(a2ui::ComponentType::kAudioPlayer));
    globalRegistry_.registerFactory(a2ui::ComponentType::kCarousel,     makeCreator(a2ui::ComponentType::kCarousel));
    globalRegistry_.registerFactory(a2ui::ComponentType::kDivider,      makeCreator(a2ui::ComponentType::kDivider));
    globalRegistry_.registerFactory(a2ui::ComponentType::kWeb,          makeCreator(a2ui::ComponentType::kWeb));
}

a2ui::A2UISurfaceManager* A2UIMessageListener::getSurfaceManager() {
    return surfaceManager_;
}

// ==================== surfaceId -> engineId Mapping ====================

void A2UIMessageListener::registerSurfaceMapping(const std::string& surfaceId) {
    std::lock_guard<std::mutex> lock(s_mappingMutex_);
    s_surfaceIdToEngineId_[surfaceId] = engineId_;
    HM_LOGI("Surface mapping registered: surfaceId=%s -> engineId=%d", surfaceId.c_str(), engineId_);
}

void A2UIMessageListener::unregisterSurfaceMapping(const std::string& surfaceId) {
    unregisterSurfaceMappingStatic(surfaceId);
}

void A2UIMessageListener::unregisterSurfaceMappingStatic(const std::string& surfaceId) {
    std::lock_guard<std::mutex> lock(s_mappingMutex_);
    s_surfaceIdToEngineId_.erase(surfaceId);
    HM_LOGI("Surface mapping unregistered: surfaceId=%s", surfaceId.c_str());
}

int A2UIMessageListener::findEngineIdBySurfaceId(const std::string& surfaceId) {
    std::lock_guard<std::mutex> lock(s_mappingMutex_);
    auto it = s_surfaceIdToEngineId_.find(surfaceId);
    if (it != s_surfaceIdToEngineId_.end()) {
        return it->second;
    }
    return 0;
}

// ==================== IAGenUIMessageListener Implementation ====================

void A2UIMessageListener::onCreateSurface(const CreateSurfaceMessage& msg) {
    HM_LOGI("engineId=%d, surfaceId=%s, catalogId=%s" , engineId_, msg.surfaceId.c_str(), msg.catalogId.c_str());
    // listeners_ and surfaceManager_ are only touched on the main thread.
    std::string surfaceId = msg.surfaceId;
    bool animated = msg.animated;
    postToMainThread([this, surfaceId, animated](napi_env env) {
        // Register the surfaceId -> engineId mapping.
        registerSurfaceMapping(surfaceId);
        a2ui::A2UISurface* surface = surfaceManager_->createSurface(surfaceId, animated);
        if (!surface) {
            HM_LOGE("Failed to create surface: %s", surfaceId.c_str());
            return;
        }

        // Notify ArkTS listeners after the surface is created.
        for (auto& ref : listeners_) {
            napi_value listener = nullptr;
            napi_get_reference_value(env, ref, &listener);
            if (!listener) continue;

            napi_value onCreatedFunc = nullptr;
            napi_get_named_property(env, listener, "onCreateSurface", &onCreatedFunc);

            napi_valuetype funcType = napi_undefined;
            if (onCreatedFunc) napi_typeof(env, onCreatedFunc, &funcType);
            if (funcType == napi_function) {
                napi_value surfaceIdValue = nullptr;
                napi_create_string_utf8(env, surfaceId.c_str(), NAPI_AUTO_LENGTH, &surfaceIdValue);
                napi_value args[] = { surfaceIdValue };
                napi_value result = nullptr;
                napi_call_function(env, listener, onCreatedFunc, 1, args, &result);  // 1 arg: surfaceId
            }
        }
    });
}

void A2UIMessageListener::onUpdateComponents(const UpdateComponentsMessage& msg) {
    // Deprecated: use onComponentsUpdate / onComponentsAdd / onComponentsRemove.
    HM_LOGW("[DEPRECATED] engineId=%d, surfaceId=%s", engineId_, msg.surfaceId.c_str());
}

void A2UIMessageListener::onContentHandleReady() {
    HM_LOGI("Method deprecated, use bindSurface instead");
}

void A2UIMessageListener::onDeleteSurface(const DeleteSurfaceMessage& msg) {
    HM_LOGI("engineId=%d, surfaceId=%s", engineId_, msg.surfaceId.c_str());

    // listeners_ and surfaceManager_ are only touched on the main thread.
    std::string surfaceId = msg.surfaceId;
    postToMainThread([this, surfaceId](napi_env env) {
        for (auto& ref : listeners_) {
            napi_value listener = nullptr;
            napi_get_reference_value(env, ref, &listener);
            if (!listener) continue;

            napi_value onDestroyedFunc = nullptr;
            napi_get_named_property(env, listener, "onDeleteSurface", &onDestroyedFunc);

            napi_valuetype funcType = napi_undefined;
            if (onDestroyedFunc) napi_typeof(env, onDestroyedFunc, &funcType);
            if (funcType == napi_function) {
                napi_value surfaceIdValue = nullptr;
                napi_create_string_utf8(env, surfaceId.c_str(), NAPI_AUTO_LENGTH, &surfaceIdValue);
                napi_value result = nullptr;
                napi_call_function(env, listener, onDestroyedFunc, 1, &surfaceIdValue, &result);
            }
        }

        surfaceManager_->destroySurface(surfaceId);

        // Remove the surfaceId -> engineId mapping.
        A2UIMessageListener::unregisterSurfaceMappingStatic(surfaceId);

        HM_LOGI("Surface destroyed: %s, remaining: %d", surfaceId.c_str(), surfaceManager_->getSurfaceCount());
    });
}

void A2UIMessageListener::onComponentsUpdate(const std::string &surfaceId, const std::vector<ComponentsUpdateMessage> &msg) {
    for (size_t msgIndex = 0; msgIndex < msg.size(); ++msgIndex) {
        std::string brief = A2UILogUtils::formatComponentBrief(msg[msgIndex].component);
        HM_LOGI("->msg%zu: %s", msgIndex + 1, brief.c_str());
    }

    // surfaceManager_ is only accessed on the main thread.
    postToMainThread([this, surfaceId, msg](napi_env /*env*/) {
        a2ui::A2UISurface* surface = surfaceManager_->getSurface(surfaceId);
        if (!surface) {
            HM_LOGE("onComponentsUpdate: Surface not found: %s", surfaceId.c_str());
            return;
        }
        surface->handleComponentsUpdate(msg);
    });
}
    
void A2UIMessageListener::onComponentsAdd(const std::string &surfaceId, const std::vector<ComponentsAddMessage> &msg) {
    for (size_t msgIndex = 0; msgIndex < msg.size(); ++msgIndex) {
        std::string brief = A2UILogUtils::formatComponentBrief(msg[msgIndex].component);
        HM_LOGI("->msg%zu: %s", msgIndex + 1, brief.c_str());
    }

    // surfaceManager_ is only accessed on the main thread.
    postToMainThread([this, surfaceId, msg](napi_env /*env*/) {
        a2ui::A2UISurface* surface = surfaceManager_->getSurface(surfaceId);
        if (!surface) {
            HM_LOGE("onComponentsAdd: Surface not found: %s", surfaceId.c_str());
            return;
        }
        for (const auto& m : msg) {
            surface->handleComponentAdd(m);
        }
    });
}

void A2UIMessageListener::onComponentsRemove(const std::string &surfaceId, const std::vector<ComponentsRemoveMessage> &msg) {
    HM_LOGI("surfaceId: %s, count: %zu", surfaceId.c_str(), msg.size());

    // surfaceManager_ is only accessed on the main thread.
    postToMainThread([this, surfaceId, msg](napi_env /*env*/) {
        a2ui::A2UISurface* surface = surfaceManager_->getSurface(surfaceId);
        if (!surface) {
            HM_LOGE("onComponentsRemove: Surface not found: %s", surfaceId.c_str());
            return;
        }
        surface->handleComponentsRemove(msg);
    });
}

void A2UIMessageListener::onInteractionStatusEvent(int32_t eventType, const std::string &content) {
    HM_LOGI("engineId=%d, type: %d, content: %s", engineId_, eventType, content.c_str());
}

void A2UIMessageListener::onActionEventRouted(const std::string &content) {
    HM_LOGI("engineId=%d, content: %s", engineId_, content.c_str());

    // listeners_ are only accessed on the main thread.
    std::string contentCopy = content;
    postToMainThread([this, contentCopy](napi_env env) {
        for (auto& ref : listeners_) {
            napi_value listener = nullptr;
            napi_get_reference_value(env, ref, &listener);
            if (!listener) continue;

            napi_value onActionEventRoutedFunc = nullptr;
            napi_get_named_property(env, listener, "onActionEventRouted", &onActionEventRoutedFunc);

            napi_valuetype funcType = napi_undefined;
            if (onActionEventRoutedFunc) napi_typeof(env, onActionEventRoutedFunc, &funcType);
            if (funcType == napi_function) {
                napi_value contentValue = nullptr;
                napi_create_string_utf8(env, contentCopy.c_str(), NAPI_AUTO_LENGTH, &contentValue);
                napi_value result = nullptr;
                napi_call_function(env, listener, onActionEventRoutedFunc, 1, &contentValue, &result);
            }
        }
    });
}

void A2UIMessageListener::registerListener(napi_value listener) {
    napi_env env = a2ui_get_napi_env();
    
    napi_ref ref = nullptr;
    napi_create_reference(env, listener, 1, &ref);
    listeners_.push_back(ref);
    
    HM_LOGI("engineId=%d, listener registered, total: %zu", engineId_, listeners_.size());
}

void A2UIMessageListener::unregisterListener(napi_value listener) {
    napi_env env = a2ui_get_napi_env();
    
    if (listeners_.empty()) {
        HM_LOGW("engineId=%d, no listeners registered", engineId_);
        return;
    }
    
    for (auto it = listeners_.begin(); it != listeners_.end(); ++it) {
        napi_value existingListener = nullptr;
        napi_get_reference_value(env, *it, &existingListener);
        
        bool isEqual = false;
        napi_strict_equals(env, listener, existingListener, &isEqual);
        
        if (isEqual) {
            napi_delete_reference(env, *it);
            listeners_.erase(it);
            HM_LOGI("engineId=%d, listener unregistered, remaining: %zu", engineId_, listeners_.size());
            return;
        }
    }
    
    HM_LOGW("engineId=%d, listener not found", engineId_);
}

} // namespace agenui

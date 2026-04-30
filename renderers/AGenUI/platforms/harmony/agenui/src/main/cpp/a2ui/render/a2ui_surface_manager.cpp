#include "a2ui_surface_manager.h"
#include "a2ui_surface.h"
#include "log/a2ui_capi_log.h"

namespace a2ui {

A2UISurfaceManager::A2UISurfaceManager(ComponentRegistry* globalRegistry)
    : globalRegistry_(globalRegistry) {
    HM_LOGI("Created with %d factories", globalRegistry_->getRegisteredFactoryCount());
}

A2UISurfaceManager::~A2UISurfaceManager() {
    clearAll();
}

A2UISurface* A2UISurfaceManager::createSurface(const std::string& surfaceId, bool animated) {

    // Check whether it already exists
    auto existingIt = surfaces_.find(surfaceId);
    if (existingIt != surfaces_.end()) {
        RELEASE_ASSERT_WITHLOG(false, "Surface already exists: %s", surfaceId.c_str());
    }

    // 1. Create a per-surface ComponentRegistry.
    ComponentRegistry* surfaceRegistry = new ComponentRegistry();
    surfaceRegistry->copyFactoriesFrom(*globalRegistry_);

    // 2. Create the surface with immutable animation and observer state.
    A2UISurface* surface = new A2UISurface(surfaceId, surfaceRegistry, animated,
                                           &componentRenderObservable_, &surfaceLayoutObservable_);

    // 3. Store the surface and registry.
    surfaces_[surfaceId] = surface;
    registries_[surfaceId] = surfaceRegistry;

    HM_LOGI("Surface created: %s (total: %d)", surfaceId.c_str(), getSurfaceCount());
    return surface;
}

A2UISurface* A2UISurfaceManager::getSurface(const std::string& surfaceId) const {
    auto it = surfaces_.find(surfaceId);
    if (it != surfaces_.end()) {
        return it->second;
    }
    return nullptr;
}

void A2UISurfaceManager::destroySurface(const std::string& surfaceId) {
    HM_LOGI("Destroying surface: %s", surfaceId.c_str());

    auto surfaceIt = surfaces_.find(surfaceId);
    if (surfaceIt == surfaces_.end()) {
        HM_LOGW("Surface not found: %s", surfaceId.c_str());
        return;
    }

    A2UISurface* surface = surfaceIt->second;

    // 1. Destroy the surface.
    surface->destroy();

    // 2. Remove it from the surface map.
    surfaces_.erase(surfaceIt);

    // 3. Delete the surface and its dedicated registry.
    delete surface;

    auto registryIt = registries_.find(surfaceId);
    if (registryIt != registries_.end()) {
        delete registryIt->second;
        registries_.erase(registryIt);
    }

    HM_LOGI("Surface destroyed: %s (remaining: %d)", surfaceId.c_str(), getSurfaceCount());
}

void A2UISurfaceManager::clearAll() {
    HM_LOGI("Clearing %d surfaces", getSurfaceCount());

    // Destroy all surfaces first.
    for (auto it = surfaces_.begin(); it != surfaces_.end(); ++it) {
        it->second->destroy();
        delete it->second;
    }
    surfaces_.clear();

    // Then delete all dedicated registries.
    for (auto it = registries_.begin(); it != registries_.end(); ++it) {
        delete it->second;
    }
    registries_.clear();

    HM_LOGI("All surfaces cleared");
}

int A2UISurfaceManager::getSurfaceCount() const {
    return static_cast<int>(surfaces_.size());
}

void A2UISurfaceManager::unmountAllRootNodes() {
    HM_LOGI("Unmounting %d surfaces", getSurfaceCount());

    for (auto it = surfaces_.begin(); it != surfaces_.end(); ++it) {
        A2UISurface* surface = it->second;
        if (surface) {
            surface->unmountRootNode();
            HM_LOGI("Unmounted: %s", it->first.c_str());
        }
    }
}

bool A2UISurfaceManager::bindSurface(const std::string& surfaceId, napi_env env, napi_value nodeContent) {
    if (!env || !nodeContent) {
        HM_LOGE("Invalid parameters");
        return false;
    }

    ArkUI_NodeContentHandle contentHandle = nullptr;
    int32_t result = OH_ArkUI_GetNodeContentFromNapiValue(env, nodeContent, &contentHandle);
    if (result != 0 || !contentHandle) {
        HM_LOGE("Failed to get NodeContent handle, error: %d", result);
        return false;
    }

    surfaceContentHandles_[surfaceId] = contentHandle;

    A2UISurface* surface = getSurface(surfaceId);
    if (surface) {
        surface->setContentHandle(contentHandle);
        surface->mountRootNode();
        HM_LOGI("Bound and mounted surface: %s", surfaceId.c_str());
    }

    return true;
}

bool A2UISurfaceManager::unbindSurface(const std::string& surfaceId) {
    HM_LOGI("Unbinding surface: %s", surfaceId.c_str());

    auto handleIt = surfaceContentHandles_.find(surfaceId);
    if (handleIt == surfaceContentHandles_.end()) {
        HM_LOGW("Surface not bound: %s", surfaceId.c_str());
        return false;
    }

    A2UISurface* surface = getSurface(surfaceId);
    if (surface) {
        surface->unmountRootNode();
//        surface->setContentHandle(nullptr);
        HM_LOGI("Unmounted and cleared surface: %s", surfaceId.c_str());
    }

    surfaceContentHandles_.erase(handleIt);
    HM_LOGI("Surface unbound: %s", surfaceId.c_str());
    return true;
}

} // namespace a2ui

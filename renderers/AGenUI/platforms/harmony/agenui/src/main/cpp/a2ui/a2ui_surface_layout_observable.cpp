#include "a2ui_surface_layout_observable.h"
#include "hilog/log.h"
#include "log/a2ui_capi_log.h"
#include <algorithm>

namespace agenui {

A2UISurfaceLayoutObservable::A2UISurfaceLayoutObservable() {
    HM_LOGI("A2UISurfaceLayoutObservable - Initialized");
}

A2UISurfaceLayoutObservable::~A2UISurfaceLayoutObservable() {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_listeners.clear();
    HM_LOGI("A2UISurfaceLayoutObservable - Destroyed");
}

void A2UISurfaceLayoutObservable::addSurfaceLayoutListener(SurfaceLayoutListener* listener) {
    if (!listener) {
        HM_LOGW("listener is null");
        return;
    }

    std::lock_guard<std::mutex> lock(m_mutex);

    // Check whether it already exists
    auto it = std::find(m_listeners.begin(), m_listeners.end(), listener);
    if (it != m_listeners.end()) {
        HM_LOGW("listener already exists");
        return;
    }

    m_listeners.push_back(listener);
    HM_LOGI("Added listener, total: %zu", m_listeners.size());
}

void A2UISurfaceLayoutObservable::removeSurfaceLayoutListener(SurfaceLayoutListener* listener) {
    if (!listener) {
        HM_LOGW("listener is null");
        return;
    }

    std::lock_guard<std::mutex> lock(m_mutex);
    auto it = std::find(m_listeners.begin(), m_listeners.end(), listener);
    if (it == m_listeners.end()) {
        HM_LOGW("listener not found");
        return;
    }
    m_listeners.erase(it);
    HM_LOGI("Removed listener, total: %zu", m_listeners.size());
}

void A2UISurfaceLayoutObservable::notifySurfaceSizeChanged(const SurfaceLayoutInfo& info) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_listeners.empty()) {
        HM_LOGD("No listeners registered");
        return;
    }

    HM_LOGI("Notifying %zu listeners, surfaceId: %s, size: %fx%f", m_listeners.size(), info.surfaceId.c_str(), info.width, info.height);

    // Notify all listeners
    for (auto* listener : m_listeners) {
        if (listener) {
            listener->onSurfaceSizeChanged(info);
        }
    }
}

void A2UISurfaceLayoutObservable::clearAllListeners() {
    std::lock_guard<std::mutex> lock(m_mutex);
    size_t count = m_listeners.size();
    m_listeners.clear();
    HM_LOGI("Cleared %zu listeners", count);
}

} // namespace agenui

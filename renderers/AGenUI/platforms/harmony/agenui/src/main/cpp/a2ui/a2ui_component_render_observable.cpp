#include "a2ui_component_render_observable.h"
#include "hilog/log.h"
#include "log/a2ui_capi_log.h"
#include <algorithm>


namespace agenui {

A2UIComponentRenderObservable::A2UIComponentRenderObservable() {
    HM_LOGI("A2UIComponentRenderObservable - Initialized");
}

A2UIComponentRenderObservable::~A2UIComponentRenderObservable() {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_listeners.clear();
    HM_LOGI("A2UIComponentRenderObservable - Destroyed");
}

void A2UIComponentRenderObservable::addComponentRenderListener(ComponentRenderListener* observer) {
    if (!observer) {
        HM_LOGW("observer is null");
        return;
    }

    std::lock_guard<std::mutex> lock(m_mutex);

    // Check whether it already exists
    auto it = std::find(m_listeners.begin(), m_listeners.end(), observer);
    if (it != m_listeners.end()) {
        HM_LOGW("observer already exists");
        return;
    }

    m_listeners.push_back(observer);
    HM_LOGI("Added listener, total: %zu", m_listeners.size());
}

void A2UIComponentRenderObservable::removeComponentRenderListener(ComponentRenderListener* observer) {
    if (!observer) {
        HM_LOGW("observer is null");
        return;
    }

    std::lock_guard<std::mutex> lock(m_mutex);
    auto it = std::find(m_listeners.begin(), m_listeners.end(), observer);
    if (it == m_listeners.end()) {
        HM_LOGW("observer not found");
        return;
    }
    m_listeners.erase(it);
}

void A2UIComponentRenderObservable::notifyRenderFinish(const ComponentRenderInfo& info) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_listeners.empty()) {
        HM_LOGD("No listeners registered");
        return;
    }

    HM_LOGI("Notifying %zu listeners, id: %s, component: %s, size: %fx%f", m_listeners.size(), info.surfaceId.c_str(), info.componentId.c_str(), info.width, info.height);

    // Notify all listeners
    for (auto* listener : m_listeners) {
        if (listener) {
            listener->onRenderFinish(info);
        }
    }
}

void A2UIComponentRenderObservable::clearAllListeners() {
    std::lock_guard<std::mutex> lock(m_mutex);
    size_t count = m_listeners.size();
    m_listeners.clear();
    HM_LOGI("Cleared %zu listeners", count);
}

} // namespace agenui

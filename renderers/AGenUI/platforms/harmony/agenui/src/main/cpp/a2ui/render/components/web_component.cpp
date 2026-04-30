#include "web_component.h"
#include "log/a2ui_capi_log.h"
#include "a2ui_hm_helper.h"
#include "../hybrid/a2ui_hybrid_factory.h"

namespace a2ui {

constexpr const char *kPropSource   = "source";
constexpr const char *kPropStyles   = "styles";
constexpr const char *kPropHeight   = "height";
constexpr const char *kPropMinH     = "min-height";
constexpr const char *kPropMaxH     = "max-height";

// ---- Constructors ----

WebComponent::WebComponent(ComponentState* state, ArkUI_NodeHandle arkuiHandle, const ArkTSObject& componentContent)
    : A2UIHybridView(state->getId(), state->getType(), state->getProperties(), arkuiHandle, componentContent) {
    m_state = state;
    HM_LOGI("WebComponent - Created: id=%s", m_id.c_str());
}

WebComponent::~WebComponent() {
    HM_LOGI("WebComponent - Destroyed: id=%s", m_id.c_str());
}

// ---- Property Updates ----

void WebComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        HM_LOGE("handle is null, id=%s", m_id.c_str());
        return;
    }

    std::vector<std::string> changedKeys;

    // Handle source updates.
    if (applySource(properties)) {
        changedKeys.push_back(kPropSource);
    }

    // Handle style updates.
    if (applyStyles(properties)) {
        changedKeys.push_back(kPropStyles);
    }

    // Notify the ArkTS side to update
    if (!changedKeys.empty()) {
        notifyHybridViewUpdate(changedKeys);
    }
}

bool WebComponent::applySource(const nlohmann::json& properties) {
    if (!properties.contains(kPropSource)) {
        return false;
    }
    const auto& val = properties[kPropSource];
    std::string newSource;
    if (val.is_string()) {
        newSource = val.get<std::string>();
    } else {
        return false;
    }
    if (newSource == m_source) {
        return false;
    }
    m_source = newSource;
    HM_LOGI("source changed: %s", m_source.c_str());
    return true;
}

bool WebComponent::applyStyles(const nlohmann::json& properties) {
    if (!properties.contains(kPropStyles)) {
        return false;
    }
    HM_LOGI("styles property changed");
    updateLayout();
    return true;
}

void WebComponent::notifyHybridViewUpdate(const std::vector<std::string>& changedKeys) {
    if (changedKeys.empty()) {
        return;
    }

    std::vector<UpdateState> updateStates;
    updateStates.reserve(changedKeys.size());
    for (const auto& key : changedKeys) {
        updateStates.emplace_back(UpdateType::AttributeChanged, key);
    }

    HM_LOGI("Updating %zu properties via updateHybridView",
             updateStates.size());
    A2UIHybridFactory::updateHybridView(this, updateStates);
}

} // namespace a2ui

#include <arkui/native_interface.h>
#include <arkui/native_animate.h>
#include <arkui/native_node_napi.h>
#include <atomic>
#include <cstdlib>

#include "a2ui_component.h"
#include "a2ui/measure/a2ui_platform_layout_bridge.h"
#include "a2ui/utils/a2ui_unit_utils.h"
#include "a2ui/utils/a2ui_color_palette.h"
#include "a2ui/utils/a2ui_animate_utils.h"
#include "a2ui_component_state.h"
#include "agenui_engine_entry.h"
#include "agenui_surface_manager_interface.h"
#include "agenui_dispatcher_types.h"
#include "a2ui/a2ui_message_listener.h"
#include "log/a2ui_capi_log.h"
#include "a2ui/bridge/image_loader_bridge.h"

namespace a2ui {

using colors::kColorTransparent;

namespace {

constexpr int32_t kDefaultAppearDurationMs = 800;

float parseOpacityValue(const nlohmann::json& value, float fallback = 1.0f) {
    if (value.is_number()) {
        return value.get<float>();
    }
    if (value.is_string()) {
        return static_cast<float>(std::atof(value.get<std::string>().c_str()));
    }
    return fallback;
}

float clampOpacity(float value) {
    if (value < 0.0f) {
        return 0.0f;
    }
    if (value > 1.0f) {
        return 1.0f;
    }
    return value;
}

}  // namespace

A2UIComponent::A2UIComponent(const std::string &id, const std::string &componentType)
    : m_id(id), m_componentType(componentType), m_state(nullptr), m_parent(nullptr), m_nodeHandle(nullptr) {
    if (!g_nodeAPI) {
        OH_ArkUI_GetModuleInterface(ARKUI_NATIVE_NODE, ArkUI_NativeNodeAPI_1, g_nodeAPI);
        if (g_nodeAPI == nullptr) {
            HM_LOGE("Fatal: Failed to get ArkUI NativeNodeAPI_1");
        }
    }
}

A2UIComponent::~A2UIComponent() {
}

void A2UIComponent::setHeight(float height) {
    m_height = height;
    getNode().setHeight(height);
}

const nlohmann::json& A2UIComponent::getProperties() const {
    if (m_state) {
        return m_state->getProperties();
    }
    return m_properties;
}

void A2UIComponent::updateProperties(const nlohmann::json& newProps) {
    if (!newProps.is_null() && !newProps.is_object()) {
        return;
    }
    
    if (m_state) {
        HM_LOGD(" using incremental update (with State)", m_id.c_str());
        
        m_state->updateProperties(newProps);
        
        for (auto it = newProps.begin(); it != newProps.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
        
        updateLayoutProperties(newProps);
        
        onUpdateProperties(newProps);
        
        if (m_state->isDirty()) {
            updateView();
            m_state->clearDirty();
        }
        playAppearAnimationIfNeeded();
    } else {
        HM_LOGD(" using full update (no State)", m_id.c_str());
        
        for (auto it = newProps.begin(); it != newProps.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
        
        updateLayoutProperties(newProps);
        
        setupClickListener();
        
        onUpdateProperties(newProps);
        playAppearAnimationIfNeeded();
    }
}

void A2UIComponent::updateLayoutProperties(const nlohmann::json& newProps) {
    float posX = 0.0f;
    float posY = 0.0f;
    float width = 100.0f;
    float height = 100.0f;
    if (newProps.contains("styles")) {
        nlohmann::json stylesJson;
        bool stylesValid = false;
        if (newProps["styles"].is_object()) {
            stylesJson = newProps["styles"];
            stylesValid = true;
        } else if (newProps["styles"].is_string()) {
            try {
                stylesJson = nlohmann::json::parse(newProps["styles"].get<std::string>());
                stylesValid = true;
            } catch (const nlohmann::json::exception& e) {
                HM_LOGW("Failed to parse styles string: %s", e.what());
            }
        }
        if (stylesValid) {
            posX = stylesJson.value("x", 0.0f);
            posY = stylesJson.value("y", 0.0f);
            width = stylesJson.value("width", 0.0f);
            height = stylesJson.value("height", 0.0f);
            
            if (stylesJson.contains("styleInfo")) {
                m_styleInfo = stylesJson["styleInfo"].get<std::string>();
            }
            
            HM_LOGD(" styles: %s", m_id.c_str(), stylesJson.dump().c_str());
            
            
            m_x = posX;
            m_y = posY;
            m_width = width;
            m_height = height;
            
            if (!m_parent || m_parent->shouldApplyChildLayoutPosition(this)) {
                getNode().setPosition(m_x, m_y);
            }
            getNode().setWidth(m_width);
            getNode().setHeight(m_height);
            HM_LOGI("Updated layout for component %s: x=%.1f, y=%.1f, width=%.1f, height=%.1f", m_id.c_str(), posX, posY, width, height);
            
            // Apply the background-image style
            applyBackgroundImage(stylesJson);
        }
    }
}

void A2UIComponent::updateView() {
    if (!m_state || !m_state->isDirty()) {
        return;
    }
    
    const auto& dirtyProps = m_state->getDirtyProperties();
    const auto& properties = m_state->getProperties();
    
    HM_LOGD(" updating %zu dirty properties", m_id.c_str(), dirtyProps.size());
    
    for (const auto& key : dirtyProps) {
        if (properties.contains(key)) {
            onUpdateProperty(key, properties[key]);
        }
    }
}

void A2UIComponent::addChild(A2UIComponent* child) {
    if (!child) {
        return;
    }
    m_children.push_back(child);
    child->m_parent = this;

    if (shouldAutoAddChildView() && m_nodeHandle && child->m_nodeHandle) {
        g_nodeAPI->addChild(m_nodeHandle, child->getNodeHandle());
    }

    HM_LOGI("Parent %s added child %s (autoAddView=%s)", m_id.c_str(), child->m_id.c_str(), shouldAutoAddChildView() ? "true" : "false");
}

void A2UIComponent::removeChild(A2UIComponent* child) {
    if (!child) {
        return;
    }
    for (auto it = m_children.begin(); it != m_children.end(); ++it) {
        if (*it == child) {
            if (m_nodeHandle && child->m_nodeHandle) {
                g_nodeAPI->removeChild(m_nodeHandle, child->getNodeHandle());
            }
            m_children.erase(it);
            child->m_parent = nullptr;
            HM_LOGI("Parent %s removed child %s", m_id.c_str(), child->m_id.c_str());
            break;
        }
    }
}

void A2UIComponent::removeChildById(const std::string& childId) {
    for (auto it = m_children.begin(); it != m_children.end(); ++it) {
        if ((*it)->m_id == childId) {
            (*it)->m_parent = nullptr;
            m_children.erase(it);
            HM_LOGI("Parent %s removed child %s", m_id.c_str(), childId.c_str());
            break;
        }
    }
}

void A2UIComponent::destroy() {
    HM_LOGI("Destroying component %s (type: %s, children: %zu)", m_id.c_str(), m_componentType.c_str(), m_children.size());

    for (A2UIComponent* child : m_children) {
        if (child) {
            child->destroy();
            delete child;
        }
    }
    m_children.clear();
    m_parent = nullptr;

    if (m_actionClickRegistered && m_nodeHandle) {
        g_nodeAPI->unregisterNodeEvent(m_nodeHandle, NODE_ON_CLICK);
        m_actionClickRegistered = false;
    }

    if (m_backgroundImageHandle) {
        if (!m_backgroundImageRequestId.empty()) {
            ImageLoaderBridge::getInstance().cancel(m_backgroundImageRequestId);
            m_backgroundImageRequestId.clear();
        }
        g_nodeAPI->removeChild(m_nodeHandle, m_backgroundImageHandle);
        g_nodeAPI->disposeNode(m_backgroundImageHandle);
        m_backgroundImageHandle = nullptr;
        m_backgroundImageUrl.clear();
    }

    if (m_nodeHandle) {
        g_nodeAPI->disposeNode(m_nodeHandle);
        m_nodeHandle = nullptr;
    }
}

bool A2UIComponent::shouldAutoAddChildView() const {
    return true;
}

bool A2UIComponent::shouldApplyChildLayoutPosition(const A2UIComponent* child) const {
    (void)child;
    return true;
}

float A2UIComponent::resolveAppearTargetOpacity(const nlohmann::json& properties) const {
    if (properties.contains("opacity")) {
        return clampOpacity(parseOpacityValue(properties["opacity"]));
    }
    if (properties.contains("styles")) {
        nlohmann::json stylesJson;
        if (properties["styles"].is_object()) {
            stylesJson = properties["styles"];
        } else if (properties["styles"].is_string()) {
            try {
                stylesJson = nlohmann::json::parse(properties["styles"].get<std::string>());
            } catch (const nlohmann::json::exception&) {
                return 1.0f;
            }
        }
        if (stylesJson.is_object()) {
            if (stylesJson.contains("opacity")) {
                return clampOpacity(parseOpacityValue(stylesJson["opacity"]));
            }
        }
    }
    return 1.0f;
}

void A2UIComponent::prepareAppearAnimation(const nlohmann::json& properties) {
    if (m_hasPlayedAppearAnimation || m_pendingAppearAnimation || !m_nodeHandle) {
        return;
    }
    if (!m_surfaceAnimated) {
        return;
    }

    m_appearTargetOpacity = resolveAppearTargetOpacity(properties);
    if (m_appearTargetOpacity <= 0.0f) {
        return;
    }

    m_pendingAppearAnimation = true;
    A2UINode(m_nodeHandle).setOpacity(0.0f);
}

void A2UIComponent::playAppearAnimationIfNeeded() {
    if (!m_pendingAppearAnimation || !m_nodeHandle) {
        return;
    }
    if (!m_surfaceAnimated) {
        m_pendingAppearAnimation = false;
        m_hasPlayedAppearAnimation = true;
        A2UINode(m_nodeHandle).setOpacity(m_appearTargetOpacity);
        return;
    }
    m_pendingAppearAnimation = false;
    m_hasPlayedAppearAnimation = true;
    animateNodeOpacityAfterMount(m_nodeHandle, m_appearTargetOpacity, kDefaultAppearDurationMs);
}

void A2UIComponent::onUpdateProperty(const std::string& key, const nlohmann::json& value) {
    HM_LOGD(" property '%s' (base class, no-op)", m_id.c_str(), key.c_str());
}

void A2UIComponent::onUpdateProperties(const nlohmann::json& properties) {
}


void A2UIComponent::setupClickListener() {
    if (!m_nodeHandle) {
        return;
    }

    if (m_properties.contains("action") && m_properties["action"].is_object()) {
        if (!m_actionClickRegistered) {
            g_nodeAPI->addNodeEventReceiver(m_nodeHandle, onActionClickCallback);
            g_nodeAPI->registerNodeEvent(m_nodeHandle, NODE_ON_CLICK, 0, this);
            m_actionClickRegistered = true;
            HM_LOGI("Registered click for component %s (type: %s)", m_id.c_str(), m_componentType.c_str());
        }
    } else {
        if (m_actionClickRegistered) {
            g_nodeAPI->unregisterNodeEvent(m_nodeHandle, NODE_ON_CLICK);
            m_actionClickRegistered = false;
            HM_LOGI("Unregistered click for component %s (type: %s)", m_id.c_str(), m_componentType.c_str());
        }
    }
}

void A2UIComponent::onActionClickCallback(ArkUI_NodeEvent* event) {
    if (OH_ArkUI_NodeEvent_GetEventType(event) != ArkUI_NodeEventType::NODE_ON_CLICK) {
        return;
    }

    void* userData = OH_ArkUI_NodeEvent_GetUserData(event);
    if (!userData) {
        HM_LOGW("userData is null");
        return;
    }

    A2UIComponent* component = static_cast<A2UIComponent*>(userData);

    if (component->isClickDisabled()) {
        HM_LOGI("Click disabled for component %s (type: %s)", component->m_id.c_str(), component->m_componentType.c_str());
        return;
    }

    HM_LOGI("Component clicked: %s (type: %s)", component->m_id.c_str(), component->m_componentType.c_str());

    if (component->m_properties.contains("action") && component->m_properties["action"].is_object()) {
        const auto& actionDef = component->m_properties["action"];
        HM_LOGI("Dispatching action: %s", actionDef.dump().c_str());
        component->dispatchAction(actionDef);
    } else {
        HM_LOGW("No action defined for component: %s", component->m_id.c_str());
    }
}

void A2UIComponent::dispatchAction(const nlohmann::json& actionDef) {
    if (m_surfaceId.empty()) {
        HM_LOGE("surfaceId is empty, id=%s", m_id.c_str());
        return;
    }

    nlohmann::json contextJson;
    contextJson["action"] = actionDef;

    agenui::ActionMessage actionMessage;
    actionMessage.surfaceId = m_surfaceId;
    actionMessage.sourceComponentId = m_id;
    actionMessage.contextJson = contextJson.dump();

    HM_LOGI("surfaceId=%s, componentId=%s, context=%s", m_surfaceId.c_str(), m_id.c_str(), actionMessage.contextJson.c_str());

    int engineId = agenui::A2UIMessageListener::findEngineIdBySurfaceId(m_surfaceId);
    if (engineId != 0) {
        auto* engine = agenui::getAGenUIEngine();
        if (engine) {
            auto* sm = engine->findSurfaceManager(engineId);
            if (sm) {
                sm->submitUIAction(actionMessage);
            } else {
                HM_LOGE("ISurfaceManager not found for engineId=%d", engineId);
            }
        } else {
            HM_LOGE("AGenUI Engine is null");
        }
    } else {
        HM_LOGE("engineId not found for surfaceId=%s", m_surfaceId.c_str());
    }
}


uint32_t A2UIComponent::parseColor(const std::string& colorStr) {
    if (colorStr.empty()) {
        return kColorTransparent;
    }

    if (colorStr == "transparent") {
        return kColorTransparent;
    }

    if (colorStr.size() >= 4 && colorStr[0] == 'r' && colorStr[1] == 'g' && colorStr[2] == 'b') {
        size_t parenOpen = colorStr.find('(');
        size_t parenClose = colorStr.rfind(')');
        if (parenOpen == std::string::npos || parenClose == std::string::npos) {
            return kColorTransparent;
        }
        std::string inner = colorStr.substr(parenOpen + 1, parenClose - parenOpen - 1);
        float r = 0.0f, g = 0.0f, b = 0.0f, a = 1.0f;
        const char* p = inner.c_str();
        char* end = nullptr;
        r = std::strtof(p, &end); if (end == p) return kColorTransparent; p = end;
        while (*p == ' ' || *p == ',') p++;
        g = std::strtof(p, &end); if (end == p) return kColorTransparent; p = end;
        while (*p == ' ' || *p == ',') p++;
        b = std::strtof(p, &end); if (end == p) return kColorTransparent; p = end;
        while (*p == ' ' || *p == ',') p++;
        if (*p != '\0' && *p != ')') {
            a = std::strtof(p, &end);
            if (end == p) a = 1.0f;
        }
        auto clamp = [](float v, float lo, float hi) -> uint32_t {
            if (v < lo) v = lo;
            if (v > hi) v = hi;
            return static_cast<uint32_t>(v);
        };
        uint32_t ai = static_cast<uint32_t>(a * 255.0f + 0.5f);
        if (ai > 255) ai = 255;
        return (ai << 24) | (clamp(r, 0, 255) << 16) | (clamp(g, 0, 255) << 8) | clamp(b, 0, 255);
    }

    // #RRGGBB / #RRGGBBAA / #RGB
    if (colorStr[0] == '#') {
        std::string hex = colorStr.substr(1);

        if (hex.length() == 3) {
            std::string expanded;
            expanded.reserve(6);
            for (char ch : hex) { expanded += ch; expanded += ch; }
            hex = expanded;
        }

        char* endPtr = nullptr;
        if (hex.length() == 6) {
            unsigned long value = std::strtoul(hex.c_str(), &endPtr, 16);
            if (endPtr != hex.c_str() + 6) return kColorTransparent;
            return colors::kColorBlack | static_cast<uint32_t>(value);
        } else if (hex.length() == 8) {
            unsigned long value = std::strtoul(hex.c_str(), &endPtr, 16);
            if (endPtr != hex.c_str() + 8) return kColorTransparent;
            uint32_t rr = (value >> 24) & 0xFF;
            uint32_t gg = (value >> 16) & 0xFF;
            uint32_t bb = (value >> 8) & 0xFF;
            uint32_t aa = value & 0xFF;
            return (aa << 24) | (rr << 16) | (gg << 8) | bb;
        }
    }

    return kColorTransparent;
}


/**
 * Extract the raw URL from a CSS url(...) value.
 * Supported formats:
 *   url(https://example.com/image.png)
 *   url('https://example.com/image.png')
 *   url("https://example.com/image.png")
 * Returns the original string when the value is not a url(...) expression.
 */
static std::string extractUrlFromCssUrl(const std::string& value) {
    if (value.empty()) {
        return "";
    }
    
    size_t start = 0;
    while (start < value.size() && (value[start] == ' ' || value[start] == '\t')) {
        start++;
    }
    
    if (value.compare(start, 4, "url(") != 0) {
        return value;
    }
    
    size_t parenStart = start + 3;
    while (parenStart < value.size() && value[parenStart] != '(') {
        parenStart++;
    }
    if (parenStart >= value.size()) {
        return value;
    }
    parenStart++;
    
    while (parenStart < value.size() && (value[parenStart] == ' ' || value[parenStart] == '\t')) {
        parenStart++;
    }
    
    size_t parenEnd = value.rfind(')');
    if (parenEnd == std::string::npos || parenEnd <= parenStart) {
        return value;
    }
    
    std::string inner = value.substr(parenStart, parenEnd - parenStart);
    
    size_t innerEnd = inner.size();
    while (innerEnd > 0 && (inner[innerEnd - 1] == ' ' || inner[innerEnd - 1] == '\t')) {
        innerEnd--;
    }
    inner = inner.substr(0, innerEnd);
    
    if (inner.size() >= 2) {
        if ((inner[0] == '"' && inner[inner.size() - 1] == '"') ||
            (inner[0] == '\'' && inner[inner.size() - 1] == '\'')) {
            inner = inner.substr(1, inner.size() - 2);
        }
    }
    
    return inner;
}

void A2UIComponent::applyBackgroundImage(const nlohmann::json& styles) {
    if (!m_nodeHandle) {
        return;
    }
    
    std::string bgImageUrl;
    if (styles.contains("background-image") && styles["background-image"].is_string()) {
        bgImageUrl = styles["background-image"].get<std::string>();
    } else if (styles.contains("backgroundImage") && styles["backgroundImage"].is_string()) {
        bgImageUrl = styles["backgroundImage"].get<std::string>();
    }
    
    bgImageUrl = extractUrlFromCssUrl(bgImageUrl);
    
    if (bgImageUrl.empty()) {
        if (!m_backgroundImageRequestId.empty()) {
            ImageLoaderBridge::getInstance().cancel(m_backgroundImageRequestId);
            m_backgroundImageRequestId.clear();
        }
        if (m_backgroundImageHandle) {
            g_nodeAPI->removeChild(m_nodeHandle, m_backgroundImageHandle);
            g_nodeAPI->disposeNode(m_backgroundImageHandle);
            m_backgroundImageHandle = nullptr;
            m_backgroundImageUrl.clear();
            HM_LOGI("Removed background image for component %s", m_id.c_str());
        }
        return;
    }
    
    if (bgImageUrl == m_backgroundImageUrl && m_backgroundImageHandle) {
        return;
    }
    
    if (!m_backgroundImageRequestId.empty()) {
        ImageLoaderBridge::getInstance().cancel(m_backgroundImageRequestId);
        m_backgroundImageRequestId.clear();
    }

    if (m_backgroundImageHandle) {
        g_nodeAPI->removeChild(m_nodeHandle, m_backgroundImageHandle);
        g_nodeAPI->disposeNode(m_backgroundImageHandle);
        m_backgroundImageHandle = nullptr;
    }
    
    m_backgroundImageHandle = g_nodeAPI->createNode(ARKUI_NODE_IMAGE);
    if (!m_backgroundImageHandle) {
        HM_LOGE("Failed to create background image node for component %s", m_id.c_str());
        return;
    }
    
    A2UIImageNode bgNode(m_backgroundImageHandle);
    bgNode.setObjectFitFill();
    bgNode.setPercentWidth(1.0f);
    bgNode.setPercentHeight(1.0f);
    A2UINode bgNodeBase(m_backgroundImageHandle);
    bgNodeBase.setZIndex(-1.0f);
    bgNodeBase.setHitTestBehavior(ARKUI_HIT_TEST_MODE_NONE);
    
    g_nodeAPI->addChild(m_nodeHandle, m_backgroundImageHandle);
    m_backgroundImageUrl = bgImageUrl;

    // Check whether an external loader exists
    if (ImageLoaderBridge::getInstance().hasLoader()) {
        ArkUI_NodeHandle bgHandle = m_backgroundImageHandle;
        std::string currentUrl   = bgImageUrl;
        std::string componentId  = m_id;

        std::string requestId = ImageLoaderBridge::getInstance().loadImage(
            bgImageUrl,
            getWidth(),
            getHeight(),
            m_id,
            getSurfaceId(),
            bgHandle,
            [bgHandle, currentUrl, componentId](const std::string& rid, bool success, bool isCancelled) {
                if (isCancelled) {
                    HM_LOGI("bg image_loader: cancelled, componentId=%s url=%s",
                        componentId.c_str(), currentUrl.c_str());
                    return;
                }
                if (!success) {
                    HM_LOGW("bg image_loader: failed, fallback ArkUI, componentId=%s url=%s",
                        componentId.c_str(), currentUrl.c_str());
                    if (bgHandle) {
                        A2UIImageNode(bgHandle).setSrc(currentUrl);
                    }
                    return;
                }
                HM_LOGI("bg image_loader: success(PixelMap set), componentId=%s url=%s",
                    componentId.c_str(), currentUrl.c_str());
            }
        );

        if (requestId.empty()) {
            HM_LOGW("bg image_loader: loadImage failed, fallback ArkUI, componentId=%s", m_id.c_str());
            bgNode.setSrc(bgImageUrl);
        } else {
            m_backgroundImageRequestId = requestId;
        }
    } else {
        bgNode.setSrc(bgImageUrl);
    }

    HM_LOGI("Set background image %s for component %s", bgImageUrl.c_str(), m_id.c_str());
}

} // namespace a2ui

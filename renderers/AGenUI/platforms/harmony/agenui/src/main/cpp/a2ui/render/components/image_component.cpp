#include "image_component.h"
#include "log/a2ui_capi_log.h"
#include <cstdlib>
#include <arkui/native_animate.h>
#include <arkui/native_node_napi.h>
#include "a2ui/measure/a2ui_platform_layout_bridge.h"
#include "a2ui/utils/a2ui_unit_utils.h"
#include "a2ui/utils/a2ui_color_palette.h"
#include "a2ui/utils/a2ui_animate_utils.h"
#include "a2ui/bridge/image_loader_bridge.h"

namespace a2ui {

namespace {

constexpr float kImageFadeInStartScale = 0.98f;

// animateImageFadeIn is the image-specific fade-in animation that additionally
// interpolates the node scale from kImageFadeInStartScale to 1.0, giving images
// a subtle zoom-in effect alongside the opacity transition.
// For a plain opacity-only animation use a2ui::animateNodeOpacityNow().
void animateImageFadeIn(ArkUI_NodeHandle nodeHandle, float targetOpacity, int32_t durationMs) {
    if (nodeHandle == nullptr) {
        HM_LOGW("nodeHandle is null");
        return;
    }

    if (durationMs <= 0) {
        HM_LOGI("duration <= 0, set opacity directly, target=%f", targetOpacity);
        A2UINode(nodeHandle).setOpacity(targetOpacity);
        return;
    }

    ArkUI_ContextHandle context = OH_ArkUI_GetContextByNode(nodeHandle);
    ArkUI_NativeAnimateAPI_1* animateApi = getAnimateApi();
    HM_LOGI("node=%p, context=%p, animateApi=%p, target=%f, duration=%d",
        nodeHandle, context, animateApi, targetOpacity, durationMs);
    if (context == nullptr || animateApi == nullptr) {
        HM_LOGW("fallback to direct opacity, context=%p, animateApi=%p",
            context, animateApi);
        A2UINode(nodeHandle).setOpacity(targetOpacity);
        return;
    }

    ArkUI_AnimatorOption* option = OH_ArkUI_AnimatorOption_Create(0);
    if (option == nullptr) {
        HM_LOGW("animator option create failed, fallback direct");
        A2UINode(nodeHandle).setOpacity(targetOpacity);
        return;
    }

    OpacityAnimatePayload* payload = new OpacityAnimatePayload();
    payload->nodeHandle = nodeHandle;
    payload->targetOpacity = targetOpacity;
    payload->startScale = kImageFadeInStartScale;
    payload->targetScale = 1.0f;
    ArkUI_CurveHandle curve = OH_ArkUI_Curve_CreateCubicBezierCurve(0.42f, 0.0f, 0.58f, 1.0f);

    OH_ArkUI_AnimatorOption_SetDuration(option, durationMs);
    OH_ArkUI_AnimatorOption_SetBegin(option, 0.0f);
    OH_ArkUI_AnimatorOption_SetEnd(option, targetOpacity);
    OH_ArkUI_AnimatorOption_SetIterations(option, 1);
    OH_ArkUI_AnimatorOption_SetFill(option, ARKUI_ANIMATION_FILL_MODE_FORWARDS);
    OH_ArkUI_AnimatorOption_SetDirection(option, ARKUI_ANIMATION_DIRECTION_NORMAL);
    if (curve != nullptr) {
        OH_ArkUI_AnimatorOption_SetCurve(option, curve);
    }

    OH_ArkUI_AnimatorOption_RegisterOnFrameCallback(
        option,
        payload,
        [](ArkUI_AnimatorOnFrameEvent* event) {
            auto* payload = static_cast<OpacityAnimatePayload*>(OH_ArkUI_AnimatorOnFrameEvent_GetUserData(event));
            if (payload == nullptr || payload->nodeHandle == nullptr) {
                HM_LOGW("ImageFadeIn::animator.onFrame - payload invalid");
                return;
            }
            float value = OH_ArkUI_AnimatorOnFrameEvent_GetValue(event);
            HM_LOGI("ImageFadeIn::animator.onFrame - node=%p, value=%f", payload->nodeHandle, value);
            A2UINode node(payload->nodeHandle);
            node.setOpacity(value);
            const float scale = payload->startScale +
                (payload->targetScale - payload->startScale) * value;
            node.setScale(scale, scale);
        });
    OH_ArkUI_AnimatorOption_RegisterOnFinishCallback(
        option,
        payload,
        [](ArkUI_AnimatorEvent* event) {
            auto* payload = static_cast<OpacityAnimatePayload*>(OH_ArkUI_AnimatorEvent_GetUserData(event));
            if (payload == nullptr || payload->nodeHandle == nullptr) {
                HM_LOGW("ImageFadeIn::animator.onFinish - payload invalid");
                return;
            }
            HM_LOGI("ImageFadeIn::animator.onFinish - node=%p, target=%f, animator=%p",
                payload->nodeHandle, payload->targetOpacity, payload->animatorHandle);
            A2UINode node(payload->nodeHandle);
            node.setOpacity(payload->targetOpacity);
            node.setScale(payload->targetScale, payload->targetScale);
            ArkUI_NativeAnimateAPI_1* animateApi = getAnimateApi();
            if (animateApi != nullptr && payload->animatorHandle != nullptr) {
                animateApi->disposeAnimator(payload->animatorHandle);
            }
            delete payload;
        });
    OH_ArkUI_AnimatorOption_RegisterOnCancelCallback(
        option,
        payload,
        [](ArkUI_AnimatorEvent* event) {
            auto* payload = static_cast<OpacityAnimatePayload*>(OH_ArkUI_AnimatorEvent_GetUserData(event));
            if (payload == nullptr || payload->nodeHandle == nullptr) {
                HM_LOGW("ImageFadeIn::animator.onCancel - payload invalid");
                return;
            }
            HM_LOGI("ImageFadeIn::animator.onCancel - node=%p, target=%f, animator=%p",
                payload->nodeHandle, payload->targetOpacity, payload->animatorHandle);
            A2UINode node(payload->nodeHandle);
            node.setOpacity(payload->targetOpacity);
            node.setScale(payload->targetScale, payload->targetScale);
            ArkUI_NativeAnimateAPI_1* animateApi = getAnimateApi();
            if (animateApi != nullptr && payload->animatorHandle != nullptr) {
                animateApi->disposeAnimator(payload->animatorHandle);
            }
            delete payload;
        });

    ArkUI_AnimatorHandle animatorHandle = animateApi->createAnimator(context, option);
    payload->animatorHandle = animatorHandle;
    HM_LOGI("animatorHandle=%p", animatorHandle);
    if (animatorHandle == nullptr) {
        HM_LOGW("createAnimator failed, fallback direct");
        A2UINode(nodeHandle).setOpacity(targetOpacity);
        delete payload;
    } else {
        int32_t playResult = OH_ArkUI_Animator_Play(animatorHandle);
        HM_LOGI("animator play result=%d", playResult);
        if (playResult != ARKUI_ERROR_CODE_NO_ERROR) {
            animateApi->disposeAnimator(animatorHandle);
            A2UINode(nodeHandle).setOpacity(targetOpacity);
            delete payload;
        }
    }

    if (curve != nullptr) {
        OH_ArkUI_Curve_DisposeCurve(curve);
    }
    OH_ArkUI_AnimatorOption_Dispose(option);
}

void onOpacityAnimatePostFrame(uint64_t nanoTimestamp, uint32_t frameCount, void* userData) {
    auto* payload = static_cast<OpacityAnimatePayload*>(userData);
    if (payload == nullptr) {
        HM_LOGW("ImageFadeIn::animateImageFadeIn.postFrame - payload invalid");
        return;
    }
    HM_LOGI("ImageFadeIn::animateImageFadeIn.postFrame - frame=%u, timestamp=%llu, node=%p",
        frameCount, static_cast<unsigned long long>(nanoTimestamp), payload->nodeHandle);
    animateImageFadeIn(payload->nodeHandle, payload->targetOpacity, payload->durationMs);
    delete payload;
}

void animateNodeOpacityTo(ArkUI_NodeHandle nodeHandle, float targetOpacity, int32_t durationMs, ArkUI_AnimationCurve curve) {
    if (nodeHandle == nullptr) {
        HM_LOGW("nodeHandle is null before post frame");
        return;
    }

    ArkUI_ContextHandle context = OH_ArkUI_GetContextByNode(nodeHandle);
    if (context == nullptr) {
        HM_LOGW("context is null before post frame, fallback direct");
        animateImageFadeIn(nodeHandle, targetOpacity, durationMs);
        return;
    }

    OpacityAnimatePayload* payload = new OpacityAnimatePayload();
    payload->nodeHandle = nodeHandle;
    payload->targetOpacity = targetOpacity;
    payload->durationMs = durationMs;
    int32_t postResult = OH_ArkUI_PostFrameCallback(
        context,
        payload,
        onOpacityAnimatePostFrame);
    HM_LOGI("postFrame result=%d", postResult);
    if (postResult != ARKUI_ERROR_CODE_NO_ERROR) {
        delete payload;
        animateImageFadeIn(nodeHandle, targetOpacity, durationMs);
    }
}

}  // namespace

ImageComponent::ImageComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "Image") {

    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_IMAGE);

    A2UIImageNode node(m_nodeHandle);
    node.setObjectFitCover();
    node.setTransformCenterPercent(0.5f, 0.5f);

    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    m_callbackPayload = std::make_shared<ImageCallbackPayload>();
    m_callbackPayload->component = this;
    m_payloadRef = new std::shared_ptr<ImageCallbackPayload>(m_callbackPayload);

    g_nodeAPI->addNodeEventReceiver(m_nodeHandle, onImageCompleteCallback);
    g_nodeAPI->registerNodeEvent(m_nodeHandle, NODE_IMAGE_ON_COMPLETE, 0, m_payloadRef);

    HM_LOGI( "ImageComponent - Created: id=%s, handle=%s",
                id.c_str(), m_nodeHandle ? "valid" : "null");
}

ImageComponent::~ImageComponent() {
    if (m_callbackPayload) {
        m_callbackPayload->component = nullptr;
    }

    stopShimmer();

    if (m_nodeHandle) {
        g_nodeAPI->unregisterNodeEvent(m_nodeHandle, NODE_IMAGE_ON_COMPLETE);
        g_nodeAPI->removeNodeEventReceiver(m_nodeHandle, onImageCompleteCallback);
    }
    if (m_payloadRef) {
        delete m_payloadRef;
        m_payloadRef = nullptr;
    }
    
    HM_LOGI("ImageComponent - Destroyed: id=%s", m_id.c_str());
}

void ImageComponent::destroy() {
    HM_LOGI("ImageComponent::destroy - id=%s", m_id.c_str());

    if (m_callbackPayload) {
        m_callbackPayload->component = nullptr;
    }

    if (!m_currentRequestId.empty()) {
        ImageLoaderBridge::getInstance().cancel(m_currentRequestId);
        m_currentRequestId.clear();
    }

    stopShimmer();

    if (m_nodeHandle) {
        g_nodeAPI->unregisterNodeEvent(m_nodeHandle, NODE_IMAGE_ON_COMPLETE);
        g_nodeAPI->removeNodeEventReceiver(m_nodeHandle, onImageCompleteCallback);
    }

    if (m_payloadRef) {
        delete m_payloadRef;
        m_payloadRef = nullptr;
    }

    A2UIComponent::destroy();
}

// ---- Property Updates ----

void ImageComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        HM_LOGE( "handle is null, id=%s", m_id.c_str());
        return;
    }

    if (properties.contains("variant") && properties["variant"].is_string()) {
        std::string variant = properties["variant"].get<std::string>();
        float aspectRatio = getAspectRatioByVariant(variant);
        
        HM_LOGI( "variant: %s, aspect-ratio: %f",
                    variant.c_str(), aspectRatio);
        
        if (aspectRatio > 0.0f) {
            m_aspectRatio = aspectRatio;
            HM_LOGI( "Applied aspect ratio from variant: %f",
                        aspectRatio);
        }
    }

    applyUrl(properties);
    applyFit(properties);
    applyStyles(properties);

    HM_LOGI( "Applied properties, id=%s", m_id.c_str());
}


void ImageComponent::applyUrl(const nlohmann::json& properties) {
    if (!properties.contains("url")) {
        HM_LOGI("no url field, id=%s", m_id.c_str());
        if (!m_currentUrl.empty()) {
            HM_LOGI("no url in props but m_currentUrl exists, reapplying src, id=%s", m_id.c_str());
            m_lastAnimatedUrl.clear();
            A2UIImageNode(m_nodeHandle).setSrc(m_currentUrl);
            if (m_imageWidth > 0.0f && m_imageHeight > 0.0f) {
                float w = 0.0f, h = 0.0f;
                applyAspectRatio(getWidth(), getHeight(), w, h);
                if (w <= 0.0f) w = m_imageWidth;
                if (h <= 0.0f) h = m_imageHeight;
                
                // Get the component render completion observer
                agenui::IComponentRenderObservable* componentRenderObservable = getComponentRenderObservable();
                if (componentRenderObservable && w > 0.0f && h > 0.0f) {
                    agenui::ComponentRenderInfo info;
                    info.surfaceId = getSurfaceId();
                    info.componentId = getId();
                    info.type = getComponentType();
                    info.width = w;
                    info.height = h;
                    
                    HM_LOGI("renotify notifyRenderFinish (no-url reapply): surfaceId=%s id=%s w=%f h=%f",
                        info.surfaceId.c_str(), info.componentId.c_str(), info.width, info.height);
                    componentRenderObservable->notifyRenderFinish(info);
                }
            }
        }
        return;
    }

    std::string url = extractStringValue(properties["url"]);
    HM_LOGI("id=%s, newUrl=%s, currentUrl=%s, fadeEnabled=%s",
        m_id.c_str(), url.c_str(), m_currentUrl.c_str(),
        isImageFadeInEnabled() ? "true" : "false");
    if (url.empty()) {
        if (!m_currentRequestId.empty()) {
            ImageLoaderBridge::getInstance().cancel(m_currentRequestId);
            m_currentRequestId.clear();
        }
        m_currentUrl.clear();
        m_pendingFadeIn = false;
        stopShimmer();
        A2UIImageNode node(m_nodeHandle);
        node.resetBackgroundColor();
        node.resetOpacityTransition();
        node.setOpacity(1.0f);
        node.setScale(1.0f, 1.0f);
        HM_LOGW( "url is empty, id=%s", m_id.c_str());
        return;
    }

    bool urlChanged = (url != m_currentUrl);

    if (urlChanged && !m_currentRequestId.empty()) {
        HM_LOGI("url changed, cancel old requestId=%s, id=%s", m_currentRequestId.c_str(), m_id.c_str());
        ImageLoaderBridge::getInstance().cancel(m_currentRequestId);
        m_currentRequestId.clear();
    }

    // Check whether an external loader exists
    if (ImageLoaderBridge::getInstance().hasLoader() && urlChanged) {
        m_currentUrl = url;
        m_lastAnimatedUrl.clear();

        if (isImageFadeInEnabled() && m_surfaceAnimated) {
            showPlaceholder();
        }

        float hintW = getWidth();
        float hintH = getHeight();

        auto payloadRef = new std::shared_ptr<ImageCallbackPayload>(m_callbackPayload);
        std::string requestId = ImageLoaderBridge::getInstance().loadImage(
            url,
            hintW,
            hintH,
            m_id,
            getSurfaceId(),
            m_nodeHandle,
            [payloadRef](const std::string& rid, bool success, bool isCancelled) {
                std::shared_ptr<ImageCallbackPayload> payload = *payloadRef;
                delete payloadRef;
                ImageComponent* component = payload->component;
                if (component == nullptr) {
                    HM_LOGW("image_loader callback: component already destroyed, requestId=%s", rid.c_str());
                    return;
                }
                if (component->m_currentRequestId != rid) {
                    HM_LOGW("image_loader callback: stale requestId=%s, current=%s, skip",
                        rid.c_str(), component->m_currentRequestId.c_str());
                    return;
                }
                component->m_currentRequestId.clear();
        
                if (isCancelled) {
                    HM_LOGI("image_loader callback: cancelled, id=%s url=%s",
                        component->m_id.c_str(), component->m_currentUrl.c_str());
                    component->stopShimmer();
                    return;
                }
        
                if (!success) {
                    HM_LOGW("image_loader callback: failed, fallback to ArkUI native, id=%s url=%s",
                        component->m_id.c_str(), component->m_currentUrl.c_str());
                    component->stopShimmer();
                    A2UIImageNode(component->m_nodeHandle).setSrc(component->m_currentUrl);
                    return;
                }
        
                HM_LOGI("image_loader callback: success(PixelMap set), id=%s url=%s",
                    component->m_id.c_str(), component->m_currentUrl.c_str());
                component->stopShimmer();
            }
        );

        if (requestId.empty()) {
            HM_LOGW("image_loader: loadImage returned empty requestId, fallback ArkUI, id=%s", m_id.c_str());
            A2UIImageNode(m_nodeHandle).setSrc(url);
        } else {
            m_currentRequestId = requestId;
        }
        return;
    }

    A2UIImageNode node(m_nodeHandle);
    node.setSrc(url);
    m_currentUrl = url;
    if (urlChanged) {
        m_lastAnimatedUrl.clear();
    } else if (m_imageWidth > 0.0f && m_imageHeight > 0.0f) {
        HM_LOGI("url unchanged, renotify height, id=%s, w=%f h=%f",
            m_id.c_str(), m_imageWidth, m_imageHeight);
        float w = 0.0f, h = 0.0f;
        applyAspectRatio(getWidth(), getHeight(), w, h);
        if (w <= 0.0f) w = m_imageWidth;
        if (h <= 0.0f) h = m_imageHeight;
        
        // Get the component render completion observer
        agenui::IComponentRenderObservable* componentRenderObservable = getComponentRenderObservable();
        if (componentRenderObservable && w > 0.0f && h > 0.0f) {
            agenui::ComponentRenderInfo info;
            info.surfaceId = getSurfaceId();
            info.componentId = getId();
            info.type = getComponentType();
            info.width = w;
            info.height = h;
            
            HM_LOGI("renotify notifyRenderFinish: surfaceId=%s id=%s w=%f h=%f",
                info.surfaceId.c_str(), info.componentId.c_str(), info.width, info.height);
            componentRenderObservable->notifyRenderFinish(info);
        }
    }

    HM_LOGI( "Set image src: %s", url.c_str());

    if (!isImageFadeInEnabled() || !m_surfaceAnimated) {
        HM_LOGI("fadeIn disabled (fadeIn=%s, surfaceAnimated=%s), skip shimmer, id=%s",
            isImageFadeInEnabled() ? "true" : "false", m_surfaceAnimated ? "true" : "false", m_id.c_str());
        return;
    }

    showPlaceholder();
}

void ImageComponent::prepareFadeInForUrl(const std::string& url) {
    if (!m_nodeHandle) return;
    A2UIImageNode node(m_nodeHandle);
    node.setOpacity(0.0f);
    node.setScale(kImageFadeInStartScale, kImageFadeInStartScale);  // 0.92f
    m_pendingFadeIn = true;
    HM_LOGI("opacity=0, scale=%.2f, id=%s", kImageFadeInStartScale, m_id.c_str());
}

void ImageComponent::playFadeInIfNeeded() {
    if (!m_pendingFadeIn || !m_nodeHandle) {
        return;
    }
    m_pendingFadeIn = false;
    playMagicReveal(1500);
    HM_LOGI("scheduled MagicReveal animation, id=%s", m_id.c_str());
}

static ArkUI_AnimatorHandle createSweepAnimator(
    ArkUI_ContextHandle context,
    ArkUI_NativeAnimateAPI_1* animateApi,
    ArkUI_NodeHandle node,
    float beginOffset,
    float endOffset,
    int32_t durationMs,
    void* userData,
    void (*onFrameCb)(ArkUI_AnimatorOnFrameEvent*),
    void (*onFinishCb)(ArkUI_AnimatorEvent*),
    void (*onCancelCb)(ArkUI_AnimatorEvent*)
) {
    ArkUI_AnimatorOption* option = OH_ArkUI_AnimatorOption_Create(0);
    if (!option) return nullptr;

    OH_ArkUI_AnimatorOption_SetDuration(option, durationMs);
    OH_ArkUI_AnimatorOption_SetBegin(option, beginOffset);
    OH_ArkUI_AnimatorOption_SetEnd(option, endOffset);
    OH_ArkUI_AnimatorOption_SetIterations(option, 1);
    OH_ArkUI_AnimatorOption_SetFill(option, ARKUI_ANIMATION_FILL_MODE_FORWARDS);
    OH_ArkUI_AnimatorOption_SetDirection(option, ARKUI_ANIMATION_DIRECTION_NORMAL);
    ArkUI_CurveHandle curve = OH_ArkUI_Curve_CreateCubicBezierCurve(0.42f, 0.0f, 0.58f, 1.0f);
    if (curve) OH_ArkUI_AnimatorOption_SetCurve(option, curve);

    if (onFrameCb)  OH_ArkUI_AnimatorOption_RegisterOnFrameCallback(option, userData, onFrameCb);
    if (onFinishCb) OH_ArkUI_AnimatorOption_RegisterOnFinishCallback(option, userData, onFinishCb);
    if (onCancelCb) OH_ArkUI_AnimatorOption_RegisterOnCancelCallback(option, userData, onCancelCb);

    ArkUI_AnimatorHandle handle = animateApi->createAnimator(context, option);
    if (curve) OH_ArkUI_Curve_DisposeCurve(curve);
    OH_ArkUI_AnimatorOption_Dispose(option);
    return handle;
}

void ImageComponent::playMagicReveal(int32_t durationMs, float hintW, float hintH) {
    if (!m_nodeHandle) return;

    ArkUI_NativeAnimateAPI_1* animateApi = getAnimateApi();
    ArkUI_NodeHandle imageNode = m_nodeHandle;
    ArkUI_ContextHandle context = OH_ArkUI_GetContextByNode(m_nodeHandle);

    if (!context || !animateApi) {
        HM_LOGW("prerequisites missing, id=%s", m_id.c_str());
        return;
    }

    float nodeW = getWidth();
    float nodeH = getHeight();
    if (nodeW <= 0.0f && hintW > 0.0f) nodeW = hintW;
    if (nodeH <= 0.0f && hintH > 0.0f) nodeH = hintH;
    if (hintW > 0.0f && nodeW > 0.0f && nodeW < hintW * 0.2f) {
        HM_LOGW("nodeW(%.1f) abnormally small vs hint(%.1f), using hint, id=%s",
            nodeW, hintW, m_id.c_str());
        nodeW = hintW;
    }
    if (hintH > 0.0f && nodeH > 0.0f && nodeH < hintH * 0.2f) {
        HM_LOGW("nodeH(%.1f) abnormally small vs hint(%.1f), using hint, id=%s",
            nodeH, hintH, m_id.c_str());
        nodeH = hintH;
    }
    if (nodeW <= 0.0f || nodeH <= 0.0f) {
        HM_LOGW("invalid size(%.1f,%.1f) hint(%.1f,%.1f), id=%s",
            nodeW, nodeH, hintW, hintH, m_id.c_str());
        return;
    }
    HM_LOGI("nodeW=%.1f nodeH=%.1f hint(%.1f,%.1f) id=%s",
        nodeW, nodeH, hintW, hintH, m_id.c_str());

    if (m_revealMaskNode) {
        g_nodeAPI->removeChild(m_nodeHandle, m_revealMaskNode);
        g_nodeAPI->disposeNode(m_revealMaskNode);
        m_revealMaskNode = nullptr;
    }

    A2UIImageNode node(m_nodeHandle);
    node.setOpacity(1.0f);
    node.setScale(kImageFadeInStartScale, kImageFadeInStartScale);

    struct RevealPayload {
        ArkUI_NodeHandle imageNode     = nullptr;
        ArkUI_NodeHandle maskNode      = nullptr;
        ArkUI_NodeHandle glassNode     = nullptr;
        ArkUI_AnimatorHandle maskAnim  = nullptr;
        ArkUI_AnimatorHandle glassAnim = nullptr;
        uint32_t maskColors[4] = {
            colors::kColorTransparentWhite,
            colors::kColorTransparentWhite,
            0x22FFFFFF,
            colors::kColorWhite,
        };
        float maskStops[4] = {0.0f, 0.55f, 0.85f, 1.0f};
        uint32_t glassColors[7] = {
            colors::kColorTransparentWhite,
            0x1FFFF5E0,
            0x59FFEEDD,
            0x80FFFFFF,
            0x4DD9EBFF,
            0x1FFFFFFF,
            colors::kColorTransparentWhite,
        };
        float glassStops[7] = {0.0f, 0.25f, 0.38f, 0.50f, 0.62f, 0.75f, 1.0f};
        int finishCount = 0;
    };
    RevealPayload* rp = new RevealPayload();
    rp->imageNode = m_nodeHandle;

    {
        ArkUI_NodeHandle maskNode = g_nodeAPI->createNode(ARKUI_NODE_STACK);
        if (!maskNode) { delete rp; return; }
        rp->maskNode = maskNode;

        A2UINode mv(maskNode);
        mv.setWidth(nodeW);
        mv.setHeight(nodeH);
        mv.setHitTestBehavior(ARKUI_HIT_TEST_MODE_NONE);
        mv.setPosition(0.0f, 0.0f);

        // stops[i] = clamp(kMaskLoc[i] + (-0.8), 0, 1) = [0, 0, 0.05, 0.2]
        {
            auto clampF = [](float v) { return v < 0.0f ? 0.0f : (v > 1.0f ? 1.0f : v); };
            static const float kLoc[4] = {0.0f, 0.55f, 0.85f, 1.0f};
            for (int i = 0; i < 4; i++) rp->maskStops[i] = clampF(kLoc[i] + (-0.8f));
        }
        ArkUI_ColorStop cs;
        cs.colors = rp->maskColors;
        cs.stops  = rp->maskStops;
        cs.size   = 4;
        ArkUI_NumberValue gv[3];
        gv[0].f32 = 135.0f;
        gv[1].i32 = ARKUI_LINEAR_GRADIENT_DIRECTION_CUSTOM;
        gv[2].i32 = 0;
        ArkUI_AttributeItem gi = {gv, 3, nullptr, &cs};
        g_nodeAPI->setAttribute(maskNode, NODE_LINEAR_GRADIENT, &gi);
        g_nodeAPI->addChild(imageNode, maskNode);
    }

    {
        ArkUI_NodeHandle glassNode = g_nodeAPI->createNode(ARKUI_NODE_STACK);
        if (!glassNode) {
            HM_LOGW("ImageMagicReveal - glassNode create failed, skip glass, id=%s", m_id.c_str());
        } else {
            rp->glassNode = glassNode;
            A2UINode gv(glassNode);
            gv.setWidth(nodeW);
            gv.setHeight(nodeH);
            gv.setHitTestBehavior(ARKUI_HIT_TEST_MODE_NONE);
            gv.setPosition(0.0f, 0.0f);

            // stops[i] = clamp(kGlassLoc[i] + (-0.6), 0, 1)
            {
                auto clampF = [](float v) { return v < 0.0f ? 0.0f : (v > 1.0f ? 1.0f : v); };
                static const float kLoc[7] = {0.0f, 0.25f, 0.38f, 0.50f, 0.62f, 0.75f, 1.0f};
                for (int i = 0; i < 7; i++) rp->glassStops[i] = clampF(kLoc[i] + (-0.6f));
            }
            ArkUI_ColorStop gcs;
            gcs.colors = rp->glassColors;
            gcs.stops  = rp->glassStops;
            gcs.size   = 7;
            ArkUI_NumberValue ggv[3];
            ggv[0].f32 = 135.0f;
            ggv[1].i32 = ARKUI_LINEAR_GRADIENT_DIRECTION_CUSTOM;
            ggv[2].i32 = 0;
            ArkUI_AttributeItem ggi = {ggv, 3, nullptr, &gcs};
            g_nodeAPI->setAttribute(glassNode, NODE_LINEAR_GRADIENT, &ggi);
            g_nodeAPI->addChild(imageNode, glassNode);
        }
    }

    m_revealMaskNode = nullptr;

    auto cleanup = [](RevealPayload* p) {
        p->finishCount++;
        if (p->finishCount < 2 && p->glassNode != nullptr) return;
        if (p->maskNode && p->imageNode) {
            g_nodeAPI->removeChild(p->imageNode, p->maskNode);
            g_nodeAPI->disposeNode(p->maskNode);
        }
        if (p->glassNode && p->imageNode) {
            g_nodeAPI->removeChild(p->imageNode, p->glassNode);
            g_nodeAPI->disposeNode(p->glassNode);
        }
        ArkUI_NativeAnimateAPI_1* api = getAnimateApi();
        if (api) {
            if (p->maskAnim)  api->disposeAnimator(p->maskAnim);
            if (p->glassAnim) api->disposeAnimator(p->glassAnim);
        }
        HM_LOGI("ImageMagicReveal - all animators finished, cleanup done");
        delete p;
    };

    rp->maskAnim = createSweepAnimator(
        context, animateApi, rp->maskNode,
        0.0f, 1.0f, durationMs,
        rp,
        [](ArkUI_AnimatorOnFrameEvent* event) {
            auto* p = static_cast<RevealPayload*>(OH_ArkUI_AnimatorOnFrameEvent_GetUserData(event));
            if (!p || !p->maskNode) return;
            float t = OH_ArkUI_AnimatorOnFrameEvent_GetValue(event);  // [0,1]
            float sp = -0.8f + t * 1.8f;
            // stops[i] = clamp(kMaskLoc[i] + sp, 0, 1)
            static const float kLoc[4] = {0.0f, 0.55f, 0.85f, 1.0f};
            auto clampF = [](float v) { return v < 0.0f ? 0.0f : (v > 1.0f ? 1.0f : v); };
            p->maskStops[0] = clampF(kLoc[0] + sp);
            p->maskStops[1] = clampF(kLoc[1] + sp);
            p->maskStops[2] = clampF(kLoc[2] + sp);
            p->maskStops[3] = clampF(kLoc[3] + sp);
            ArkUI_ColorStop cs;
            cs.colors = p->maskColors;
            cs.stops  = p->maskStops;
            cs.size   = 4;
            ArkUI_NumberValue gv[3];
            gv[0].f32 = 135.0f;
            gv[1].i32 = ARKUI_LINEAR_GRADIENT_DIRECTION_CUSTOM;
            gv[2].i32 = 0;
            ArkUI_AttributeItem gi = {gv, 3, nullptr, &cs};
            g_nodeAPI->setAttribute(p->maskNode, NODE_LINEAR_GRADIENT, &gi);
        },
        [](ArkUI_AnimatorEvent* event) {
            auto* p = static_cast<RevealPayload*>(OH_ArkUI_AnimatorEvent_GetUserData(event));
            if (p) {
                auto cleanupFn = [](RevealPayload* rp) {
                    rp->finishCount++;
                    if (rp->finishCount < 2 && rp->glassNode != nullptr) return;
                    if (rp->maskNode && rp->imageNode) { g_nodeAPI->removeChild(rp->imageNode, rp->maskNode); g_nodeAPI->disposeNode(rp->maskNode); }
                    if (rp->glassNode && rp->imageNode) { g_nodeAPI->removeChild(rp->imageNode, rp->glassNode); g_nodeAPI->disposeNode(rp->glassNode); }
                    ArkUI_NativeAnimateAPI_1* api = getAnimateApi();
                    if (api) { if (rp->maskAnim) api->disposeAnimator(rp->maskAnim); if (rp->glassAnim) api->disposeAnimator(rp->glassAnim); }
                    HM_LOGI("ImageMagicReveal - cleanup done");
                    delete rp;
                };
                cleanupFn(p);
            }
        },
        [](ArkUI_AnimatorEvent* event) {
            auto* p = static_cast<RevealPayload*>(OH_ArkUI_AnimatorEvent_GetUserData(event));
            if (p) {
                auto cleanupFn = [](RevealPayload* rp) {
                    rp->finishCount++;
                    if (rp->finishCount < 2 && rp->glassNode != nullptr) return;
                    if (rp->maskNode && rp->imageNode) { g_nodeAPI->removeChild(rp->imageNode, rp->maskNode); g_nodeAPI->disposeNode(rp->maskNode); }
                    if (rp->glassNode && rp->imageNode) { g_nodeAPI->removeChild(rp->imageNode, rp->glassNode); g_nodeAPI->disposeNode(rp->glassNode); }
                    ArkUI_NativeAnimateAPI_1* api = getAnimateApi();
                    if (api) { if (rp->maskAnim) api->disposeAnimator(rp->maskAnim); if (rp->glassAnim) api->disposeAnimator(rp->glassAnim); }
                    delete rp;
                };
                cleanupFn(p);
            }
        }
    );

    // stops[i] = kGlassLoc[i] + (-0.6 + t * 1.8)
    if (rp->glassNode) {
        rp->glassAnim = createSweepAnimator(
            context, animateApi, rp->glassNode,
            0.0f, 1.0f, durationMs,
            rp,
            [](ArkUI_AnimatorOnFrameEvent* event) {
                auto* p = static_cast<RevealPayload*>(OH_ArkUI_AnimatorOnFrameEvent_GetUserData(event));
                if (!p || !p->glassNode) return;
                float t = OH_ArkUI_AnimatorOnFrameEvent_GetValue(event);
                float sp = -0.6f + t * 1.8f;
                static const float kLoc[7] = {0.0f, 0.25f, 0.38f, 0.50f, 0.62f, 0.75f, 1.0f};
                auto clampF = [](float v) { return v < 0.0f ? 0.0f : (v > 1.0f ? 1.0f : v); };
                for (int i = 0; i < 7; i++) {
                    p->glassStops[i] = clampF(kLoc[i] + sp);
                }
                ArkUI_ColorStop gcs;
                gcs.colors = p->glassColors;
                gcs.stops  = p->glassStops;
                gcs.size   = 7;
                ArkUI_NumberValue ggv[3];
                ggv[0].f32 = 135.0f;
                ggv[1].i32 = ARKUI_LINEAR_GRADIENT_DIRECTION_CUSTOM;
                ggv[2].i32 = 0;
                ArkUI_AttributeItem ggi = {ggv, 3, nullptr, &gcs};
                g_nodeAPI->setAttribute(p->glassNode, NODE_LINEAR_GRADIENT, &ggi);
            },
            [](ArkUI_AnimatorEvent* event) {
                auto* p = static_cast<RevealPayload*>(OH_ArkUI_AnimatorEvent_GetUserData(event));
                if (p) {
                    auto cleanupFn = [](RevealPayload* rp) {
                        rp->finishCount++;
                        if (rp->finishCount < 2 && rp->glassNode != nullptr) return;
                        if (rp->maskNode && rp->imageNode) { g_nodeAPI->removeChild(rp->imageNode, rp->maskNode); g_nodeAPI->disposeNode(rp->maskNode); }
                        if (rp->glassNode && rp->imageNode) { g_nodeAPI->removeChild(rp->imageNode, rp->glassNode); g_nodeAPI->disposeNode(rp->glassNode); }
                        ArkUI_NativeAnimateAPI_1* api = getAnimateApi();
                        if (api) { if (rp->maskAnim) api->disposeAnimator(rp->maskAnim); if (rp->glassAnim) api->disposeAnimator(rp->glassAnim); }
                        HM_LOGI("ImageMagicReveal - cleanup done");
                        delete rp;
                    };
                    cleanupFn(p);
                }
            },
            [](ArkUI_AnimatorEvent* event) {
                auto* p = static_cast<RevealPayload*>(OH_ArkUI_AnimatorEvent_GetUserData(event));
                if (p) {
                    auto cleanupFn = [](RevealPayload* rp) {
                        rp->finishCount++;
                        if (rp->finishCount < 2 && rp->glassNode != nullptr) return;
                        if (rp->maskNode && rp->imageNode) { g_nodeAPI->removeChild(rp->imageNode, rp->maskNode); g_nodeAPI->disposeNode(rp->maskNode); }
                        if (rp->glassNode && rp->imageNode) { g_nodeAPI->removeChild(rp->imageNode, rp->glassNode); g_nodeAPI->disposeNode(rp->glassNode); }
                        ArkUI_NativeAnimateAPI_1* api = getAnimateApi();
                        if (api) { if (rp->maskAnim) api->disposeAnimator(rp->maskAnim); if (rp->glassAnim) api->disposeAnimator(rp->glassAnim); }
                        delete rp;
                    };
                    cleanupFn(p);
                }
            }
        );
    } else {
        rp->finishCount = 1;
    }

    // Scale ease-out animation: node scale 0.98 -> 1.0 over durationMs.
    {
        struct ScalePayload { ArkUI_NodeHandle node; ArkUI_AnimatorHandle anim; };
        ScalePayload* sp = new ScalePayload();
        sp->node = m_nodeHandle;

        ArkUI_AnimatorOption* scaleOpt = OH_ArkUI_AnimatorOption_Create(0);
        if (scaleOpt) {
            OH_ArkUI_AnimatorOption_SetDuration(scaleOpt, durationMs);
            OH_ArkUI_AnimatorOption_SetBegin(scaleOpt, 0.0f);
            OH_ArkUI_AnimatorOption_SetEnd(scaleOpt, 1.0f);
            OH_ArkUI_AnimatorOption_SetIterations(scaleOpt, 1);
            OH_ArkUI_AnimatorOption_SetFill(scaleOpt, ARKUI_ANIMATION_FILL_MODE_FORWARDS);
            OH_ArkUI_AnimatorOption_SetDirection(scaleOpt, ARKUI_ANIMATION_DIRECTION_NORMAL);
            ArkUI_CurveHandle easeCurve = OH_ArkUI_Curve_CreateCubicBezierCurve(0.0f, 0.0f, 0.58f, 1.0f);
            if (easeCurve) OH_ArkUI_AnimatorOption_SetCurve(scaleOpt, easeCurve);

            OH_ArkUI_AnimatorOption_RegisterOnFrameCallback(
                scaleOpt, sp,
                [](ArkUI_AnimatorOnFrameEvent* event) {
                    auto* p = static_cast<ScalePayload*>(OH_ArkUI_AnimatorOnFrameEvent_GetUserData(event));
                    if (!p || !p->node) return;
                    float t = OH_ArkUI_AnimatorOnFrameEvent_GetValue(event);  // [0,1]
                    float s = kImageFadeInStartScale + (1.0f - kImageFadeInStartScale) * t;
                    A2UINode(p->node).setScale(s, s);
                });
            OH_ArkUI_AnimatorOption_RegisterOnFinishCallback(
                scaleOpt, sp,
                [](ArkUI_AnimatorEvent* event) {
                    auto* p = static_cast<ScalePayload*>(OH_ArkUI_AnimatorEvent_GetUserData(event));
                    if (!p) return;
                    if (p->node) A2UINode(p->node).setScale(1.0f, 1.0f);
                    ArkUI_NativeAnimateAPI_1* api = getAnimateApi();
                    if (api && p->anim) api->disposeAnimator(p->anim);
                    delete p;
                });
            OH_ArkUI_AnimatorOption_RegisterOnCancelCallback(
                scaleOpt, sp,
                [](ArkUI_AnimatorEvent* event) {
                    auto* p = static_cast<ScalePayload*>(OH_ArkUI_AnimatorEvent_GetUserData(event));
                    if (!p) return;
                    if (p->node) A2UINode(p->node).setScale(1.0f, 1.0f);
                    ArkUI_NativeAnimateAPI_1* api = getAnimateApi();
                    if (api && p->anim) api->disposeAnimator(p->anim);
                    delete p;
                });

            ArkUI_AnimatorHandle scaleHandle = animateApi->createAnimator(context, scaleOpt);
            sp->anim = scaleHandle;
            if (easeCurve) OH_ArkUI_Curve_DisposeCurve(easeCurve);
            OH_ArkUI_AnimatorOption_Dispose(scaleOpt);

            if (scaleHandle) {
                OH_ArkUI_Animator_Play(scaleHandle);
                HM_LOGI("ImageMagicReveal - scale animator started (0.98 -> 1.0)");
            } else {
                A2UINode(m_nodeHandle).setScale(1.0f, 1.0f);
                delete sp;
            }
        } else {
            delete sp;
        }
    }

    if (rp->maskAnim) {
        OH_ArkUI_Animator_Play(rp->maskAnim);
        HM_LOGI("ImageMagicReveal - mask animator started (0 -> nodeW), id=%s", m_id.c_str());
    } else {
        if (rp->maskNode && rp->imageNode) { g_nodeAPI->removeChild(rp->imageNode, rp->maskNode); g_nodeAPI->disposeNode(rp->maskNode); }
        if (rp->glassNode && rp->imageNode) { g_nodeAPI->removeChild(rp->imageNode, rp->glassNode); g_nodeAPI->disposeNode(rp->glassNode); }
        if (animateApi) { if (rp->glassAnim) animateApi->disposeAnimator(rp->glassAnim); }
        delete rp;
        return;
    }
    if (rp->glassAnim) {
        OH_ArkUI_Animator_Play(rp->glassAnim);
        HM_LOGI("ImageMagicReveal - glass animator started (0.2*nodeW -> 1.2*nodeW, leads mask by 0.2)");
    }
}


void ImageComponent::applyFit(const nlohmann::json& properties) {
    if (!properties.contains("fit") || !properties["fit"].is_string()) {
        return;
    }

    A2UIImageNode node(m_nodeHandle);
    node.setObjectFit((ArkUI_ObjectFit)mapObjectFit(properties["fit"].get<std::string>()));
}


void ImageComponent::applyStyles(const nlohmann::json& properties) {
    if (!properties.contains("styles") || !properties["styles"].is_object()) {
        return;
    }

    const auto& styles = properties["styles"];

    if (styles.contains("border-radius")) {
        float radius = 0.0f;

        if (styles["border-radius"].is_number()) {
            radius = styles["border-radius"].get<float>();
        } else if (styles["border-radius"].is_string()) {
            std::string radiusStr = styles["border-radius"].get<std::string>();
            radius = static_cast<float>(std::atof(radiusStr.c_str()));
        }

        if (radius > 0.0f) {
            A2UIImageNode node(m_nodeHandle);
            node.setBorderRadius(radius);
        }
    }

    // Border width
    if (styles.contains("border-width")) {
        float width = 0.0f;

        if (styles["border-width"].is_number()) {
            width = styles["border-width"].get<float>();
        } else if (styles["border-width"].is_string()) {
            std::string widthStr = styles["border-width"].get<std::string>();
            width = static_cast<float>(std::atof(widthStr.c_str()));
        }

        if (width > 0.0f) {
            A2UIImageNode node(m_nodeHandle);
            node.setBorderWidth(width, width, width, width);
            node.setBorderStyle(ARKUI_BORDER_STYLE_SOLID);
            HM_LOGI( "Set border-width: %f", width);
        }
    }

    // Border color
    if (styles.contains("border-color") && styles["border-color"].is_string()) {
        uint32_t color = parseColor(styles["border-color"].get<std::string>());
        A2UIImageNode node(m_nodeHandle);
        node.setBorderColor(color);
        HM_LOGI( "Set border-color: 0x%X", color);
    }
}

// ---- Enum Mappings ----

int32_t ImageComponent::mapObjectFit(const std::string& fit) {
    if (fit == "contain") {
        return ARKUI_OBJECT_FIT_CONTAIN;
    } else if (fit == "cover") {
        return ARKUI_OBJECT_FIT_COVER;
    } else if (fit == "scale-down") {
        return ARKUI_OBJECT_FIT_SCALE_DOWN;
    } else if (fit == "fill") {
        return ARKUI_OBJECT_FIT_FILL;
    } else if (fit == "none") {
        return ARKUI_OBJECT_FIT_NONE;
    }
    return ARKUI_OBJECT_FIT_COVER;
}


std::string ImageComponent::extractStringValue(const nlohmann::json& value) {
    if (value.is_string()) {
        return value.get<std::string>();
    }

    if (value.is_object() && value.contains("literalString") && value["literalString"].is_string()) {
        return value["literalString"].get<std::string>();
    }

    return "";
}


float ImageComponent::getAspectRatioByVariant(const std::string& variant) {
    if (variant.empty()) {
        return 0.0f;
    }

    if (variant == "smallFeature") {
        return 4.0f / 3.0f; // 4:3
    } else if (variant == "mediumFeature") {
        return 3.0f / 2.0f; // 3:2
    } else if (variant == "largeFeature") {
        return 16.0f / 9.0f; // 16:9
    } else if (variant == "header") {
        return 16.0f / 9.0f; // 16:9
    } else if (variant == "icon") {
        return 1.0f;
    } else if (variant == "avatar") {
        return 1.0f;
    }

    return 0.0f;
}


void ImageComponent::applyAspectRatio(float inputWidth, float inputHeight, float& outputWidth, float& outputHeight) {
    if (m_aspectRatio <= 0.0f) {
        outputWidth = inputWidth;
        outputHeight = inputHeight;
        return;
    }

    HM_LOGI( "Input size: width=%f, height=%f, aspectRatio=%f",
                inputWidth, inputHeight, m_aspectRatio);

    if (inputWidth > 0 && inputHeight <= 0) {
        outputWidth = inputWidth;
        outputHeight = inputWidth / m_aspectRatio;
        HM_LOGI( "Calculated height based on width: %f", outputHeight);
    } else if (inputHeight > 0 && inputWidth <= 0) {
        outputWidth = inputHeight * m_aspectRatio;
        outputHeight = inputHeight;
        HM_LOGI( "Calculated width based on height: %f", outputWidth);
    } else if (inputWidth > 0 && inputHeight > 0) {
        outputWidth = inputWidth;
        outputHeight = inputWidth / m_aspectRatio;
        HM_LOGI( "Adjusted height to maintain aspect ratio: %f", outputHeight);
    } else {
        outputWidth = inputWidth;
        outputHeight = inputHeight;
    }
}


void ImageComponent::onImageCompleteCallback(ArkUI_NodeEvent* event) {
    void* userData = OH_ArkUI_NodeEvent_GetUserData(event);
    if (!userData) {
        HM_LOGE( "userData is null");
        return;
    }

    auto* payloadRef = static_cast<std::shared_ptr<ImageCallbackPayload>*>(userData);
    std::shared_ptr<ImageCallbackPayload> payload = *payloadRef;

    if (payload->component == nullptr) {
        HM_LOGW("onImageCompleteCallback: component already destroyed (null), skip");
        return;
    }

    auto* component = payload->component;
    
    HM_LOGI( "Start, id=%s", component->m_id.c_str());
    
    ArkUI_NodeComponentEvent* componentEvent = OH_ArkUI_NodeEvent_GetNodeComponentEvent(event);
    ArkUI_NumberValue* data = componentEvent ? componentEvent->data : nullptr;

    // data[0]: loadingStatus (0=success, 1=fail)
    A2UIImageNode node(component->m_nodeHandle);

    if (!data) {
        HM_LOGW("data is null (abnormal event), "
                "fallback to stopShimmer+playMagicReveal, id=%s", component->m_id.c_str());
        component->stopShimmer();
        if (isImageFadeInEnabled() && component->m_surfaceAnimated && component->m_currentUrl != component->m_lastAnimatedUrl) {
            component->m_lastAnimatedUrl = component->m_currentUrl;
            float w = component->getWidth();
            float h = component->getHeight();
            component->playMagicReveal(1500, w, h);
        }
        return;
    }

    int32_t loadingStatus = data[0].i32;
    HM_LOGI("id=%s, status=%d, imageWidth=%f, imageHeight=%f, componentWidth=%f, componentHeight=%f",
        component->m_id.c_str(),
        loadingStatus,
        data[1].f32,
        data[2].f32,
        data[3].f32,
        data[4].f32);
    auto doLayoutAndNotify = [&]() {
        float nodeWidth = component->getWidth();
        float nodeHeight = component->getHeight();

        std::string styleWidth2, styleHeight2;
        std::string styleInfo2 = component->getStyleInfo();
        if (!styleInfo2.empty()) {
            try {
                auto styleJson = nlohmann::json::parse(styleInfo2);
                if (styleJson.contains("width")) {
                    styleWidth2 = styleJson["width"].get<std::string>();
                }
                if (styleJson.contains("height")) {
                    styleHeight2 = styleJson["height"].get<std::string>();
                }
            } catch (...) {
                HM_LOGW("ImageComponent layout: failed to parse styleInfo JSON, ignoring style width/height");
            }
        }

        auto isAuto2 = [](const std::string& val) -> bool {
            return val.empty() || val == "auto";
        };
        auto isPercent2 = [](const std::string& val) -> bool {
            return !val.empty() && val.back() == '%';
        };
        auto isPixel2 = [&isAuto2, &isPercent2](const std::string& val) -> bool {
            return !isAuto2(val) && !isPercent2(val) && !val.empty();
        };

        float width2 = 0.0f;
        float height2 = 0.0f;

        bool wIsAuto    = isAuto2(styleWidth2);
        bool hIsAuto    = isAuto2(styleHeight2);
        bool wIsPercent = isPercent2(styleWidth2);
        bool hIsPercent = isPercent2(styleHeight2);
        bool wIsPixel   = isPixel2(styleWidth2);
        bool hIsPixel   = isPixel2(styleHeight2);

        if (wIsAuto)    { width2  = nodeWidth; }
        if (hIsAuto)    { height2 = nodeHeight; }
        if (wIsPercent) {
            A2UIComponent* parent = component->getParent();
            float parentW = parent ? parent->getWidth() : nodeWidth;
            float pct = 0.0f;
            try { pct = std::stof(styleWidth2) / 100.0f; }
            catch (...) { HM_LOGW("ImageComponent: invalid percent width '%s', using 100%%", styleWidth2.c_str()); pct = 1.0f; }
            width2 = parentW * pct;
        }
        if (hIsPercent) {
            A2UIComponent* parent = component->getParent();
            float parentH = parent ? parent->getHeight() : nodeHeight;
            float pct = 0.0f;
            try { pct = std::stof(styleHeight2) / 100.0f; }
            catch (...) { HM_LOGW("ImageComponent: invalid percent height '%s', using 100%%", styleHeight2.c_str()); pct = 1.0f; }
            height2 = parentH * pct;
        }
        if (wIsPixel) {
            try { width2  = std::stof(styleWidth2);  }
            catch (...) { HM_LOGW("ImageComponent: invalid pixel width '%s', using node width", styleWidth2.c_str()); width2  = nodeWidth;  }
        }
        if (hIsPixel) {
            try { height2 = std::stof(styleHeight2); }
            catch (...) { HM_LOGW("ImageComponent: invalid pixel height '%s', using node height", styleHeight2.c_str()); height2 = nodeHeight; }
        }

        if (!wIsAuto && !wIsPercent && !wIsPixel && !hIsAuto && !hIsPercent && !hIsPixel) {
            component->applyAspectRatio(
                nodeWidth  > 0.0f ? nodeWidth  : component->m_imageWidth,
                nodeHeight > 0.0f ? nodeHeight : component->m_imageHeight,
                width2, height2);
        }
        if ((width2 > 0.0f && height2 <= 0.0f) || (width2 <= 0.0f && height2 > 0.0f)) {
            component->applyAspectRatio(width2, height2, width2, height2);
        }
        if (width2 > 0.0f && height2 > 0.0f && component->m_aspectRatio > 0.0f) {
            float expectedH = width2 / component->m_aspectRatio;
            if (expectedH > 0.0f && height2 < expectedH * 0.2f) {
                HM_LOGW("height(%.1f) abnormally small vs expected(%.1f), correcting, id=%s",
                    height2, expectedH, component->m_id.c_str());
                height2 = expectedH;
            }
        }

        float borderTop2 = 0.0f, borderRight2 = 0.0f, borderBottom2 = 0.0f, borderLeft2 = 0.0f;
        float marginTop2 = 0.0f, marginRight2 = 0.0f, marginBottom2 = 0.0f, marginLeft2 = 0.0f;
        float paddingTop2 = 0.0f, paddingRight2 = 0.0f, paddingBottom2 = 0.0f, paddingLeft2 = 0.0f;
        node.getBorderWidth(borderTop2, borderRight2, borderBottom2, borderLeft2);
        node.getMargin(marginTop2, marginRight2, marginBottom2, marginLeft2);
        node.getPadding(paddingTop2, paddingRight2, paddingBottom2, paddingLeft2);

        float totalBorderW2  = borderTop2 + borderRight2 + borderBottom2 + borderLeft2;
        float totalMarginW2  = marginLeft2 + marginRight2;
        float totalMarginH2  = marginTop2  + marginBottom2;
        float totalPaddingW2 = paddingLeft2 + paddingRight2;
        float totalPaddingH2 = paddingTop2  + paddingBottom2;
        float finalWidth2  = width2  + totalMarginW2  + totalPaddingW2;
        float finalHeight2 = height2 + totalMarginH2 + totalPaddingH2;

        HM_LOGI("Final size: w=%f h=%f finalW=%f finalH=%f, id=%s",
            width2, height2, finalWidth2, finalHeight2, component->m_id.c_str());

        if (width2 > finalWidth2 && height2 > finalHeight2) { return; }

        if (width2 > 0.0f && height2 > 0.0f) {
            node.setWidth(width2);
            node.setHeight(height2);
            node.setObjectFitFill();
        }

        // Get the component render completion observer
        agenui::IComponentRenderObservable* componentRenderObservable = component->getComponentRenderObservable();
        if (componentRenderObservable) {
            agenui::ComponentRenderInfo info2;
            info2.surfaceId = component->getSurfaceId();
            info2.componentId = component->getId();
            info2.type = component->getComponentType();
            info2.width = width2;
            info2.height = height2;
            
            HM_LOGI("notifyRenderFinish: surfaceId=%s id=%s w=%f h=%f",
                info2.surfaceId.c_str(), info2.componentId.c_str(), info2.width, info2.height);
            componentRenderObservable->notifyRenderFinish(info2);
        }
    };

    if (loadingStatus != 0) {
        HM_LOGW("loadingStatus=%d (non-zero), id=%s, imageWidth=%f, imageHeight=%f",
            loadingStatus, component->m_id.c_str(), data[1].f32, data[2].f32);
        component->stopShimmer();
        A2UIImageNode(component->m_nodeHandle).setOpacity(1.0f);
        A2UIImageNode(component->m_nodeHandle).setScale(1.0f, 1.0f);

        if (data[1].f32 > 0.0f && data[2].f32 > 0.0f) {
            if (!component->m_currentUrl.empty() &&
                component->m_currentUrl == component->m_lastAnimatedUrl) {
                HM_LOGW("status=1 duplicate, skip, id=%s", component->m_id.c_str());
                return;
            }
            component->m_lastAnimatedUrl = component->m_currentUrl;
            component->m_imageWidth  = data[1].f32;
            component->m_imageHeight = data[2].f32;
            if (component->m_aspectRatio == 0.0f && component->m_imageHeight > 0.0f) {
                component->m_aspectRatio = component->m_imageWidth / component->m_imageHeight;
                HM_LOGI("status=1: aspectRatio=%f, id=%s",
                    component->m_aspectRatio, component->m_id.c_str());
            }
            doLayoutAndNotify();
            return;
        }

        if (!component->m_currentUrl.empty() &&
            component->m_currentUrl != component->m_lastAnimatedUrl) {
            HM_LOGW("reapplying src to recover from status=1, id=%s, url=%s",
                component->m_id.c_str(), component->m_currentUrl.c_str());
            component->m_lastAnimatedUrl = component->m_currentUrl;
            A2UIImageNode(component->m_nodeHandle).setSrc(component->m_currentUrl);
        }
        return;
    }
    
    if (!component->m_currentUrl.empty() && component->m_currentUrl == component->m_lastAnimatedUrl) {
        HM_LOGW("duplicate callback for url=%s, skip, id=%s",
            component->m_currentUrl.c_str(), component->m_id.c_str());
        return;
    }
    component->m_lastAnimatedUrl = component->m_currentUrl;

    component->stopShimmer();
    A2UIImageNode(component->m_nodeHandle).resetBackgroundColor();

    component->m_imageWidth  = data[1].f32;
    component->m_imageHeight = data[2].f32;
    HM_LOGI("Image loaded successfully, id=%s, imageWidth=%f, imageHeight=%f",
        component->m_id.c_str(), component->m_imageWidth, component->m_imageHeight);
    if (component->m_aspectRatio == 0.0f && component->m_imageHeight > 0.0f) {
        component->m_aspectRatio = component->m_imageWidth / component->m_imageHeight;
        HM_LOGI("Calculated aspect ratio from image: %f", component->m_aspectRatio);
    }

    doLayoutAndNotify();

    if (isImageFadeInEnabled() && component->m_surfaceAnimated) {
        float pw = component->getWidth();
        float ph = component->getHeight();
        component->playMagicReveal(1500, pw, ph);
    } else {
        HM_LOGI("fadeIn disabled (fadeIn=%s, surfaceAnimated=%s), skip playMagicReveal, id=%s",
            isImageFadeInEnabled() ? "true" : "false",
            component->m_surfaceAnimated ? "true" : "false",
            component->m_id.c_str());
    }
}


void ImageComponent::showPlaceholder() {
    if (!m_nodeHandle) {
        return;
    }
    
    A2UIImageNode node(m_nodeHandle);
    node.setBackgroundColor(0xFFE5E5EA);
    
    startShimmer();
    
    HM_LOGI("id=%s", m_id.c_str());
}

void ImageComponent::stopShimmer() {
    if (m_shimmerAnimator) {
        ArkUI_NativeAnimateAPI_1* animateApi = getAnimateApi();
        if (animateApi) {
            OH_ArkUI_Animator_Cancel(m_shimmerAnimator);
            animateApi->disposeAnimator(m_shimmerAnimator);
        }
        m_shimmerAnimator = nullptr;
    }
    
    if (m_shimmerNode) {
        if (m_nodeHandle) {
            g_nodeAPI->removeChild(m_nodeHandle, m_shimmerNode);
        }
        g_nodeAPI->disposeNode(m_shimmerNode);
        m_shimmerNode = nullptr;
    }
    
    m_shimmerPending = false;
    
    HM_LOGI("id=%s", m_id.c_str());
}

void ImageComponent::startShimmer() {
    if (!m_nodeHandle) {
        return;
    }
    
    stopShimmer();
    m_shimmerPending = true;
    
    ArkUI_ContextHandle context = OH_ArkUI_GetContextByNode(m_nodeHandle);
    if (context) {
        auto* payloadRef1 = new std::shared_ptr<ImageCallbackPayload>(m_callbackPayload);
        int32_t postResult = OH_ArkUI_PostFrameCallback(
            context,
            payloadRef1,
            [](uint64_t nanoTimestamp, uint32_t frameCount, void* userData) {
                auto* payloadRef = static_cast<std::shared_ptr<ImageCallbackPayload>*>(userData);
                std::shared_ptr<ImageCallbackPayload> payload = *payloadRef;
                delete payloadRef;
                if (payload->component != nullptr) {
                    payload->component->createShimmerLayerIfNeeded();
                }
            });
        if (postResult != ARKUI_ERROR_CODE_NO_ERROR) {
            delete payloadRef1;
            createShimmerLayerIfNeeded();
        }
    } else {
        createShimmerLayerIfNeeded();
    }
    
    HM_LOGI("id=%s", m_id.c_str());
}

void ImageComponent::createShimmerLayerIfNeeded() {
    if (!m_shimmerPending || m_shimmerNode != nullptr || !m_nodeHandle) {
        return;
    }
    
    float width = getWidth();
    float height = getHeight();
    
    if (width <= 0.0f || height <= 0.0f) {
        ArkUI_ContextHandle context = OH_ArkUI_GetContextByNode(m_nodeHandle);
        if (context) {
            auto* payloadRef2 = new std::shared_ptr<ImageCallbackPayload>(m_callbackPayload);
            int32_t postResult = OH_ArkUI_PostFrameCallback(
                context,
                payloadRef2,
                [](uint64_t nanoTimestamp, uint32_t frameCount, void* userData) {
                    auto* payloadRef = static_cast<std::shared_ptr<ImageCallbackPayload>*>(userData);
                    std::shared_ptr<ImageCallbackPayload> payload = *payloadRef;
                    delete payloadRef;
                    if (payload->component != nullptr) {
                        payload->component->createShimmerLayerIfNeeded();
                    }
                });
            if (postResult != ARKUI_ERROR_CODE_NO_ERROR) {
                delete payloadRef2;
            }
        }
        return;
    }
    
    m_shimmerPending = false;


    m_shimmerNode = g_nodeAPI->createNode(ARKUI_NODE_STACK);
    if (!m_shimmerNode) {
        HM_LOGE("Failed to create shimmer node, id=%s", m_id.c_str());
        return;
    }

    A2UINode shimmerNodeView(m_shimmerNode);
    shimmerNodeView.setWidth(width);
    shimmerNodeView.setHeight(height);
    shimmerNodeView.setHitTestBehavior(ARKUI_HIT_TEST_MODE_NONE);
    shimmerNodeView.setPosition(0.0f, 0.0f);

    applyShimmerGradient(-0.8f);

    g_nodeAPI->addChild(m_nodeHandle, m_shimmerNode);

    startShimmerAnimation(width, width);

    HM_LOGI("Shimmer layer created, id=%s, width=%f, height=%f",
        m_id.c_str(), width, height);
}

void ImageComponent::applyShimmerGradient(float offset) {
    if (!m_shimmerNode) return;

    constexpr uint32_t kBase      = 0xFFE5E5EA;
    constexpr uint32_t kHighlight = 0xFFF8F8FA;
    static const uint32_t colors[5] = {kBase, kBase, kHighlight, kBase, kBase};
    static const float kLoc[5] = {0.0f, 0.35f, 0.50f, 0.65f, 1.0f};
    auto clampF = [](float v) { return v < 0.0f ? 0.0f : (v > 1.0f ? 1.0f : v); };
    float stops[5];
    for (int i = 0; i < 5; i++) stops[i] = clampF(kLoc[i] + offset);

    ArkUI_ColorStop colorStop;
    colorStop.colors = colors;
    colorStop.stops  = stops;
    colorStop.size   = 5;

    ArkUI_NumberValue gradientVal[3];
    gradientVal[0].f32 = 135.0f;
    gradientVal[1].i32 = ARKUI_LINEAR_GRADIENT_DIRECTION_CUSTOM;
    gradientVal[2].i32 = 0;
    ArkUI_AttributeItem gradientItem = {gradientVal, 3, nullptr, &colorStop};
    g_nodeAPI->setAttribute(m_shimmerNode, NODE_LINEAR_GRADIENT, &gradientItem);
}

void ImageComponent::startShimmerAnimation(float shimmerWidth, float containerWidth) {
    if (!m_shimmerNode) return;

    ArkUI_ContextHandle context = OH_ArkUI_GetContextByNode(m_nodeHandle);
    ArkUI_NativeAnimateAPI_1* animateApi = getAnimateApi();
    if (!context || !animateApi) {
        HM_LOGW("no context or animateApi, id=%s", m_id.c_str());
        return;
    }

    ArkUI_AnimatorOption* option = OH_ArkUI_AnimatorOption_Create(0);
    if (!option) return;

    OH_ArkUI_AnimatorOption_SetDuration(option, 1200);
    OH_ArkUI_AnimatorOption_SetBegin(option, -0.8f);
    OH_ArkUI_AnimatorOption_SetEnd(option, 0.8f);
    OH_ArkUI_AnimatorOption_SetIterations(option, -1);
    OH_ArkUI_AnimatorOption_SetFill(option, ARKUI_ANIMATION_FILL_MODE_FORWARDS);

    ArkUI_CurveHandle curve = OH_ArkUI_Curve_CreateCubicBezierCurve(0.42f, 0.0f, 0.58f, 1.0f);
    if (curve) OH_ArkUI_AnimatorOption_SetCurve(option, curve);

    auto* animPayloadRef = new std::shared_ptr<ImageCallbackPayload>(m_callbackPayload);

    OH_ArkUI_AnimatorOption_RegisterOnFrameCallback(
        option, animPayloadRef,
        [](ArkUI_AnimatorOnFrameEvent* event) {
            auto* payloadRef = static_cast<std::shared_ptr<ImageCallbackPayload>*>(OH_ArkUI_AnimatorOnFrameEvent_GetUserData(event));
            if (!payloadRef) return;
            std::shared_ptr<ImageCallbackPayload> payload = *payloadRef;
            ImageComponent* component = payload->component;
            if (!component) return;
            if (!component->m_shimmerNode) return;

            float offset = OH_ArkUI_AnimatorOnFrameEvent_GetValue(event);  // [-0.8, 0.8]
            // stops[i] = clamp(kLoc[i] + offset, 0, 1)
            static const float kLoc[5] = {0.0f, 0.35f, 0.50f, 0.65f, 1.0f};
            constexpr uint32_t kBase      = 0xFFE5E5EA;
            constexpr uint32_t kHighlight = 0xFFF8F8FA;
            // constexpr uint32_t kBase      = 0xFF3A3A8C;
            // constexpr uint32_t kHighlight = 0xFFFFFFFF;
            static const uint32_t colors[5] = {kBase, kBase, kHighlight, kBase, kBase};
            auto clampF = [](float v) { return v < 0.0f ? 0.0f : (v > 1.0f ? 1.0f : v); };
            float stops[5];
            for (int i = 0; i < 5; i++) stops[i] = clampF(kLoc[i] + offset);

            ArkUI_ColorStop cs;
            cs.colors = colors;
            cs.stops  = stops;
            cs.size   = 5;
            ArkUI_NumberValue gv[3];
            gv[0].f32 = 135.0f;
            gv[1].i32 = ARKUI_LINEAR_GRADIENT_DIRECTION_CUSTOM;
            gv[2].i32 = 0;
            ArkUI_AttributeItem gi = {gv, 3, nullptr, &cs};
            g_nodeAPI->setAttribute(component->m_shimmerNode, NODE_LINEAR_GRADIENT, &gi);
        });

    OH_ArkUI_AnimatorOption_RegisterOnFinishCallback(
        option, animPayloadRef,
        [](ArkUI_AnimatorEvent* event) {
            auto* payloadRef = static_cast<std::shared_ptr<ImageCallbackPayload>*>(
                OH_ArkUI_AnimatorEvent_GetUserData(event));
            delete payloadRef;
        });

    OH_ArkUI_AnimatorOption_RegisterOnCancelCallback(
        option, animPayloadRef,
        [](ArkUI_AnimatorEvent* event) {
            auto* payloadRef = static_cast<std::shared_ptr<ImageCallbackPayload>*>(
                OH_ArkUI_AnimatorEvent_GetUserData(event));
            delete payloadRef;
        });

    m_shimmerAnimator = animateApi->createAnimator(context, option);
    if (m_shimmerAnimator) {
        int32_t playResult = OH_ArkUI_Animator_Play(m_shimmerAnimator);
        if (playResult != ARKUI_ERROR_CODE_NO_ERROR) {
            HM_LOGW("Failed to play, result=%d, id=%s", playResult, m_id.c_str());
            animateApi->disposeAnimator(m_shimmerAnimator);
            m_shimmerAnimator = nullptr;
            delete animPayloadRef;
        } else {
            HM_LOGI("Animation started, id=%s", m_id.c_str());
        }
    } else {
        HM_LOGW("createAnimator failed, id=%s", m_id.c_str());
        delete animPayloadRef;
    }

    if (curve) OH_ArkUI_Curve_DisposeCurve(curve);
    OH_ArkUI_AnimatorOption_Dispose(option);
}

} // namespace a2ui

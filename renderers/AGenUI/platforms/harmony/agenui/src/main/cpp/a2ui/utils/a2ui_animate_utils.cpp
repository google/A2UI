#include "a2ui_animate_utils.h"

#include <arkui/native_interface.h>
#include <arkui/native_animate.h>
#include <arkui/native_node_napi.h>
#include "a2ui/render/a2ui_node.h"
#include "log/a2ui_capi_log.h"

namespace a2ui {

namespace {

float clampOpacity(float value) {
    if (value < 0.0f) return 0.0f;
    if (value > 1.0f) return 1.0f;
    return value;
}

void onAppearAnimatePostFrame(uint64_t /*nanoTimestamp*/, uint32_t /*frameCount*/, void* userData) {
    auto* payload = static_cast<OpacityAnimatePayload*>(userData);
    if (payload == nullptr) {
        return;
    }
    animateNodeOpacityNow(payload->nodeHandle, payload->targetOpacity, payload->durationMs);
    delete payload;
}

} // namespace

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

ArkUI_NativeAnimateAPI_1* getAnimateApi() {
    static ArkUI_NativeAnimateAPI_1* animateApi = nullptr;
    if (animateApi == nullptr) {
        OH_ArkUI_GetModuleInterface(ARKUI_NATIVE_ANIMATE, ArkUI_NativeAnimateAPI_1, animateApi);
        if (animateApi == nullptr) {
            HM_LOGE("Fatal: Failed to get ArkUI NativeAnimateAPI_1");
        }
    }
    return animateApi;
}

void animateNodeOpacityNow(ArkUI_NodeHandle nodeHandle, float targetOpacity, int32_t durationMs) {
    if (nodeHandle == nullptr) {
        return;
    }

    targetOpacity = clampOpacity(targetOpacity);
    if (durationMs <= 0) {
        A2UINode(nodeHandle).setOpacity(targetOpacity);
        return;
    }

    ArkUI_ContextHandle context = OH_ArkUI_GetContextByNode(nodeHandle);
    ArkUI_NativeAnimateAPI_1* animateApi = getAnimateApi();
    if (context == nullptr || animateApi == nullptr) {
        A2UINode(nodeHandle).setOpacity(targetOpacity);
        return;
    }

    ArkUI_AnimatorOption* option = OH_ArkUI_AnimatorOption_Create(0);
    if (option == nullptr) {
        A2UINode(nodeHandle).setOpacity(targetOpacity);
        return;
    }

    auto* payload = new OpacityAnimatePayload();
    payload->nodeHandle     = nodeHandle;
    payload->targetOpacity  = targetOpacity;
    payload->durationMs     = durationMs;

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
            auto* p = static_cast<OpacityAnimatePayload*>(
                OH_ArkUI_AnimatorOnFrameEvent_GetUserData(event));
            if (p == nullptr || p->nodeHandle == nullptr) {
                return;
            }
            A2UINode(p->nodeHandle).setOpacity(OH_ArkUI_AnimatorOnFrameEvent_GetValue(event));
        });

    auto finish = [](ArkUI_AnimatorEvent* event) {
        auto* p = static_cast<OpacityAnimatePayload*>(OH_ArkUI_AnimatorEvent_GetUserData(event));
        if (p == nullptr) {
            return;
        }
        if (p->nodeHandle != nullptr) {
            A2UINode(p->nodeHandle).setOpacity(p->targetOpacity);
        }
        ArkUI_NativeAnimateAPI_1* api = getAnimateApi();
        if (api != nullptr && p->animatorHandle != nullptr) {
            api->disposeAnimator(p->animatorHandle);
        }
        delete p;
    };

    OH_ArkUI_AnimatorOption_RegisterOnFinishCallback(option, payload, finish);
    OH_ArkUI_AnimatorOption_RegisterOnCancelCallback(option, payload, finish);

    ArkUI_AnimatorHandle animatorHandle = animateApi->createAnimator(context, option);
    payload->animatorHandle = animatorHandle;
    if (animatorHandle == nullptr) {
        A2UINode(nodeHandle).setOpacity(targetOpacity);
        delete payload;
    } else if (OH_ArkUI_Animator_Play(animatorHandle) != ARKUI_ERROR_CODE_NO_ERROR) {
        animateApi->disposeAnimator(animatorHandle);
        A2UINode(nodeHandle).setOpacity(targetOpacity);
        delete payload;
    }

    if (curve != nullptr) {
        OH_ArkUI_Curve_DisposeCurve(curve);
    }
    OH_ArkUI_AnimatorOption_Dispose(option);
}

void animateNodeOpacityAfterMount(ArkUI_NodeHandle nodeHandle, float targetOpacity, int32_t durationMs) {
    if (nodeHandle == nullptr) {
        return;
    }

    ArkUI_ContextHandle context = OH_ArkUI_GetContextByNode(nodeHandle);
    if (context == nullptr) {
        animateNodeOpacityNow(nodeHandle, targetOpacity, durationMs);
        return;
    }

    auto* payload = new OpacityAnimatePayload();
    payload->nodeHandle     = nodeHandle;
    payload->targetOpacity  = clampOpacity(targetOpacity);
    payload->durationMs     = durationMs;
    if (OH_ArkUI_PostFrameCallback(context, payload, onAppearAnimatePostFrame) != ARKUI_ERROR_CODE_NO_ERROR) {
        delete payload;
        animateNodeOpacityNow(nodeHandle, targetOpacity, durationMs);
    }
}

} // namespace a2ui

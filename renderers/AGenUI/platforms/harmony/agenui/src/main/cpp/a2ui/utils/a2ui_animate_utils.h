#pragma once

#include <arkui/native_animate.h>
#include <arkui/native_node.h>
#include <cstdint>

namespace a2ui {

/**
 * Payload used by opacity animators.  The base fields (nodeHandle,
 * targetOpacity, durationMs, animatorHandle) are used by the shared
 * animateNodeOpacityNow() implementation; the scale fields are only used
 * by image-specific fade-in animations (animateImageFadeIn).
 */
struct OpacityAnimatePayload {
    ArkUI_NodeHandle     nodeHandle      = nullptr;
    float                targetOpacity   = 1.0f;
    int32_t              durationMs      = 0;
    ArkUI_AnimatorHandle animatorHandle  = nullptr;
    // Image-specific scale animation fields (unused in the generic path).
    float                startScale      = 1.0f;
    float                targetScale     = 1.0f;
};

/**
 * Return the process-wide singleton ArkUI NativeAnimateAPI_1 handle.
 *
 * The handle is loaded lazily on the first call and cached in a function-local
 * static.  Calling this from multiple threads is safe because the ArkUI module
 * interface is idempotent and the static initialisation is guarded by the C++11
 * function-local-static guarantee.
 */
ArkUI_NativeAnimateAPI_1* getAnimateApi();

/**
 * Animate the opacity of @p nodeHandle to @p targetOpacity over @p durationMs.
 *
 * If @p durationMs <= 0 the opacity is applied immediately without animation.
 * Falls back to a direct opacity set when the ArkUI animate API or the node
 * context is unavailable.
 *
 * @param nodeHandle   Target ArkUI node; silently ignored when null.
 * @param targetOpacity Destination opacity value, clamped to [0, 1].
 * @param durationMs    Animation duration in milliseconds; <= 0 means instant.
 */
void animateNodeOpacityNow(ArkUI_NodeHandle nodeHandle, float targetOpacity, int32_t durationMs);

/**
 * Schedule an opacity animation to run on the next rendered frame.
 *
 * Posts a per-frame callback via OH_ArkUI_PostFrameCallback so the animation
 * starts only after the node has been fully laid out and mounted.  Falls back
 * to animateNodeOpacityNow() when the context is unavailable or the callback
 * registration fails.
 *
 * @param nodeHandle    Target ArkUI node; silently ignored when null.
 * @param targetOpacity Destination opacity value, clamped to [0, 1].
 * @param durationMs    Animation duration in milliseconds.
 */
void animateNodeOpacityAfterMount(ArkUI_NodeHandle nodeHandle, float targetOpacity, int32_t durationMs);

} // namespace a2ui

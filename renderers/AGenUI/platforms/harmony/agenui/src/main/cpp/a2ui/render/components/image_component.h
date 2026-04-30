#pragma once

#include "../a2ui_component.h"
#include <memory>

// ArkUI_AnimatorHandle forward declarations, restored here after removal from a2ui_component.h.
struct ArkUI_Animator;
typedef struct ArkUI_Animator* ArkUI_AnimatorHandle;

namespace a2ui {

/**
 * Image component backed by ARKUI_NODE_IMAGE.
 *
 * Supported properties:
 *   - url: image URL, including network URLs and DynamicString input
 *   - fit: contain, cover, fill, none, or scale-down
 *   - styles.border-radius: corner radius
 *   - styles.border-width: numeric or unit-suffixed border width
 *   - styles.border-color: #RGB / #RRGGBB / #AARRGGBB
 */
class ImageComponent : public A2UIComponent {
public:
    ImageComponent(const std::string& id, const nlohmann::json& properties);
    ~ImageComponent() override;

    /**
     * Stop shimmer animation and unregister events before the base disposeNode path runs.
     */
    void destroy() override;

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    /** Apply the image URL. */
    void applyUrl(const nlohmann::json& properties);

    /** Prepare fade-in before switching the image source. */
    void prepareFadeInForUrl(const std::string& url);

    /** Play a fade-in animation after the image finishes loading. */
    void playFadeInIfNeeded();

    /**
     * Play the MagicReveal transition after image load completes.
     * @param durationMs Animation duration in milliseconds
     */
    void playMagicReveal(int32_t durationMs, float hintW = 0.0f, float hintH = 0.0f);

    /** Apply the object-fit mode. */
    void applyFit(const nlohmann::json& properties);

    /** Apply styles such as border radius. */
    void applyStyles(const nlohmann::json& properties);

    /** Map fit strings to ArkUI ObjectFit values. */
    static int32_t mapObjectFit(const std::string& fit);

    /** Extract a string value, including DynamicString input. */
    static std::string extractStringValue(const nlohmann::json& value);

    /** Static image-complete callback. */
    static void onImageCompleteCallback(ArkUI_NodeEvent* event);

    /** Return the actual image width. */
    float getImageWidth() const { return m_imageWidth; }

    /** Return the actual image height. */
    float getImageHeight() const { return m_imageHeight; }

    /** Return the aspect ratio implied by variant. */
    static float getAspectRatioByVariant(const std::string& variant);

    /** Recalculate width and height from the aspect ratio. */
    void applyAspectRatio(float inputWidth, float inputHeight, float& outputWidth, float& outputHeight);

    // Shimmer placeholder helpers
    /** Show the placeholder and start shimmer. */
    void showPlaceholder();

    /** Stop shimmer and remove its layer. */
    void stopShimmer();

    /** Start the shimmer animation. */
    void startShimmer();

    /** Create the shimmer layer once bounds are valid. */
    void createShimmerLayerIfNeeded();

    /** Apply a left-to-right shimmer gradient to the shimmer node. */
    void applyShimmerGradient(float offset = 0.0f);

    /** Create and start the shimmer translation animator. */
    void startShimmerAnimation(float shimmerWidth, float containerWidth);

    /** Whether shimmer is currently visible or animating. */
    bool isShimmerActive() const { return m_shimmerNode != nullptr || m_shimmerPending; }

private:
    // Actual image size
    float m_imageWidth = 0.0f;
    float m_imageHeight = 0.0f;

    // Cached aspect ratio
    float m_aspectRatio = 0.0f;

    // Current image source and fade state
    std::string m_currentUrl;
    bool m_pendingFadeIn = false;

    // Current external loader request ID. Empty means no external loader is in use.
    std::string m_currentRequestId;

    // Prevent duplicate animations when onImageCompleteCallback fires more than once.
    std::string m_lastAnimatedUrl;

    // Shimmer placeholder state
    ArkUI_NodeHandle m_shimmerNode = nullptr;
    ArkUI_AnimatorHandle m_shimmerAnimator = nullptr;
    bool m_shimmerPending = false;

    /**
     * userData payload for image-load callbacks.
     * The payload is kept alive with shared_ptr, while m_payloadRef is the heap-owned
     * shared_ptr copy passed into registerNodeEvent as userData.
     */
    struct ImageCallbackPayload {
        ImageComponent* component = nullptr;
    };

    // The payload is owned by shared_ptr for the lifetime of the component.
    std::shared_ptr<ImageCallbackPayload> m_callbackPayload;

    // Heap-owned shared_ptr copy passed as registerNodeEvent userData.
    std::shared_ptr<ImageCallbackPayload>* m_payloadRef = nullptr;

    // MagicReveal mask node, created during playMagicReveal and cleaned up when the animation ends.
    ArkUI_NodeHandle m_revealMaskNode = nullptr;
};

} // namespace a2ui

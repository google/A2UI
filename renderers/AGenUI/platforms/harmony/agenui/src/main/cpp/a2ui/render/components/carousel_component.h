#pragma once

#include "../a2ui_component.h"
#include <vector>
#include <string>

namespace a2ui {

/**
 * Image carousel component backed by ARKUI_NODE_SWIPER.
 *
 * Node structure:
 *   ARKUI_NODE_STACK (m_nodeHandle, root container with width 100% and default height 200vp)
 *     ├── ARKUI_NODE_SWIPER (m_swiperHandle, full size, built-in indicator disabled)
 *     │     └── [ARKUI_NODE_IMAGE x N] one IMAGE node per slide
 *     └── ARKUI_NODE_ROW (m_indicatorContainerHandle, centered floating indicator container)
 *           └── [ARKUI_NODE_STACK x N] one STACK node per custom indicator
 *
 * Supported properties:
 *   - content: required array of image URLs
 *   - autoplay: whether slides switch automatically, default false
 *   - autoplaySpeed: autoplay interval in milliseconds, default 3000
 *   - draggable: whether gesture dragging is allowed, default false
 *   - styles.width: "100%" or a numeric vp value
 *   - styles.height: numeric vp value, default 200
 *   - styles.margin-top: top margin in vp
 */
class CarouselComponent : public A2UIComponent {
public:
    CarouselComponent(const std::string& id, const nlohmann::json& properties);
    ~CarouselComponent() override;

    /** Clean internal handles before delegating to the base destroy path. */
    void destroy() override;

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    /** Apply the image URL list. */
    void applyContent(const nlohmann::json& properties);

    /** Apply autoplay and autoplaySpeed. */
    void applyAutoPlay(const nlohmann::json& properties);

    /** Apply draggable. */
    void applyDraggable(const nlohmann::json& properties);

    /** Apply size and margin styles. */
    void applyStyles(const nlohmann::json& properties);

    /** Rebuild all IMAGE child nodes. */
    void rebuildImageNodes();

    /** Rebuild the custom indicator nodes. */
    void rebuildIndicatorNodes();

    /** Update indicator styling for the current page. */
    void updateIndicatorSelection(int32_t index);

    /** Static SWIPER page change callback. */
    static void onSwiperChangeEvent(ArkUI_NodeEvent* event);

    ArkUI_NodeHandle m_swiperHandle = nullptr;              // SWIPER node
    ArkUI_NodeHandle m_indicatorContainerHandle = nullptr;  // Indicator row container

    std::vector<std::string> m_imageUrls;         // Current image URLs
    std::vector<ArkUI_NodeHandle> m_imageHandles; // IMAGE handles
    std::vector<ArkUI_NodeHandle> m_dotHandles;   // Indicator handles

    int32_t m_currentIndex = 0;     // Current page index
    float   m_height       = 0.0f;  // Current component height in vp
};

} // namespace a2ui

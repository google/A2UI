#include "carousel_component.h"
#include "../a2ui_node.h"
#include "a2ui/measure/a2ui_platform_layout_bridge.h"
#include "a2ui/utils/a2ui_unit_utils.h"
#include "a2ui/utils/a2ui_color_palette.h"
#include "log/a2ui_capi_log.h"
#include <cstdlib>
#include <cmath>

#undef LOG_DOMAIN
#undef LOG_TAG
#define LOG_DOMAIN 0x0000
#define LOG_TAG "A2UI_CarouselComponent"

namespace a2ui {

// ---- Indicator Constants ----
static constexpr float kDotWidth        = 12.0f;    // Inactive indicator width.
static constexpr float kActiveDotWidth  = 40.0f;    // Active indicator width.
static constexpr float kDotHeight       = 8.0f;     // Indicator height.
static constexpr float kDotRadius       = 4.0f;     // Indicator corner radius.
static constexpr float kDotSpacing      = 12.0f;    // Gap between indicators.
static constexpr float kIndicatorPadH   = 16.0f;    // Horizontal indicator padding.
static constexpr float kIndicatorPadV   = 8.0f;     // Vertical indicator padding.
static constexpr float kIndicatorBottom = 16.0f;    // Distance from the bottom edge.
static constexpr float kSwiperRadius    = 14.0f;    // Swiper corner radius.
static constexpr float kDefaultHeight   = 400.0f;   // Default height.

// ---- Constructors ----

CarouselComponent::CarouselComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "Carousel")
    , m_swiperHandle(nullptr)
    , m_indicatorContainerHandle(nullptr)
    , m_currentIndex(0)
    , m_height(kDefaultHeight) {

    // Use a STACK root so the indicator can float above the swiper.
    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_STACK);

    // Default to full width, the fallback height, and bottom alignment.
    {
        A2UINode root(m_nodeHandle);
        root.setWidth(-1.0f);
        root.setHeight(kDefaultHeight);
        ArkUI_NumberValue alignVal[] = {{.i32 = ARKUI_ALIGNMENT_BOTTOM}};
        ArkUI_AttributeItem alignItem = {alignVal, 1, nullptr, nullptr};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_STACK_ALIGN_CONTENT, &alignItem);
    }

    // Swiper node.
    m_swiperHandle = g_nodeAPI->createNode(ARKUI_NODE_SWIPER);

    // Stretch the swiper, disable the built-in indicator, and apply the corner radius.
    {
        A2UISwiperNode swiper(m_swiperHandle);
        swiper.setWidth(-1.0f);
        swiper.setHeight(-1.0f);
        swiper.setShowIndicator(false);
        swiper.setLoop(true);
        swiper.setAutoPlay(false);
        swiper.setDisableSwipe(true);
        swiper.setBorderRadius(kSwiperRadius);
    }

    // Track page changes to update the custom indicator.
    g_nodeAPI->addNodeEventReceiver(m_swiperHandle, onSwiperChangeEvent);
    g_nodeAPI->registerNodeEvent(m_swiperHandle, NODE_SWIPER_EVENT_ON_CHANGE, 0, this);

    // Floating indicator container.
    m_indicatorContainerHandle = g_nodeAPI->createNode(ARKUI_NODE_ROW);

    // Center the indicator row and keep it hidden by default.
    {
        A2UINode indicator(m_indicatorContainerHandle);
        indicator.setPadding(kIndicatorPadV, kIndicatorPadH, kIndicatorPadV, kIndicatorPadH);
        indicator.setBackgroundColor(0x80000000);
        indicator.setBorderRadius(24.0f);
        indicator.setMargin(0.0f, 0.0f, UnitConverter::a2uiToVp(kIndicatorBottom), 0.0f);
        indicator.setVisibility(ARKUI_VISIBILITY_HIDDEN);
        // Center the row contents horizontally.
        ArkUI_NumberValue rowAlignVal[] = {{.i32 = ARKUI_HORIZONTAL_ALIGNMENT_CENTER}};
        ArkUI_AttributeItem rowAlignItem = {rowAlignVal, 1, nullptr, nullptr};
        g_nodeAPI->setAttribute(m_indicatorContainerHandle, NODE_ROW_ALIGN_ITEMS, &rowAlignItem);
        // Anchor the row to the bottom of the STACK.
        ArkUI_NumberValue indAlignVal[] = {{.i32 = ARKUI_ALIGNMENT_BOTTOM}};
        ArkUI_AttributeItem indAlignItem = {indAlignVal, 1, nullptr, nullptr};
        g_nodeAPI->setAttribute(m_indicatorContainerHandle, NODE_ALIGNMENT, &indAlignItem);
    }

    // Assemble the node tree.
    g_nodeAPI->addChild(m_nodeHandle, m_swiperHandle);
    g_nodeAPI->addChild(m_nodeHandle, m_indicatorContainerHandle);

    // Merge initial properties.
    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    HM_LOGI("CarouselComponent - Created: id=%s", id.c_str());
}

CarouselComponent::~CarouselComponent() {
    HM_LOGI("CarouselComponent - Destructor: id=%s", m_id.c_str());
}

// ---- destroy ----

void CarouselComponent::destroy() {
    HM_LOGI("id=%s", m_id.c_str());

    // Unregister the swiper change event.
    if (m_swiperHandle) {
        g_nodeAPI->unregisterNodeEvent(m_swiperHandle, NODE_SWIPER_EVENT_ON_CHANGE);
    }

    // Clear child handles before the base class disposes the root.
    if (m_swiperHandle) {
        g_nodeAPI->disposeNode(m_swiperHandle);
        m_swiperHandle = nullptr;
    }
    
    if (m_indicatorContainerHandle) {
        g_nodeAPI->disposeNode(m_indicatorContainerHandle);
        m_indicatorContainerHandle = nullptr;
    }

    A2UIComponent::destroy();
}

// ---- Property Updates ----

void CarouselComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        HM_LOGE("handle is null, id=%s", m_id.c_str());
        return;
    }

    // Styles must run first so content rebuilds use the latest size.
    applyStyles(properties);
    applyContent(properties);
    applyAutoPlay(properties);
    applyDraggable(properties);

    HM_LOGI("Applied properties, id=%s", m_id.c_str());
}

// ---- applyStyles ----

void CarouselComponent::applyStyles(const nlohmann::json& properties) {
    if (!properties.contains("styles") || !properties["styles"].is_object()) {
        return;
    }

    const auto& styles = properties["styles"];

    // Width.
    if (styles.contains("width")) {
        std::string widthStr;
        if (styles["width"].is_string()) {
            widthStr = styles["width"].get<std::string>();
        } else if (styles["width"].is_number()) {
            widthStr = std::to_string(styles["width"].get<float>());
        }

        float widthVp = -1.0f; // Default to 100% width.
        if (!widthStr.empty() && widthStr != "100%") {
            widthVp = static_cast<float>(std::atof(widthStr.c_str()));
        }

        A2UINode(m_nodeHandle).setWidth(widthVp);
    }

    // Height.
    if (styles.contains("height")) {
        float h = kDefaultHeight;
        if (styles["height"].is_number()) {
            h = styles["height"].get<float>();
        } else if (styles["height"].is_string()) {
            h = static_cast<float>(std::atof(styles["height"].get<std::string>().c_str()));
        }
        if (h > 0.0f) {
            m_height = h;
            A2UINode(m_nodeHandle).setHeight(h);
        }
    }

    // margin-top.
    if (styles.contains("margin-top")) {
        float mt = 0.0f;
        if (styles["margin-top"].is_number()) {
            mt = styles["margin-top"].get<float>();
        } else if (styles["margin-top"].is_string()) {
            mt = static_cast<float>(std::atof(styles["margin-top"].get<std::string>().c_str()));
        }
        // Apply the top margin through the node wrapper.
        A2UINode(m_swiperHandle).setMargin(mt, 0.0f, 0.0f, 0.0f);
    }
}

// ---- applyContent ----

void CarouselComponent::applyContent(const nlohmann::json& properties) {
    if (!properties.contains("content") || !properties["content"].is_array()) {
        return;
    }

    // Parse the new URL list.
    std::vector<std::string> newUrls;
    for (const auto& item : properties["content"]) {
        if (item.is_string()) {
            newUrls.push_back(item.get<std::string>());
        }
    }

    // Skip rebuilds when the URL list is unchanged.
    if (newUrls == m_imageUrls) {
        return;
    }

    m_imageUrls = newUrls;
    m_currentIndex = 0;

    rebuildImageNodes();
    rebuildIndicatorNodes();

    // Reset the swiper to the first page.
    A2UISwiperNode(m_swiperHandle).setIndex(0);

    HM_LOGI("%zu images, id=%s", m_imageUrls.size(), m_id.c_str());
}

// ---- rebuildImageNodes ----

void CarouselComponent::rebuildImageNodes() {
    // Remove and dispose the previous IMAGE nodes.
    for (ArkUI_NodeHandle h : m_imageHandles) {
        g_nodeAPI->removeChild(m_swiperHandle, h);
        g_nodeAPI->disposeNode(h);
    }
    m_imageHandles.clear();

    // Create one IMAGE node per URL.
    for (const auto& url : m_imageUrls) {
        ArkUI_NodeHandle img = g_nodeAPI->createNode(ARKUI_NODE_IMAGE);

        // Fill the swiper page and use cover scaling.
        A2UIImageNode imgNode(img);
        imgNode.setWidth(-1.0f);
        imgNode.setHeight(-1.0f);
        imgNode.setObjectFitCover();
        imgNode.setSrc(url);

        g_nodeAPI->addChild(m_swiperHandle, img);
        m_imageHandles.push_back(img);
    }
}

// ---- rebuildIndicatorNodes ----

void CarouselComponent::rebuildIndicatorNodes() {
    // Remove and dispose the previous indicator nodes.
    for (ArkUI_NodeHandle h : m_dotHandles) {
        g_nodeAPI->removeChild(m_indicatorContainerHandle, h);
        g_nodeAPI->disposeNode(h);
    }
    m_dotHandles.clear();

    // Hide the indicator for fewer than two images.
    if (m_imageUrls.size() <= 1) {
        A2UINode(m_indicatorContainerHandle).setVisibility(ARKUI_VISIBILITY_HIDDEN);
        return;
    }

    // Show the indicator.
    A2UINode(m_indicatorContainerHandle).setVisibility(ARKUI_VISIBILITY_VISIBLE);

    // Create the indicator dots.
    for (size_t i = 0; i < m_imageUrls.size(); i++) {
        ArkUI_NodeHandle dot = g_nodeAPI->createNode(ARKUI_NODE_STACK);

        A2UINode dotNode(dot);
        dotNode.setHeight(kDotHeight);
        dotNode.setWidth(kDotWidth);
        dotNode.setBackgroundColor(colors::kColorWhite);
        dotNode.setBorderRadius(kDotRadius);

        // Add left spacing after the first indicator.
        if (i > 0) {
            dotNode.setMargin(0.0f, 0.0f, 0.0f, kDotSpacing);
        }

        // Start non-selected dots at 0.5 opacity.
        dotNode.setOpacity(0.5f);

        g_nodeAPI->addChild(m_indicatorContainerHandle, dot);
        m_dotHandles.push_back(dot);
    }

    // Select the first indicator.
    updateIndicatorSelection(0);
}

// ---- updateIndicatorSelection ----

void CarouselComponent::updateIndicatorSelection(int32_t index) {
    for (size_t i = 0; i < m_dotHandles.size(); i++) {
        ArkUI_NodeHandle dot = m_dotHandles[i];
        bool isSelected = (static_cast<int32_t>(i) == index);

        A2UINode dotNode(dot);
        // Expand the selected indicator.
        dotNode.setWidth(isSelected ? kActiveDotWidth : kDotWidth);
        // Raise opacity for the selected indicator.
        dotNode.setOpacity(isSelected ? 1.0f : 0.5f);
    }
}

// ---- applyAutoPlay ----

void CarouselComponent::applyAutoPlay(const nlohmann::json& properties) {
    bool changed = false;

    if (properties.contains("autoplay")) {
        bool autoplay = false;
        if (properties["autoplay"].is_boolean()) {
            autoplay = properties["autoplay"].get<bool>();
        }
        A2UISwiperNode(m_swiperHandle).setAutoPlay(autoplay);
    }

    if (properties.contains("autoplaySpeed")) {
        int32_t speed = 3000;
        if (properties["autoplaySpeed"].is_number()) {
            speed = properties["autoplaySpeed"].get<int32_t>();
        }
        A2UISwiperNode(m_swiperHandle).setInterval(speed);
        changed = true;
        HM_LOGI("autoplaySpeed=%d, id=%s", speed, m_id.c_str());
    }

    (void)changed;
}

// ---- applyDraggable ----

void CarouselComponent::applyDraggable(const nlohmann::json& properties) {
    if (!properties.contains("draggable")) {
        return;
    }

    bool draggable = false;
    if (properties["draggable"].is_boolean()) {
        draggable = properties["draggable"].get<bool>();
    }

    // ArkUI uses the inverse DISABLE_SWIPE flag.
    A2UISwiperNode(m_swiperHandle).setDisableSwipe(!draggable);

    HM_LOGI("draggable=%s, id=%s", draggable ? "true" : "false", m_id.c_str());
}

// ---- Swiper Change Callback ----

void CarouselComponent::onSwiperChangeEvent(ArkUI_NodeEvent* event) {
    void* userData = OH_ArkUI_NodeEvent_GetUserData(event);
    if (!userData) {
        return;
    }

    CarouselComponent* self = static_cast<CarouselComponent*>(userData);

    // Read the current page index from the event.
    ArkUI_NodeComponentEvent* componentEvent = OH_ArkUI_NodeEvent_GetNodeComponentEvent(event);
    if (!componentEvent) {
        return;
    }

    int32_t newIndex = componentEvent->data[0].i32;
    self->m_currentIndex = newIndex;
    self->updateIndicatorSelection(newIndex);

    HM_LOGI("page changed to %d, id=%s", newIndex, self->m_id.c_str());
}

} // namespace a2ui

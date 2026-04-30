#pragma once

#include <string>
#include <arkui/native_node.h>
#include <arkui/native_interface.h>
#include <arkui/drawable_descriptor.h>
#include "a2ui/utils/a2ui_unit_utils.h"
#include "a2ui/utils/hm_font_utils.h"
#include "log/a2ui_capi_log.h"

extern ArkUI_NativeNodeAPI_1 *g_nodeAPI;

namespace a2ui {

/**
 * Base A2UI node
 * Wraps common ArkUI C-API node operations
 */
class A2UINode {
public:
    explicit A2UINode(ArkUI_NodeHandle nodeHandle) : m_nodeHandle(nodeHandle) {}
    virtual ~A2UINode() = default;

    ArkUI_NodeHandle getNodeHandle() const { 
        return m_nodeHandle; 
    }

    // ========== ID ==========

    void setNodeId(const std::string& id) {
        ArkUI_AttributeItem item = {.string = id.c_str()};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_ID, &item);
    }

    // ========== Size And Position ==========

    void setWidth(float width) {
        ArkUI_NumberValue value[] = {{.f32 = UnitConverter::a2uiToVp(width)}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_WIDTH, &item);
    }

    void setHeight(float height) {
        ArkUI_NumberValue value[] = {{.f32 = UnitConverter::a2uiToVp(height)}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_HEIGHT, &item);
    }

    void resetHeight() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_HEIGHT);
    }

    void resetWidth() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_WIDTH);
    }

    void setPercentWidth(float percent) {
        ArkUI_NumberValue value[] = {{.f32 = percent}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_WIDTH_PERCENT, &item);
    }

    void setPercentHeight(float percent) {
        ArkUI_NumberValue value[] = {{.f32 = percent}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_HEIGHT_PERCENT, &item);
    }

    /**
     * Set size constraints, matching CSS min/max width and height.
     * NODE_CONSTRAINT_SIZE accepts minWidth, maxWidth, minHeight, and maxHeight in vp.
     * Use 0 for unconstrained min values and a very large value for unconstrained max values.
     */
    void setConstraintSize(float minWidth, float maxWidth, float minHeight, float maxHeight) {
        ArkUI_NumberValue value[] = {
            {.f32 = UnitConverter::a2uiToVp(minWidth)},
            {.f32 = UnitConverter::a2uiToVp(maxWidth)},
            {.f32 = UnitConverter::a2uiToVp(minHeight)},
            {.f32 = UnitConverter::a2uiToVp(maxHeight)}
        };
        ArkUI_AttributeItem item = {value, 4};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_CONSTRAINT_SIZE, &item);
    }

    /**
     * Set a custom shadow, matching CSS drop-shadow / box-shadow semantics.
     * NODE_CUSTOM_SHADOW parameters:
     *   [0] blur   - blur radius in vp
     *   [1] spread - spread radius, always 0 here
     *   [2] offsetX - x offset in physical px
     *   [3] offsetY - y offset in physical px
     *   [4] type   - shadow type, ARKUI_SHADOW_TYPE_COLOR = 0
     *   [5] color  - color in 0xAARRGGBB
     *   [6] fill   - fill flag, 0 means no fill
     * All inputs use a2ui units and are converted internally.
     */
    void setCustomShadow(float blurA2ui, float offsetXA2ui, float offsetYA2ui, uint32_t color) {
        ArkUI_NumberValue value[] = {
            {.f32 = UnitConverter::a2uiToVp(blurA2ui)},
            {.f32 = 0.0f},
            {.f32 = UnitConverter::a2uiToPx(offsetXA2ui)},
            {.f32 = UnitConverter::a2uiToPx(offsetYA2ui)},
            {.i32 = 0},
            {.u32 = color},
            {.u32 = 0},
        };
        ArkUI_AttributeItem item = {value, 7};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_CUSTOM_SHADOW, &item);
    }

    void setLayoutWeight(float weight) {
        // layoutWeight is unitless and does not need conversion.
        ArkUI_NumberValue value[] = {{.f32 = weight}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_LAYOUT_WEIGHT, &item);
    }

    void resetLayoutWeight() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_LAYOUT_WEIGHT);
    }

    void setPosition(float x, float y) {
        ArkUI_NumberValue value[] = {{.f32 = UnitConverter::a2uiToVp(x)}, {.f32 = UnitConverter::a2uiToVp(y)}};
        ArkUI_AttributeItem item = {value, 2};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_POSITION, &item);
    }

    void setRotate(float axisX, float axisY, float axisZ, float angle, float perspectiveVp = 0.0f) {
        ArkUI_NumberValue value[] = {
            {.f32 = axisX},
            {.f32 = axisY},
            {.f32 = axisZ},
            {.f32 = angle},
            {.f32 = perspectiveVp}
        };
        ArkUI_AttributeItem item = {value, 5};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_ROTATE, &item);
    }

    void resetRotate() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_ROTATE);
    }

    void setTransformCenterPercent(float xPercent, float yPercent, float zPercent = 0.0f) {
        ArkUI_NumberValue value[] = {
            {.f32 = 0.0f},
            {.f32 = 0.0f},
            {.f32 = 0.0f},
            {.f32 = xPercent},
            {.f32 = yPercent},
            {.f32 = zPercent}
        };
        ArkUI_AttributeItem item = {value, 6};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TRANSFORM_CENTER, &item);
    }

    void setScale(float scaleX, float scaleY) {
        ArkUI_NumberValue value[] = {
            {.f32 = scaleX},
            {.f32 = scaleY}
        };
        ArkUI_AttributeItem item = {value, 2};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SCALE, &item);
    }

    void resetScale() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_SCALE);
    }

    void setRotateTransition(float axisX, float axisY, float axisZ, float angle, float perspectiveVp,
                             int32_t durationMs, ArkUI_AnimationCurve curve, int32_t delayMs,
                             int32_t iterations, ArkUI_AnimationPlayMode playMode,
                             float speed = 1.0f) {
        ArkUI_NumberValue value[] = {
            {.f32 = axisX},
            {.f32 = axisY},
            {.f32 = axisZ},
            {.f32 = angle},
            {.f32 = perspectiveVp},
            {.i32 = durationMs},
            {.i32 = curve},
            {.i32 = delayMs},
            {.i32 = iterations},
            {.i32 = playMode},
            {.f32 = speed}
        };
        ArkUI_AttributeItem item = {value, 11};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_ROTATE_TRANSITION, &item);
    }

    void resetRotateTransition() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_ROTATE_TRANSITION);
    }

    // ========== Z-Axis And Rendering ==========

    void setZIndex(float zIndex) {
        ArkUI_NumberValue value[] = {{.f32 = zIndex}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_Z_INDEX, &item);
    }

    void resetZIndex() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_Z_INDEX);
    }

    void setRenderGroup(bool flag) {
        ArkUI_NumberValue value[] = {{.i32 = flag ? 1 : 0}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_RENDER_GROUP, &item);
    }

    // ========== Opacity ==========

    void setOpacity(float opacity) {
        ArkUI_NumberValue value[] = {{.f32 = opacity}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_OPACITY, &item);
        // Enable offscreen rendering when opacity is below 1 to keep blending correct.
        setRenderGroup(opacity < 0.9999f);
    }

    void resetOpacity() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_OPACITY);
        setRenderGroup(false);
    }

    void setOpacityTransition(float opacity, int32_t durationMs, int32_t curve,
                              int32_t delayMs = 0, int32_t iterations = 1,
                              int32_t playMode = ARKUI_ANIMATION_PLAY_MODE_NORMAL,
                              float speed = 1.0f) {
        ArkUI_NumberValue value[] = {
            {.f32 = opacity},
            {.i32 = durationMs},
            {.i32 = curve},
            {.i32 = delayMs},
            {.i32 = iterations},
            {.i32 = playMode},
            {.f32 = speed}
        };
        ArkUI_AttributeItem item = {value, 7};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_OPACITY_TRANSITION, &item);
    }

    void resetOpacityTransition() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_OPACITY_TRANSITION);
    }

    // ========== Visibility And Clipping ==========

    void setVisibility(ArkUI_Visibility visibility) {
        ArkUI_NumberValue value[] = {{.i32 = visibility}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_VISIBILITY, &item);
    }

    void resetVisibility() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_VISIBILITY);
    }

    void setClip(bool clip) {
        ArkUI_NumberValue value[] = {{.i32 = clip ? 1 : 0}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_CLIP, &item);
    }

    void resetClip() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_CLIP);
    }

    // ========== Enabled State ==========

    void setEnabled(bool enabled) {
        ArkUI_NumberValue value[] = {{.i32 = enabled ? 1 : 0}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_ENABLED, &item);
    }

    // ========== Hit Testing ==========

    void setHitTestBehavior(ArkUI_HitTestMode mode) {
        ArkUI_NumberValue value[] = {{.i32 = mode}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_HIT_TEST_BEHAVIOR, &item);
    }

    void resetHitTestBehavior() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_HIT_TEST_BEHAVIOR);
    }

    // ========== Background ==========

    void setBackgroundColor(uint32_t color) {
        ArkUI_NumberValue value[] = {{.u32 = color}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_BACKGROUND_COLOR, &item);
    }

    void resetBackgroundColor() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_BACKGROUND_COLOR);
    }

    // ========== Spacing ==========

    void setPadding(float top, float right, float bottom, float left) {
        ArkUI_NumberValue value[] = {{.f32 = UnitConverter::a2uiToVp(top)}, {.f32 = UnitConverter::a2uiToVp(right)}, {.f32 = UnitConverter::a2uiToVp(bottom)}, {.f32 = UnitConverter::a2uiToVp(left)}};
        ArkUI_AttributeItem item = {value, 4};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_PADDING, &item);
    }

    void setPadding(float padding) {
        ArkUI_NumberValue value[] = {{.f32 = UnitConverter::a2uiToVp(padding)}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_PADDING, &item);
    }

    void resetPadding() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_PADDING);
    }

    /**
     * @brief Read padding values
     * @param top Output top padding in a2ui units
     * @param right Output right padding in a2ui units
     * @param bottom Output bottom padding in a2ui units
     * @param left Output left padding in a2ui units
     * @return Whether retrieval succeeded
     */
    bool getPadding(float& top, float& right, float& bottom, float& left) {
        const ArkUI_AttributeItem* item = g_nodeAPI->getAttribute(m_nodeHandle, NODE_PADDING);
        if (item && item->size >= 4) {
            top = UnitConverter::vpToA2ui(item->value[0].f32);
            right = UnitConverter::vpToA2ui(item->value[1].f32);
            bottom = UnitConverter::vpToA2ui(item->value[2].f32);
            left = UnitConverter::vpToA2ui(item->value[3].f32);
            return true;
        }
        return false;
    }

    void setMargin(float top, float right, float bottom, float left) {
        ArkUI_NumberValue value[] = {{.f32 = UnitConverter::a2uiToVp(top)}, {.f32 = UnitConverter::a2uiToVp(right)}, {.f32 = UnitConverter::a2uiToVp(bottom)}, {.f32 = UnitConverter::a2uiToVp(left)}};
        ArkUI_AttributeItem item = {value, 4};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_MARGIN, &item);
    }

    void setMargin(float margin) {
        ArkUI_NumberValue value[] = {{.f32 = UnitConverter::a2uiToVp(margin)}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_MARGIN, &item);
    }

    void resetMargin() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_MARGIN);
    }

    /**
     * @brief Read margin values
     * @param top Output top margin in a2ui units
     * @param right Output right margin in a2ui units
     * @param bottom Output bottom margin in a2ui units
     * @param left Output left margin in a2ui units
     * @return Whether retrieval succeeded
     */
    bool getMargin(float& top, float& right, float& bottom, float& left) {
        const ArkUI_AttributeItem* item = g_nodeAPI->getAttribute(m_nodeHandle, NODE_MARGIN);
        if (item && item->size >= 4) {
            top = UnitConverter::vpToA2ui(item->value[0].f32);
            right = UnitConverter::vpToA2ui(item->value[1].f32);
            bottom = UnitConverter::vpToA2ui(item->value[2].f32);
            left = UnitConverter::vpToA2ui(item->value[3].f32);
            return true;
        }
        return false;
    }

    void setBorderWidth(float top, float right, float bottom, float left) {
        ArkUI_NumberValue value[] = {{.f32 = UnitConverter::a2uiToVp(top)}, {.f32 = UnitConverter::a2uiToVp(right)}, {.f32 = UnitConverter::a2uiToVp(bottom)}, {.f32 = UnitConverter::a2uiToVp(left)}};
        ArkUI_AttributeItem item = {value, 4};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_BORDER_WIDTH, &item);
    }

    void resetBorderWidth() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_BORDER_WIDTH);
    }

    /**
     * @brief Read border widths
     * @param top Output top border width in a2ui units
     * @param right Output right border width in a2ui units
     * @param bottom Output bottom border width in a2ui units
     * @param left Output left border width in a2ui units
     * @return Whether retrieval succeeded
     */
    bool getBorderWidth(float& top, float& right, float& bottom, float& left) {
        const ArkUI_AttributeItem* item = g_nodeAPI->getAttribute(m_nodeHandle, NODE_BORDER_WIDTH);
        if (item && item->size >= 4) {
            top = UnitConverter::vpToA2ui(item->value[0].f32);
            right = UnitConverter::vpToA2ui(item->value[1].f32);
            bottom = UnitConverter::vpToA2ui(item->value[2].f32);
            left = UnitConverter::vpToA2ui(item->value[3].f32);
            return true;
        }
        return false;
    }

    void setBorderRadius(float leftTop, float rightTop, float leftBottom, float rightBottom) {
        ArkUI_NumberValue value[] = {{.f32 = UnitConverter::a2uiToVp(leftTop)}, {.f32 = UnitConverter::a2uiToVp(rightTop)}, {.f32 = UnitConverter::a2uiToVp(leftBottom)}, {.f32 = UnitConverter::a2uiToVp(rightBottom)}};
        ArkUI_AttributeItem item = {value, 4};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_BORDER_RADIUS, &item);
    }

    void setBorderRadius(float radius) {
        ArkUI_NumberValue value[] = {{.f32 = UnitConverter::a2uiToVp(radius)}, {.f32 = UnitConverter::a2uiToVp(radius)}, {.f32 = UnitConverter::a2uiToVp(radius)}, {.f32 = UnitConverter::a2uiToVp(radius)}};
        ArkUI_AttributeItem item = {value, 4};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_BORDER_RADIUS, &item);
    }

    void resetBorderRadius() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_BORDER_RADIUS);
    }

    void setBorderColor(uint32_t color) {
        ArkUI_NumberValue value[] = {{.u32 = color}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_BORDER_COLOR, &item);
    }

    void resetBorderColor() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_BORDER_COLOR);
    }

    /**
     * Set the border style: solid, dashed, or dotted.
     */
    void setBorderStyle(ArkUI_BorderStyle style) {
        ArkUI_NumberValue value[] = {{.i32 = style}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_BORDER_STYLE, &item);
    }

    void resetBorderStyle() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_BORDER_STYLE);
    }

protected:
    ArkUI_NodeHandle m_nodeHandle = nullptr;
};

// ========== Container Nodes ==========

/**
 * Base container node
 * Supports appending, inserting, and removing children
 */
class A2UIContainerNode : public A2UINode {
public:
    explicit A2UIContainerNode(ArkUI_NodeHandle nodeHandle) : A2UINode(nodeHandle) {}

    void appendChild(ArkUI_NodeHandle childHandle) {
        g_nodeAPI->addChild(m_nodeHandle, childHandle);
    }

    void insertChildBefore(ArkUI_NodeHandle beforeHandle, ArkUI_NodeHandle newHandle) {
        g_nodeAPI->insertChildBefore(m_nodeHandle, beforeHandle, newHandle);
    }

    void removeChild(ArkUI_NodeHandle childHandle) {
        g_nodeAPI->removeChild(m_nodeHandle, childHandle);
    }
};

/**
 * Row container node for horizontal layout
 */
class A2UIRowNode : public A2UIContainerNode {
public:
    explicit A2UIRowNode(ArkUI_NodeHandle nodeHandle) : A2UIContainerNode(nodeHandle) {}

    void setJustifyContent(ArkUI_FlexAlignment alignment) {
        ArkUI_NumberValue value[] = {{.i32 = alignment}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_ROW_JUSTIFY_CONTENT, &item);
    }

    void setAlignItems(ArkUI_VerticalAlignment alignment) {
        ArkUI_NumberValue value[] = {{.i32 = alignment}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_ROW_ALIGN_ITEMS, &item);
    }
};

/**
 * Column container node for vertical layout
 */
class A2UIColumnNode : public A2UIContainerNode {
public:
    explicit A2UIColumnNode(ArkUI_NodeHandle nodeHandle) : A2UIContainerNode(nodeHandle) {}

    void setJustifyContent(ArkUI_FlexAlignment alignment) {
        ArkUI_NumberValue value[] = {{.i32 = alignment}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_COLUMN_JUSTIFY_CONTENT, &item);
    }

    void setAlignItems(ArkUI_ItemAlignment alignment) {
        ArkUI_NumberValue value[] = {{.i32 = alignment}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_COLUMN_ALIGN_ITEMS, &item);
    }
};

// ========== Text Nodes ==========

/**
 * Base text node shared by Text, TextInput, and TextArea
 */
class A2UITextNodeBase : public A2UINode {
public:
    explicit A2UITextNodeBase(ArkUI_NodeHandle nodeHandle) : A2UINode(nodeHandle) {
        setFontFamily(harmonyDefaultFontFamily());
    }

    void setFontSize(float fontSize) {
        ArkUI_NumberValue value[] = {{.f32 = UnitConverter::a2uiToVp(fontSize)}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_FONT_SIZE, &item);
    }

    void setFontColor(uint32_t color) {
        ArkUI_NumberValue value[] = {{.u32 = color}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_FONT_COLOR, &item);
    }

    void setFontWeight(ArkUI_FontWeight fontWeight) {
        ArkUI_NumberValue value[] = {{.i32 = fontWeight}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_FONT_WEIGHT, &item);
    }

    void setFontStyle(ArkUI_FontStyle fontStyle) {
        ArkUI_NumberValue value[] = {{.i32 = fontStyle}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_FONT_STYLE, &item);
    }

    void setFontFamily(const std::string& fontFamily) {
        const std::string resolvedFontFamily = normalizeHarmonyFontFamily(fontFamily);
        ArkUI_AttributeItem item = {nullptr, 0, resolvedFontFamily.c_str()};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_FONT_FAMILY, &item);
    }

    void setTextAlign(ArkUI_TextAlignment textAlign) {
        ArkUI_NumberValue value[] = {{.i32 = textAlign}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_ALIGN, &item);
    }

    void setLineHeight(float height) {
        ArkUI_NumberValue value[] = {{.f32 = height}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_LINE_HEIGHT, &item);
    }

    void setLetterSpacing(float spacing) {
        ArkUI_NumberValue value[] = {{.f32 = spacing}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_LETTER_SPACING, &item);
    }

    void setTextMaxLines(int lines) {
        if (lines <= 0) {
            g_nodeAPI->resetAttribute(m_nodeHandle, NODE_TEXT_MAX_LINES);
            return;
        }
        ArkUI_NumberValue value[] = {{.i32 = lines}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_MAX_LINES, &item);
    }

    void setTextOverflowNone() {
        ArkUI_NumberValue value[] = {{.i32 = ARKUI_TEXT_OVERFLOW_NONE}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_OVERFLOW, &item);
    }

    void setTextOverflowClip() {
        ArkUI_NumberValue value[] = {{.i32 = ARKUI_TEXT_OVERFLOW_CLIP}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_OVERFLOW, &item);
    }

    void setTextOverflowEllipsis() {
        ArkUI_NumberValue value[] = {{.i32 = ARKUI_TEXT_OVERFLOW_ELLIPSIS}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_OVERFLOW, &item);
    }

    void setTextOverflowMarquee() {
        ArkUI_NumberValue value[] = {{.i32 = ARKUI_TEXT_OVERFLOW_MARQUEE}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_OVERFLOW, &item);
    }

    void setTextEllipsisMode(ArkUI_EllipsisMode mode) {
        ArkUI_NumberValue value[] = {{.i32 = mode}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_ELLIPSIS_MODE, &item);
    }

    void setTextDecoration(ArkUI_TextDecorationType type, uint32_t color) {
        ArkUI_NumberValue value[] = {{.i32 = type}, {.u32 = color}};
        ArkUI_AttributeItem item = {value, 2};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_DECORATION, &item);
    }

    void setTextDecorationNone() {
        ArkUI_NumberValue value[] = {{.i32 = ARKUI_TEXT_DECORATION_TYPE_NONE}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_DECORATION, &item);
    }
};

/**
 * Text node
 */
class A2UITextNode : public A2UITextNodeBase {
public:
    explicit A2UITextNode(ArkUI_NodeHandle nodeHandle) : A2UITextNodeBase(nodeHandle) {}

    void setTextContent(const std::string& content) {
        ArkUI_AttributeItem item = {nullptr, 0, content.c_str()};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_CONTENT, &item);
    }
    
    std::string getTextContent() {
        const ArkUI_AttributeItem *item = g_nodeAPI->getAttribute(m_nodeHandle, NODE_TEXT_CONTENT);
        if (item == nullptr || item->string == nullptr) {
            HM_LOGW("[A2UITextNode::getTextContent] getAttribute returned null, nodeHandle=%p", m_nodeHandle);
            return "";
        }
        return item->string;
    }
};

/**
 * TextInput node
 */
class A2UITextInputNode : public A2UITextNodeBase {
public:
    explicit A2UITextInputNode(ArkUI_NodeHandle nodeHandle) : A2UITextNodeBase(nodeHandle) {}

    void setTextContent(const std::string& content) {
        ArkUI_AttributeItem item = {nullptr, 0, content.c_str()};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_INPUT_TEXT, &item);
    }

    std::string getTextContent() {
        const ArkUI_AttributeItem* item = g_nodeAPI->getAttribute(m_nodeHandle, NODE_TEXT_INPUT_TEXT);
        if (item && item->string) return item->string;
        return "";
    }

    void setPlaceholder(const std::string& placeholder) {
        ArkUI_AttributeItem item = {nullptr, 0, placeholder.c_str()};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_INPUT_PLACEHOLDER, &item);
    }

    void setPlaceholderColor(uint32_t color) {
        ArkUI_NumberValue value[] = {{.u32 = color}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_INPUT_PLACEHOLDER_COLOR, &item);
    }

    void setPlaceholderFontSize(float fontSize) {
        ArkUI_NumberValue value[] = {{.f32 = fontSize}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_INPUT_PLACEHOLDER_FONT, &item);
    }

    void setInputType(ArkUI_TextInputType inputType) {
        ArkUI_NumberValue value[] = {{.i32 = inputType}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_INPUT_TYPE, &item);
    }

    void setTextMaxLen(int max) {
        ArkUI_NumberValue value[] = {{.i32 = max}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_INPUT_MAX_LENGTH, &item);
    }

    void resetTextMaxLen() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_TEXT_INPUT_MAX_LENGTH);
    }

    void setEnterKeyType(ArkUI_EnterKeyType keyType) {
        ArkUI_NumberValue value[] = {{.i32 = keyType}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_TEXT_INPUT_ENTER_KEY_TYPE, &item);
    }
};

// ========== Image Nodes ==========

/**
 * Image node
 */
class A2UIImageNode : public A2UINode {
public:
    explicit A2UIImageNode(ArkUI_NodeHandle nodeHandle) : A2UINode(nodeHandle) {}

    void setSrc(const std::string& src) {
        ArkUI_AttributeItem item = {nullptr, 0, src.c_str()};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_IMAGE_SRC, &item);
    }

    /**
     * Set the image source with a DrawableDescriptor, typically built from an external PixelMap.
     * @param descriptor OH_ArkUI_DrawableDescriptor instance. The caller releases it after assignment.
     */
    void setDrawableDescriptor(ArkUI_DrawableDescriptor* descriptor) {
        if (descriptor == nullptr) return;
        ArkUI_AttributeItem item = { .object = descriptor };
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_IMAGE_SRC, &item);
    }

    void resetSrc() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_IMAGE_SRC);
    }

    void setObjectFit(ArkUI_ObjectFit fit) {
        ArkUI_NumberValue value[] = {{.i32 = fit}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_IMAGE_OBJECT_FIT, &item);
    }

    void setObjectFitCover() {
        ArkUI_NumberValue value[] = {{.i32 = ARKUI_OBJECT_FIT_COVER}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_IMAGE_OBJECT_FIT, &item);
    }

    void setObjectFitContain() {
        ArkUI_NumberValue value[] = {{.i32 = ARKUI_OBJECT_FIT_CONTAIN}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_IMAGE_OBJECT_FIT, &item);
    }

    void setObjectFitFill() {
        ArkUI_NumberValue value[] = {{.i32 = ARKUI_OBJECT_FIT_FILL}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_IMAGE_OBJECT_FIT, &item);
    }

    void setObjectFitScaleDown() {
        ArkUI_NumberValue value[] = {{.i32 = ARKUI_OBJECT_FIT_SCALE_DOWN}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_IMAGE_OBJECT_FIT, &item);
    }

    void resetObjectFit() {
        g_nodeAPI->resetAttribute(m_nodeHandle, NODE_IMAGE_OBJECT_FIT);
    }

    void setFillColor(uint32_t color) {
        ArkUI_NumberValue value[] = {{.u32 = color}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_IMAGE_FILL_COLOR, &item);
    }
};

/**
 * Progress node
 */
class A2UIProgressNode : public A2UINode {
public:
    explicit A2UIProgressNode(ArkUI_NodeHandle nodeHandle) : A2UINode(nodeHandle) {}

    void setValue(float value) {
        ArkUI_NumberValue values[] = {{.f32 = value}};
        ArkUI_AttributeItem item = {values, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_PROGRESS_VALUE, &item);
    }

    void setTotal(float total) {
        ArkUI_NumberValue values[] = {{.f32 = total}};
        ArkUI_AttributeItem item = {values, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_PROGRESS_TOTAL, &item);
    }

    void setColor(uint32_t color) {
        ArkUI_NumberValue values[] = {{.u32 = color}};
        ArkUI_AttributeItem item = {values, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_PROGRESS_COLOR, &item);
    }

    void setType(ArkUI_ProgressType type) {
        ArkUI_NumberValue values[] = {{.i32 = type}};
        ArkUI_AttributeItem item = {values, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_PROGRESS_TYPE, &item);
    }
};

// ========== Specialized Control Nodes ==========

/**
 * Checkbox node
 */
class A2UICheckboxNode : public A2UINode {
public:
    explicit A2UICheckboxNode(ArkUI_NodeHandle nodeHandle) : A2UINode(nodeHandle) {}

    void setChecked(bool checked) {
        ArkUI_NumberValue value[] = {{.i32 = checked ? 1 : 0}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_CHECKBOX_SELECT, &item);
    }

    void setShape(ArkUI_CheckboxShape shape) {
        ArkUI_NumberValue value[] = {{.i32 = shape}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_CHECKBOX_SHAPE, &item);
    }

    void setSelectedColor(uint32_t color) {
        ArkUI_NumberValue value[] = {{.u32 = color}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_CHECKBOX_SELECT_COLOR, &item);
    }

    void setUnselectedColor(uint32_t color) {
        ArkUI_NumberValue value[] = {{.u32 = color}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_CHECKBOX_UNSELECT_COLOR, &item);
    }
};

/**
 * Slider node
 */
class A2UISliderNode : public A2UINode {
public:
    explicit A2UISliderNode(ArkUI_NodeHandle nodeHandle) : A2UINode(nodeHandle) {}

    void setMinValue(float min) {
        ArkUI_NumberValue value[] = {{.f32 = min}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SLIDER_MIN_VALUE, &item);
    }

    void setMaxValue(float max) {
        ArkUI_NumberValue value[] = {{.f32 = max}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SLIDER_MAX_VALUE, &item);
    }

    void setValue(float val) {
        ArkUI_NumberValue value[] = {{.f32 = val}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SLIDER_VALUE, &item);
    }

    void setStep(float step) {
        ArkUI_NumberValue value[] = {{.f32 = step}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SLIDER_STEP, &item);
    }

    void setStyle(ArkUI_SliderStyle style) {
        ArkUI_NumberValue value[] = {{.i32 = style}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SLIDER_STYLE, &item);
    }

    void setDirection(ArkUI_SliderDirection direction) {
        ArkUI_NumberValue value[] = {{.i32 = direction}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SLIDER_DIRECTION, &item);
    }

    void setBlockColor(uint32_t color) {
        ArkUI_NumberValue value[] = {{.u32 = color}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SLIDER_BLOCK_COLOR, &item);
    }

    void setTrackColor(uint32_t color) {
        ArkUI_NumberValue value[] = {{.u32 = color}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SLIDER_TRACK_COLOR, &item);
    }

    void setSelectedColor(uint32_t color) {
        ArkUI_NumberValue value[] = {{.u32 = color}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SLIDER_SELECTED_COLOR, &item);
    }

    void setTrackThickness(float thickness) {
        ArkUI_NumberValue value[] = {{.f32 = UnitConverter::a2uiToVp(thickness)}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SLIDER_TRACK_THICKNESS, &item);
    }

    void setBlockCircleStyle(float diameter) {
        ArkUI_NumberValue value[] = {
            {.i32 = ARKUI_SLIDER_BLOCK_STYLE_SHAPE},
            {.i32 = ARKUI_SHAPE_TYPE_CIRCLE},
            {.f32 = UnitConverter::a2uiToVp(diameter)},
            {.f32 = UnitConverter::a2uiToVp(diameter)}
        };
        ArkUI_AttributeItem item = {value, 4};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SLIDER_BLOCK_STYLE, &item);
    }

    void setBlockImageStyle(const std::string& src) {
        ArkUI_NumberValue value[] = {
            {.i32 = ARKUI_SLIDER_BLOCK_STYLE_IMAGE}
        };
        ArkUI_AttributeItem item = {value, 1, src.c_str()};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SLIDER_BLOCK_STYLE, &item);
    }
};

/**
 * Swiper node used by CarouselComponent
 * Based on hm_node.h SwipperNode
 */
class A2UISwiperNode : public A2UIContainerNode {
public:
    explicit A2UISwiperNode(ArkUI_NodeHandle nodeHandle) : A2UIContainerNode(nodeHandle) {}

    void setLoop(bool loop) {
        ArkUI_NumberValue value[] = {{.i32 = loop ? 1 : 0}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SWIPER_LOOP, &item);
    }

    void setAutoPlay(bool autoPlay) {
        ArkUI_NumberValue value[] = {{.i32 = autoPlay ? 1 : 0}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SWIPER_AUTO_PLAY, &item);
    }

    void setShowIndicator(bool show) {
        ArkUI_NumberValue value[] = {{.i32 = show ? 1 : 0}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SWIPER_SHOW_INDICATOR, &item);
    }

    void setIndex(int index) {
        ArkUI_NumberValue value[] = {{.i32 = index}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SWIPER_INDEX, &item);
    }

    void setDisableSwipe(bool disable) {
        ArkUI_NumberValue value[] = {{.i32 = disable ? 1 : 0}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SWIPER_DISABLE_SWIPE, &item);
    }

    void setPrevMargin(float margin) {
        ArkUI_NumberValue value[] = {{.f32 = margin}, {.i32 = 0}};
        ArkUI_AttributeItem item = {value, 2};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SWIPER_PREV_MARGIN, &item);
    }

    void setNextMargin(float margin) {
        ArkUI_NumberValue value[] = {{.f32 = margin}, {.i32 = 1}};
        ArkUI_AttributeItem item = {value, 2};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SWIPER_NEXT_MARGIN, &item);
    }

    void setInterval(int intervalMs) {
        ArkUI_NumberValue value[] = {{.i32 = intervalMs}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SWIPER_INTERVAL, &item);
    }

    void swipeToIndex(int index, bool animation) {
        ArkUI_NumberValue value[] = {{.i32 = index}, {.i32 = animation ? 1 : 0}};
        ArkUI_AttributeItem item = {value, 2};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SWIPER_SWIPE_TO_INDEX, &item);
    }
};

/**
 * List node
 */
class A2UIListNode : public A2UIContainerNode {
public:
    explicit A2UIListNode(ArkUI_NodeHandle nodeHandle) : A2UIContainerNode(nodeHandle) {}

    void setScrollBarDisplayOff() {
        ArkUI_NumberValue value[] = {{.i32 = ARKUI_SCROLL_BAR_DISPLAY_MODE_OFF}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SCROLL_BAR_DISPLAY_MODE, &item);
    }

    void setScrollDirectionVertical() {
        ArkUI_NumberValue value[] = {{.i32 = ARKUI_AXIS_VERTICAL}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_LIST_DIRECTION, &item);
    }

    void setScrollDirectionHorizontal() {
        ArkUI_NumberValue value[] = {{.i32 = ARKUI_AXIS_HORIZONTAL}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_LIST_DIRECTION, &item);
    }

    void setEdgeEffectNone() {
        ArkUI_NumberValue value[] = {{.i32 = ARKUI_EDGE_EFFECT_NONE}, {.i32 = 1}};
        ArkUI_AttributeItem item = {value, 2};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SCROLL_EDGE_EFFECT, &item);
    }

    void setEdgeEffectSpring() {
        ArkUI_NumberValue value[] = {{.i32 = ARKUI_EDGE_EFFECT_SPRING}, {.i32 = 1}};
        ArkUI_AttributeItem item = {value, 2};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SCROLL_EDGE_EFFECT, &item);
    }

    void setItemSpace(float spacePx) {
        ArkUI_NumberValue value[] = {{.f32 = UnitConverter::a2uiToVp(spacePx)}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_LIST_SPACE, &item);
    }

    void setScrollInteraction(bool enable) {
        ArkUI_NumberValue value[] = {{.i32 = enable ? 1 : 0}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_SCROLL_ENABLE_SCROLL_INTERACTION, &item);
    }
};

class A2UIDatePickerNode: public A2UINode {
public:
	A2UIDatePickerNode(ArkUI_NodeHandle nodeHandle) : A2UINode(nodeHandle) {
	}

public:
    void setDatePickerStart(const std::string &start_time) {
        ArkUI_AttributeItem start_item = {.string = start_time.c_str() };
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_DATE_PICKER_START, &start_item);
    }
    
    void setDatePickerEnd(const std::string &end_time) {
        ArkUI_AttributeItem end_item = {.string = end_time.c_str() };
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_DATE_PICKER_END, &end_item);
    }
    
    void setDatePickerSelected(const std::string &selected_time) {
        ArkUI_AttributeItem selected_item = {.string = selected_time.c_str() };
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_DATE_PICKER_SELECTED, &selected_item);
    }
    
    void setDatePickerMode(ArkUI_DatePickerMode mode) {
        ArkUI_NumberValue value[] = {{.i32 = mode}};
        ArkUI_AttributeItem item = {value, 1};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_DATE_PICKER_MODE, &item);
    }
};

} // namespace a2ui

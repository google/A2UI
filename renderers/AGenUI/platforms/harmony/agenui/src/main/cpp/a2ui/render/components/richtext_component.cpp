#include "richtext_component.h"
#include <layout/Html.h>
#include "../../bridge/open_url_helper.h"
#include "../a2ui_node.h"
#include "a2ui/measure/a2ui_platform_layout_bridge.h"
#include "a2ui/utils/a2ui_unit_utils.h"
#include "a2ui/utils/a2ui_color_palette.h"
#include "a2ui/utils/hm_font_utils.h"
#include "log/a2ui_capi_log.h"
#include <cstdlib>
#include <cstring>
#include <regex>

namespace a2ui {

static constexpr float kDefaultFontSize = 24.0f;

RichTextComponent::RichTextComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "RichText") {

    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_TEXT);

    {
        A2UITextNode t(m_nodeHandle);
        t.setFontSize(kDefaultFontSize);
        t.setFontColor(colors::kColorBlack);
    }

    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    HM_LOGI( "RichTextComponent - Created: id=%s, handle=%s",
                id.c_str(), m_nodeHandle ? "valid" : "null");
}

RichTextComponent::~RichTextComponent() {
    cleanSpanNodes();
    HM_LOGI( "RichTextComponent - Destroyed: id=%s", m_id.c_str());
}

void RichTextComponent::destroy() {
    // Unregister link clicks before the node tree is released.
    for (auto& clickNode : m_clickNodes) {
        if (clickNode->handle) {
            g_nodeAPI->unregisterNodeEvent(clickNode->handle, NODE_ON_CLICK);
        }
    }
    A2UIComponent::destroy();
}

// ---- Property Updates ----

void RichTextComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        HM_LOGE( "handle is null, id=%s", m_id.c_str());
        return;
    }

    applyVariant(properties);
    applyStyles(properties);

    if (properties.find("text") != properties.end()) {
        std::string htmlContent;
        const auto& textValue = properties["text"];

        if (textValue.is_object()) {
            if (textValue.find("literalString") != textValue.end() && textValue["literalString"].is_string()) {
                htmlContent = textValue["literalString"].get<std::string>();
            }
        }
        else if (textValue.is_string()) {
            htmlContent = textValue.get<std::string>();
        }

        if (!htmlContent.empty()) {
            setHtmlContent(htmlContent);
            HM_LOGI( "Set HTML content, length=%zu, id=%s",
                        htmlContent.size(), m_id.c_str());
        }
    }
}

// ---- HTML Preprocessing ----

std::string RichTextComponent::preprocessHtml(const std::string& html) {
    std::string result = html;
    
    result = std::regex_replace(result, std::regex("</h1>"), "</h1>\n");
    result = std::regex_replace(result, std::regex("</h2>"), "</h2>\n");
    result = std::regex_replace(result, std::regex("</h3>"), "</h3>\n");
    result = std::regex_replace(result, std::regex("</h4>"), "</h4>\n");
    result = std::regex_replace(result, std::regex("</h5>"), "</h5>\n");
    result = std::regex_replace(result, std::regex("</h6>"), "</h6>\n");
    
    result = std::regex_replace(result, std::regex("</p>"), "</p>\n");
    
    result = std::regex_replace(result, std::regex("</div>"), "</div>\n");
    
    return result;
}

// ---- HTML Rendering ----

void RichTextComponent::setHtmlContent(const std::string& html) {
    cleanSpanNodes();

    std::string processedHtml = preprocessHtml(html);

    agenui::Html ho(processedHtml);
    if (ho.isMalformed()) {
        HM_LOGW( "Malformed HTML, id=%s", m_id.c_str());
    }

    HM_LOGI( "Parsed %d spans, id=%s",
                ho.getSpanSize(), m_id.c_str());

    for (int i = 0; i < ho.getSpanSize(); i++) {
        agenui::Html::Span* span = ho.getSpan(i);
        if (!span) continue;

        bool isImageSpan = false;
        for (const auto& t : span->_tag_list) {
            if (t._tagID == agenui::Html::img) {
                isImageSpan = true;
                break;
            }
        }

        ArkUI_NodeType nodeType = isImageSpan ? ARKUI_NODE_IMAGE_SPAN : ARKUI_NODE_SPAN;
        auto spanNodeHandle = g_nodeAPI->createNode(nodeType);
        m_spanNodes.push_back(spanNodeHandle);

        if (isImageSpan) {
            // Image spans use dedicated image nodes.
            for (const auto& t : span->_tag_list) {
                if (t._tagID != agenui::Html::img) continue;

                std::string imgId;
                std::string imgSrc;
                std::string customEmoji;
                int imgWidth = 60;
                int imgHeight = 60;

                for (const auto& kv : t._attributes) {
                    if (kv.first == "id") {
                        imgId = kv.second;
                    } else if (kv.first == "src") {
                        imgSrc = kv.second;
                    } else if (kv.first == "width") {
                        imgWidth = std::atoi(kv.second.c_str());
                        if (imgWidth <= 0) imgWidth = 300;
                    } else if (kv.first == "height") {
                        imgHeight = std::atoi(kv.second.c_str());
                        if (imgHeight <= 0) imgHeight = 200;
                    } else if (kv.first == "customEmoji") {
                        customEmoji = kv.second;
                    }
                }

                // Rich text parsing does not carry span font size yet.
                if (customEmoji == "true") {
                    HM_LOGI( "RichTextComponent - customEmoji detected, id=%s", imgId.c_str());
                }

                ArkUI_NumberValue alignVal[] = {{.i32 = ARKUI_IMAGE_SPAN_ALIGNMENT_CENTER}};
                ArkUI_AttributeItem alignItem = {alignVal, 1, nullptr, nullptr};
                g_nodeAPI->setAttribute(spanNodeHandle, NODE_IMAGE_SPAN_VERTICAL_ALIGNMENT, &alignItem);

                A2UINode imgSpan(spanNodeHandle);
                imgSpan.setWidth(static_cast<float>(imgWidth));
                imgSpan.setHeight(static_cast<float>(imgHeight));

                if (!imgSrc.empty() && imgWidth > 0 && imgHeight > 0) {
                    ArkUI_AttributeItem srcItem = {nullptr, 0, imgSrc.c_str(), nullptr};
                    g_nodeAPI->setAttribute(spanNodeHandle, NODE_IMAGE_SRC, &srcItem);

                    HM_LOGI( "RichTextComponent - ImageSpan id=%s, src=%s, width=%d, height=%d, customEmoji=%s",
                                imgId.c_str(), imgSrc.c_str(), imgWidth, imgHeight, customEmoji.c_str());
                } else {
                    HM_LOGE( "RichTextComponent - Invalid ImageSpan: src=%s, width=%d, height=%d",
                                 imgSrc.c_str(), imgWidth, imgHeight);
                }

                break;
            }

            // Add to the root node
            g_nodeAPI->addChild(m_nodeHandle, spanNodeHandle);

        } else {
            {
                ArkUI_AttributeItem familyItem = {nullptr, 0, harmonyDefaultFontFamily().c_str(), nullptr};
                g_nodeAPI->setAttribute(spanNodeHandle, NODE_FONT_FAMILY, &familyItem);
            }

            ArkUI_AttributeItem textItem = {nullptr, 0, span->_text.c_str(), nullptr};
            g_nodeAPI->setAttribute(spanNodeHandle, NODE_SPAN_CONTENT, &textItem);

            // Add to the root node
            g_nodeAPI->addChild(m_nodeHandle, spanNodeHandle);

            uint32_t fontColor = colors::kColorBlack;
            int32_t decorationType = ARKUI_TEXT_DECORATION_TYPE_NONE;

            for (const auto& t : span->_tag_list) {
                switch (t._tagID) {
                    case agenui::Html::font: {
                        for (const auto& kv : t._attributes) {
                            if (kv.first == "color") {
                                fontColor = parseColor(kv.second);
                            } else if (kv.first == "size") {
                                // <font size="xxx"> Set font size
                                std::string sizeStr = kv.second;
                                // Strip the "px" suffix
                                size_t pxPos = sizeStr.rfind("px");
                                if (pxPos != std::string::npos) {
                                    sizeStr = sizeStr.substr(0, pxPos);
                                }
                                float fontSize = static_cast<float>(std::atof(sizeStr.c_str()));
                                if (fontSize > 0) {
                                    ArkUI_NumberValue sizeVal[] = {{.f32 = UnitConverter::a2uiToVp(fontSize)}};
                                    ArkUI_AttributeItem sizeItem = {sizeVal, 1, nullptr, nullptr};
                                    g_nodeAPI->setAttribute(spanNodeHandle, NODE_FONT_SIZE, &sizeItem);
                                }
                            } else if (kv.first == "face") {
                                const std::string fontFamily = normalizeHarmonyFontFamily(kv.second);
                                ArkUI_AttributeItem faceItem = {nullptr, 0, fontFamily.c_str(), nullptr};
                                g_nodeAPI->setAttribute(spanNodeHandle, NODE_FONT_FAMILY, &faceItem);
                            } else if (kv.first == "font-weight") {
                                int32_t weight = (kv.second == "bold") ? ARKUI_FONT_WEIGHT_BOLD : ARKUI_FONT_WEIGHT_NORMAL;
                                ArkUI_NumberValue weightVal[] = {{.i32 = weight}};
                                ArkUI_AttributeItem weightItem = {weightVal, 1, nullptr, nullptr};
                                g_nodeAPI->setAttribute(spanNodeHandle, NODE_FONT_WEIGHT, &weightItem);
                            } else if (kv.first == "background-color") {
                                uint32_t bgColor = parseColor(kv.second);
                                ArkUI_NumberValue bgVal[] = {{.u32 = bgColor}};
                                ArkUI_AttributeItem bgItem = {bgVal, 1, nullptr, nullptr};
                                g_nodeAPI->setAttribute(spanNodeHandle, NODE_BACKGROUND_COLOR, &bgItem);
                            }
                        }
                        break;
                    }

                    case agenui::Html::b:
                    case agenui::Html::strong: {
                        ArkUI_NumberValue weightVal[] = {{.i32 = ARKUI_FONT_WEIGHT_BOLD}};
                        ArkUI_AttributeItem weightItem = {weightVal, 1, nullptr, nullptr};
                        g_nodeAPI->setAttribute(spanNodeHandle, NODE_FONT_WEIGHT, &weightItem);
                        break;
                    }

                    case agenui::Html::i: {
                        ArkUI_NumberValue styleVal[] = {{.i32 = ARKUI_FONT_STYLE_ITALIC}};
                        ArkUI_AttributeItem styleItem = {styleVal, 1, nullptr, nullptr};
                        g_nodeAPI->setAttribute(spanNodeHandle, NODE_FONT_STYLE, &styleItem);
                        break;
                    }

                    case agenui::Html::u: {
                        decorationType = ARKUI_TEXT_DECORATION_TYPE_UNDERLINE;
                        break;
                    }

                    case agenui::Html::strike: {
                        decorationType = ARKUI_TEXT_DECORATION_TYPE_LINE_THROUGH;
                        break;
                    }

                    case agenui::Html::a: {
                        fontColor = 0xFF007FFF;
                        decorationType = ARKUI_TEXT_DECORATION_TYPE_UNDERLINE;

                        std::string id;
                        std::string href;
                        for (const auto& kv : t._attributes) {
                            if (kv.first == "id") {
                                id = kv.second;
                            } else if (kv.first == "href") {
                                href = kv.second;
                            } else if (kv.first == "face") {
                                const std::string fontFamily = normalizeHarmonyFontFamily(kv.second);
                                ArkUI_AttributeItem faceItem = {nullptr, 0, fontFamily.c_str(), nullptr};
                                g_nodeAPI->setAttribute(spanNodeHandle, NODE_FONT_FAMILY, &faceItem);
                            }
                        }

                        auto* clickNode = new ClickNode{this, spanNodeHandle, id, href};
                        m_clickNodes.push_back(clickNode);
                        HM_LOGI( "RichTextComponent - Link found: id=%s, href=%s",
                                    id.c_str(), href.c_str());
                        break;
                    }


                    case agenui::Html::br:
                    case agenui::Html::blockquote:
                        break;
                    
                    case agenui::Html::text:
                    case agenui::Html::img:
                    case agenui::Html::sub:
                    case agenui::Html::sup:
                    case agenui::Html::small:
                        break;
                }
            }

            ArkUI_NumberValue colorVal[] = {{.u32 = fontColor}};
            ArkUI_AttributeItem colorItem = {colorVal, 1, nullptr, nullptr};
            g_nodeAPI->setAttribute(spanNodeHandle, NODE_FONT_COLOR, &colorItem);

            if (decorationType != ARKUI_TEXT_DECORATION_TYPE_NONE) {
                ArkUI_NumberValue decoVal[] = {{.i32 = decorationType}, {.u32 = fontColor}};
                ArkUI_AttributeItem decoItem = {decoVal, 2, nullptr, nullptr};
                g_nodeAPI->setAttribute(spanNodeHandle, NODE_TEXT_DECORATION, &decoItem);
            }
        }
    }

    registerLinkClicks();
}


void RichTextComponent::registerLinkClicks() {
    for (auto& clickNode : m_clickNodes) {
        g_nodeAPI->addNodeEventReceiver(clickNode->handle, onLinkClickCallback);
        g_nodeAPI->registerNodeEvent(clickNode->handle, NODE_ON_CLICK, 0, clickNode);
    }

    if (!m_clickNodes.empty()) {
        HM_LOGI( "RichTextComponent - Registered %zu link click events, id=%s",
                    m_clickNodes.size(), m_id.c_str());
    }
}


void RichTextComponent::onLinkClickCallback(ArkUI_NodeEvent* event) {
    auto* clickNode = static_cast<ClickNode*>(OH_ArkUI_NodeEvent_GetUserData(event));
    if (!clickNode) {
        HM_LOGW( "userData is null");
        return;
    }

    HM_LOGI( "RichTextComponent - Link clicked: href=%s", clickNode->href.c_str());

    OpenUrlHelper::getInstance().openUrl(clickNode->href);
}


void RichTextComponent::cleanSpanNodes() {
    for (auto& clickNode : m_clickNodes) {
        if (clickNode->handle) {
            g_nodeAPI->unregisterNodeEvent(clickNode->handle, NODE_ON_CLICK);
        }
        delete clickNode;
    }
    m_clickNodes.clear();

    for (auto& spanNode : m_spanNodes) {
        g_nodeAPI->removeChild(m_nodeHandle, spanNode);
        g_nodeAPI->disposeNode(spanNode);
    }
    m_spanNodes.clear();
}


void RichTextComponent::applyVariant(const nlohmann::json& properties) {
    if (properties.find("variant") == properties.end() || !properties["variant"].is_string()) {
        return;
    }

    std::string variant = properties["variant"].get<std::string>();

    float fontSize = kDefaultFontSize;
    int32_t fontWeight = ARKUI_FONT_WEIGHT_NORMAL;

    if (variant == "h1") {
        fontSize = 32.0f;
        fontWeight = ARKUI_FONT_WEIGHT_BOLD;
    } else if (variant == "h2") {
        fontSize = 28.0f;
        fontWeight = ARKUI_FONT_WEIGHT_BOLD;
    } else if (variant == "h3") {
        fontSize = 24.0f;
        fontWeight = ARKUI_FONT_WEIGHT_BOLD;
    } else if (variant == "h4") {
        fontSize = 20.0f;
        fontWeight = ARKUI_FONT_WEIGHT_BOLD;
    } else if (variant == "h5") {
        fontSize = 18.0f;
        fontWeight = ARKUI_FONT_WEIGHT_BOLD;
    } else if (variant == "caption") {
        fontSize = 12.0f;
    } else {
        fontSize = kDefaultFontSize;
    }

    ArkUI_NumberValue fontSizeVal[] = {{.f32 = UnitConverter::a2uiToVp(fontSize)}};
    ArkUI_AttributeItem fontSizeItem = {fontSizeVal, 1, nullptr, nullptr};
    g_nodeAPI->setAttribute(m_nodeHandle, NODE_FONT_SIZE, &fontSizeItem);

    ArkUI_NumberValue fontWeightVal[] = {{.i32 = fontWeight}};
    ArkUI_AttributeItem fontWeightItem = {fontWeightVal, 1, nullptr, nullptr};
    g_nodeAPI->setAttribute(m_nodeHandle, NODE_FONT_WEIGHT, &fontWeightItem);
}

// ---- Custom Styles ----

void RichTextComponent::applyStyles(const nlohmann::json& properties) {
    if (properties.find("styles") == properties.end() || !properties["styles"].is_object()) {
        return;
    }

    const auto& styles = properties["styles"];

    {
        const nlohmann::json* fontSizeVal = nullptr;
        if (styles.find("font-size") != styles.end()) {
            fontSizeVal = &styles["font-size"];
        } else if (styles.find("fontSize") != styles.end()) {
            fontSizeVal = &styles["fontSize"];
        }
        if (fontSizeVal != nullptr) {
            float fontSize = 16.0f;
            if (fontSizeVal->is_number()) {
                fontSize = fontSizeVal->get<float>();
            } else if (fontSizeVal->is_string()) {
                fontSize = static_cast<float>(std::atof(fontSizeVal->get<std::string>().c_str()));
            }
            ArkUI_NumberValue sizeVal[] = {{.f32 = UnitConverter::a2uiToVp(fontSize)}};
            ArkUI_AttributeItem sizeItem = {sizeVal, 1, nullptr, nullptr};
            g_nodeAPI->setAttribute(m_nodeHandle, NODE_FONT_SIZE, &sizeItem);
        }
    }
    

    // color -> NODE_FONT_COLOR
    if (styles.find("color") != styles.end() && styles["color"].is_string()) {
        uint32_t color = parseColor(styles["color"].get<std::string>());
        ArkUI_NumberValue colorVal[] = {{.u32 = color}};
        ArkUI_AttributeItem colorItem = {colorVal, 1, nullptr, nullptr};
        g_nodeAPI->setAttribute(m_nodeHandle, NODE_FONT_COLOR, &colorItem);
    }

    if (styles.find("font-family") != styles.end() && styles["font-family"].is_string()) {
        A2UITextNode(m_nodeHandle).setFontFamily(styles["font-family"].get<std::string>());
    } else if (styles.find("fontFamily") != styles.end() && styles["fontFamily"].is_string()) {
        A2UITextNode(m_nodeHandle).setFontFamily(styles["fontFamily"].get<std::string>());
    }
}

} // namespace a2ui

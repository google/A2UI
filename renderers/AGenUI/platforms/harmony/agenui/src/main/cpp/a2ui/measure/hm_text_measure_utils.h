
#pragma once

#include "log/a2ui_capi_log.h"
#include <arkui/native_type.h>
#include <cassert>
#include <native_drawing/drawing_register_font.h>
#include <native_drawing/drawing_text_typography.h>
#include <native_drawing/drawing_text_declaration.h>
#include <native_drawing/drawing_font_collection.h>
#include <agenui_platform_layout_bridge.h>
#include "layout/key_define.h"
#include "layout/Html.h"
#include "a2ui/utils/hm_font_utils.h"

#include <native_drawing/drawing_register_font.h>
#include <native_drawing/drawing_text_typography.h>
#include <native_drawing/drawing_text_declaration.h>
#include <native_drawing/drawing_font_collection.h>

extern const std::string kstr_line_through = "line-through";
extern const std::string kstr_underline = "underline";
extern float gFontWeightScale;

#if defined(FLOAT_EQUAL)
#undef FLOAT_EQUAL
#endif
#define FLOAT_EQUAL(a, b) (std::isnan(a) || std::isnan(b) ? false : std::abs(a - b) < std::numeric_limits<float>::epsilon())

namespace css{
    enum TextOverflow {
        TextOverflow_undefined = agenui::NODE_PROPERTY_TEXT_OVERFLOW_UNDEFINED,      // 
        TextOverflow_clip      = agenui::NODE_PROPERTY_TEXT_OVERFLOW_CLIP,           // clip
        TextOverflow_ellipsis  = agenui::NODE_PROPERTY_TEXT_OVERFLOW_ELLIPSIS,       // ellipsis
        TextOverflow_middle    = agenui::NODE_PROPERTY_TEXT_OVERFLOW_MIDDLE,         // middle
        TextOverflow_head      = agenui::NODE_PROPERTY_TEXT_OVERFLOW_HEAD,           // head
    };
}

class TextMeasureUtils {
private:
    struct MeasureTextStyle {
        bool isMultLineHeight;
        float lineHeight;
        double fontSize;
        double letterSpacing;

        int fontWeight = agenui::NODE_PROPERTY_FONT_NORMAL;
        int fontStyle = agenui::NODE_PROPERTY_FONT_NORMAL;
        int textAlign = agenui::TEXT_ALIGN_LEFT_V_CENTER;
        int textOverflow = agenui::NODE_PROPERTY_TEXT_OVERFLOW_UNDEFINED;

        OH_Drawing_TextDecoration decoration = TEXT_DECORATION_NONE;

        std::vector<std::string> fontFamilies;
    };

    struct RichTextSpan {
        MeasureTextStyle style;
        std::string text;
        std::string originText;
        bool isPlaceHolder = false;
        bool isALink = false;
        double phWidth = 0;
        double phHeight = 0;
        int start = 0;
        int end = 0;
        std::string imgPath = "";
        std::string href = "";
        std::string clickId = "";
        std::map<std::string, std::string> attribute;
    };

public:
    
    static OH_Drawing_TextAlign convertToHMLayoutTextAlign(int textAlign) {
        OH_Drawing_TextAlign fixTextAlign = TEXT_ALIGN_LEFT;
        switch (textAlign) {
        case agenui::TEXT_ALIGN_LEFT_TOP:
        case agenui::TEXT_ALIGN_LEFT_V_CENTER:
        case agenui::TEXT_ALIGN_LEFT_BOTTOM:
            fixTextAlign = TEXT_ALIGN_LEFT;
            break;
        case agenui::TEXT_ALIGN_TOP_H_CENTER:
        case agenui::TEXT_ALIGN_CENTER:
        case agenui::TEXT_ALIGN_BOTTOM_H_CENTER:
            fixTextAlign = TEXT_ALIGN_CENTER;
            break;
        case agenui::TEXT_ALIGN_RIGHT_TOP:
        case agenui::TEXT_ALIGN_RIGHT_V_CENTER:
        case agenui::TEXT_ALIGN_RIGHT_BOTTOM:
            fixTextAlign = TEXT_ALIGN_RIGHT;
            break;
        }
        return fixTextAlign;
    }
    
    static OH_Drawing_FontWeight convertToHMLayoutFontWeight(int fontWeight) {
        OH_Drawing_FontWeight fixWeight = FONT_WEIGHT_400;
        switch (fontWeight) {
        case agenui::NODE_PROPERTY_FONT_THIN:
            fixWeight = FONT_WEIGHT_100;
            break;
        case agenui::NODE_PROPERTY_FONT_LIGHT:
            fixWeight = FONT_WEIGHT_300;
            break;
        case agenui::NODE_PROPERTY_FONT_NORMAL:
            fixWeight = FONT_WEIGHT_400;
            break;
        case agenui::NODE_PROPERTY_FONT_MEDIUM:
            fixWeight = FONT_WEIGHT_600;
            break;
        case agenui::NODE_PROPERTY_FONT_BOLD:
            fixWeight = FONT_WEIGHT_700;
            break;
        case agenui::NODE_PROPERTY_FONT_BOLDER:
            fixWeight = FONT_WEIGHT_900;
            break;
        default:
            break;
        }
        return fixWeight;
    }
    
    static float convertToRealFontWeightValue(OH_Drawing_FontWeight fontWeight) {
        float fixWeight = 400;
        switch (fontWeight) {
        case FONT_WEIGHT_100:
            fixWeight = 100;
            break;
        case FONT_WEIGHT_300:
            fixWeight = 300;
            break;
        case FONT_WEIGHT_400:
            fixWeight = 400;
            break;
        case FONT_WEIGHT_500:
            fixWeight = 500;
            break;
        case FONT_WEIGHT_600:
            fixWeight = 600;
            break;
        case FONT_WEIGHT_700:
            fixWeight = 700;
            break;
        case FONT_WEIGHT_800:
            fixWeight = 800;
            break;
        case FONT_WEIGHT_900:
            fixWeight = 900;
            break;
        default:
            break;
        }
        return fixWeight;
    }
    
    static OH_Drawing_EllipsisModal convertToHMLayoutTextOverflow(int textOverflow) {
        OH_Drawing_EllipsisModal fixTextOverflow = ELLIPSIS_MODAL_TAIL;
        if (textOverflow == agenui::NODE_PROPERTY_TEXT_OVERFLOW_ELLIPSIS) {
            fixTextOverflow = ELLIPSIS_MODAL_TAIL;
        } else if (textOverflow == agenui::NODE_PROPERTY_TEXT_OVERFLOW_MIDDLE) {
            fixTextOverflow = ELLIPSIS_MODAL_MIDDLE;
        } else if (textOverflow == agenui::NODE_PROPERTY_TEXT_OVERFLOW_HEAD) {
            fixTextOverflow = ELLIPSIS_MODAL_HEAD;
        } else {
            assert(false); // This path should be unreachable.
        }
        return fixTextOverflow;
    }
    
    static OH_Drawing_FontStyle convertToHMLayoutFontStyle(int fontStyle) {
        OH_Drawing_FontStyle fixStyle = FONT_STYLE_NORMAL;
        if (fontStyle == agenui::NODE_PROPERTY_FONT_ITALIC) {
            fixStyle = FONT_STYLE_ITALIC;
        }
        return fixStyle;
    }
    
    // Note that CAPI control setters expect vp units, so property assignment requires an explicit conversion
    static agenui::IPlatformLayoutBridge::MeasureSize doMeasure(const agenui::IPlatformLayoutBridge::TextMeasureParam &param, float width, agenui::IPlatformLayoutBridge::MeasureMode widthMode, float height,
                                                      agenui::IPlatformLayoutBridge::MeasureMode heightMode, float &baseLine, float &ascent, float &descent) {
        agenui::IPlatformLayoutBridge::MeasureSize result = {.lines=1, .width=0.0, .height=0.0};
        if (!param.text || strlen(param.text) == 0) {
            return result;
        }
        if (widthMode != agenui::IPlatformLayoutBridge::MeasureMode::MeasureModeUndefined && width <= 0.0f) {
            return result;
        }

        float maxWidth = 0.0;
        switch (widthMode) {
        case agenui::IPlatformLayoutBridge::MeasureMode::MeasureModeExactly:
            maxWidth = width;
            break;
        case agenui::IPlatformLayoutBridge::MeasureMode::MeasureModeAtMost:
            maxWidth = width;
            break;
        case agenui::IPlatformLayoutBridge::MeasureMode::MeasureModeUndefined:
            maxWidth = 9999.f;
            break;
        default:
            std::abort();
        }

        OH_Drawing_TypographyStyle *typoStyle = OH_Drawing_CreateTypographyStyle();
        OH_Drawing_SetTypographyTextDirection(typoStyle, TEXT_DIRECTION_LTR);
        OH_Drawing_SetTypographyTextAlign(typoStyle, convertToHMLayoutTextAlign(param.textAlign));
        int maxLines = width > 0 ? param.maxLines : 1;
        if (height > 0 && param.fontSize * 2 > height && maxLines == INT32_MAX) {
            maxLines = 1;
        }
        
        OH_Drawing_SetTypographyTextMaxLines(typoStyle, maxLines);

        switch (param.textOverflow) {
        case css::TextOverflow_head:
        case css::TextOverflow_middle:
            if (maxLines == 1) { // Head and middle ellipsis require line-clamp=1 when the control cannot display the full text.
                OH_Drawing_SetTypographyTextEllipsis(typoStyle, "...");
            }
            break;
        case css::TextOverflow_ellipsis: // Tail ellipsis does not depend on the line count.
            OH_Drawing_SetTypographyTextEllipsis(typoStyle, "...");
            break;
        case css::TextOverflow_clip:
            OH_Drawing_SetTypographyTextEllipsis(typoStyle, "");
            break;
        case css::TextOverflow_undefined:
            break;
        }
        OH_Drawing_FontCollection *fontCollection = nullptr;
        if (!fontCollection) {
            fontCollection = OH_Drawing_CreateSharedFontCollection();
        }
        OH_Drawing_TypographyCreate *handler = OH_Drawing_CreateTypographyHandler(typoStyle, fontCollection);
        assert(handler);
        MeasureTextStyle rootTextStyle = convertTextStyle(param);
        float maxRichTextHeight = 0.0;
        if (param.isRichtext) {
            auto spans = BuildRichTextSpans(param.text, param, rootTextStyle, maxRichTextHeight);
            int index = 0;
            for (auto &it : spans) {
                OH_Drawing_TextStyle *txtStyle = createTextStyle(it.style, true);
                OH_Drawing_TypographyHandlerPushTextStyle(handler, txtStyle);
                if (it.isPlaceHolder) {
                    OH_Drawing_PlaceholderSpan holder;
                    holder.width = it.phWidth;
                    holder.height = it.phHeight;
                    OH_Drawing_TypographyHandlerAddPlaceholder(handler, &holder);
                    HM_LOGD("[measure] span[%d][placeHolder] w:%f h:%f", index, holder.width, holder.height);
                } else {
                    OH_Drawing_TypographyHandlerAddText(handler, it.text.c_str());
                    HM_LOGD("[measure] span[%d][text] a:%d t:%s", index, it.isALink, it.text.c_str());
                }
                OH_Drawing_TypographyHandlerPopTextStyle(handler);
                OH_Drawing_DestroyTextStyle(txtStyle);
                index++;
            }
        } else {
            OH_Drawing_TextStyle *txtStyle = createTextStyle(rootTextStyle, false);
            OH_Drawing_TypographyHandlerPushTextStyle(handler, txtStyle);
            OH_Drawing_TypographyHandlerAddText(handler, param.text);
            OH_Drawing_TypographyHandlerPopTextStyle(handler);
            OH_Drawing_DestroyTextStyle(txtStyle);
        }

        OH_Drawing_Typography *typography = OH_Drawing_CreateTypography(handler);
        OH_Drawing_TypographyLayout(typography, maxWidth);

        baseLine = static_cast<float>(ceil(OH_Drawing_TypographyGetAlphabeticBaseline(typography)));

        // Populate result.countOfLines as cumulative per-line character counts.
        OH_Drawing_LineMetrics *lineMetrics = OH_Drawing_TypographyGetLineMetrics(typography);
        int vectorMetrics = OH_Drawing_LineMetricsGetSize(lineMetrics);
        int countOfLines = 0;
        for (int i = 0; i < vectorMetrics; i++) {
            OH_Drawing_LineMetrics metrics;
            OH_Drawing_TypographyGetLineMetricsAt(typography, i, &metrics);
            countOfLines = static_cast<int>(metrics.endIndex - metrics.startIndex) + countOfLines;
            result.countOfLines.push_back(countOfLines);
            if (i == 0) {
                ascent = metrics.ascender;
                descent = metrics.descender;
            }
        }
        OH_Drawing_DestroyLineMetrics(lineMetrics);
        // Rich text uses GetMaxWidth for more accurate multi-style span measurement, especially with bold text.
        // Plain text uses GetLongestLine with a 2% buffer.
        float measuredWidth = 0.0f;
        if (param.isRichtext) {
            // Rich text uses GetMaxWidth with a 5% buffer to avoid unintended wrapping.
            measuredWidth = static_cast<float>(ceil(OH_Drawing_TypographyGetMaxWidth(typography)) * 1.05);
        } else {
            // Plain text uses GetLongestLine with a 2% buffer.
            measuredWidth = static_cast<float>(ceil(OH_Drawing_TypographyGetLongestLine(typography)) * 1.02);
        }
        auto measuredHeight = static_cast<float>(ceil(OH_Drawing_TypographyGetHeight(typography)));
        auto lines = OH_Drawing_TypographyGetLineCount(typography);

        if (param.isRichtext) {
            // Rich text height should use the maximum span height.
            measuredHeight = std::max(maxRichTextHeight, measuredHeight);
        }
        
        // Resolve measured text height.
        switch (heightMode) {
        case agenui::IPlatformLayoutBridge::MeasureMode::MeasureModeExactly:
            result.height = height;
            break;
        case agenui::IPlatformLayoutBridge::MeasureMode::MeasureModeAtMost:
            result.height = std::min(measuredHeight, height);
            break;
        case agenui::IPlatformLayoutBridge::MeasureMode::MeasureModeUndefined:
            result.height = measuredHeight;
            break;
        default:
            std::abort();
        }
        result.width = widthMode == agenui::IPlatformLayoutBridge::MeasureMode::MeasureModeExactly ? width : measuredWidth;
        result.width = (fabs(result.width) <= 1e-6) ? measuredWidth : result.width;
        result.lines = lines;
        
        // Compensate slightly when very long rich text underestimates its measured height.
        if (param.isRichtext && result.height > 10000) {
            result.height += 2;
        }

        OH_Drawing_DestroyTypography(typography);
        OH_Drawing_DestroyTypographyHandler(handler);
        OH_Drawing_DestroyTypographyStyle(typoStyle);

        return result;
    }

private:
    static void SetTextDecoration(const agenui::IPlatformLayoutBridge::TextMeasureParam &param, MeasureTextStyle &text_style) {
        if (param.extras == nullptr || strlen(param.extras) == 0)
            return;
        if (param.extras == kstr_underline) {
            text_style.decoration = TEXT_DECORATION_UNDERLINE;
        } else if (param.extras == kstr_line_through) {
            text_style.decoration = TEXT_DECORATION_LINE_THROUGH;
        } else {
            // Add more styles here as needed.
        }
    }

    static std::vector<RichTextSpan> BuildRichTextSpans(const std::string &html, const agenui::IPlatformLayoutBridge::TextMeasureParam &param, const MeasureTextStyle &rootTextStyle, float &maxHeight) {
        std::vector<RichTextSpan> span_array;
        if (html.empty()) {
            return span_array;
        }
        agenui::Html ho(html);
        int index = 0;
        for (size_t i = 0; i < ho.getSpanSize(); i++) {
            agenui::Html::Span *span = ho.getSpan(i);
            auto sub_text = span->_text;
            RichTextSpan sub_span;
            sub_span.style = rootTextStyle;
            SetTextDecoration(param, sub_span.style);
            sub_span.start = index;
            sub_span.text = sub_text;
            sub_span.originText = html;

            for (auto &it : span->_tag_list) {
                switch (it._tagID) {
                case agenui::Html::TagID::text: {
                } break;
                case agenui::Html::TagID::font: {
                    if (it._attributes.empty()) {
                        break;
                    }
                    HM_LOGD("[measure] span <font> parse start.");
                    for (auto &attr : it._attributes) {
                        auto first = attr.first;
                        auto second = attr.second;
                        sub_span.attribute[first] = second;
                        HM_LOGD("[measure] span <font> key:%s, value:%s.", first.c_str(), second.c_str());
                        if (first == "color" && !second.empty()) {

                        } else if ("face" == first && !second.empty()) {
                            sub_span.style.fontFamilies.push_back(a2ui::normalizeHarmonyFontFamily(second));
                        } else if ("size" == first && !second.empty()) {
                            std::string token_value = second;
                            if (second.find("@") != std::string::npos) {
                                HM_LOGE("[measure] span <font> size unsupport @token.");
                            } else {
                                std::string size_str = token_value;
                                size_t pos = size_str.rfind("px");
                                if (pos != std::string::npos) {
                                    size_str.replace(pos, 2, "");
                                }
                                auto font_size = atof(size_str.c_str());
                                sub_span.style.fontSize = font_size;
                            }
                        } else if ("font-weight" == first && !second.empty()) {
                            if ("bold" == second) {
                                sub_span.style.fontWeight = agenui::NODE_PROPERTY_FONT_BOLD;
                            } else if ("light" == second) {
                                sub_span.style.fontWeight = agenui::NODE_PROPERTY_FONT_LIGHT;
                            }
                        }
                    }
                } break;
                case agenui::Html::TagID::a: {
                    if (it._attributes.empty()) {
                        break;
                    }
                    HM_LOGD("[measure] span <a> parse start.");
                    sub_span.isALink = true;
                    sub_span.style.decoration = TEXT_DECORATION_UNDERLINE;
                    for (auto &attr : it._attributes) {
                        auto first = attr.first;
                        auto second = attr.second;
                        sub_span.attribute[first] = second;
                        if ("face" == first && "none" == second) {
                            sub_span.style.decoration = TEXT_DECORATION_NONE;
                        } else if ("href" == first && !second.empty()) {
                            sub_span.href = second;
                        } else if ("id" == first && !second.empty()) {
                            sub_span.clickId = second;
                        }
                    }
                } break;
                case agenui::Html::TagID::br: {
                    HM_LOGD("[measure] span <br> parse start.");
                    sub_span.text = "\n";
                } break;
                case agenui::Html::TagID::blockquote: {
                    HM_LOGD("[measure] span <blockquote> parse start.");
                    sub_span.text = "\n\n" + sub_text + "\n\n";
                } break;
                case agenui::Html::TagID::i: {
                    HM_LOGD("[measure] span <i> parse start.");
                    sub_span.style.fontStyle = agenui::NODE_PROPERTY_FONT_ITALIC;
                } break;
                case agenui::Html::TagID::u: {
                    HM_LOGD("[measure] span <u> parse start.");
                    sub_span.style.decoration = TEXT_DECORATION_UNDERLINE;
                } break;
                case agenui::Html::TagID::strike: {
                    HM_LOGD("[measure] span <strike> parse start.");
                    sub_span.style.decoration = TEXT_DECORATION_LINE_THROUGH;
                } break;
                case agenui::Html::TagID::sub: {
                    HM_LOGD("[measure] span <sub> parse start.");
                    // sub/sup do not support line-through by default to match justified text behavior.
                    sub_span.style.decoration = TEXT_DECORATION_NONE;
                    sub_span.style.fontSize = sub_span.style.fontSize * 0.5;
                } break;
                case agenui::Html::TagID::sup: {
                    HM_LOGD("[measure] span <sup> parse start.");
                    // sub/sup do not support line-through by default to match justified text behavior.
                    sub_span.style.decoration = TEXT_DECORATION_NONE;
                    sub_span.style.fontSize = sub_span.style.fontSize * 0.5;
                } break;
                case agenui::Html::TagID::strong: {
                    HM_LOGD("[measure] span <strong> parse start.");
                    sub_span.style.fontStyle = agenui::NODE_PROPERTY_FONT_NORMAL;
                    sub_span.style.fontWeight = agenui::NODE_PROPERTY_FONT_BOLD;
                } break;
                case agenui::Html::TagID::b: {
                    HM_LOGD("[measure] span <b> parse start.");
                    sub_span.style.fontStyle = agenui::NODE_PROPERTY_FONT_NORMAL;
                    sub_span.style.fontWeight = agenui::NODE_PROPERTY_FONT_BOLD;
                } break;
                case agenui::Html::TagID::small: {
                    HM_LOGD("[measure] span <small> parse start.");
                    if (sub_span.style.fontSize > 2.0f) {
                        sub_span.style.fontSize -= 2.0f;
                    }
                } break;
                case agenui::Html::TagID::img: {
                    HM_LOGD("[measure] span <img> parse start.");
                    sub_span.isPlaceHolder = true;
                    index = index + 1;
                    for (auto &attr : it._attributes) {
                        auto first = attr.first;
                        auto second = attr.second;
                        sub_span.attribute[first] = second;
                        if (first == "width") {
                            sub_span.phWidth = atof(second.c_str());
                        } else if (first == "height") {
                            sub_span.phHeight = atof(second.c_str());
                            if (sub_span.phHeight > maxHeight) {
                                maxHeight = sub_span.phHeight;
                            }
                        } else if (first == "id") {
                            sub_span.clickId = second;
                        } else if (first == "src") {
                            sub_span.imgPath = second;
                        } else if (first == "customEmoji") {
                            HM_LOGE("[measure] img->customEmoji not support.");
                        } else if (first == "align") {
                            HM_LOGE("[measure] img->align not support.");
                        }
                    }
                } break;
                default:
                    HM_LOGE("[measure] span tag %d unknown.", it._tagID);
                }
            }
            index = index + (int)sub_span.text.size();
            sub_span.end = index;
            sub_span.style.isMultLineHeight = param.isMultLineHeight;
            sub_span.style.lineHeight = param.lineHeight;
            span_array.push_back(sub_span);
        }
        return span_array;
    }

    static MeasureTextStyle convertTextStyle(const agenui::IPlatformLayoutBridge::TextMeasureParam &param) {
        MeasureTextStyle textStyle;
        textStyle.isMultLineHeight = param.isMultLineHeight;
        textStyle.lineHeight = param.lineHeight;
        textStyle.fontSize = param.fontSize;
        textStyle.fontStyle = param.fontStyle;
        textStyle.textAlign = param.textAlign;
        textStyle.textOverflow = param.textOverflow;
        textStyle.fontWeight = param.fontWeight;
        if (param.fontFamily && strlen(param.fontFamily) > 0) {
            textStyle.fontFamilies.push_back(a2ui::normalizeHarmonyFontFamily(param.fontFamily));
        }
        if (textStyle.fontFamilies.empty()) {
            textStyle.fontFamilies.push_back(a2ui::harmonyDefaultFontFamily());
        }
        textStyle.letterSpacing = param.letter_spacing;
        return textStyle;
    }

    static OH_Drawing_TextStyle *createTextStyle(const MeasureTextStyle &textStyle, bool isRichText) {
        OH_Drawing_TextStyle *ohTextStyle = OH_Drawing_CreateTextStyle();
        OH_Drawing_SetTextStyleFontSize(ohTextStyle, textStyle.fontSize);
        
        int fontWeight = convertToHMLayoutFontWeight(textStyle.fontWeight);
        OH_Drawing_SetTextStyleFontWeight(ohTextStyle, fontWeight);
        // fontWeight * fontWeightScale prevents clipped text when bold weight increases glyph width.
        OH_Drawing_TextStyleAddFontVariation(ohTextStyle, "wght", convertToRealFontWeightValue(static_cast<OH_Drawing_FontWeight>(fontWeight)) * gFontWeightScale);
        
        OH_Drawing_SetTextStyleBaseLine(ohTextStyle, TEXT_BASELINE_ALPHABETIC);
        if (!textStyle.isMultLineHeight) {
            // Handle absolute line height by converting it to a font-size multiplier.
            OH_Drawing_SetTextStyleFontHeight(ohTextStyle, textStyle.lineHeight / textStyle.fontSize);
        } else if (!FLOAT_EQUAL(textStyle.lineHeight, 1.0)) {
            OH_Drawing_SetTextStyleFontHeight(ohTextStyle, textStyle.lineHeight);
        }
        OH_Drawing_SetTextStyleLetterSpacing(ohTextStyle, textStyle.letterSpacing);

        OH_Drawing_SetTextStyleDecoration(ohTextStyle, textStyle.decoration);
        if (textStyle.textOverflow == agenui::NODE_PROPERTY_TEXT_OVERFLOW_ELLIPSIS || 
            textStyle.textOverflow == agenui::NODE_PROPERTY_TEXT_OVERFLOW_MIDDLE ||
-           textStyle.textOverflow == agenui::NODE_PROPERTY_TEXT_OVERFLOW_HEAD) {
            OH_Drawing_SetTextStyleEllipsisModal(ohTextStyle, convertToHMLayoutTextOverflow(textStyle.textOverflow));
        }

        if (textStyle.fontFamilies.size() > 0) {
            const char *fontFamilies[] = {textStyle.fontFamilies.back().c_str()};
            OH_Drawing_SetTextStyleFontFamilies(ohTextStyle, 1, fontFamilies);
        }
        OH_Drawing_SetTextStyleFontStyle(ohTextStyle, convertToHMLayoutFontStyle(textStyle.fontStyle));
        return ohTextStyle;
    }
};

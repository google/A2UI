#pragma once

#include "../a2ui_component.h"
#include <vector>
#include <string>

namespace a2ui {

/**
 * Rich text component rendered with the Harmony ArkUI C-API.
 *
 * Rendering model:
 *   - the root node is ARKUI_NODE_TEXT
 *   - the HTML string is parsed into spans
 *   - each span creates an ARKUI_NODE_SPAN child
 *   - styling comes from the span tag stack, including color, bold, italic, and underline
 *
 * Supported properties:
 *   - text: required HTML content, as either a literalString object or a plain string
 *   - variant: preset text style such as h1-h5, caption, or body
 *   - styles: style object including fontSize and color
 *
 * Supported HTML tags:
 *   - text styles: <b>, <strong>, <i>, <em>, <u>, <strike>, <del>
 *   - font color: <font color="#xxx">
 *   - links: <a href="...">, rendered in blue and opened in the browser on click
 *   - paragraphs: <p>, <br>
 *   - headings: <h1> - <h6>
 */
class RichTextComponent : public A2UIComponent {
public:
    RichTextComponent(const std::string& id, const nlohmann::json& properties);
    ~RichTextComponent() override;

    /** Unregister events before destroying the component. */
    void destroy() override;

    /**
     * Click node (aligned with hm_rich_text.cpp ClickNode)
     * Stores the span handle and link metadata for click callbacks.
     */
    struct ClickNode {
        RichTextComponent* component;
        ArkUI_NodeHandle handle;
        std::string id;    // Link id attribute
        std::string href;  // Link href attribute
    };

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    /** Preprocess HTML by inserting line breaks for block-level tags. */
    std::string preprocessHtml(const std::string& html);

    /** Parse HTML and create native span nodes. */
    void setHtmlContent(const std::string& html);

    /** Destroy all span nodes and click nodes. */
    void cleanSpanNodes();

    /** Register click events for all link spans. */
    void registerLinkClicks();

    /** Link span click callback (static function, aligned with the lambda callback in hm_rich_text.cpp) */
    static void onLinkClickCallback(ArkUI_NodeEvent* event);

    /** Apply preset font size and weight from variant. */
    void applyVariant(const nlohmann::json& properties);

    /** Parse and apply styles. */
    void applyStyles(const nlohmann::json& properties);

    /** Managed native span nodes. */
    std::vector<ArkUI_NodeHandle> m_spanNodes;

    /** Click-node list (aligned with hm_rich_text.cpp m_clickNodes) */
    std::vector<ClickNode*> m_clickNodes;
};

} // namespace a2ui

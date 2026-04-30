#include "agenui_component_snapshot.h"
#include "agenui_css_style_converter.h"
#include "surface/agenui_serializable_data_impl.h"

namespace agenui {

bool LayoutInfo::operator==(const LayoutInfo& other) const {
    return x == other.x && y == other.y && width == other.width && height == other.height;
}

bool LayoutInfo::operator!=(const LayoutInfo& other) const {
    return !(*this == other);
}

std::string ComponentSnapshot::stringify() const {
    auto dataImpl = SerializableData::Impl::createObject();
    
    for (const auto& attr : attributes) {
        if (attr.second.isNull() || !attr.second.isValid()) {
            continue;
        }
        
        // Streaming append mode: use incremental field names
        if (component == "Markdown" && attr.first == "content" && appendMode) {
            dataImpl->set("appendContent", attr.second);
        } else if (component == "Text" && attr.first == "text" && appendMode) {
            dataImpl->set("textChunk", attr.second);
        } else if (component == "Text" && attr.first == "text" && attributes.count("textChunk") > 0) {
            // Inline streaming: textChunk exists as a separate attribute
            // (spec fills default text="" causing coexistence); skip text, keep only textChunk
            continue;
        } else {
            dataImpl->set(attr.first, attr.second);
        }
    }
    
    dataImpl->set("id", id);
    dataImpl->set("component", component);
    
    if (!styles.empty() || layout.isValid()) {
        auto stylesImpl = SerializableData::Impl::createObject();

        for (const auto& style : styles) {
            if (style.second.isNull() || !style.second.isValid()) {
                continue;
            }
            stylesImpl->set(style.first, style.second);
        }
#if defined(__OHOS__)
        // Include Yoga layout results in styles
        stylesImpl->set("x", layout.x);
        stylesImpl->set("y", layout.y);
        stylesImpl->set("width", layout.width);
        stylesImpl->set("height", layout.height);
        // Output line count for text components when layout dimensions are set
        if ((component == "Text" || component == "RichText") && layout.lines > 0) {
            stylesImpl->set("lines", layout.lines);
        }
        // Include styleInfo (saved original width/height style)
        if (!layout.styleInfo.empty()) {
            stylesImpl->set("styleInfo", layout.styleInfo);
        }
#endif
        dataImpl->set("styles", SerializableData(stylesImpl));
    }
    
#if !defined(TEST_COMPONENT_UPDATE)
    if (!children.empty()) {
        auto childrenImpl = SerializableData::Impl::createArray();
        for (const auto& child : children) {
            childrenImpl->append(SerializableData(SerializableData::Impl::create(child)));
        }
        dataImpl->set("children", SerializableData(childrenImpl));
    }
#endif
    
    return SerializableData(dataImpl).dump();
}

void ComponentSnapshot::resetMode() {
    appendMode = false;
}

}  // namespace agenui

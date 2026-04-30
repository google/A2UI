/*
 * image_holder.h
 *
 * Placeholder image loading helper.
 */

#pragma once

#include <string>

namespace a2ui {

/**
 * Placeholder image loading helper for rich-text image resources.
 *
 * - asyncLoadImage: asynchronous loading
 * - loadImage: synchronous loading
 * - createLoadParams: load parameter creation
 */
class ImageHolder {
public:
    ImageHolder() = default;
    ~ImageHolder() = default;

    // void asyncLoadImage(long rid, UiPageContext* pageCore, long viewId,
    //                     const std::string& src, float width, float height);

    // void loadImage(View* view, long rid, UiPageContext* pageCore, long viewId,
    //                const std::string& src, float width, float height);

private:
    std::string m_lastSrc;
    int m_lastRequestId = 0;
};

} // namespace a2ui

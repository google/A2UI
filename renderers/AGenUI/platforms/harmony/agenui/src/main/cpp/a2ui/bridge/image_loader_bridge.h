#pragma once

#include "napi/native_api.h"
#include "arkui/drawable_descriptor.h"
#include "arkui/native_node_napi.h"
#include <arkui/native_node.h>
#include <multimedia/image_framework/image/pixelmap_native.h>
#include <string>
#include <functional>
#include <mutex>
#include <unordered_map>

namespace a2ui {

/**
 * Image loading callback.
 *   - success=true on success
 *   - success=false on failure or cancellation, with isCancelled indicating which
 */
using ImageLoadCallback = std::function<void(
    const std::string& requestId,
    bool               success,
    bool               isCancelled
)>;

/**
 * Singleton bridge for the ETS image loader.
 *
 * Workflow:
 *   1. ArkTS injects an IImageLoader implementation with SurfaceManager.setImageLoader(config).
 *   2. napi_init.cpp::RegisterImageLoader registers the loader here and creates threadsafe functions.
 *   3. C++ components call ImageLoaderBridge::loadImage(), which forwards work to ETS through TSFN.
 *   4. The ETS loader calls setImagePixelMap(requestId, pixelMap) when loading completes.
 *   5. The bridge uses OH_PixelmapNative_ConvertPixelmapNativeFromNapi + OH_ArkUI_DrawableDescriptor_CreateFromPixelMap
 *      converts the PixelMap into a DrawableDescriptor and applies it to the ArkUI Image node.
 *   6. Success, failure, or cancellation is reported back to the C++ callback.
 */
class ImageLoaderBridge {
public:
    static ImageLoaderBridge& getInstance();

    // Registration, called by napi_init.cpp

    /**
     * Register the ETS image loader and create threadsafe functions.
     * @param env NAPI environment
     * @param loader IImageLoader object reference from ETS
     */
    void registerLoader(napi_env env, napi_value loader);

    /**
     * Return whether an ETS loader has been registered.
     */
    bool hasLoader() const;

    // Node registration, called by C++ components

    void registerNodeHandle(const std::string& requestId, ArkUI_NodeHandle handle);
    void unregisterNodeHandle(const std::string& requestId);

    // Core API, callable from any thread

    /**
     * Start an image loading request through the JS main thread.
     * @return Locally generated requestId, or an empty string if no loader is registered
     */
    std::string loadImage(
        const std::string& url,
        float width,
        float height,
        const std::string& componentId,
        const std::string& surfaceId,
        ArkUI_NodeHandle nodeHandle,
        ImageLoadCallback callback
    );

    /**
     * Cancel a request through the JS main thread.
     * @param requestId Request ID returned by loadImage
     */
    void cancel(const std::string& requestId);

    // PixelMap delivery, called by NAPI setImagePixelMap on the JS main thread

    /**
     * Create a PixelMap from raw bytes and apply it to the node.
     * This bypasses the problematic OH_ArkUI_GetDrawableDescriptorFromNapiValue path.
     * @param data RGBA_8888 or BGRA_8888 pixel bytes
     * @param dataLen Byte length
     * @param width/height Image size
     * @param pixelFormat PIXEL_FORMAT_RGBA_8888(3) or PIXEL_FORMAT_BGRA_8888(4)
     * @param alphaType Alpha type
     */
    void setImagePixelMapFromBytes(
        const std::string& requestId,
        uint8_t*           data,
        size_t             dataLen,
        int32_t            width,
        int32_t            height,
        int32_t            pixelFormat,
        int32_t            alphaType
    );

    // Failure and cancellation callback, called by NAPI onImageLoadFailed on the JS main thread

    void onFailed(const std::string& requestId, bool isCancelled);

    // Cleanup, called by napi_init.cpp
    void clear();

private:
    ImageLoaderBridge() = default;
    ~ImageLoaderBridge();

    ImageLoaderBridge(const ImageLoaderBridge&) = delete;
    ImageLoaderBridge& operator=(const ImageLoaderBridge&) = delete;

    // TSFN payloads used to invoke ETS methods across threads

    /**
     * Payload passed into the loadImage TSFN.
     */
    struct LoadImageData {
        std::string requestId;
        std::string url;
        float       width  = 0.0f;
        float       height = 0.0f;
        std::string componentId;
        std::string surfaceId;
    };

    /**
     * Payload passed into the cancel TSFN.
     */
    struct CancelData {
        std::string requestId;
    };

    // JS main-thread callback that invokes loader.loadImage
    static void CallLoadImageOnJsThread(
        napi_env env, napi_value jsCallback, void* context, void* data);

    // JS main-thread callback that invokes loader.cancel
    static void CallCancelOnJsThread(
        napi_env env, napi_value jsCallback, void* context, void* data);

    napi_env   env_          = nullptr;
    napi_ref   loader_ref_   = nullptr;  // IImageLoader object reference
    mutable std::mutex mutex_;

    napi_threadsafe_function tsfn_load_image_  = nullptr;  // Safely invokes loader.loadImage
    napi_threadsafe_function tsfn_cancel_      = nullptr;  // Safely invokes loader.cancel

    // Pending callback table: <requestId, callback>
    std::unordered_map<std::string, ImageLoadCallback> pending_callbacks_;

    // requestId -> ArkUI Image node handle
    std::unordered_map<std::string, ArkUI_NodeHandle> pending_handles_;
};

} // namespace a2ui

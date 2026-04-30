#include "image_loader_bridge.h"
#include "log/a2ui_capi_log.h"
#include "a2ui/render/a2ui_node.h"
#include <atomic>
#include <memory>

namespace a2ui {

// Stack buffer size used for reading short NAPI string return values (such as the
// requestId echoed back by ETS). Strings longer than this will be truncated by
// napi_get_value_string_utf8.
constexpr size_t kNapiStringReadBufferSize = 256;

// ---- Singleton ----

ImageLoaderBridge& ImageLoaderBridge::getInstance() {
    static ImageLoaderBridge instance;
    return instance;
}

ImageLoaderBridge::~ImageLoaderBridge() {
    clear();
}

// ---- requestId Generator ----

static std::string generateRequestId() {
    static std::atomic<uint64_t> counter{0};
    return "img_req_" + std::to_string(++counter);
}

// ---- Registration ----

void ImageLoaderBridge::registerLoader(napi_env env, napi_value loader) {
    std::lock_guard<std::mutex> lock(mutex_);

    // Release the previous thread-safe functions.
    if (tsfn_load_image_ != nullptr) {
        napi_release_threadsafe_function(tsfn_load_image_, napi_tsfn_release);
        tsfn_load_image_ = nullptr;
    }
    if (tsfn_cancel_ != nullptr) {
        napi_release_threadsafe_function(tsfn_cancel_, napi_tsfn_release);
        tsfn_cancel_ = nullptr;
    }

    // Release the previous loader reference.
    if (loader_ref_ != nullptr && env_ != nullptr) {
        napi_delete_reference(env_, loader_ref_);
        loader_ref_ = nullptr;
    }

    // Create the loader reference.
    napi_status status = napi_create_reference(env, loader, 1, &loader_ref_);
    if (status != napi_ok) {
        HM_LOGE("ImageLoaderBridge: Failed to create loader reference");
        return;
    }
    env_ = env;

    // Create the loadImage thread-safe function.
    napi_value asyncName = nullptr;
    napi_create_string_utf8(env, "ImageLoaderBridge_loadImage", NAPI_AUTO_LENGTH, &asyncName);
    status = napi_create_threadsafe_function(
        env, nullptr, nullptr, asyncName,
        0, 1, nullptr, nullptr, this,
        CallLoadImageOnJsThread,
        &tsfn_load_image_);
    if (status != napi_ok) {
        HM_LOGE("ImageLoaderBridge: Failed to create tsfn_load_image_");
        return;
    }

    // Create the cancel thread-safe function.
    napi_value asyncNameCancel = nullptr;
    napi_create_string_utf8(env, "ImageLoaderBridge_cancel", NAPI_AUTO_LENGTH, &asyncNameCancel);
    status = napi_create_threadsafe_function(
        env, nullptr, nullptr, asyncNameCancel,
        0, 1, nullptr, nullptr, this,
        CallCancelOnJsThread,
        &tsfn_cancel_);
    if (status != napi_ok) {
        HM_LOGE("ImageLoaderBridge: Failed to create tsfn_cancel_");
        return;
    }

    HM_LOGI("ImageLoaderBridge: Loader registered successfully, tsfn created");
}

bool ImageLoaderBridge::hasLoader() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return loader_ref_ != nullptr && env_ != nullptr && tsfn_load_image_ != nullptr;
}

// ---- Node Registration ----

void ImageLoaderBridge::registerNodeHandle(const std::string& requestId, ArkUI_NodeHandle handle) {
    std::lock_guard<std::mutex> lock(mutex_);
    pending_handles_[requestId] = handle;
}

void ImageLoaderBridge::unregisterNodeHandle(const std::string& requestId) {
    std::lock_guard<std::mutex> lock(mutex_);
    pending_handles_.erase(requestId);
}

// ---- JS Main-Thread Callback: loader.loadImage ----

void ImageLoaderBridge::CallLoadImageOnJsThread(
    napi_env env, napi_value /*jsCallback*/, void* context, void* data)
{
    if (data == nullptr) return;
    auto* payload = static_cast<LoadImageData*>(data);

    ImageLoaderBridge& bridge = *static_cast<ImageLoaderBridge*>(context);

    // Resolve the loader object.
    napi_value loaderObj = nullptr;
    {
        std::lock_guard<std::mutex> lock(bridge.mutex_);
        if (bridge.loader_ref_ == nullptr) {
            delete payload;
            return;
        }
        napi_get_reference_value(env, bridge.loader_ref_, &loaderObj);
    }
    if (loaderObj == nullptr) {
        delete payload;
        return;
    }

    // Resolve loader.loadImage.
    napi_value loadImageFn = nullptr;
    napi_get_named_property(env, loaderObj, "loadImage", &loadImageFn);
    if (loadImageFn == nullptr) {
        HM_LOGE("ImageLoaderBridge: loader has no loadImage method");
        delete payload;
        return;
    }

    // Build the options object.
    napi_value optionsObj = nullptr;
    napi_create_object(env, &optionsObj);
    if (payload->width > 0.0f) {
        napi_value v = nullptr;
        napi_create_double(env, static_cast<double>(payload->width), &v);
        napi_set_named_property(env, optionsObj, "width", v);
    }
    if (payload->height > 0.0f) {
        napi_value v = nullptr;
        napi_create_double(env, static_cast<double>(payload->height), &v);
        napi_set_named_property(env, optionsObj, "height", v);
    }
    if (!payload->componentId.empty()) {
        napi_value v = nullptr;
        napi_create_string_utf8(env, payload->componentId.c_str(), NAPI_AUTO_LENGTH, &v);
        napi_set_named_property(env, optionsObj, "componentId", v);
    }
    if (!payload->surfaceId.empty()) {
        napi_value v = nullptr;
        napi_create_string_utf8(env, payload->surfaceId.c_str(), NAPI_AUTO_LENGTH, &v);
        napi_set_named_property(env, optionsObj, "surfaceId", v);
    }

    // Pass (url, options, requestId) to ETS.
    napi_value urlVal = nullptr;
    napi_create_string_utf8(env, payload->url.c_str(), NAPI_AUTO_LENGTH, &urlVal);
    napi_value reqIdVal = nullptr;
    napi_create_string_utf8(env, payload->requestId.c_str(), NAPI_AUTO_LENGTH, &reqIdVal);
    napi_value args[3] = { urlVal, optionsObj, reqIdVal };

    // Call ETS loader.loadImage.
    napi_value thisVal = nullptr;
    napi_get_undefined(env, &thisVal);
    napi_value returnVal = nullptr;
    napi_status callStatus = napi_call_function(env, thisVal, loadImageFn, 3, args, &returnVal);
    if (callStatus != napi_ok) {
        HM_LOGE("ImageLoaderBridge: napi_call_function(loadImage) failed, url=%s", payload->url.c_str());
        // Notify failure
        std::lock_guard<std::mutex> lock(bridge.mutex_);
        auto it = bridge.pending_callbacks_.find(payload->requestId);
        if (it != bridge.pending_callbacks_.end()) {
            auto cb = std::move(it->second);
            bridge.pending_callbacks_.erase(it);
            bridge.pending_handles_.erase(payload->requestId);
            if (cb) cb(payload->requestId, false, false);
        }
        delete payload;
        return;
    }

    // Log the ETS requestId for validation.
    if (returnVal != nullptr) {
        napi_valuetype vtype = napi_undefined;
        napi_typeof(env, returnVal, &vtype);
        if (vtype == napi_string) {
            char buf[kNapiStringReadBufferSize] = {};
            size_t len = 0;
            napi_get_value_string_utf8(env, returnVal, buf, sizeof(buf), &len);
            HM_LOGI("ImageLoaderBridge: ETS loadImage returned requestId=%s, local requestId=%s",
                buf, payload->requestId.c_str());
        }
    }

    HM_LOGI("ImageLoaderBridge: loadImage dispatched on JS thread, requestId=%s url=%s",
        payload->requestId.c_str(), payload->url.c_str());
    delete payload;
}

// ---- JS Main-Thread Callback: loader.cancel ----

void ImageLoaderBridge::CallCancelOnJsThread(
    napi_env env, napi_value /*jsCallback*/, void* context, void* data)
{
    if (data == nullptr) return;
    auto* payload = static_cast<CancelData*>(data);

    ImageLoaderBridge& bridge = *static_cast<ImageLoaderBridge*>(context);

    napi_value loaderObj = nullptr;
    {
        std::lock_guard<std::mutex> lock(bridge.mutex_);
        if (bridge.loader_ref_ == nullptr) {
            delete payload;
            return;
        }
        napi_get_reference_value(env, bridge.loader_ref_, &loaderObj);
    }
    if (loaderObj == nullptr) {
        delete payload;
        return;
    }

    napi_value cancelFn = nullptr;
    napi_get_named_property(env, loaderObj, "cancel", &cancelFn);
    if (cancelFn == nullptr) {
        delete payload;
        return;
    }

    napi_value reqIdVal = nullptr;
    napi_create_string_utf8(env, payload->requestId.c_str(), NAPI_AUTO_LENGTH, &reqIdVal);
    napi_value thisVal = nullptr;
    napi_get_undefined(env, &thisVal);
    napi_value result = nullptr;
    napi_call_function(env, thisVal, cancelFn, 1, &reqIdVal, &result);

    HM_LOGI("ImageLoaderBridge: cancel dispatched on JS thread, requestId=%s", payload->requestId.c_str());
    delete payload;
}

// ---- Core API ----

std::string ImageLoaderBridge::loadImage(
    const std::string& url,
    float width,
    float height,
    const std::string& componentId,
    const std::string& surfaceId,
    ArkUI_NodeHandle nodeHandle,
    ImageLoadCallback callback
) {
    napi_threadsafe_function tsfn = nullptr;
    std::string requestId;
    {
        std::lock_guard<std::mutex> lock(mutex_);
        if (tsfn_load_image_ == nullptr || loader_ref_ == nullptr) {
            HM_LOGW("ImageLoaderBridge::loadImage - no loader registered, url=%s", url.c_str());
            return "";
        }
        // Generate and register the requestId under lock.
        requestId = generateRequestId();
        pending_callbacks_[requestId] = std::move(callback);
        if (nodeHandle != nullptr) {
            pending_handles_[requestId] = nodeHandle;
        }
        tsfn = tsfn_load_image_;
    }

    // Build the payload for the JS thread. Use unique_ptr so any early return
    // releases the payload automatically; ownership is transferred to the
    // thread-safe function only on a successful enqueue.
    auto payload = std::make_unique<LoadImageData>(LoadImageData{
        requestId, url, width, height, componentId, surfaceId
    });

    napi_status status = napi_call_threadsafe_function(tsfn, payload.get(), napi_tsfn_nonblocking);
    if (status != napi_ok) {
        HM_LOGE("ImageLoaderBridge::loadImage - napi_call_threadsafe_function failed, url=%s", url.c_str());
        std::lock_guard<std::mutex> lock(mutex_);
        pending_callbacks_.erase(requestId);
        pending_handles_.erase(requestId);
        // payload auto-released by unique_ptr.
        return "";
    }

    // Ownership transferred to tsfn; the JS-thread callback is responsible for delete.
    (void)payload.release();

    HM_LOGI("ImageLoaderBridge::loadImage - enqueued to JS thread, requestId=%s url=%s",
        requestId.c_str(), url.c_str());
    return requestId;
}

void ImageLoaderBridge::cancel(const std::string& requestId) {
    if (requestId.empty()) return;

    napi_threadsafe_function tsfn = nullptr;
    {
        std::lock_guard<std::mutex> lock(mutex_);
        // Drop the pending callback entry.
        pending_callbacks_.erase(requestId);
        pending_handles_.erase(requestId);
        tsfn = tsfn_cancel_;
    }

    if (tsfn == nullptr) return;

    // Use unique_ptr so the payload is released automatically on enqueue failure.
    auto payload = std::make_unique<CancelData>(CancelData{ requestId });
    napi_status status = napi_call_threadsafe_function(tsfn, payload.get(), napi_tsfn_nonblocking);
    if (status != napi_ok) {
        HM_LOGW("ImageLoaderBridge::cancel - napi_call_threadsafe_function failed, requestId=%s",
            requestId.c_str());
        // payload auto-released by unique_ptr.
        return;
    }
    // Ownership transferred to tsfn; the JS-thread callback is responsible for delete.
    (void)payload.release();
}

// ---- PixelMap Setup ----

void ImageLoaderBridge::setImagePixelMapFromBytes(
    const std::string& requestId,
    uint8_t*           data,
    size_t             dataLen,
    int32_t            width,
    int32_t            height,
    int32_t            pixelFormat,
    int32_t            alphaType
) {
    ImageLoadCallback cb;
    ArkUI_NodeHandle handle = nullptr;
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = pending_callbacks_.find(requestId);
        if (it == pending_callbacks_.end()) {
            HM_LOGW("ImageLoaderBridge::setImagePixelMapFromBytes - unknown requestId=%s (cancelled or not found)",
                requestId.c_str());
            return;
        }
        cb = std::move(it->second);
        pending_callbacks_.erase(it);

        auto hit = pending_handles_.find(requestId);
        if (hit != pending_handles_.end()) {
            handle = hit->second;
            pending_handles_.erase(hit);
        }
    }

    HM_LOGI("ImageLoaderBridge::setImagePixelMapFromBytes - requestId=%s handle=%p w=%d h=%d fmt=%d alpha=%d",
        requestId.c_str(), handle, width, height, pixelFormat, alphaType);

    if (handle == nullptr || data == nullptr || dataLen == 0 || width <= 0 || height <= 0) {
        HM_LOGE("ImageLoaderBridge::setImagePixelMapFromBytes - invalid params, requestId=%s", requestId.c_str());
        if (cb) cb(requestId, false, false);
        return;
    }

    // Step 1: Create OH_Pixelmap_InitializationOptions.
    OH_Pixelmap_InitializationOptions* opts = nullptr;
    Image_ErrorCode err = OH_PixelmapInitializationOptions_Create(&opts);
    if (err != IMAGE_SUCCESS || opts == nullptr) {
        HM_LOGE("ImageLoaderBridge: OH_PixelmapInitializationOptions_Create failed, err=%d", err);
        if (cb) cb(requestId, false, false);
        return;
    }

    OH_PixelmapInitializationOptions_SetWidth(opts, static_cast<uint32_t>(width));
    OH_PixelmapInitializationOptions_SetHeight(opts, static_cast<uint32_t>(height));
    // Use the source pixel format provided by ArkTS.
    OH_PixelmapInitializationOptions_SetSrcPixelFormat(opts, static_cast<int32_t>(pixelFormat));
    // Normalize the destination format to RGBA_8888.
    OH_PixelmapInitializationOptions_SetPixelFormat(opts, PIXEL_FORMAT_RGBA_8888);
    OH_PixelmapInitializationOptions_SetAlphaType(opts, static_cast<int32_t>(alphaType));

    // Step 2: Create OH_PixelmapNative from the raw pixel buffer.
    OH_PixelmapNative* nativePixelmap = nullptr;
    err = OH_PixelmapNative_CreatePixelmap(data, dataLen, opts, &nativePixelmap);
    OH_PixelmapInitializationOptions_Release(opts);

    if (err != IMAGE_SUCCESS || nativePixelmap == nullptr) {
        HM_LOGE("ImageLoaderBridge: OH_PixelmapNative_CreatePixelmap failed, err=%d, requestId=%s",
            err, requestId.c_str());
        if (cb) cb(requestId, false, false);
        return;
    }

    // Step 3: Build a DrawableDescriptor from the PixelMap.
    ArkUI_DrawableDescriptor* descriptor =
        OH_ArkUI_DrawableDescriptor_CreateFromPixelMap(nativePixelmap);
    if (descriptor == nullptr) {
        HM_LOGE("ImageLoaderBridge: OH_ArkUI_DrawableDescriptor_CreateFromPixelMap failed, requestId=%s",
            requestId.c_str());
        OH_PixelmapNative_Release(nativePixelmap);
        if (cb) cb(requestId, false, false);
        return;
    }

    // Step 4: Assign the descriptor to the ArkUI Image node.
    ArkUI_AttributeItem item = { .object = descriptor };
    g_nodeAPI->setAttribute(handle, NODE_IMAGE_SRC, &item);
    OH_ArkUI_DrawableDescriptor_Dispose(descriptor);
    // Release our PixelMap reference after the descriptor takes ownership.
    OH_PixelmapNative_Release(nativePixelmap);

    HM_LOGI("ImageLoaderBridge::setImagePixelMapFromBytes - PixelMap set to node OK, requestId=%s",
        requestId.c_str());
    if (cb) cb(requestId, true, false);
}

// ---- Failure / Cancel Callback ----

void ImageLoaderBridge::onFailed(const std::string& requestId, bool isCancelled) {
    ImageLoadCallback cb;
    {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = pending_callbacks_.find(requestId);
        if (it == pending_callbacks_.end()) {
            HM_LOGW("ImageLoaderBridge::onFailed - unknown requestId=%s", requestId.c_str());
            return;
        }
        cb = std::move(it->second);
        pending_callbacks_.erase(it);
        pending_handles_.erase(requestId);
    }

    HM_LOGI("ImageLoaderBridge::onFailed - requestId=%s cancelled=%d", requestId.c_str(), isCancelled);
    if (cb) cb(requestId, false, isCancelled);
}

// ---- Cleanup ----

void ImageLoaderBridge::clear() {
    std::lock_guard<std::mutex> lock(mutex_);

    if (tsfn_load_image_ != nullptr) {
        napi_release_threadsafe_function(tsfn_load_image_, napi_tsfn_release);
        tsfn_load_image_ = nullptr;
    }
    if (tsfn_cancel_ != nullptr) {
        napi_release_threadsafe_function(tsfn_cancel_, napi_tsfn_release);
        tsfn_cancel_ = nullptr;
    }
    if (loader_ref_ != nullptr && env_ != nullptr) {
        napi_delete_reference(env_, loader_ref_);
        loader_ref_ = nullptr;
    }
    env_ = nullptr;
    pending_callbacks_.clear();
    pending_handles_.clear();

    HM_LOGI("ImageLoaderBridge: Cleared");
}

} // namespace a2ui

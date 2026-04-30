#include "video_component.h"
#include "../a2ui_node.h"
#include "a2ui/utils/a2ui_color_palette.h"
#include "log/a2ui_capi_log.h"
#include <algorithm>
#include <cmath>
#include <sstream>
#include <iomanip>
#include <functional>
#include <napi/native_api.h>

// Global threadsafe function created in napi_init.cpp;
// used here to hop back to the main thread from AVPlayer worker callbacks.
extern napi_threadsafe_function a2ui_get_main_tsfn();

namespace a2ui {

using colors::kColorBlack;
using colors::kColorWhite;
// ---- Static member initialization ----
std::mutex VideoComponent::s_instanceMutex;
std::map<OH_NativeXComponent*, VideoComponent*> VideoComponent::s_instanceMap;

// ---- postToMainThread implementation ----
// Wraps a no-arg lambda as a heap-allocated napi callback data pointer and
// dispatches it via the global TSFN. The TSFN callback executes it on the
// JS/UI main thread, then deletes the allocation.
void VideoComponent::postToMainThread(std::function<void()> task) {
    napi_threadsafe_function tsfn = a2ui_get_main_tsfn();
    if (!tsfn) {
        HM_LOGE("[VideoComponent::postToMainThread] g_mainTsfn is null, dropping UI task");
        return;
    }
    // Wrap in a MainThreadTask (napi_env arg is unused here).
    using Task = std::function<void(napi_env)>;
    auto* wrapper = new Task([t = std::move(task)](napi_env /*env*/) { t(); });
    napi_status status = napi_call_threadsafe_function(tsfn, wrapper, napi_tsfn_nonblocking);
    if (status != napi_ok) {
        HM_LOGE("[VideoComponent::postToMainThread] napi_call_threadsafe_function failed, status=%d", status);
        delete wrapper;
    }
}


VideoComponent::VideoComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "Video") {

    m_xcomponentId = "video_xcomp_" + id;

    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_STACK);

    {
        A2UINode node(m_nodeHandle);
        node.setPercentWidth(1.0f);
        node.setBackgroundColor(kColorBlack);
        node.setClip(true);
    }

    m_xcomponentHandle = g_nodeAPI->createNode(ARKUI_NODE_XCOMPONENT);

    ArkUI_AttributeItem xcompIdItem = {nullptr, 0, m_xcomponentId.c_str(), nullptr};
    g_nodeAPI->setAttribute(m_xcomponentHandle, NODE_XCOMPONENT_ID, &xcompIdItem);

    ArkUI_NumberValue xcompTypeValue[] = {{.i32 = ARKUI_XCOMPONENT_TYPE_SURFACE}};
    ArkUI_AttributeItem xcompTypeItem = {xcompTypeValue, 1, nullptr, nullptr};
    g_nodeAPI->setAttribute(m_xcomponentHandle, NODE_XCOMPONENT_TYPE, &xcompTypeItem);

    {
        A2UINode xcomp(m_xcomponentHandle);
        xcomp.setPercentWidth(1.0f);
        xcomp.setPercentHeight(1.0f);
    }

    m_nativeXComponent = OH_NativeXComponent_GetNativeXComponent(m_xcomponentHandle);
    if (m_nativeXComponent) {
        m_xcompCallback.OnSurfaceCreated = onSurfaceCreatedCB;
        m_xcompCallback.OnSurfaceChanged = onSurfaceChangedCB;
        m_xcompCallback.OnSurfaceDestroyed = onSurfaceDestroyedCB;
        m_xcompCallback.DispatchTouchEvent = dispatchTouchEventCB;
        OH_NativeXComponent_RegisterCallback(m_nativeXComponent, &m_xcompCallback);
        registerInstance(m_nativeXComponent);
    }

    g_nodeAPI->addChild(m_nodeHandle, m_xcomponentHandle);

    m_avPlayer = OH_AVPlayer_Create();
    if (m_avPlayer) {
        m_playerCallbackValid.store(true);
        OH_AVPlayer_SetOnInfoCallback(m_avPlayer, onPlayerInfoCallback, this);
        OH_AVPlayer_SetOnErrorCallback(m_avPlayer, onPlayerErrorCallback, this);
    }

    createControlsBar();

    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    HM_LOGI( "VideoComponent - Created: id=%s, xcompId=%s, avPlayer=%s",
                id.c_str(), m_xcomponentId.c_str(), m_avPlayer ? "valid" : "null");
}

VideoComponent::~VideoComponent() {
    HM_LOGI( "VideoComponent - Destroying: id=%s", m_id.c_str());
    releasePlayer();
    unregisterInstance();
    destroyControlsBar();

    if (m_xcomponentHandle && m_nodeHandle) {
        g_nodeAPI->removeChild(m_nodeHandle, m_xcomponentHandle);
        g_nodeAPI->disposeNode(m_xcomponentHandle);
        m_xcomponentHandle = nullptr;
    }
    m_nativeXComponent = nullptr;
    m_window = nullptr;

    HM_LOGI( "VideoComponent - Destroyed: id=%s", m_id.c_str());
}

void VideoComponent::destroy() {
    releasePlayer();
    destroyControlsBar();
    A2UIComponent::destroy();
}


void VideoComponent::registerInstance(OH_NativeXComponent* xcomp) {
    std::lock_guard<std::mutex> lock(s_instanceMutex);
    s_instanceMap[xcomp] = this;
}

void VideoComponent::unregisterInstance() {
    std::lock_guard<std::mutex> lock(s_instanceMutex);
    for (auto it = s_instanceMap.begin(); it != s_instanceMap.end(); ++it) {
        if (it->second == this) {
            s_instanceMap.erase(it);
            break;
        }
    }
}


void VideoComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        HM_LOGE( "handle is null, id=%s", m_id.c_str());
        return;
    }

    if (properties.find("autoPlay") != properties.end()) {
        const auto& autoPlayVal = properties["autoPlay"];
        if (autoPlayVal.is_boolean()) {
            m_autoPlay = autoPlayVal.get<bool>();
        } else if (autoPlayVal.is_string()) {
            m_autoPlay = (autoPlayVal.get<std::string>() == "true");
        }
    }

    if (properties.find("controls") != properties.end()) {
        const auto& controlsVal = properties["controls"];
        if (controlsVal.is_boolean()) {
            m_controls = controlsVal.get<bool>();
        } else if (controlsVal.is_string()) {
            m_controls = (controlsVal.get<std::string>() == "true");
        }
    }

    if (properties.find("url") != properties.end()) {
        const auto& urlVal = properties["url"];
        if (urlVal.is_string()) {
            std::string newUrl = urlVal.get<std::string>();
            if (!newUrl.empty()) {
                setVideoUrl(newUrl);
            }
        }
    }

    updateControlsBarLayout();

    HM_LOGI( "url=%s, autoPlay=%d, controls=%d",
                m_videoUrl.c_str(), m_autoPlay ? 1 : 0, m_controls ? 1 : 0);
}


void VideoComponent::onSurfaceCreatedCB(OH_NativeXComponent* component, void* window) {
    if (!component || !window) {
        HM_LOGE( "Invalid params");
        return;
    }

    VideoComponent* self = nullptr;
    {
        std::lock_guard<std::mutex> lock(s_instanceMutex);
        auto it = s_instanceMap.find(component);
        if (it != s_instanceMap.end() && it->second) {
            self = it->second;
            self->m_window = reinterpret_cast<OHNativeWindow*>(window);
            HM_LOGI( "id=%s, window=%p",
                        self->m_id.c_str(), window);
        }
    }
    if (self && !self->m_videoUrl.empty()) {
        self->handleVideoPrepare(self->m_videoUrl);
    }
}

void VideoComponent::onSurfaceChangedCB(OH_NativeXComponent* component, void* window) {
    if (!component || !window) return;

    std::lock_guard<std::mutex> lock(s_instanceMutex);
    auto it = s_instanceMap.find(component);
    if (it != s_instanceMap.end() && it->second) {
        VideoComponent* self = it->second;
        self->m_window = reinterpret_cast<OHNativeWindow*>(window);
        HM_LOGI( "id=%s", self->m_id.c_str());
    }
}

void VideoComponent::onSurfaceDestroyedCB(OH_NativeXComponent* component, void* window) {
    if (!component) return;

    std::lock_guard<std::mutex> lock(s_instanceMutex);
    auto it = s_instanceMap.find(component);
    if (it != s_instanceMap.end() && it->second) {
        VideoComponent* self = it->second;
        HM_LOGI( "id=%s", self->m_id.c_str());
        self->m_window = nullptr;
    }
}

void VideoComponent::dispatchTouchEventCB(OH_NativeXComponent* component, void* window) {
    if (!component) return;

    std::lock_guard<std::mutex> lock(s_instanceMutex);
    auto it = s_instanceMap.find(component);
    if (it == s_instanceMap.end() || !it->second) return;

    VideoComponent* self = it->second;

    OH_NativeXComponent_TouchEvent touchEvent;
    OH_NativeXComponent_GetTouchEvent(component, window, &touchEvent);

    if (touchEvent.type == OH_NativeXComponent_TouchEventType::OH_NATIVEXCOMPONENT_UP) {
        HM_LOGI( "Touch UP, toggling controls, id=%s",
                    self->m_id.c_str());
        self->toggleControlsBar();
    }
}



void VideoComponent::onPlayerInfoCallback(OH_AVPlayer* player, AVPlayerOnInfoType type,
                                          OH_AVFormat* infoBody, void* userData) {
    VideoComponent* self = reinterpret_cast<VideoComponent*>(userData);
    if (!self || !player) return;
    if (!self->m_playerCallbackValid.load()) return;

    switch (type) {
    case AV_INFO_TYPE_STATE_CHANGE: {
        int32_t state = -1;
        int32_t stateChangeReason = -1;
        OH_AVFormat_GetIntValue(infoBody, OH_PLAYER_STATE, &state);
        OH_AVFormat_GetIntValue(infoBody, OH_PLAYER_STATE_CHANGE_REASON, &stateChangeReason);
        // handleStateChange updates data fields on all paths; only the branches that
        // call ArkUI functions (updatePlayPauseButton, showControlsBar) need the hop.
        // Capture by value so the lambda is safe after this stack frame returns.
        AVPlayerState capturedState = static_cast<AVPlayerState>(state);
        int32_t capturedReason = stateChangeReason;
        postToMainThread([self, capturedState, capturedReason]() {
            if (!self->m_uiTasksEnabled.load()) return;
            self->handleStateChange(capturedState, capturedReason);
        });
        break;
    }
    case AV_INFO_TYPE_POSITION_UPDATE: {
        int32_t currentPosition = 0;
        OH_AVFormat_GetIntValue(infoBody, OH_PLAYER_CURRENT_POSITION, &currentPosition);
        int64_t capturedPos = static_cast<int64_t>(currentPosition);
        postToMainThread([self, capturedPos]() {
            if (!self->m_uiTasksEnabled.load()) return;
            self->m_currentPosition = capturedPos;

            if (self->m_controlsBarVisible) {
                self->updateProgressDisplay();

                if (!self->m_isSeeking) {
                    auto now = std::chrono::steady_clock::now();
                    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
                        now - self->m_controlsShowTime).count();
                    if (elapsed >= kControlsAutoHideMs) {
                        self->hideControlsBar();
                    }
                }
            }
        });
        break;
    }
    case AV_INFO_TYPE_DURATION_UPDATE: {
        int64_t duration = -1;
        OH_AVFormat_GetLongValue(infoBody, OH_PLAYER_DURATION, &duration);
        int64_t capturedDuration = duration;
        postToMainThread([self, capturedDuration]() {
            if (!self->m_uiTasksEnabled.load()) return;
            self->m_duration = capturedDuration;

            if (self->m_sliderHandle && capturedDuration > 0) {
                A2UISliderNode(self->m_sliderHandle).setMaxValue(static_cast<float>(capturedDuration));
            }

            if (self->m_totalTimeHandle) {
                A2UITextNode(self->m_totalTimeHandle).setTextContent(formatTime(capturedDuration));
            }
        });
        break;
    }
    case AV_INFO_TYPE_RESOLUTION_CHANGE: {
        int32_t videoWidth = 0, videoHeight = 0;
        OH_AVFormat_GetIntValue(infoBody, OH_PLAYER_VIDEO_WIDTH, &videoWidth);
        OH_AVFormat_GetIntValue(infoBody, OH_PLAYER_VIDEO_HEIGHT, &videoHeight);
        // Store intrinsic dimensions and call notifyIntrinsicSizeIfNeeded on the main thread
        // because it reads node layout state which must not be accessed concurrently.
        float capturedW = static_cast<float>(videoWidth);
        float capturedH = static_cast<float>(videoHeight);
        HM_LOGI( "VideoComponent - Resolution: %dx%d, id=%s",
                    videoWidth, videoHeight, self->m_id.c_str());
        postToMainThread([self, capturedW, capturedH]() {
            if (!self->m_uiTasksEnabled.load()) return;
            self->m_videoIntrinsicWidth  = capturedW;
            self->m_videoIntrinsicHeight = capturedH;
            self->notifyIntrinsicSizeIfNeeded();
        });
        break;
    }
    case AV_INFO_TYPE_MESSAGE: {
        int32_t messageType = -1;
        OH_AVFormat_GetIntValue(infoBody, OH_PLAYER_MESSAGE_TYPE, &messageType);
        if (messageType == 1) {
            HM_LOGI( "VideoComponent - First frame rendered, id=%s", self->m_id.c_str());
        }
        break;
    }
    default:
        break;
    }
}

void VideoComponent::onPlayerErrorCallback(OH_AVPlayer* player, int32_t errorCode,
                                           const char* errorMsg, void* userData) {
    VideoComponent* self = reinterpret_cast<VideoComponent*>(userData);
    if (!self) return;
    if (!self->m_playerCallbackValid.load()) return;

    std::string capturedMsg = errorMsg ? errorMsg : "unknown";
    HM_LOGE( "VideoComponent - Player error: code=%d, msg=%s, id=%s",
                 errorCode, capturedMsg.c_str(), self->m_id.c_str());
    postToMainThread([self, capturedMsg]() {
        if (!self->m_uiTasksEnabled.load()) return;
        self->m_videoCurrentState = "error";
        self->m_isPlaying = false;
        self->updatePlayPauseButton();
    });
}


void VideoComponent::notifyIntrinsicSizeIfNeeded() {
    if (m_videoIntrinsicWidth <= 0.0f || m_videoIntrinsicHeight <= 0.0f) {
        return;
    }

    float currentWidth = getWidth();
    float currentHeight = getHeight();
    if (currentWidth > 2.0f && currentHeight > 2.0f) {
        HM_LOGI("Skip, layout already resolved: %.1fx%.1f, id=%s",
            currentWidth, currentHeight, m_id.c_str());
        return;
    }

    float reportWidth = m_videoIntrinsicWidth;
    float reportHeight = m_videoIntrinsicHeight;

    constexpr float kNotifyEpsilon = 0.01f;
    if (std::fabs(reportWidth - m_lastNotifiedWidth) <= kNotifyEpsilon
        && std::fabs(reportHeight - m_lastNotifiedHeight) <= kNotifyEpsilon) {
        return;
    }

    m_lastNotifiedWidth = reportWidth;
    m_lastNotifiedHeight = reportHeight;

    agenui::IComponentRenderObservable* observable = getComponentRenderObservable();
    if (!observable) {
        HM_LOGW("ComponentRenderObservable not set, id=%s", m_id.c_str());
        return;
    }

    agenui::ComponentRenderInfo info;
    info.surfaceId = getSurfaceId();
    info.componentId = getId();
    info.type = getComponentType();
    info.width = UnitConverter::pxToA2ui(reportWidth);
    info.height = UnitConverter::pxToA2ui(reportHeight);

    HM_LOGI("Notify layout with intrinsic size: %.1fx%.1f (current=%.1fx%.1f), id=%s",
        reportWidth, reportHeight, currentWidth, currentHeight, m_id.c_str());
    observable->notifyRenderFinish(info);
}

void VideoComponent::setVideoUrl(const std::string& url) {
    HM_LOGI( "url=%s, state=%s, id=%s",
                url.c_str(), m_videoCurrentState.c_str(), m_id.c_str());

    if (m_videoUrl == url && !m_videoCurrentState.empty() && m_videoCurrentState != "error") {
        return;
    }

    m_videoUrl = url;
    m_currentPosition = 0;
    m_duration = 0;
    m_pendingPrepare = false;

    if (!m_avPlayer || url.empty()) return;

    if (!m_videoCurrentState.empty()
        && m_videoCurrentState != "idle"
        && m_videoCurrentState != "destroyed") {
        m_pendingPrepare = true;
        HM_LOGI( "Resetting player (async), pendingPrepare=true, id=%s", m_id.c_str());
        OH_AVPlayer_Reset(m_avPlayer);
        return;
    }

    if (m_window) {
        handleVideoPrepare(url);
    }
}

OH_AVErrCode VideoComponent::handleVideoPrepare(const std::string& url) {
    OH_AVErrCode errCode = AV_ERR_OK;

    if (!m_window || !m_avPlayer || url.empty()) {
        HM_LOGW( "Not ready: window=%p, avPlayer=%p, url=%s",
                    m_window, m_avPlayer, url.c_str());
        return AV_ERR_INVALID_VAL;
    }

    HM_LOGI( "Starting: url=%s, id=%s",
                url.c_str(), m_id.c_str());

    if (url.rfind("http://", 0) == 0 || url.rfind("https://", 0) == 0) {
        errCode = OH_AVPlayer_SetURLSource(m_avPlayer, url.c_str());
        if (errCode != AV_ERR_OK) {
            HM_LOGE( "SetURLSource failed: %d", errCode);
            return errCode;
        }
    } else {
        const char* filePath = url.c_str();
        if (url.rfind("file://", 0) == 0) {
            filePath = url.c_str() + strlen("file://");
        }
        int fd = open(filePath, O_RDONLY);
        if (fd < 0) {
            HM_LOGE( "open file failed: %s, errno=%d",
                         filePath, errno);
            return AV_ERR_IO;
        }
        struct stat fileStat;
        if (fstat(fd, &fileStat) != 0) {
            HM_LOGE( "fstat failed, errno=%d", errno);
            close(fd);
            return AV_ERR_IO;
        }
        int64_t fileSize = fileStat.st_size;
        errCode = OH_AVPlayer_SetFDSource(m_avPlayer, fd, 0, fileSize);
        close(fd);
        if (errCode != AV_ERR_OK) {
            HM_LOGE( "SetFDSource failed: %d", errCode);
            return errCode;
        }
    }

    errCode = OH_AVPlayer_SetVideoSurface(m_avPlayer, m_window);
    if (errCode != AV_ERR_OK) {
        HM_LOGE( "SetVideoSurface failed: %d", errCode);
        return errCode;
    }

    errCode = OH_AVPlayer_Prepare(m_avPlayer);
    if (errCode != AV_ERR_OK) {
        HM_LOGE( "Prepare failed: %d", errCode);
        return errCode;
    }

    HM_LOGI( "Success, id=%s", m_id.c_str());
    return errCode;
}

void VideoComponent::handleStateChange(AVPlayerState state, int32_t stateChangeReason) {
    switch (state) {
    case AV_IDLE:
        m_videoCurrentState = "idle";
        m_isPlaying = false;
        HM_LOGI( "VideoComponent - State: IDLE, pendingPrepare=%d, window=%p, id=%s",
                    m_pendingPrepare ? 1 : 0, m_window, m_id.c_str());
        if (m_pendingPrepare && !m_videoUrl.empty() && m_window) {
            m_pendingPrepare = false;
            handleVideoPrepare(m_videoUrl);
        }
        break;

    case AV_INITIALIZED:
        m_videoCurrentState = "preparing";
        HM_LOGI( "VideoComponent - State: INITIALIZED, id=%s", m_id.c_str());
        break;

    case AV_PREPARED:
        m_videoCurrentState = "prepared";
        HM_LOGI( "VideoComponent - State: PREPARED, autoPlay=%d, id=%s",
                    m_autoPlay ? 1 : 0, m_id.c_str());

        if (m_autoPlay) {
            OH_AVErrCode playErr = play();
            if (playErr != AV_ERR_OK) {
                HM_LOGE( "VideoComponent - AutoPlay failed: %d, id=%s",
                             playErr, m_id.c_str());
            }
        }
        break;

    case AV_PLAYING:
        m_videoCurrentState = "playing";
        m_isPlaying = true;
        HM_LOGI( "VideoComponent - State: PLAYING, id=%s", m_id.c_str());
        updatePlayPauseButton();
        break;

    case AV_PAUSED:
        m_videoCurrentState = "paused";
        m_isPlaying = false;
        HM_LOGI( "VideoComponent - State: PAUSED, id=%s", m_id.c_str());
        updatePlayPauseButton();
        break;

    case AV_STOPPED:
        m_videoCurrentState = "stopped";
        m_isPlaying = false;
        HM_LOGI( "VideoComponent - State: STOPPED, id=%s", m_id.c_str());
        updatePlayPauseButton();
        break;

    case AV_COMPLETED:
        m_videoCurrentState = "completed";
        m_isPlaying = false;
        HM_LOGI( "VideoComponent - State: COMPLETED, id=%s", m_id.c_str());
        updatePlayPauseButton();
        if (m_controls) {
            showControlsBar();
        }
        break;

    case AV_RELEASED:
        m_videoCurrentState = "destroyed";
        m_isPlaying = false;
        HM_LOGI( "VideoComponent - State: RELEASED, id=%s", m_id.c_str());
        break;

    case AV_ERROR:
        m_videoCurrentState = "error";
        m_isPlaying = false;
        HM_LOGE( "VideoComponent - State: ERROR, id=%s", m_id.c_str());
        break;

    default:
        break;
    }
}

OH_AVErrCode VideoComponent::play() {
    if (!m_avPlayer) return AV_ERR_INVALID_VAL;
    OH_AVErrCode code = OH_AVPlayer_Play(m_avPlayer);
    HM_LOGI( "result=%d, id=%s", code, m_id.c_str());
    return code;
}

OH_AVErrCode VideoComponent::pause() {
    if (!m_avPlayer) return AV_ERR_INVALID_VAL;
    OH_AVErrCode code = OH_AVPlayer_Pause(m_avPlayer);
    HM_LOGI( "result=%d, id=%s", code, m_id.c_str());
    return code;
}

OH_AVErrCode VideoComponent::stop() {
    if (!m_avPlayer) return AV_ERR_INVALID_VAL;
    OH_AVErrCode code = OH_AVPlayer_Stop(m_avPlayer);
    HM_LOGI( "result=%d, id=%s", code, m_id.c_str());
    return code;
}

void VideoComponent::releasePlayer() {
    if (m_avPlayer) {
        m_playerCallbackValid.store(false);
        m_uiTasksEnabled.store(false);   // Block any in-flight main-thread tasks from touching nodes
        OH_AVPlayer_SetOnInfoCallback(m_avPlayer, nullptr, nullptr);
        OH_AVPlayer_SetOnErrorCallback(m_avPlayer, nullptr, nullptr);

        OH_AVErrCode code = OH_AVPlayer_Release(m_avPlayer);
        HM_LOGI( "result=%d, id=%s", code, m_id.c_str());
        m_avPlayer = nullptr;
    }
    m_isPlaying = false;
    m_videoCurrentState = "destroyed";
}


void VideoComponent::createControlsBar() {
    m_controlsBarHandle = g_nodeAPI->createNode(ARKUI_NODE_COLUMN);

    {
        A2UIColumnNode bar(m_controlsBarHandle);
        bar.setPercentWidth(1.0f);
        bar.setPercentHeight(1.0f);
        bar.setJustifyContent(ARKUI_FLEX_ALIGNMENT_END);
        bar.setHitTestBehavior(ARKUI_HIT_TEST_MODE_TRANSPARENT);
    }

    m_buttonsRowHandle = g_nodeAPI->createNode(ARKUI_NODE_ROW);

    {
        A2UIRowNode btnRow(m_buttonsRowHandle);
        btnRow.setPercentWidth(1.0f);
        btnRow.setHeight(96.0f);
        btnRow.setBackgroundColor(0xAA000000);
        btnRow.setJustifyContent(ARKUI_FLEX_ALIGNMENT_CENTER);
        btnRow.setAlignItems(ARKUI_VERTICAL_ALIGNMENT_CENTER);
    }

    m_rewindBtnHandle = g_nodeAPI->createNode(ARKUI_NODE_TEXT);
    {
        A2UITextNode btn(m_rewindBtnHandle);
        btn.setTextContent("\xe2\x8f\xaa");
        btn.setFontSize(48.0f);
        btn.setFontColor(kColorWhite);
        btn.setWidth(96.0f);
        btn.setHeight(96.0f);
        btn.setTextAlign(ARKUI_TEXT_ALIGNMENT_CENTER);
        btn.setMargin(0.0f, 32.0f, 0.0f, 32.0f);
    }
    g_nodeAPI->addNodeEventReceiver(m_rewindBtnHandle, onRewindBtnClickEvent);
    g_nodeAPI->registerNodeEvent(m_rewindBtnHandle, NODE_ON_CLICK, 0, this);

    m_playPauseBtnHandle = g_nodeAPI->createNode(ARKUI_NODE_TEXT);
    {
        A2UITextNode btn(m_playPauseBtnHandle);
        btn.setTextContent("\xe2\x96\xb6");
        btn.setFontSize(48.0f);
        btn.setFontColor(kColorWhite);
        btn.setWidth(96.0f);
        btn.setHeight(96.0f);
        btn.setTextAlign(ARKUI_TEXT_ALIGNMENT_CENTER);
        btn.setMargin(0.0f, 32.0f, 0.0f, 32.0f);
    }
    g_nodeAPI->addNodeEventReceiver(m_playPauseBtnHandle, onPlayPauseBtnClickEvent);
    g_nodeAPI->registerNodeEvent(m_playPauseBtnHandle, NODE_ON_CLICK, 0, this);

    m_forwardBtnHandle = g_nodeAPI->createNode(ARKUI_NODE_TEXT);
    {
        A2UITextNode btn(m_forwardBtnHandle);
        btn.setTextContent("\xe2\x8f\xa9");
        btn.setFontSize(48.0f);
        btn.setFontColor(kColorWhite);
        btn.setWidth(96.0f);
        btn.setHeight(96.0f);
        btn.setTextAlign(ARKUI_TEXT_ALIGNMENT_CENTER);
        btn.setMargin(0.0f, 32.0f, 0.0f, 32.0f);
    }
    g_nodeAPI->addNodeEventReceiver(m_forwardBtnHandle, onForwardBtnClickEvent);
    g_nodeAPI->registerNodeEvent(m_forwardBtnHandle, NODE_ON_CLICK, 0, this);

    g_nodeAPI->addChild(m_buttonsRowHandle, m_rewindBtnHandle);
    g_nodeAPI->addChild(m_buttonsRowHandle, m_playPauseBtnHandle);
    g_nodeAPI->addChild(m_buttonsRowHandle, m_forwardBtnHandle);

    m_controlsRowHandle = g_nodeAPI->createNode(ARKUI_NODE_ROW);

    {
        A2UIRowNode row(m_controlsRowHandle);
        row.setPercentWidth(1.0f);
        row.setHeight(64.0f);
        row.setBackgroundColor(0xAA000000);
        row.setPadding(0.0f, 16.0f, 8.0f, 16.0f);
        row.setAlignItems(ARKUI_VERTICAL_ALIGNMENT_CENTER);
    }

    m_currentTimeHandle = g_nodeAPI->createNode(ARKUI_NODE_TEXT);
    {
        A2UITextNode t(m_currentTimeHandle);
        t.setTextContent("00:00");
        t.setFontSize(24.0f);
        t.setFontColor(kColorWhite);
        t.setMargin(0.0f, 8.0f, 0.0f, 0.0f);
    }

    m_sliderHandle = g_nodeAPI->createNode(ARKUI_NODE_SLIDER);
    {
        A2UISliderNode slider(m_sliderHandle);
        slider.setMinValue(0.0f);
        slider.setMaxValue(100.0f);
        slider.setValue(0.0f);
        slider.setLayoutWeight(1.0f);
        slider.setHeight(48.0f);
    }
    g_nodeAPI->addNodeEventReceiver(m_sliderHandle, onSliderChangeEvent);
    g_nodeAPI->registerNodeEvent(m_sliderHandle, NODE_SLIDER_EVENT_ON_CHANGE, 0, this);

    m_totalTimeHandle = g_nodeAPI->createNode(ARKUI_NODE_TEXT);
    {
        A2UITextNode t(m_totalTimeHandle);
        t.setTextContent("00:00");
        t.setFontSize(24.0f);
        t.setFontColor(kColorWhite);
        t.setMargin(0.0f, 0.0f, 0.0f, 8.0f);
    }

    g_nodeAPI->addChild(m_controlsRowHandle, m_currentTimeHandle);
    g_nodeAPI->addChild(m_controlsRowHandle, m_sliderHandle);
    g_nodeAPI->addChild(m_controlsRowHandle, m_totalTimeHandle);

    g_nodeAPI->addChild(m_controlsBarHandle, m_buttonsRowHandle);
    g_nodeAPI->addChild(m_controlsBarHandle, m_controlsRowHandle);

    g_nodeAPI->addChild(m_nodeHandle, m_controlsBarHandle);

    hideControlsBar();

    HM_LOGI( "Controls bar created (2-row layout), id=%s", m_id.c_str());
}

void VideoComponent::destroyControlsBar() {
    if (m_rewindBtnHandle) {
        g_nodeAPI->unregisterNodeEvent(m_rewindBtnHandle, NODE_ON_CLICK);
    }
    if (m_playPauseBtnHandle) {
        g_nodeAPI->unregisterNodeEvent(m_playPauseBtnHandle, NODE_ON_CLICK);
    }
    if (m_forwardBtnHandle) {
        g_nodeAPI->unregisterNodeEvent(m_forwardBtnHandle, NODE_ON_CLICK);
    }
    if (m_sliderHandle) {
        g_nodeAPI->unregisterNodeEvent(m_sliderHandle, NODE_SLIDER_EVENT_ON_CHANGE);
    }

    if (m_buttonsRowHandle) {
        if (m_rewindBtnHandle) {
            g_nodeAPI->removeChild(m_buttonsRowHandle, m_rewindBtnHandle);
            g_nodeAPI->disposeNode(m_rewindBtnHandle);
            m_rewindBtnHandle = nullptr;
        }
        if (m_playPauseBtnHandle) {
            g_nodeAPI->removeChild(m_buttonsRowHandle, m_playPauseBtnHandle);
            g_nodeAPI->disposeNode(m_playPauseBtnHandle);
            m_playPauseBtnHandle = nullptr;
        }
        if (m_forwardBtnHandle) {
            g_nodeAPI->removeChild(m_buttonsRowHandle, m_forwardBtnHandle);
            g_nodeAPI->disposeNode(m_forwardBtnHandle);
            m_forwardBtnHandle = nullptr;
        }
    }

    if (m_controlsRowHandle) {
        if (m_currentTimeHandle) {
            g_nodeAPI->removeChild(m_controlsRowHandle, m_currentTimeHandle);
            g_nodeAPI->disposeNode(m_currentTimeHandle);
            m_currentTimeHandle = nullptr;
        }
        if (m_sliderHandle) {
            g_nodeAPI->removeChild(m_controlsRowHandle, m_sliderHandle);
            g_nodeAPI->disposeNode(m_sliderHandle);
            m_sliderHandle = nullptr;
        }
        if (m_totalTimeHandle) {
            g_nodeAPI->removeChild(m_controlsRowHandle, m_totalTimeHandle);
            g_nodeAPI->disposeNode(m_totalTimeHandle);
            m_totalTimeHandle = nullptr;
        }
    }

    if (m_controlsBarHandle) {
        if (m_buttonsRowHandle) {
            g_nodeAPI->removeChild(m_controlsBarHandle, m_buttonsRowHandle);
            g_nodeAPI->disposeNode(m_buttonsRowHandle);
            m_buttonsRowHandle = nullptr;
        }
        if (m_controlsRowHandle) {
            g_nodeAPI->removeChild(m_controlsBarHandle, m_controlsRowHandle);
            g_nodeAPI->disposeNode(m_controlsRowHandle);
            m_controlsRowHandle = nullptr;
        }
        if (m_nodeHandle) {
            g_nodeAPI->removeChild(m_nodeHandle, m_controlsBarHandle);
        }
        g_nodeAPI->disposeNode(m_controlsBarHandle);
        m_controlsBarHandle = nullptr;
    }
}

void VideoComponent::toggleControlsBar() {
    if (m_controlsBarVisible) {
        hideControlsBar();
    } else {
        showControlsBar();
    }
}

void VideoComponent::showControlsBar() {
    if (!m_controls || !m_controlsBarHandle) return;

    updateControlsBarLayout();
    A2UINode(m_controlsBarHandle).setVisibility(ARKUI_VISIBILITY_VISIBLE);

    m_controlsBarVisible = true;
    m_controlsShowTime = std::chrono::steady_clock::now();

    updatePlayPauseButton();
    updateProgressDisplay();

    HM_LOGI( "id=%s", m_id.c_str());
}

void VideoComponent::hideControlsBar() {
    if (!m_controlsBarHandle) return;

    A2UINode(m_controlsBarHandle).setVisibility(ARKUI_VISIBILITY_HIDDEN);

    m_controlsBarVisible = false;
}

void VideoComponent::updateControlsBarLayout() {
    if (!m_controlsBarHandle || !m_buttonsRowHandle || !m_controlsRowHandle ||
        !m_rewindBtnHandle || !m_playPauseBtnHandle || !m_forwardBtnHandle ||
        !m_currentTimeHandle || !m_sliderHandle || !m_totalTimeHandle) {
        return;
    }

    const float componentWidth = getWidth();
    const float componentHeight = getHeight();
    if (componentWidth <= 0.0f || componentHeight <= 0.0f) {
        return;
    }

    constexpr float kBaseButtonsTotalWidth = 480.0f;
    constexpr float kBaseControlsTotalHeight = 160.0f;
    const float scale = std::max(
        0.2f,
        std::min({1.0f,
                  componentWidth / kBaseButtonsTotalWidth,
                  componentHeight / kBaseControlsTotalHeight}));

    const float buttonSize = 96.0f * scale;
    const float buttonFontSize = 48.0f * scale;
    const float buttonHorizontalMargin = 32.0f * scale;
    const float buttonRowHeight = 96.0f * scale;

    const float progressRowHeight = 64.0f * scale;
    const float progressPaddingRight = 16.0f * scale;
    const float progressPaddingBottom = 8.0f * scale;
    const float progressPaddingLeft = 16.0f * scale;
    const float timeFontSize = 24.0f * scale;
    const float currentTimeMarginRight = 8.0f * scale;
    const float totalTimeMarginLeft = 8.0f * scale;
    const float sliderHeight = 48.0f * scale;

    {
        A2UIRowNode buttonsRow(m_buttonsRowHandle);
        buttonsRow.setHeight(buttonRowHeight);
    }

    auto updateButton = [&](ArkUI_NodeHandle handle) {
        A2UITextNode btn(handle);
        btn.setFontSize(buttonFontSize);
        btn.setWidth(buttonSize);
        btn.setHeight(buttonSize);
        btn.setMargin(0.0f, buttonHorizontalMargin, 0.0f, buttonHorizontalMargin);
    };
    updateButton(m_rewindBtnHandle);
    updateButton(m_playPauseBtnHandle);
    updateButton(m_forwardBtnHandle);

    {
        A2UIRowNode progressRow(m_controlsRowHandle);
        progressRow.setHeight(progressRowHeight);
        progressRow.setPadding(0.0f, progressPaddingRight, progressPaddingBottom, progressPaddingLeft);
    }

    {
        A2UITextNode currentTime(m_currentTimeHandle);
        currentTime.setFontSize(timeFontSize);
        currentTime.setMargin(0.0f, currentTimeMarginRight, 0.0f, 0.0f);
    }

    {
        A2UISliderNode slider(m_sliderHandle);
        slider.setHeight(sliderHeight);
    }

    {
        A2UITextNode totalTime(m_totalTimeHandle);
        totalTime.setFontSize(timeFontSize);
        totalTime.setMargin(0.0f, 0.0f, 0.0f, totalTimeMarginLeft);
    }
}

void VideoComponent::updatePlayPauseButton() {
    if (!m_playPauseBtnHandle) return;

    const char* btnText = m_isPlaying ? "\xe2\x8f\xb8" : "\xe2\x96\xb6";
    A2UITextNode(m_playPauseBtnHandle).setTextContent(btnText);
}

void VideoComponent::updateProgressDisplay() {
    if (!m_currentTimeHandle || !m_totalTimeHandle || !m_sliderHandle) return;

    A2UITextNode(m_currentTimeHandle).setTextContent(formatTime(m_currentPosition));
    A2UITextNode(m_totalTimeHandle).setTextContent(formatTime(m_duration));

    if (!m_isSeeking) {
        if (m_duration > 0) {
            A2UISliderNode(m_sliderHandle).setMaxValue(static_cast<float>(m_duration));
        }

        A2UISliderNode(m_sliderHandle).setValue(static_cast<float>(m_currentPosition));
    }
}

std::string VideoComponent::formatTime(int64_t milliseconds) {
    if (milliseconds <= 0) return "00:00";

    int64_t totalSeconds = milliseconds / 1000;
    int64_t minutes = totalSeconds / 60;
    int64_t seconds = totalSeconds % 60;

    std::ostringstream stream;
    if (minutes >= 60) {
        int64_t hours = minutes / 60;
        minutes = minutes % 60;
        stream << std::setw(2) << std::setfill('0') << hours << ":";
    }
    stream << std::setw(2) << std::setfill('0') << minutes << ":"
           << std::setw(2) << std::setfill('0') << seconds;
    return stream.str();
}


void VideoComponent::onVideoAreaClickEvent(ArkUI_NodeEvent* event) {
    void* userData = OH_ArkUI_NodeEvent_GetUserData(event);
    if (!userData) return;

    VideoComponent* self = static_cast<VideoComponent*>(userData);
    HM_LOGI( "id=%s", self->m_id.c_str());
    self->toggleControlsBar();
}

void VideoComponent::onRewindBtnClickEvent(ArkUI_NodeEvent* event) {
    void* userData = OH_ArkUI_NodeEvent_GetUserData(event);
    if (!userData) return;

    VideoComponent* self = static_cast<VideoComponent*>(userData);
    if (!self->m_avPlayer) return;

    int32_t targetPosition = static_cast<int32_t>(self->m_currentPosition) - kSeekStepMs;
    if (targetPosition < 0) targetPosition = 0;

    OH_AVPlayer_Seek(self->m_avPlayer, targetPosition, AV_SEEK_NEXT_SYNC);
    self->m_currentPosition = targetPosition;
    self->updateProgressDisplay();

    self->m_controlsShowTime = std::chrono::steady_clock::now();

    HM_LOGI( "Rewind to %d ms, id=%s",
                targetPosition, self->m_id.c_str());
}

void VideoComponent::onPlayPauseBtnClickEvent(ArkUI_NodeEvent* event) {
    void* userData = OH_ArkUI_NodeEvent_GetUserData(event);
    if (!userData) return;

    VideoComponent* self = static_cast<VideoComponent*>(userData);
    HM_LOGI( "isPlaying=%d, id=%s",
                self->m_isPlaying ? 1 : 0, self->m_id.c_str());

    if (self->m_isPlaying) {
        self->pause();
    } else {
        if (self->m_videoCurrentState == "completed") {
            OH_AVPlayer_Seek(self->m_avPlayer, 0, AV_SEEK_NEXT_SYNC);
        }
        self->play();
    }

    self->updatePlayPauseButton();

    self->m_controlsShowTime = std::chrono::steady_clock::now();
}

void VideoComponent::onForwardBtnClickEvent(ArkUI_NodeEvent* event) {
    void* userData = OH_ArkUI_NodeEvent_GetUserData(event);
    if (!userData) return;

    VideoComponent* self = static_cast<VideoComponent*>(userData);
    if (!self->m_avPlayer) return;

    int32_t targetPosition = static_cast<int32_t>(self->m_currentPosition) + kSeekStepMs;
    if (self->m_duration > 0 && targetPosition > static_cast<int32_t>(self->m_duration)) {
        targetPosition = static_cast<int32_t>(self->m_duration);
    }

    OH_AVPlayer_Seek(self->m_avPlayer, targetPosition, AV_SEEK_NEXT_SYNC);
    self->m_currentPosition = targetPosition;
    self->updateProgressDisplay();

    self->m_controlsShowTime = std::chrono::steady_clock::now();

    HM_LOGI( "Forward to %d ms, id=%s",
                targetPosition, self->m_id.c_str());
}

void VideoComponent::onSliderChangeEvent(ArkUI_NodeEvent* event) {
    void* userData = OH_ArkUI_NodeEvent_GetUserData(event);
    if (!userData) return;

    VideoComponent* self = static_cast<VideoComponent*>(userData);

    ArkUI_NodeComponentEvent* nodeEvent = OH_ArkUI_NodeEvent_GetNodeComponentEvent(event);
    if (!nodeEvent) return;

    float sliderValue = nodeEvent->data[0].f32;
    int32_t dragState = nodeEvent->data[1].i32;

    // dragState: 0=BEGIN, 1=MOVING, 2=END, 3=CLICK
    if (dragState == 0) {
        self->m_isSeeking = true;
        HM_LOGI( "Seek BEGIN, value=%f", sliderValue);
    } else if (dragState == 1) {
        self->m_currentPosition = static_cast<int64_t>(sliderValue);
        A2UITextNode(self->m_currentTimeHandle).setTextContent(formatTime(self->m_currentPosition));
    } else if (dragState == 2 || dragState == 3) {
        self->m_isSeeking = false;
        int32_t seekPosition = static_cast<int32_t>(sliderValue);
        if (self->m_avPlayer) {
            OH_AVPlayer_Seek(self->m_avPlayer, seekPosition, AV_SEEK_NEXT_SYNC);
            HM_LOGI( "Seek to %d ms, id=%s",
                        seekPosition, self->m_id.c_str());
        }
        self->m_currentPosition = static_cast<int64_t>(sliderValue);
        self->updateProgressDisplay();
    }

    self->m_controlsShowTime = std::chrono::steady_clock::now();
}

} // namespace a2ui

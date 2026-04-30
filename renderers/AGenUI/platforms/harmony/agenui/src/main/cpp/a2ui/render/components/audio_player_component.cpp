#include "audio_player_component.h"

#include "log/a2ui_capi_log.h"
#include "../../measure/a2ui_platform_layout_bridge.h"
#include "../../utils/a2ui_color_palette.h"
#include "../a2ui_node.h"

#include <string>
#include <napi/native_api.h>

// Global threadsafe function created in napi_init.cpp;
// used here to hop back to the main thread from AVPlayer worker callbacks.
extern napi_threadsafe_function a2ui_get_main_tsfn();

extern const std::string& a2ui_get_files_dir();

namespace a2ui {

using colors::kColorTransparent;
using colors::kColorShadow20;

namespace {

constexpr const char* kPlayIconFileName = "audio_play.svg";
constexpr const char* kPauseIconFileName = "audio_pause.svg";
constexpr const char* kLoadingRingFileName = "audio_loading_ring.svg";
constexpr float kProgressTotal = 100.0f;

float parseStyleDimension(const nlohmann::json& styles, const char* key, float fallbackValue) {
    if (!styles.is_object() || !styles.contains(key)) {
        return fallbackValue;
    }

    const auto& value = styles[key];
    try {
        if (value.is_number()) {
            return value.get<float>();
        }
        if (value.is_string()) {
            return std::stof(value.get<std::string>());
        }
    } catch (...) {
        HM_LOGW("AudioPlayerComponent parseStyleNumber: invalid value for '%s', using fallback %f", key, fallbackValue);
    }

    return fallbackValue;
}

std::string buildAudioIconSrc(const char* fileName) {
    const std::string& filesDir = a2ui_get_files_dir();
    if (filesDir.empty()) {
        return std::string();
    }
    return "file://" + filesDir + "/data/icons/" + fileName;
}

float clampProgress(float value) {
    if (value < 0.0f) {
        return 0.0f;
    }
    if (value > 1.0f) {
        return 1.0f;
    }
    return value;
}

} // namespace

AudioPlayerComponent::AudioPlayerComponent(const std::string& id, const nlohmann::json& properties)
    : A2UIComponent(id, "AudioPlayer") {
    m_nodeHandle = g_nodeAPI->createNode(ARKUI_NODE_STACK);

    loadStyleConfig();

    {
        A2UINode node(m_nodeHandle);
        node.setWidth(m_size);
        node.setHeight(m_size);
        node.setMargin(0.0f, 0.0f, 0.0f, 0.0f);
        node.setBorderRadius(m_size * 0.5f);
        node.setClip(true);
        node.setCustomShadow(8.0f, 0.0f, 2.0f, kColorShadow20);
    }

    createUI();

    m_avPlayer = OH_AVPlayer_Create();
    if (m_avPlayer) {
        OH_AVPlayer_SetOnInfoCallback(m_avPlayer, onPlayerInfoCallback, this);
        OH_AVPlayer_SetOnErrorCallback(m_avPlayer, onPlayerErrorCallback, this);
        HM_LOGI("AudioPlayerComponent - AVPlayer created, id=%s", id.c_str());
    } else {
        HM_LOGE("AudioPlayerComponent - Failed to create AVPlayer, id=%s", id.c_str());
    }

    if (!properties.is_null() && properties.is_object()) {
        for (auto it = properties.begin(); it != properties.end(); ++it) {
            m_properties[it.key()] = it.value();
        }
    }

    applyVisualState();
    HM_LOGI("AudioPlayerComponent - Created: id=%s", id.c_str());
}

AudioPlayerComponent::~AudioPlayerComponent() {
    HM_LOGI("AudioPlayerComponent - Destroying: id=%s", m_id.c_str());
    releasePlayer();
    destroyUI();
    HM_LOGI("AudioPlayerComponent - Destroyed: id=%s", m_id.c_str());
}

void AudioPlayerComponent::destroy() {
    releasePlayer();
    destroyUI();
    A2UIComponent::destroy();
}

void AudioPlayerComponent::onUpdateProperties(const nlohmann::json& properties) {
    if (!m_nodeHandle) {
        HM_LOGE("handle is null, id=%s", m_id.c_str());
        return;
    }

    if (properties.contains("description") && properties["description"].is_string()) {
        m_description = properties["description"].get<std::string>();
    }

    if (properties.contains("url") && properties["url"].is_string()) {
        std::string newUrl = properties["url"].get<std::string>();
        if (!newUrl.empty()) {
            setAudioUrl(newUrl);
        }
    }

    applyVisualState();
    HM_LOGI("url=%s, id=%s",
            m_audioUrl.c_str(), m_id.c_str());
}

void AudioPlayerComponent::onPlayerInfoCallback(OH_AVPlayer* player, AVPlayerOnInfoType type,
                                                OH_AVFormat* infoBody, void* userData) {
    AudioPlayerComponent* self = reinterpret_cast<AudioPlayerComponent*>(userData);
    if (!self || !player) {
        return;
    }

    switch (type) {
    case AV_INFO_TYPE_STATE_CHANGE: {
        int32_t state = -1;
        int32_t stateChangeReason = -1;
        OH_AVFormat_GetIntValue(infoBody, OH_PLAYER_STATE, &state);
        OH_AVFormat_GetIntValue(infoBody, OH_PLAYER_STATE_CHANGE_REASON, &stateChangeReason);
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
            if (self->m_audioCurrentState == "playing") {
                self->updateProgressRing();
            }
        });
        break;
    }
    case AV_INFO_TYPE_DURATION_UPDATE: {
        int64_t duration = -1;
        OH_AVFormat_GetLongValue(infoBody, OH_PLAYER_DURATION, &duration);
        int64_t capturedDuration = duration;
        HM_LOGI("AudioPlayerComponent - Duration: %lld ms, id=%s",
                duration, self->m_id.c_str());
        postToMainThread([self, capturedDuration]() {
            if (!self->m_uiTasksEnabled.load()) return;
            self->m_duration = capturedDuration;
            if (self->m_audioCurrentState == "playing") {
                self->updateProgressRing();
            }
        });
        break;
    }
    default:
        break;
    }
}

void AudioPlayerComponent::onPlayerErrorCallback(OH_AVPlayer* player, int32_t errorCode,
                                                 const char* errorMsg, void* userData) {
    AudioPlayerComponent* self = reinterpret_cast<AudioPlayerComponent*>(userData);
    if (!self) {
        return;
    }

    std::string capturedMsg = errorMsg ? errorMsg : "unknown";
    HM_LOGE("AudioPlayerComponent - Player error: code=%d, msg=%s, id=%s",
            errorCode, capturedMsg.c_str(), self->m_id.c_str());
    postToMainThread([self, capturedMsg]() {
        if (!self->m_uiTasksEnabled.load()) return;
        self->m_audioCurrentState = "error";
        self->m_isPlaying = false;
        self->m_pendingPlay = false;
        self->applyVisualState();
    });
}

void AudioPlayerComponent::loadStyleConfig() {
    const nlohmann::json styles = getComponentStylesFor("AudioPlayer");
    if (styles.is_null() || !styles.is_object()) {
        return;
    }

    m_size = parseStyleDimension(styles, "size", m_size);
    m_playIconSize = parseStyleDimension(styles, "play-icon-size", m_playIconSize);
    m_pauseIconSize = parseStyleDimension(styles, "pause-icon-size", m_pauseIconSize);
    m_ringWidth = parseStyleDimension(styles, "ring-width", m_ringWidth);

    if (styles.contains("play-bg-color") && styles["play-bg-color"].is_string()) {
        m_playBgColor = parseColor(styles["play-bg-color"].get<std::string>());
    }
    if (styles.contains("pause-bg-color") && styles["pause-bg-color"].is_string()) {
        m_pauseBgColor = parseColor(styles["pause-bg-color"].get<std::string>());
    }
    if (styles.contains("ring-color") && styles["ring-color"].is_string()) {
        m_ringColor = parseColor(styles["ring-color"].get<std::string>());
    }
    if (styles.contains("play-icon-color") && styles["play-icon-color"].is_string()) {
        m_playIconColor = parseColor(styles["play-icon-color"].get<std::string>());
    }
    if (styles.contains("pause-icon-color") && styles["pause-icon-color"].is_string()) {
        m_pauseIconColor = parseColor(styles["pause-icon-color"].get<std::string>());
    }
    if (styles.contains("loading-color") && styles["loading-color"].is_string()) {
        m_loadingColor = parseColor(styles["loading-color"].get<std::string>());
    }
    if (styles.contains("error-bg-color") && styles["error-bg-color"].is_string()) {
        m_errorBgColor = parseColor(styles["error-bg-color"].get<std::string>());
    }
}

void AudioPlayerComponent::setAudioUrl(const std::string& url) {
    HM_LOGI("url=%s, id=%s", url.c_str(), m_id.c_str());

    if (m_audioUrl == url) {
        return;
    }

    m_audioUrl = url;
    m_currentPosition = 0;
    m_duration = 0;
    m_isPlaying = false;
    m_pendingPlay = false;

    if (!m_avPlayer) {
        return;
    }

    if (m_audioCurrentState == "playing" || m_audioCurrentState == "paused" ||
        m_audioCurrentState == "prepared" || m_audioCurrentState == "completed" ||
        m_audioCurrentState == "error") {
        OH_AVPlayer_Reset(m_avPlayer);
    }

    m_audioCurrentState = "preparing";
    applyVisualState();

    OH_AVErrCode errCode = handleAudioPrepare(url);
    if (errCode != AV_ERR_OK) {
        m_audioCurrentState = "error";
        applyVisualState();
    }
}

OH_AVErrCode AudioPlayerComponent::handleAudioPrepare(const std::string& url) {
    if (!m_avPlayer || url.empty()) {
        HM_LOGW("Not ready: avPlayer=%p, url=%s",
                m_avPlayer, url.c_str());
        return AV_ERR_INVALID_VAL;
    }

    HM_LOGI("Starting: url=%s, id=%s",
            url.c_str(), m_id.c_str());

    OH_AVErrCode errCode = OH_AVPlayer_SetURLSource(m_avPlayer, url.c_str());
    if (errCode != AV_ERR_OK) {
        HM_LOGE("SetURLSource failed: %d", errCode);
        return errCode;
    }

    errCode = OH_AVPlayer_Prepare(m_avPlayer);
    if (errCode != AV_ERR_OK) {
        HM_LOGE("Prepare failed: %d", errCode);
        return errCode;
    }

    HM_LOGI("Success, id=%s", m_id.c_str());
    return errCode;
}

void AudioPlayerComponent::handleStateChange(AVPlayerState state, int32_t stateChangeReason) {
    (void)stateChangeReason;

    switch (state) {
    case AV_IDLE:
        m_audioCurrentState = "idle";
        m_isPlaying = false;
        m_pendingPlay = false;
        HM_LOGI("AudioPlayerComponent - State: IDLE, id=%s", m_id.c_str());
        break;

    case AV_INITIALIZED:
        m_audioCurrentState = "preparing";
        m_isPlaying = false;
        HM_LOGI("AudioPlayerComponent - State: INITIALIZED, id=%s", m_id.c_str());
        break;

    case AV_PREPARED:
        m_audioCurrentState = "prepared";
        m_isPlaying = false;
        HM_LOGI("AudioPlayerComponent - State: PREPARED, pendingPlay=%d, id=%s",
                m_pendingPlay ? 1 : 0, m_id.c_str());
        if (m_pendingPlay) {
            m_pendingPlay = false;
            OH_AVErrCode playErr = play();
            if (playErr != AV_ERR_OK) {
                HM_LOGE("AudioPlayerComponent - PendingPlay failed: %d, id=%s",
                        playErr, m_id.c_str());
                m_audioCurrentState = "error";
            }
        }
        break;

    case AV_PLAYING:
        m_audioCurrentState = "playing";
        m_isPlaying = true;
        HM_LOGI("AudioPlayerComponent - State: PLAYING, id=%s", m_id.c_str());
        break;

    case AV_PAUSED:
        m_audioCurrentState = "paused";
        m_isPlaying = false;
        HM_LOGI("AudioPlayerComponent - State: PAUSED, id=%s", m_id.c_str());
        break;

    case AV_STOPPED:
        m_audioCurrentState = "stopped";
        m_isPlaying = false;
        m_currentPosition = 0;
        HM_LOGI("AudioPlayerComponent - State: STOPPED, id=%s", m_id.c_str());
        break;

    case AV_COMPLETED:
        m_audioCurrentState = "completed";
        m_isPlaying = false;
        m_currentPosition = 0;
        HM_LOGI("AudioPlayerComponent - State: COMPLETED, id=%s", m_id.c_str());
        break;

    case AV_RELEASED:
        m_audioCurrentState = "destroyed";
        m_isPlaying = false;
        HM_LOGI("AudioPlayerComponent - State: RELEASED, id=%s", m_id.c_str());
        break;

    case AV_ERROR:
        m_audioCurrentState = "error";
        m_isPlaying = false;
        m_pendingPlay = false;
        HM_LOGE("AudioPlayerComponent - State: ERROR, id=%s", m_id.c_str());
        break;

    default:
        break;
    }

    applyVisualState();
}

OH_AVErrCode AudioPlayerComponent::play() {
    if (!m_avPlayer) {
        return AV_ERR_INVALID_VAL;
    }
    OH_AVErrCode code = OH_AVPlayer_Play(m_avPlayer);
    HM_LOGI("result=%d, id=%s", code, m_id.c_str());
    return code;
}

OH_AVErrCode AudioPlayerComponent::pause() {
    if (!m_avPlayer) {
        return AV_ERR_INVALID_VAL;
    }
    OH_AVErrCode code = OH_AVPlayer_Pause(m_avPlayer);
    HM_LOGI("result=%d, id=%s", code, m_id.c_str());
    return code;
}

OH_AVErrCode AudioPlayerComponent::stop() {
    if (!m_avPlayer) {
        return AV_ERR_INVALID_VAL;
    }
    OH_AVErrCode code = OH_AVPlayer_Stop(m_avPlayer);
    HM_LOGI("result=%d, id=%s", code, m_id.c_str());
    return code;
}

void AudioPlayerComponent::releasePlayer() {
    if (m_avPlayer) {
        m_uiTasksEnabled.store(false);   // Block any in-flight main-thread tasks from touching nodes
        OH_AVPlayer_SetOnInfoCallback(m_avPlayer, nullptr, nullptr);
        OH_AVPlayer_SetOnErrorCallback(m_avPlayer, nullptr, nullptr);

        OH_AVErrCode code = OH_AVPlayer_Release(m_avPlayer);
        HM_LOGI("result=%d, id=%s", code, m_id.c_str());
        m_avPlayer = nullptr;
    }

    m_isPlaying = false;
    m_pendingPlay = false;
    m_audioCurrentState = "destroyed";
}

// ---- postToMainThread implementation ----
void AudioPlayerComponent::postToMainThread(std::function<void()> task) {
    napi_threadsafe_function tsfn = a2ui_get_main_tsfn();
    if (!tsfn) {
        HM_LOGE("[AudioPlayerComponent::postToMainThread] g_mainTsfn is null, dropping UI task");
        return;
    }
    using Task = std::function<void(napi_env)>;
    auto* wrapper = new Task([t = std::move(task)](napi_env /*env*/) { t(); });
    napi_status status = napi_call_threadsafe_function(tsfn, wrapper, napi_tsfn_nonblocking);
    if (status != napi_ok) {
        HM_LOGE("[AudioPlayerComponent::postToMainThread] napi_call_threadsafe_function failed, status=%d", status);
        delete wrapper;
    }
}

void AudioPlayerComponent::createUI() {
    m_ringHandle = g_nodeAPI->createNode(ARKUI_NODE_PROGRESS);
    m_loadingHandle = g_nodeAPI->createNode(ARKUI_NODE_IMAGE);
    m_iconContainerHandle = g_nodeAPI->createNode(ARKUI_NODE_STACK);
    m_iconHandle = g_nodeAPI->createNode(ARKUI_NODE_IMAGE);

    {
        A2UIProgressNode ring(m_ringHandle);
        ring.setWidth(m_size);
        ring.setHeight(m_size);
        ring.setPosition(0.0f, 0.0f);
        ring.setTotal(kProgressTotal);
        ring.setValue(0.0f);
        ring.setColor(m_ringColor);
        ring.setType(ARKUI_PROGRESS_TYPE_SCALE_RING);
        ring.setOpacity(0.0f);
        ring.setHitTestBehavior(ARKUI_HIT_TEST_MODE_NONE);
    }

    {
        A2UIImageNode loading(m_loadingHandle);
        loading.setWidth(m_size);
        loading.setHeight(m_size);
        loading.setPosition(0.0f, 0.0f);
        loading.setObjectFitFill();
        loading.setHitTestBehavior(ARKUI_HIT_TEST_MODE_NONE);
        loading.setSrc(buildAudioIconSrc(kLoadingRingFileName));
        A2UINode(m_loadingHandle).setOpacity(0.0f);
        A2UINode(m_loadingHandle).setTransformCenterPercent(0.5f, 0.5f);
    }

    {
        A2UINode iconContainer(m_iconContainerHandle);
        iconContainer.setWidth(m_size);
        iconContainer.setHeight(m_size);
        iconContainer.setPosition(0.0f, 0.0f);
        iconContainer.setHitTestBehavior(ARKUI_HIT_TEST_MODE_NONE);
    }

    {
        A2UIImageNode icon(m_iconHandle);
        icon.setWidth(m_playIconSize);
        icon.setHeight(m_playIconSize);
        icon.setObjectFitFill();
        icon.setHitTestBehavior(ARKUI_HIT_TEST_MODE_NONE);
        icon.setSrc(buildAudioIconSrc(kPlayIconFileName));
        icon.setFillColor(m_playIconColor);
    }

    g_nodeAPI->addChild(m_nodeHandle, m_ringHandle);
    g_nodeAPI->addChild(m_nodeHandle, m_loadingHandle);
    g_nodeAPI->addChild(m_iconContainerHandle, m_iconHandle);
    g_nodeAPI->addChild(m_nodeHandle, m_iconContainerHandle);

    g_nodeAPI->addNodeEventReceiver(m_nodeHandle, onPlayPauseBtnClickEvent);
    g_nodeAPI->registerNodeEvent(m_nodeHandle, NODE_ON_CLICK, 0, this);

    HM_LOGI("UI created, id=%s", m_id.c_str());
}

void AudioPlayerComponent::destroyUI() {
    if (m_nodeHandle) {
        g_nodeAPI->unregisterNodeEvent(m_nodeHandle, NODE_ON_CLICK);
    }

    if (m_nodeHandle && m_ringHandle) {
        g_nodeAPI->removeChild(m_nodeHandle, m_ringHandle);
        g_nodeAPI->disposeNode(m_ringHandle);
        m_ringHandle = nullptr;
    }

    if (m_nodeHandle && m_loadingHandle) {
        g_nodeAPI->removeChild(m_nodeHandle, m_loadingHandle);
        g_nodeAPI->disposeNode(m_loadingHandle);
        m_loadingHandle = nullptr;
    }

    if (m_iconContainerHandle && m_iconHandle) {
        g_nodeAPI->removeChild(m_iconContainerHandle, m_iconHandle);
        g_nodeAPI->disposeNode(m_iconHandle);
        m_iconHandle = nullptr;
    }

    if (m_nodeHandle && m_iconContainerHandle) {
        g_nodeAPI->removeChild(m_nodeHandle, m_iconContainerHandle);
        g_nodeAPI->disposeNode(m_iconContainerHandle);
        m_iconContainerHandle = nullptr;
    }

    HM_LOGI("UI destroyed, id=%s", m_id.c_str());
}

void AudioPlayerComponent::updateProgressRing() {
    if (!m_ringHandle) {
        return;
    }

    float progress = 0.0f;
    if (m_duration > 0) {
        progress = clampProgress(static_cast<float>(m_currentPosition) /
                                 static_cast<float>(m_duration));
    }

    A2UIProgressNode ring(m_ringHandle);
    ring.setTotal(kProgressTotal);
    ring.setValue(progress * kProgressTotal);
}

void AudioPlayerComponent::applyVisualState() {
    if (!m_nodeHandle || !m_ringHandle || !m_loadingHandle || !m_iconContainerHandle || !m_iconHandle) {
        return;
    }

    A2UINode node(m_nodeHandle);
    A2UIProgressNode ring(m_ringHandle);
    A2UIImageNode loading(m_loadingHandle);
    A2UINode iconContainer(m_iconContainerHandle);
    A2UIImageNode icon(m_iconHandle);

    node.setWidth(m_size);
    node.setHeight(m_size);
    node.setBorderRadius(m_size * 0.5f);
    node.setBorderWidth(0.0f, 0.0f, 0.0f, 0.0f);
    node.setBorderColor(kColorTransparent);
    node.setBorderStyle(ARKUI_BORDER_STYLE_SOLID);
    node.setBackgroundColor(m_playBgColor);
    node.setOpacity(1.0f);

    ring.setWidth(m_size);
    ring.setHeight(m_size);
    ring.setPosition(0.0f, 0.0f);
    ring.setTotal(kProgressTotal);
    ring.setValue(0.0f);
    ring.setColor(m_ringColor);
    ring.setType(ARKUI_PROGRESS_TYPE_SCALE_RING);
    ring.setOpacity(0.0f);

    loading.setWidth(m_size);
    loading.setHeight(m_size);
    loading.setPosition(0.0f, 0.0f);
    loading.setObjectFitFill();
    loading.setSrc(buildAudioIconSrc(kLoadingRingFileName));
    A2UINode(m_loadingHandle).setTransformCenterPercent(0.5f, 0.5f);
    A2UINode(m_loadingHandle).resetRotateTransition();
    A2UINode(m_loadingHandle).setRotate(0.0f, 0.0f, 1.0f, 0.0f);
    A2UINode(m_loadingHandle).setOpacity(0.0f);

    iconContainer.setWidth(m_size);
    iconContainer.setHeight(m_size);
    iconContainer.setPosition(0.0f, 0.0f);

    float iconSize = m_playIconSize;
    float iconOffsetX = 0.0f;
    if (m_audioCurrentState == "playing") {
        iconSize = m_pauseIconSize;
        iconOffsetX = 0.0f;
    } else {
        iconOffsetX = 3.0f;
    }
    float iconLeft = (m_size - iconSize) * 0.5f + iconOffsetX;
    float iconTop = (m_size - iconSize) * 0.5f;

    icon.setWidth(iconSize);
    icon.setHeight(iconSize);
    icon.setPosition(iconLeft, iconTop);
    icon.setObjectFitFill();
    icon.resetMargin();
    icon.setSrc(buildAudioIconSrc(kPlayIconFileName));
    icon.setFillColor(m_playIconColor);
    A2UINode(m_iconHandle).setOpacity(1.0f);

    if (m_audioCurrentState == "playing") {
        node.setBackgroundColor(m_pauseBgColor);
        ring.setType(ARKUI_PROGRESS_TYPE_SCALE_RING);
        ring.setColor(m_ringColor);
        ring.setOpacity(1.0f);
        updateProgressRing();
        icon.setSrc(buildAudioIconSrc(kPauseIconFileName));
        icon.setFillColor(m_pauseIconColor);
        return;
    }

    if (m_audioCurrentState == "preparing") {
        node.setBackgroundColor(m_pauseBgColor);
        A2UINode(m_loadingHandle).setOpacity(1.0f);
        A2UINode(m_loadingHandle).setRotateTransition(
            0.0f, 0.0f, 1.0f, -360.0f, 0.0f,
            1000, ARKUI_CURVE_LINEAR, 0, -1, ARKUI_ANIMATION_PLAY_MODE_NORMAL, 1.0f);
        A2UINode(m_loadingHandle).setRotate(0.0f, 0.0f, 1.0f, -360.0f);
        A2UINode(m_iconHandle).setOpacity(0.0f);
        return;
    }

    if (m_audioCurrentState == "error") {
        node.setBackgroundColor(m_errorBgColor);
        icon.setSrc(buildAudioIconSrc(kPlayIconFileName));
        icon.setFillColor(m_playIconColor);
        return;
    }

    if (m_audioCurrentState == "destroyed") {
        node.setOpacity(0.6f);
    }
}

void AudioPlayerComponent::onPlayPauseBtnClickEvent(ArkUI_NodeEvent* event) {
    void* userData = OH_ArkUI_NodeEvent_GetUserData(event);
    if (!userData) {
        return;
    }

    AudioPlayerComponent* self = static_cast<AudioPlayerComponent*>(userData);
    HM_LOGI("isPlaying=%d, state=%s, id=%s",
            self->m_isPlaying ? 1 : 0, self->m_audioCurrentState.c_str(), self->m_id.c_str());

    if (self->m_isPlaying) {
        self->pause();
        return;
    }

    if (self->m_audioCurrentState == "completed") {
        if (self->m_avPlayer) {
            OH_AVPlayer_Seek(self->m_avPlayer, 0, AV_SEEK_NEXT_SYNC);
        }
        self->m_currentPosition = 0;
        self->play();
        return;
    }

    if (self->m_audioCurrentState == "prepared" || self->m_audioCurrentState == "paused") {
        self->play();
        return;
    }

    if ((self->m_audioCurrentState.empty() || self->m_audioCurrentState == "idle") &&
        !self->m_audioUrl.empty() && self->m_avPlayer) {
        self->m_pendingPlay = true;
        self->m_audioCurrentState = "preparing";
        self->applyVisualState();
        self->handleAudioPrepare(self->m_audioUrl);
    }
}

} // namespace a2ui

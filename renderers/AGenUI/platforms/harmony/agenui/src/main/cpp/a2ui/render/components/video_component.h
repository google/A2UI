#pragma once

#include "../a2ui_component.h"
#include <string>
#include <mutex>
#include <atomic>
#include <chrono>
#include <functional>
#include <fcntl.h>
#include <sys/stat.h>
#include <unistd.h>
#include <ace/xcomponent/native_interface_xcomponent.h>
#include <multimedia/player_framework/avplayer.h>
#include <multimedia/player_framework/avplayer_base.h>
#include <multimedia/player_framework/native_averrors.h>

namespace a2ui {

/**
 * Video component backed by Harmony XComponent and AVPlayer.
 *
 * Supported properties:
 *   - url: video URL string
 *   - autoPlay: whether playback starts automatically, default false
 *   - controls: whether controls are shown, default true
 *
 * Node structure:
 *   ARKUI_NODE_STACK (root node with a black background)
 *     ├── ARKUI_NODE_XCOMPONENT (video rendering surface)
 *     └── ARKUI_NODE_COLUMN (bottom-aligned translucent controls container)
 *           ├── ARKUI_NODE_ROW (centered button row)
 *           │     ├── ARKUI_NODE_TEXT (rewind button)
 *           │     ├── ARKUI_NODE_TEXT (play/pause button)
 *           │     └── ARKUI_NODE_TEXT (forward button)
 *           └── ARKUI_NODE_ROW (progress row)
 *                 ├── ARKUI_NODE_TEXT (current time)
 *                 ├── ARKUI_NODE_SLIDER (seek bar)
 *                 └── ARKUI_NODE_TEXT (duration)
 */
class VideoComponent : public A2UIComponent {
public:
    VideoComponent(const std::string& id, const nlohmann::json& properties);
    ~VideoComponent() override;

    bool shouldAutoAddChildView() const override { return false; }
    void destroy() override;

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    void notifyIntrinsicSizeIfNeeded();

    // XComponent surface callbacks
    static void onSurfaceCreatedCB(OH_NativeXComponent* component, void* window);
    static void onSurfaceChangedCB(OH_NativeXComponent* component, void* window);
    static void onSurfaceDestroyedCB(OH_NativeXComponent* component, void* window);
    static void dispatchTouchEventCB(OH_NativeXComponent* component, void* window);

    // AVPlayer callbacks
    static void onPlayerInfoCallback(OH_AVPlayer* player, AVPlayerOnInfoType type,
                                     OH_AVFormat* infoBody, void* userData);
    static void onPlayerErrorCallback(OH_AVPlayer* player, int32_t errorCode,
                                      const char* errorMsg, void* userData);

    // Static event callbacks
    static void onVideoAreaClickEvent(ArkUI_NodeEvent* event);
    static void onRewindBtnClickEvent(ArkUI_NodeEvent* event);
    static void onPlayPauseBtnClickEvent(ArkUI_NodeEvent* event);
    static void onForwardBtnClickEvent(ArkUI_NodeEvent* event);
    static void onSliderChangeEvent(ArkUI_NodeEvent* event);

    // Playback control
    void setVideoUrl(const std::string& url);
    OH_AVErrCode handleVideoPrepare(const std::string& url);
    void handleStateChange(AVPlayerState state, int32_t stateChangeReason);
    OH_AVErrCode play();
    OH_AVErrCode pause();
    OH_AVErrCode stop();
    void releasePlayer();

    // UI thread safety
    // Dispatch a lambda to the main (JS/UI) thread via the global TSFN so that
    // AVPlayer worker-thread callbacks never touch ArkUI nodes directly.
    static void postToMainThread(std::function<void()> task);

    // Controls whether queued main-thread tasks are allowed to touch node handles.
    // Set to false in releasePlayer() before nodes are torn down.
    std::atomic<bool> m_uiTasksEnabled{true};

    // Controls bar
    void createControlsBar();
    void destroyControlsBar();
    void toggleControlsBar();
    void showControlsBar();
    void hideControlsBar();
    void updateControlsBarLayout();
    void updatePlayPauseButton();
    void updateProgressDisplay();
    static std::string formatTime(int64_t milliseconds);

    // Instance registry
    static std::mutex s_instanceMutex;
    static std::map<OH_NativeXComponent*, VideoComponent*> s_instanceMap;
    void registerInstance(OH_NativeXComponent* xcomp);
    void unregisterInstance();

    // Member state
    ArkUI_NodeHandle m_xcomponentHandle = nullptr;
    OH_NativeXComponent* m_nativeXComponent = nullptr;
    OH_NativeXComponent_Callback m_xcompCallback;
    OHNativeWindow* m_window = nullptr;

    OH_AVPlayer* m_avPlayer = nullptr;
    std::string m_videoUrl;
    bool m_autoPlay = false;
    bool m_controls = true;
    bool m_isPlaying = false;
    std::string m_videoCurrentState;
    std::string m_xcomponentId;
    // Marks player callbacks as invalid after releasePlayer to avoid stale access.
    std::atomic<bool> m_playerCallbackValid{false};
    // Reset is asynchronous. Track whether prepare should run immediately after AV_IDLE.
    bool m_pendingPrepare = false;
    float m_videoIntrinsicWidth = 0.0f;
    float m_videoIntrinsicHeight = 0.0f;
    float m_lastNotifiedWidth = 0.0f;
    float m_lastNotifiedHeight = 0.0f;

    // Controls bar nodes
    ArkUI_NodeHandle m_controlsBarHandle = nullptr;      // Outer COLUMN container
    ArkUI_NodeHandle m_buttonsRowHandle = nullptr;       // Button row for rewind/play/forward
    ArkUI_NodeHandle m_rewindBtnHandle = nullptr;        // Rewind button text
    ArkUI_NodeHandle m_playPauseBtnHandle = nullptr;     // Play/pause button text
    ArkUI_NodeHandle m_forwardBtnHandle = nullptr;       // Forward button text
    ArkUI_NodeHandle m_controlsRowHandle = nullptr;      // Progress row with time and slider
    ArkUI_NodeHandle m_currentTimeHandle = nullptr;      // Current time text
    ArkUI_NodeHandle m_sliderHandle = nullptr;           // Progress slider
    ArkUI_NodeHandle m_totalTimeHandle = nullptr;        // Total duration text

    // Playback progress
    int64_t m_currentPosition = 0;
    int64_t m_duration = 0;
    bool m_isSeeking = false;

    // Controls bar visibility
    bool m_controlsBarVisible = false;
    std::chrono::steady_clock::time_point m_controlsShowTime;
    static constexpr int64_t kControlsAutoHideMs = 3000;
    static constexpr int32_t kSeekStepMs = 5000;         // Rewind/forward step: 5 seconds
};

} // namespace a2ui

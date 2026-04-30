#pragma once

#include "../a2ui_component.h"
#include "../../utils/a2ui_color_palette.h"
#include <multimedia/player_framework/avplayer.h>
#include <multimedia/player_framework/avplayer_base.h>
#include <multimedia/player_framework/native_averrors.h>
#include <string>
#include <atomic>
#include <functional>

namespace a2ui {

/**
 * Audio player component backed by Harmony OH_AVPlayer.
 *
 * The component uses the same visual model as the cross-platform spec:
 *   - the component renders as a fixed-size circular button
 *   - button size and colors come from g_component_styles.AudioPlayer
 *   - visual state switches between play, pause, loading, and error
 */
class AudioPlayerComponent : public A2UIComponent {
public:
    AudioPlayerComponent(const std::string& id, const nlohmann::json& properties);
    ~AudioPlayerComponent() override;

    bool shouldAutoAddChildView() const override { return false; }
    void destroy() override;

protected:
    void onUpdateProperties(const nlohmann::json& properties) override;

private:
    static void onPlayerInfoCallback(OH_AVPlayer* player, AVPlayerOnInfoType type,
                                     OH_AVFormat* infoBody, void* userData);
    static void onPlayerErrorCallback(OH_AVPlayer* player, int32_t errorCode,
                                      const char* errorMsg, void* userData);
    static void onPlayPauseBtnClickEvent(ArkUI_NodeEvent* event);

    // Dispatch a lambda to the main (JS/UI) thread via the global TSFN so that
    // AVPlayer worker-thread callbacks never touch ArkUI nodes directly.
    static void postToMainThread(std::function<void()> task);

    void createUI();
    void destroyUI();
    void loadStyleConfig();
    void applyVisualState();
    void updateProgressRing();

    void setAudioUrl(const std::string& url);
    OH_AVErrCode handleAudioPrepare(const std::string& url);
    void handleStateChange(AVPlayerState state, int32_t stateChangeReason);
    OH_AVErrCode play();
    OH_AVErrCode pause();
    OH_AVErrCode stop();
    void releasePlayer();

private:
    OH_AVPlayer* m_avPlayer = nullptr;
    std::string m_audioUrl;
    std::string m_description = "AudioPlayer";
    bool m_isPlaying = false;
    std::string m_audioCurrentState;

    // Controls whether queued main-thread tasks are allowed to touch node handles.
    // Set to false in releasePlayer() before nodes are torn down.
    std::atomic<bool> m_uiTasksEnabled{true};

    ArkUI_NodeHandle m_ringHandle = nullptr;
    ArkUI_NodeHandle m_loadingHandle = nullptr;
    ArkUI_NodeHandle m_iconContainerHandle = nullptr;
    ArkUI_NodeHandle m_iconHandle = nullptr;

    float m_size = 80.0f;
    float m_playIconSize = 40.0f;
    float m_pauseIconSize = 35.0f;
    float m_ringWidth = 8.0f;
    uint32_t m_playBgColor = a2ui::colors::kColorPrimaryBlue;
    uint32_t m_pauseBgColor = a2ui::colors::kColorWhite;
    uint32_t m_ringColor = a2ui::colors::kColorPrimaryBlue;
    uint32_t m_playIconColor = a2ui::colors::kColorWhite;
    uint32_t m_pauseIconColor = a2ui::colors::kColorPrimaryBlue;
    uint32_t m_loadingColor = a2ui::colors::kColorPrimaryBlue;
    uint32_t m_errorBgColor = 0xFFCCCCCC;

    int64_t m_currentPosition = 0;
    int64_t m_duration = 0;
    bool m_pendingPlay = false;
};

} // namespace a2ui

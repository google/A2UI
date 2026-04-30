package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.view.CustomAudioPlayerView;
import com.amap.agenui.render.style.ComponentStyleConfig;
import com.amap.agenui.render.style.StyleHelper;

import java.io.IOException;
import java.util.Map;

/**
 * AudioPlayer component implementation
 *
 * Corresponds to the AudioPlayer component in the A2UI protocol.
 * Uses MediaPlayer for audio playback.
 * Uses CustomAudioPlayerView for custom UI.
 *
 * Supported properties:
 * - url: audio URL (String)
 *
 * Supported style properties (read from component_styles.json):
 * - size: player size
 * - play-icon-size: play icon size
 * - pause-icon-size: pause icon size
 * - ring-width: loading ring width
 * - play-bg-color: play button background color
 * - pause-bg-color: pause button background color
 * - ring-color: loading ring color
 * - play-icon-color: play icon color
 * - pause-icon-color: pause icon color
 * - loading-color: loading state color
 * - error-bg-color: error state background color
 *
 */
public class AudioPlayerComponent extends A2UIComponent {

    private static final String TAG = "AudioPlayerComponent";

    private CustomAudioPlayerView audioPlayerView;
    private MediaPlayer mediaPlayer;
    private boolean isPrepared = false;

    // Progress updates
    private Handler progressHandler = new Handler(Looper.getMainLooper());
    private Runnable progressRunnable = new Runnable() {
        @Override
        public void run() {
            updateProgress();
            progressHandler.postDelayed(this, 100); // update every 100ms
        }
    };

    public AudioPlayerComponent(String id, Map<String, Object> properties) {
        super(id, "AudioPlayer");
        // Save initial properties to the base class
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    public View onCreateView(Context context) {
        audioPlayerView = new CustomAudioPlayerView(context);
        applyAudioPlayerStyles(context);
        audioPlayerView.setOnClickListener(v -> togglePlayPause());
        initMediaPlayer(context);
        return audioPlayerView;
    }

    /**
     * Apply audio player styles
     */
    private void applyAudioPlayerStyles(Context context) {
        Map<String, String> styleConfig = ComponentStyleConfig.getInstance(context)
                .getComponentStyle("AudioPlayer");

        if (styleConfig == null || styleConfig.isEmpty()) {
            return;
        }

        if (styleConfig.containsKey("size")) {
            int size = StyleHelper.parseDimension(styleConfig.get("size"), context);
            audioPlayerView.setSize(size);
        }
        if (styleConfig.containsKey("play-icon-size")) {
            int playIconSize = StyleHelper.parseDimension(styleConfig.get("play-icon-size"), context);
            audioPlayerView.setPlayIconSize(playIconSize);
        }
        if (styleConfig.containsKey("pause-icon-size")) {
            int pauseIconSize = StyleHelper.parseDimension(styleConfig.get("pause-icon-size"), context);
            audioPlayerView.setPauseIconSize(pauseIconSize);
        }
        if (styleConfig.containsKey("ring-width")) {
            int ringWidth = StyleHelper.parseDimension(styleConfig.get("ring-width"), context);
            audioPlayerView.setRingWidth(ringWidth);
        }
        if (styleConfig.containsKey("play-bg-color")) {
            int playBgColor = StyleHelper.parseColor(styleConfig.get("play-bg-color"));
            audioPlayerView.setPlayBgColor(playBgColor);
        }
        if (styleConfig.containsKey("pause-bg-color")) {
            int pauseBgColor = StyleHelper.parseColor(styleConfig.get("pause-bg-color"));
            audioPlayerView.setPauseBgColor(pauseBgColor);
        }
        if (styleConfig.containsKey("ring-color")) {
            int ringColor = StyleHelper.parseColor(styleConfig.get("ring-color"));
            audioPlayerView.setRingColor(ringColor);
        }
        if (styleConfig.containsKey("play-icon-color")) {
            int playIconColor = StyleHelper.parseColor(styleConfig.get("play-icon-color"));
            audioPlayerView.setPlayIconColor(playIconColor);
        }
        if (styleConfig.containsKey("pause-icon-color")) {
            int pauseIconColor = StyleHelper.parseColor(styleConfig.get("pause-icon-color"));
            audioPlayerView.setPauseIconColor(pauseIconColor);
        }
        if (styleConfig.containsKey("loading-color")) {
            int loadingColor = StyleHelper.parseColor(styleConfig.get("loading-color"));
            audioPlayerView.setLoadingColor(loadingColor);
        }
        if (styleConfig.containsKey("error-bg-color")) {
            int errorBgColor = StyleHelper.parseColor(styleConfig.get("error-bg-color"));
            audioPlayerView.setErrorBgColor(errorBgColor);
        }
    }

    /**
     * Initialize MediaPlayer
     */
    private void initMediaPlayer(Context context) {
        if (properties.containsKey("url")) {
            String url = (String) properties.get("url");

            if (audioPlayerView != null) {
                audioPlayerView.setState(CustomAudioPlayerView.State.LOADING);
            }

            try {
                mediaPlayer = new MediaPlayer();
                mediaPlayer.setDataSource(context, Uri.parse(url));

                mediaPlayer.setOnPreparedListener(mp -> {
                    isPrepared = true;
                    if (audioPlayerView != null) {
                        audioPlayerView.setState(CustomAudioPlayerView.State.READY);
                    }
                });

                mediaPlayer.setOnCompletionListener(mp -> {
                    // Playback completed, return to ready state
                    if (audioPlayerView != null) {
                        audioPlayerView.setState(CustomAudioPlayerView.State.READY);
                    }
                });

                mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                    isPrepared = false;
                    if (audioPlayerView != null) {
                        audioPlayerView.setState(CustomAudioPlayerView.State.ERROR);
                    }
                    return true;
                });

                mediaPlayer.prepareAsync();

            } catch (IOException e) {
                Log.e(TAG, "Failed to initialize MediaPlayer", e);
                if (audioPlayerView != null) {
                    audioPlayerView.setState(CustomAudioPlayerView.State.ERROR);
                }
            }
        }
    }

    /**
     * Toggle play/pause
     */
    private void togglePlayPause() {
        if (audioPlayerView == null) {
            return;
        }

        CustomAudioPlayerView.State currentState = audioPlayerView.getState();

        // Only toggle in READY, PLAYING, or PAUSED states
        if (currentState == CustomAudioPlayerView.State.READY ||
                currentState == CustomAudioPlayerView.State.PAUSED) {
            play();
        } else if (currentState == CustomAudioPlayerView.State.PLAYING) {
            pause();
        }
    }

    /**
     * Play audio
     */
    public void play() {
        if (mediaPlayer != null && isPrepared) {
            mediaPlayer.start();
            if (audioPlayerView != null) {
                audioPlayerView.setState(CustomAudioPlayerView.State.PLAYING);
            }
            startProgressUpdate();
        }
    }

    /**
     * Pause audio
     */
    public void pause() {
        if (mediaPlayer != null && mediaPlayer.isPlaying()) {
            mediaPlayer.pause();
            if (audioPlayerView != null) {
                audioPlayerView.setState(CustomAudioPlayerView.State.PAUSED);
            }
            stopProgressUpdate();
        }
    }

    /**
     * Stop audio
     */
    public void stop() {
        if (mediaPlayer != null) {
            if (mediaPlayer.isPlaying()) {
                mediaPlayer.stop();
            }
            isPrepared = false;
            if (audioPlayerView != null) {
                audioPlayerView.setState(CustomAudioPlayerView.State.IDLE);
            }
            stopProgressUpdate();
        }
    }

    /**
     * Check if audio is playing
     */
    public boolean isPlaying() {
        return mediaPlayer != null && mediaPlayer.isPlaying();
    }

    /**
     * Get the current playback position
     */
    public int getCurrentPosition() {
        if (mediaPlayer != null && isPrepared) {
            return mediaPlayer.getCurrentPosition();
        }
        return 0;
    }

    /**
     * Get the total audio duration
     */
    public int getDuration() {
        if (mediaPlayer != null && isPrepared) {
            return mediaPlayer.getDuration();
        }
        return 0;
    }

    /**
     * Seek to a specified position
     */
    public void seekTo(int position) {
        if (mediaPlayer != null && isPrepared) {
            mediaPlayer.seekTo(position);
        }
    }

    /**
     * Release resources
     */
    public void release() {
        stopProgressUpdate();

        if (mediaPlayer != null) {
            if (mediaPlayer.isPlaying()) {
                mediaPlayer.stop();
            }
            mediaPlayer.release();
            mediaPlayer = null;
        }

        isPrepared = false;

        if (audioPlayerView != null) {
            audioPlayerView.setState(CustomAudioPlayerView.State.IDLE);
        }
    }


    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        if (properties.containsKey("url")) {
            release();
            if (audioPlayerView != null) {
                initMediaPlayer(audioPlayerView.getContext());
            }
        }
    }

    @Override
    protected void onDestroy() {
        release();
    }

    /**
     * Start progress updates
     */
    private void startProgressUpdate() {
        stopProgressUpdate(); // stop any previous task first
        progressHandler.post(progressRunnable);
    }

    /**
     * Stop progress updates
     */
    private void stopProgressUpdate() {
        progressHandler.removeCallbacks(progressRunnable);
    }

    /**
     * Update playback progress
     */
    private void updateProgress() {
        if (mediaPlayer != null && isPrepared && mediaPlayer.isPlaying() && audioPlayerView != null) {
            int currentPosition = mediaPlayer.getCurrentPosition();
            int duration = mediaPlayer.getDuration();

            if (duration > 0) {
                float progress = (float) currentPosition / duration;
                audioPlayerView.setPlayProgress(progress);
            }
        }
    }

}

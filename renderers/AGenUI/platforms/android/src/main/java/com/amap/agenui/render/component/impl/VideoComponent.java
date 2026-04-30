package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.net.Uri;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.MediaController;
import android.widget.VideoView;

import com.amap.agenui.render.component.A2UIComponent;

import java.util.Map;

/**
 * Video component implementation
 *
 * Corresponds to the Video component in the A2UI protocol.
 * Uses VideoView for video playback.
 *
 * Supported properties:
 * - url: video URL (String)
 * - autoPlay: whether to auto-play (Boolean, default false)
 * - controls: whether to show controls (Boolean, default true)
 *
 */
public class VideoComponent extends A2UIComponent {

    private static final String TAG = "VideoComponent";

    private FrameLayout containerLayout;
    private VideoView videoView;
    private MediaController mediaController;
    private boolean isPlaying = false;

    public VideoComponent(String id, Map<String, Object> properties) {
        super(id, "Video");
        // Save initial properties to base class
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    public View onCreateView(Context context) {
        containerLayout = new FrameLayout(context);
        containerLayout.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        videoView = new VideoView(context);
        FrameLayout.LayoutParams videoParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                (int) (200 * context.getResources().getDisplayMetrics().density) // default height 200dp
        );
        videoView.setLayoutParams(videoParams);
        containerLayout.addView(videoView);

        boolean showControls = true;
        if (properties.containsKey("controls")) {
            Object controlsValue = properties.get("controls");
            if (controlsValue instanceof Boolean) {
                showControls = (Boolean) controlsValue;
            }
        }

        if (showControls) {
            mediaController = new MediaController(context);
            mediaController.setAnchorView(videoView);
            videoView.setMediaController(mediaController);
        }

        boolean autoPlay = false;
        if (properties.containsKey("autoPlay")) {
            Object autoPlayValue = properties.get("autoPlay");
            if (autoPlayValue instanceof Boolean) {
                autoPlay = (Boolean) autoPlayValue;
            }
        }

        final boolean shouldAutoPlay = autoPlay;
        videoView.setOnPreparedListener(mp -> {
            if (shouldAutoPlay) {
                videoView.start();
                isPlaying = true;
            }
        });

        if (properties.containsKey("url")) {
            String url = (String) properties.get("url");
            setVideoUrl(url);
        }

        videoView.setOnErrorListener((mp, what, extra) -> {
            isPlaying = false;
            return true;
        });

        return containerLayout;
    }

    /**
     * Sets the video URL
     */
    private void setVideoUrl(String url) {
        if (url != null && !url.isEmpty() && videoView != null) {
            try {
                Uri uri = Uri.parse(url);
                videoView.setVideoURI(uri);
            } catch (Exception e) {
                Log.e(TAG, "Failed to set video URI: " + url, e);
            }
        }
    }

    /**
     * Plays the video
     */
    public void play() {
        if (videoView != null && !isPlaying) {
            videoView.start();
            isPlaying = true;
        }
    }

    /**
     * Pauses the video
     */
    public void pause() {
        if (videoView != null && isPlaying) {
            videoView.pause();
            isPlaying = false;
        }
    }

    /**
     * Stops the video
     */
    public void stop() {
        if (videoView != null) {
            videoView.stopPlayback();
            isPlaying = false;
        }
    }

    /**
     * Returns whether the video is playing
     */
    public boolean isPlaying() {
        return isPlaying && videoView != null && videoView.isPlaying();
    }

    /**
     * Returns the current playback position
     */
    public int getCurrentPosition() {
        if (videoView != null) {
            return videoView.getCurrentPosition();
        }
        return 0;
    }

    /**
     * Returns the total video duration
     */
    public int getDuration() {
        if (videoView != null) {
            return videoView.getDuration();
        }
        return 0;
    }

    /**
     * Seeks to the specified position
     */
    public void seekTo(int position) {
        if (videoView != null) {
            videoView.seekTo(position);
        }
    }

    /**
     * Releases resources
     */
    public void release() {
        if (videoView != null) {
            videoView.stopPlayback();
            videoView = null;
        }
        if (mediaController != null) {
            mediaController = null;
        }
        isPlaying = false;
    }


    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        // Update video URL
        if (properties.containsKey("url")) {
            String url = (String) properties.get("url");
            setVideoUrl(url);
        }
    }

    @Override
    protected void onDestroy() {
        release();
    }

}

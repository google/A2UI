package com.amap.agenui;

import androidx.annotation.Keep;

import java.util.Map;

/**
 * AGenUI message listener interface
 * Used to receive event callbacks from the C++ layer
 *
 * <p>Note: This interface interacts with the C++ layer via JNI; method signatures must strictly
 * match the C++ layer</p>
 * <p>Corresponding C++ implementation: jni_message_listener_bridge.cpp</p>
 */
@Keep
public interface IAGenUIMessageListener {
    /**
     * Callback when a Surface is created
     *
     * @param surfaceId     Unique identifier of the surface
     * @param catalogId     Component catalog identifier
     * @param theme         Theme parameters
     * @param sendDataModel Whether to send back the data model
     */
    void onCreateSurface(String surfaceId, String catalogId, Map<String, String> theme, boolean sendDataModel, boolean animated);

    /**
     * Callback when components are updated
     *
     * @param surfaceId  Surface identifier
     * @param components String array of the component list
     */
    void onUpdateComponents(String surfaceId, String[] components);

    /**
     * Callback when a Surface is deleted
     *
     * @param surfaceId Surface identifier
     */
    void onDeleteSurface(String surfaceId);

    void onInteractionStatusEvent(int eventType, String content);
    void onActionEventRouted(String content);
}

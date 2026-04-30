package com.amap.agenui.render.surface;

import android.app.Activity;
import android.content.Context;
import android.os.SystemClock;
import android.util.Log;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.RestrictTo;

import com.amap.agenui.AGenUI;
import com.amap.agenui.IAGenUIMessageListener;
import com.amap.agenui.render.component.ComponentEventDispatcher;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Surface manager
 * <p>
 * Responsibilities:
 * 1. Manages multiple Surface instances
 * 2. Provides interfaces for creating, retrieving, and destroying Surfaces
 * 3. Provides container bind/unbind interfaces (for RecyclerView optimization)
 * 4. Notifies SurfaceListeners (e.g. RecyclerView's ChatAdapter)
 * <p>
 * Design notes:
 * - Surfaces can be created without a container (supports pre-rendering)
 * - Container bind/unbind is independent of the Surface lifecycle
 * - Supports RecyclerView ViewHolder recycling optimization
 *
 */
public class SurfaceManager {

    private static final String TAG = "SurfaceManager";

    private final WeakReference<Context> contextRef;
    private final NativeEventBridge nativeEventBridge;

    private final Map<String, Surface> surfaces = new HashMap<>();
    private final List<ISurfaceManagerListener> listeners = new CopyOnWriteArrayList<>();
    private final int engineId;

    /**
     * Constructor
     *
     * @param context Android Activity
     */
    @SuppressWarnings("RestrictedApi")
    public SurfaceManager(@NonNull Activity activity) throws IllegalStateException {
        this.contextRef = new WeakReference<>(activity);
        this.engineId = AGenUI.getInstance().createSurfaceManager();
        this.nativeEventBridge = new NativeEventBridge(this, engineId);
        addMessageListener(nativeEventBridge);
        Log.i(TAG, "SurfaceManager created with engineId=" + engineId);
    }

    /**
     * Begins a round of streaming data reception.
     * <p>
     * Clears the buffer and resets the parsing state. Recommended to call at the start of
     * each new session.
     */
    public void beginTextStream() {
        try {
            nativeBeginTextStream(engineId);
        } catch (RuntimeException e) {
            Log.e(TAG, "Failed to beginTextStream", e);
        }
    }

    /**
     * Transmits data (supports streaming fragments).
     * <p>
     * Supports transmitting a complete JSON data packet or a streaming fragment:
     * - Complete JSON: e.g. createSurface, updateComponents, updateDataModel, and other
     *   complete protocol data
     * - Streaming fragment: supports incremental data transmitted in segments
     *
     * @param dataString Data JSON string; format must conform to the AGenUI protocol spec
     */
    public void receiveTextChunk(String dataString) {
        try {
            nativeReceiveTextChunk(engineId, dataString);
        } catch (RuntimeException e) {
            Log.e(TAG, "Failed to receiveTextChunk", e);
        }
    }

    /**
     * Ends a round of streaming data reception.
     * <p>
     * Resets the parsing state. Should be called after the SSE stream closes normally,
     * the HTTP response ends, the user actively cancels the conversation, or a network
     * disconnect occurs.
     */
    public void endTextStream() {
        try {
            nativeEndTextStream(engineId);
        } catch (RuntimeException e) {
            Log.e(TAG, "Failed to endTextStream", e);
        }
    }

    /**
     * Adds a Surface listener
     *
     * @param listener ISurfaceManagerListener instance
     */
    public void addListener(ISurfaceManagerListener listener) {
        if (listener != null && !listeners.contains(listener)) {
            listeners.add(listener);
            Log.d(TAG, "Listener added: " + listener.getClass().getSimpleName());
        }
    }

    /**
     * Removes a Surface listener
     *
     * @param listener ISurfaceManagerListener instance
     */
    public void removeListener(ISurfaceManagerListener listener) {
        if (listener != null) {
            listeners.remove(listener);
            Log.d(TAG, "Listener removed: " + listener.getClass().getSimpleName());
        }
    }


    /**
     * Registers a UIMessage listener
     *
     * @param listener Event listener
     */
    void addMessageListener(IAGenUIMessageListener listener) {
        if (listener == null) {
            Log.e(TAG, "addMessageListener: listener is null");
            return;
        }
        try {
            nativeAddEventListener(engineId, listener);
            Log.i(TAG, "UIMessage listener registered: engineId=" + engineId);
        } catch (Exception e) {
            Log.e(TAG, "Failed to register UIMessage listener", e);
        }
    }

    /**
     * Removes a UIMessage listener
     *
     * @param listener The event listener to remove
     */
    void removeMessageListener(IAGenUIMessageListener listener) {
        if (listener == null) {
            Log.w(TAG, "removeMessageListener: listener is null");
            return;
        }
        try {
            nativeRemoveEventListener(engineId, listener);
            Log.i(TAG, "UIMessage listener unregistered: engineId=" + engineId);
        } catch (Exception e) {
            Log.e(TAG, "Failed to unregister UIMessage listener", e);
        }
    }


    /**
     * Destroys all resources held by this SurfaceManager.
     * <p>
     * Destroys all Surfaces, removes all listeners, and cleans up NativeEventBridge.
     */
    public void destroy() {
        Log.i(TAG, "Destroying SurfaceManager...");
        clearAll();
        listeners.clear();
        removeMessageListener(nativeEventBridge);
        AGenUI.getInstance().destroySurfaceManager(engineId);
        Log.i(TAG, "✓ SurfaceManager destroyed, engineId=" + engineId);
    }


    /**
     * Returns the Activity Context (weak reference; may return null after the Activity is destroyed).
     * Callers must perform a null check.
     */
    Context getContext() {
        Context ctx = contextRef.get();
        if (ctx == null) {
            Log.w(TAG, "getContext: Activity has been GC'd; release() may have been missed");
        }
        return ctx;
    }

    /**
     * Creates a Surface.
     * <p>
     * Called by NativeEventBridge.onCreateSurface().
     * The Surface internally creates a root container; callers obtain it via surface.getContainer().
     *
     * @param surfaceId Unique Surface identifier
     * @return Created Surface instance
     * @hide
     */
    @RestrictTo(RestrictTo.Scope.LIBRARY_GROUP)
    public Surface createSurface(String surfaceId) {
        Log.d(TAG, "createSurface: surfaceId=" + surfaceId);

        Context context = getContext();
        if (context == null) {
            Log.e(TAG, "createSurface: Cannot create surface, Activity context is null (Activity may have been destroyed)");
            return null;
        }

        Surface surface = new Surface(
                surfaceId,
                getContext(),
                new ComponentEventDispatcher() {
                    @Override
                    public void submitUIAction(String sid, String componentId, String contextJson) {
                        try {
                            nativeSubmitUIAction(engineId, sid, componentId, contextJson);
                        } catch (Exception e) {
                            Log.e(TAG, "Failed to submitUIAction", e);
                        }
                    }

                    @Override
                    public void submitUIDataModel(String sid, String componentId, String changeData) {
                        try {
                            nativeSubmitUIDataModel(engineId, sid, componentId, changeData);
                        } catch (Exception e) {
                            Log.e(TAG, "Failed to submitUIDataModel", e);
                        }
                    }
                }
        );

        surfaces.put(surfaceId, surface);

        // Notify listeners
        notifyListenersOnCreate(surface);

        Log.d(TAG, "✓ Surface created: " + surfaceId);
        return surface;
    }

    /**
     * Returns a Surface
     *
     * @param surfaceId Unique Surface identifier
     * @return Surface instance, or null if not found
     * @hide
     */
    public Surface getSurface(String surfaceId) {
        return surfaces.get(surfaceId);
    }

    /**
     * Destroys a Surface
     *
     * @param surfaceId Unique Surface identifier
     * @hide
     */
    void destroySurface(String surfaceId) {
        Log.d(TAG, "destroySurface: surfaceId=" + surfaceId);

        Surface surface = surfaces.remove(surfaceId);
        if (surface != null) {
            surface.destroy();

            // Notify listeners (each listener is independently guarded; a single exception
            // does not affect the remaining listeners)
            for (ISurfaceManagerListener listener : listeners) {
                try {
                    listener.onDeleteSurface(surface);
                } catch (Exception e) {
                    Log.e(TAG, "destroySurface: listener threw exception", e);
                }
            }
        }
    }

    /**
     * Clears all Surfaces
     */
    private void clearAll() {
        Log.d(TAG, "clearAll: clearing " + surfaces.size() + " surfaces");

        List<String> surfaceIds = new ArrayList<>(surfaces.keySet());
        for (String surfaceId : surfaceIds) {
            destroySurface(surfaceId);
        }
    }

    /**
     * Notifies all listeners that a Surface has been created
     */
    private void notifyListenersOnCreate(Surface surface) {
        for (ISurfaceManagerListener listener : listeners) {
            try {
                listener.onCreateSurface(surface);
            } catch (Exception e) {
                Log.e(TAG, "notifyListenersOnCreate: listener threw exception", e);
            }
        }
    }

    /**
     * Notifies all listeners of an Action event.
     * <p>
     * Called by NativeEventBridge when it receives an Action event routed from the C++ layer.
     *
     * @param event Event content as a JSON string
     */
    void notifyActionEvent(String event) {
        for (ISurfaceManagerListener listener : listeners) {
            try {
                listener.onReceiveActionEvent(event);
            } catch (Exception e) {
                Log.e(TAG, "notifyActionEvent: listener threw exception", e);
            }
        }
    }


    // TODO temporary workaround for scroll jank; overall renderer optimization to follow

    /**
     * Pre-builds the View tree for the specified Surface
     *
     * @param surfaceId   Unique Surface identifier
     * @param preloadHost Off-screen pre-build container
     */
    /**
     * Submits a UI data model synchronization
     *
     * @param surfaceId   Surface ID
     * @param componentId Component ID
     * @param change      Changed content (JSON format)
     */
    public void submitUIDataModel(String surfaceId, String componentId, String change) {
        try {
            nativeSubmitUIDataModel(engineId, surfaceId, componentId, change);
        } catch (Exception e) {
            Log.e(TAG, "Failed to submitUIDataModel", e);
        }
    }


    private static native void nativeAddEventListener(int engineId, IAGenUIMessageListener listener);
    private static native void nativeRemoveEventListener(int engineId, IAGenUIMessageListener listener);

    private static native void nativeSubmitUIAction(int engineId, String surfaceId, String sourceComponentId, String contextJson);
    private static native void nativeSubmitUIDataModel(int engineId, String surfaceId, String componentId, String change);

    private static native void nativeBeginTextStream(int engineId);
    private static native void nativeReceiveTextChunk(int engineId, String content);
    private static native void nativeEndTextStream(int engineId);

    public void preloadSurface(String surfaceId, ViewGroup preloadHost) {
        Surface surface = surfaces.get(surfaceId);
        if (surface == null) {
            Log.w(TAG, "preloadSurface: surface not found, surfaceId=" + surfaceId);
            return;
        }

        if (preloadHost == null) {
            Log.w(TAG, "preloadSurface: preloadHost is null, surfaceId=" + surfaceId);
            return;
        }

        long start = SystemClock.elapsedRealtime();
        Log.d(TAG, "preloadSurface start"
                + ", surfaceId=" + surfaceId
                + ", preloadHostHash=" + System.identityHashCode(preloadHost)
                + ", childCountBefore=" + preloadHost.getChildCount());

        // Important: clear the host before each preload to avoid cross-surface contamination
        preloadHost.removeAllViews();

        surface.preloadViews(preloadHost);

        Log.d(TAG, "preloadSurface end"
                + ", surfaceId=" + surfaceId
                + ", childCountAfter=" + preloadHost.getChildCount()
                + ", cost=" + (SystemClock.elapsedRealtime() - start));
    }
}

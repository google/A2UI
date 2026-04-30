package com.amap.agenui.function;

import android.util.Log;

import androidx.annotation.NonNull;

/**
 * Function adapter: adapts IFunction to IPlatformFunction
 *
 * Used to maintain compatibility with the new registerFunction interface.
 * Wraps the Java-layer IFunction and registers it with the C++ layer.
 */
public class PlatformFunction implements IPlatformFunction {
    private static final String TAG = "PlatformFunction";

    private final IFunction function;

    /**
     * Constructor
     *
     * @param function The Function instance to adapt
     */
    public PlatformFunction(@NonNull IFunction function) {
        this.function = function;
    }

    /**
     * Synchronous Function call
     *
     * @param params Parameters in JSON format
     * @return Execution result in JSON format
     */
    @Override
    public String callSync(String params) {
        Log.i(TAG, "callSync: function=" + function.getConfig().getName() + ", params=" + params);
        try {
            FunctionResult result = function.execute(params);
            String resultJson = (result != null)
                    ? result.toJsonString()
                    : FunctionResult.createSuccess(null).toJsonString();
            Log.i(TAG, "callSync result: " + resultJson);
            return resultJson;
        } catch (Exception e) {
            Log.e(TAG, "callSync: exception in execute()", e);
            return FunctionResult.createError(e.getMessage()).toJsonString();
        }
    }

    /**
     * Asynchronous Function call
     *
     * @param params      Parameters in JSON format
     * @param callbackPtr Callback pointer (used for JNI callback to return the result)
     * @return JSON result returned immediately
     */
    @Override
    public String callAsync(String params, long callbackPtr) {
        // TODO: 2026/4/22 async call not yet implemented
        // callbackPtr is discarded: the C++ layer holds this pointer waiting for the callback;
        // if the callback never fires, the C++ side will hang indefinitely
        Log.w(TAG, "callAsync: not yet implemented; callbackPtr=" + callbackPtr
                + " is discarded. C++ side will wait indefinitely until this is implemented.");
        return "";
    }
}

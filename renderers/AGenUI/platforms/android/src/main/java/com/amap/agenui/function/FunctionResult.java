package com.amap.agenui.function;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Function execution result class
 *
 * Encapsulates the result of a Function execution, including success/failure status and return value.
 * Simplified version replacing the original SkillResult.
 */
public class FunctionResult {
    private static final String TAG = "FunctionResult";
    private boolean result = false;
    private Object value = null;

    /**
     * Private constructor
     */
    private FunctionResult() {}

    /**
     * Creates a success result
     *
     * @param value Return value
     * @return FunctionResult instance
     */
    public static FunctionResult createSuccess(Object value) {
        FunctionResult functionResult = new FunctionResult();
        functionResult.result = true;
        functionResult.value = value;
        return functionResult;
    }

    /**
     * Creates an error result
     *
     * @param value Error message or other value
     * @return FunctionResult instance
     */
    public static FunctionResult createError(Object value) {
        FunctionResult functionResult = new FunctionResult();
        functionResult.result = false;
        functionResult.value = value;
        return functionResult;
    }

    /**
     * Converts to a JSON object
     *
     * @return JSON object
     */
    public JSONObject toJson() {
        JSONObject json = new JSONObject();
        try {
            json.put("result", result);
            json.put("value", value != null ? value : JSONObject.NULL);
        } catch (JSONException e) {
            Log.e(TAG, "toJson serialization failed", e);
        }
        return json;
    }

    /**
     * Converts to a JSON string
     *
     * @return JSON string
     */
    public String toJsonString() {
        return toJson().toString();
    }
}

package com.amap.agenui.function;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Function configuration class
 *
 * Stores metadata for a Function.
 * Simplified version containing only the name field, replacing the original SkillConfig.
 */
public class FunctionConfig {
    private static final String TAG = "FunctionConfig";
    private final String name;

    /**
     * Constructor
     */
    public FunctionConfig(String name) {
        this.name = name;
    }

    /**
     * Serializes this config to a JSON string
     *
     * @return JSON string
     */
    public String toJSON() {
        JSONObject json = new JSONObject();
        try {
            json.put("name", name);
        } catch (JSONException e) {
            Log.e(TAG, "toJSON serialization failed", e);
        }
        return json.toString();
    }
    public String getName() {
        return name;
    }
}

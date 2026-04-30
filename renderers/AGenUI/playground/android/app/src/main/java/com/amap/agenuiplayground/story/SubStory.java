package com.amap.agenuiplayground.story;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Sub Story
 * Represents a single example of a component
 * 
 */
public class SubStory {
    
    private String parentName;      // Parent component name, e.g. "Button"
    private String subName;         // Sub-example name, e.g. "default"
    private String displayName;     // Display name, e.g. "Default Button"
    private JSONObject components;  // updateComponents content
    private JSONObject dataModel;   // updateDataModel content
    
    public SubStory(String parentName, String subName, JSONObject components, JSONObject dataModel) {
        this.parentName = parentName;
        this.subName = subName;
        this.displayName = subName;  // Use subName as display name by default
        this.components = components;
        this.dataModel = dataModel;
    }
    
    public SubStory(String parentName, String subName, String displayName, 
                    JSONObject components, JSONObject dataModel) {
        this.parentName = parentName;
        this.subName = subName;
        this.displayName = displayName;
        this.components = components;
        this.dataModel = dataModel;
    }
    
    public String getParentName() {
        return parentName;
    }
    
    public String getSubName() {
        return subName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
    
    public JSONObject getComponents() {
        return components;
    }
    
    public JSONObject getDataModel() {
        return dataModel;
    }
    
    /**
     * Get formatted Components JSON string
     */
    public String getComponentsString() {
        try {
            return components.toString(2);  // Indent with 2 spaces
        } catch (JSONException e) {
            return components.toString();
        }
    }
    
    /**
     * Get formatted DataModel JSON string
     */
    public String getDataModelString() {
        try {
            return dataModel.toString(2);
        } catch (JSONException e) {
            return dataModel.toString();
        }
    }
    
    /**
     * Get full path
     */
    public String getFullPath() {
        return parentName + "/" + subName;
    }
}
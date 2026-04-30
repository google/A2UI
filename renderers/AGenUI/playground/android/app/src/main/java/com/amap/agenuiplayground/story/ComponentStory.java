package com.amap.agenuiplayground.story;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Component Story
 * Contains the complete display of a component (aggregates all variants)
 * 
 */
public class ComponentStory {
    
    private String componentName;       // Component name, e.g. "Text"
    private JSONObject components;      // updateComponents content (compatible with legacy single-file structure)
    private JSONObject dataModel;       // updateDataModel content (compatible with legacy single-file structure)
    private List<SubStory> subStories;  // Sub-story list (new two-level directory structure)
    private boolean isExpanded;         // Whether expanded (for UI display)
    
    /**
     * Constructor - Legacy single-file structure
     */
    public ComponentStory(String componentName, JSONObject components, JSONObject dataModel) {
        this.componentName = componentName;
        this.components = components;
        this.dataModel = dataModel;
        this.subStories = new ArrayList<>();
        this.isExpanded = false;
    }
    
    /**
     * Constructor - New two-level directory structure
     */
    public ComponentStory(String componentName, List<SubStory> subStories) {
        this.componentName = componentName;
        this.subStories = subStories != null ? subStories : new ArrayList<>();
        this.isExpanded = false;
        // Compatibility: Use empty objects if no sub-stories
        this.components = new JSONObject();
        this.dataModel = new JSONObject();
    }
    
    public String getComponentName() {
        return componentName;
    }
    
    public JSONObject getComponents() {
        return components;
    }
    
    public JSONObject getDataModel() {
        return dataModel;
    }
    
    public List<SubStory> getSubStories() {
        return subStories;
    }
    
    public void setSubStories(List<SubStory> subStories) {
        this.subStories = subStories;
    }
    
    public void addSubStory(SubStory subStory) {
        if (this.subStories == null) {
            this.subStories = new ArrayList<>();
        }
        this.subStories.add(subStory);
    }
    
    public boolean isExpanded() {
        return isExpanded;
    }
    
    public void setExpanded(boolean expanded) {
        isExpanded = expanded;
    }
    
    public void toggleExpanded() {
        isExpanded = !isExpanded;
    }
    
    /**
     * Check if has sub-stories
     */
    public boolean hasSubStories() {
        return subStories != null && !subStories.isEmpty();
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
}
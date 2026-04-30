package com.amap.agenuiplayground.story;

import android.content.Context;
import android.util.Log;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

/**
 * Story Loader
 * Load component stories from assets directory
 * 
 */
public class StoryLoader {
    
    private static final String TAG = "StoryLoader";
    private static final String STORIES_DIR = "stories";
    
    private Context context;
    
    public StoryLoader(Context context) {
        this.context = context;
    }
    
    /**
     * Scan and load all stories
     * 
     * @return Component list
     */
    public List<ComponentStory> loadAllStories() {
        List<ComponentStory> stories = new ArrayList<>();
        
        try {
            // List all component folders under stories directory
            String[] componentDirs = context.getAssets().list(STORIES_DIR);
            
            if (componentDirs == null || componentDirs.length == 0) {
                Log.w(TAG, "No component directories found");
                return stories;
            }
            
            // Iterate through each component folder
            for (String componentName : componentDirs) {
                ComponentStory story = loadComponentStory(componentName);
                if (story != null) {
                    stories.add(story);
                }
            }
            
            Log.i(TAG, "Loaded " + stories.size() + " component stories");
            
        } catch (IOException e) {
            Log.e(TAG, "Failed to load stories", e);
        }
        
        return stories;
    }
    
    /**
     * Load story for a single component
     * 
     * @param componentName Component name (e.g. "Text")
     * @return ComponentStory object
     */
    private ComponentStory loadComponentStory(String componentName) {
        try {
            String componentPath = STORIES_DIR + "/" + componentName;
            
            // Try to list subdirectories
            String[] subDirs = context.getAssets().list(componentPath);
            
            if (subDirs == null || subDirs.length == 0) {
                Log.w(TAG, "No subdirectories found for: " + componentName);
                return null;
            }
            
            // Check if it's the new two-level directory structure (contains subfolders)
            boolean hasSubDirectories = false;
            for (String item : subDirs) {
                try {
                    // Try to list the item's contents, success indicates it's a directory
                    String[] subItems = context.getAssets().list(componentPath + "/" + item);
                    if (subItems != null && subItems.length > 0) {
                        hasSubDirectories = true;
                        break;
                    }
                } catch (Exception e) {
                    // Not a directory, continue checking
                }
            }
            
            if (hasSubDirectories) {
                // New two-level directory structure
                return loadComponentStoryWithSubDirs(componentName, componentPath, subDirs);
            } else {
                // Legacy single-file structure (compatibility)
                return loadComponentStoryLegacy(componentName, componentPath);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to load component story: " + componentName, e);
            return null;
        }
    }
    
    /**
     * Load story with new two-level directory structure
     */
    private ComponentStory loadComponentStoryWithSubDirs(String componentName, 
                                                         String componentPath, 
                                                         String[] subDirs) {
        List<SubStory> subStories = new ArrayList<>();
        
        for (String subDir : subDirs) {
            try {
                String subPath = componentPath + "/" + subDir;
                
                // Check if it's a directory
                String[] files = context.getAssets().list(subPath);
                if (files == null || files.length == 0) {
                    continue;  // Not a directory, skip
                }
                
                // Check if contains required files
                boolean hasComponents = false;
                boolean hasDataModel = false;
                for (String file : files) {
                    if ("updateComponents.json".equals(file)) {
                        hasComponents = true;
                    } else if ("updateDataModel.json".equals(file)) {
                        hasDataModel = true;
                    }
                }
                
                if (!hasComponents) {
                    Log.w(TAG, "Missing updateComponents.json in: " + subPath);
                    continue;
                }
                
                // Read JSON files
                String componentsJson = loadAssetFile(subPath + "/updateComponents.json");
                String dataModelJson = hasDataModel ? 
                    loadAssetFile(subPath + "/updateDataModel.json") : "{}";
                
                // Create SubStory
                SubStory subStory = new SubStory(
                    componentName,
                    subDir,
                    new JSONObject(componentsJson),
                    new JSONObject(dataModelJson)
                );
                
                subStories.add(subStory);
                Log.d(TAG, "Loaded sub story: " + componentName + "/" + subDir);
                
            } catch (Exception e) {
                Log.e(TAG, "Failed to load sub story: " + componentName + "/" + subDir, e);
            }
        }
        
        if (subStories.isEmpty()) {
            Log.w(TAG, "No valid sub stories found for: " + componentName);
            return null;
        }
        
        ComponentStory story = new ComponentStory(componentName, subStories);
        Log.d(TAG, "Loaded component story with " + subStories.size() + " sub stories: " + componentName);
        
        return story;
    }
    
    /**
     * Load story with legacy single-file structure (compatibility)
     */
    private ComponentStory loadComponentStoryLegacy(String componentName, String componentPath) {
        try {
            // Read updateComponents.json
            String componentsJson = loadAssetFile(
                componentPath + "/updateComponents.json"
            );
            
            // Read updateDataModel.json
            String dataModelJson = loadAssetFile(
                componentPath + "/updateDataModel.json"
            );
            
            // Create Story object
            ComponentStory story = new ComponentStory(
                componentName,
                new JSONObject(componentsJson),
                new JSONObject(dataModelJson)
            );
            
            Log.d(TAG, "Loaded legacy component story: " + componentName);
            
            return story;
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to load legacy component story: " + componentName, e);
            return null;
        }
    }
    
    /**
     * Load all stories from Gallery directory
     * 
     * @return List of SubStory objects
     */
    public List<SubStory> loadGalleryStories() {
        List<SubStory> galleryStories = new ArrayList<>();
        
        try {
            String galleryPath = STORIES_DIR + "/Gallery";
            
            // List all subdirectories under Gallery
            String[] subDirs = context.getAssets().list(galleryPath);
            
            if (subDirs == null || subDirs.length == 0) {
                Log.w(TAG, "No subdirectories found in Gallery");
                return galleryStories;
            }
            
            // Iterate through each subdirectory (UUID folders)
            for (String subDir : subDirs) {
                try {
                    String subPath = galleryPath + "/" + subDir;
                    
                    // Check if it's a directory
                    String[] files = context.getAssets().list(subPath);
                    if (files == null || files.length == 0) {
                        continue;  // Not a directory, skip
                    }
                    
                    // Check if contains required files
                    boolean hasComponents = false;
                    boolean hasDataModel = false;
                    for (String file : files) {
                        if ("updateComponents.json".equals(file)) {
                            hasComponents = true;
                        } else if ("updateDataModel.json".equals(file)) {
                            hasDataModel = true;
                        }
                    }
                    
                    if (!hasComponents) {
                        Log.w(TAG, "Missing updateComponents.json in: " + subPath);
                        continue;
                    }
                    
                    // Read JSON files
                    String componentsJson = loadAssetFile(subPath + "/updateComponents.json");
                    String dataModelJson = hasDataModel ? 
                        loadAssetFile(subPath + "/updateDataModel.json") : "{}";
                    
                    // Create SubStory with UUID as display name
                    SubStory subStory = new SubStory(
                        "Gallery",
                        subDir,  // UUID as display name
                        new JSONObject(componentsJson),
                        new JSONObject(dataModelJson)
                    );
                    
                    galleryStories.add(subStory);
                    Log.d(TAG, "Loaded Gallery story: " + subDir);
                    
                } catch (Exception e) {
                    Log.e(TAG, "Failed to load Gallery story: " + subDir, e);
                }
            }
            
            Log.i(TAG, "Loaded " + galleryStories.size() + " Gallery stories");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to load Gallery stories", e);
        }
        
        return galleryStories;
    }
    
    /**
     * Load all stories from A2UI Show directory
     * 
     * @return List of SubStory objects
     */
    public List<SubStory> loadA2UIShowStories() {
        List<SubStory> a2uiStories = new ArrayList<>();
        
        try {
            String a2uiShowPath = STORIES_DIR + "/A2UI Show";
            
            // List all subdirectories under A2UI Show
            String[] subDirs = context.getAssets().list(a2uiShowPath);
            
            if (subDirs == null || subDirs.length == 0) {
                Log.w(TAG, "No subdirectories found in A2UI Show");
                return a2uiStories;
            }
            
            // Iterate through each subdirectory
            for (String subDir : subDirs) {
                try {
                    String subPath = a2uiShowPath + "/" + subDir;
                    
                    // Check if it's a directory
                    String[] files = context.getAssets().list(subPath);
                    if (files == null || files.length == 0) {
                        continue;  // Not a directory, skip
                    }
                    
                    // Check if contains required files
                    boolean hasComponents = false;
                    boolean hasDataModel = false;
                    for (String file : files) {
                        if ("updateComponents.json".equals(file)) {
                            hasComponents = true;
                        } else if ("updateDataModel.json".equals(file)) {
                            hasDataModel = true;
                        }
                    }
                    
                    if (!hasComponents) {
                        Log.w(TAG, "Missing updateComponents.json in: " + subPath);
                        continue;
                    }
                    
                    // Read JSON files
                    String componentsJson = loadAssetFile(subPath + "/updateComponents.json");
                    String dataModelJson = hasDataModel ? 
                        loadAssetFile(subPath + "/updateDataModel.json") : "{}";
                    
                    // Create SubStory
                    SubStory subStory = new SubStory(
                        "A2UI Show",
                        subDir,
                        new JSONObject(componentsJson),
                        new JSONObject(dataModelJson)
                    );
                    
                    a2uiStories.add(subStory);
                    Log.d(TAG, "Loaded A2UI Show story: " + subDir);
                    
                } catch (Exception e) {
                    Log.e(TAG, "Failed to load A2UI Show story: " + subDir, e);
                }
            }
            
            Log.i(TAG, "Loaded " + a2uiStories.size() + " A2UI Show stories");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to load A2UI Show stories", e);
        }
        
        return a2uiStories;
    }
    
    /**
     * Read file content from assets
     */
    private String loadAssetFile(String path) throws IOException {
        InputStream is = context.getAssets().open(path);
        BufferedReader reader = new BufferedReader(
            new InputStreamReader(is, "UTF-8")
        );
        
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        
        reader.close();
        return sb.toString();
    }
}

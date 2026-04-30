package com.amap.agenuiplayground;

import android.Manifest;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.amap.agenui.AGenUI;
import com.amap.agenui.render.surface.ISurfaceManagerListener;
import com.amap.agenui.render.surface.Surface;
import com.amap.agenui.render.surface.SurfaceManager;
import com.amap.agenuiplayground.adapter.ComponentAdapter;
import com.amap.agenuiplayground.component.factory.ChartComponentFactory;
import com.amap.agenuiplayground.component.factory.LottieComponentFactory;
import com.amap.agenuiplayground.component.factory.MarkdownComponentFactory;
import com.amap.agenuiplayground.function.ToastFunction;
import com.amap.agenuiplayground.story.ComponentStory;
import com.amap.agenuiplayground.story.StoryLoader;
import com.amap.agenuiplayground.story.SubStory;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.navigation.NavigationView;
import com.google.android.material.tabs.TabLayout;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonParser;
import com.google.gson.JsonSyntaxException;
import com.journeyapps.barcodescanner.ScanContract;
import com.journeyapps.barcodescanner.ScanOptions;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * A2UI Playground Activity
 *
 * Features:
 * 1. Display A2UI component rendering effects
 * 2. Support editing Components and DataModel JSON
 * 3. Real-time preview of rendering results
 * 4. Display log information
 *
 */
public class A2UIPlaygroundActivity extends AppCompatActivity {

    // UI Components
    private DrawerLayout drawerLayout;
    private MaterialToolbar toolbar;
    private ActionBarDrawerToggle drawerToggle;
    private NavigationView navigationView;
    private RecyclerView rvComponentList;
    private View customComponentMenuItem;
    private View a2uiShowAllMenuItem;
    private View galleryLoadAllMenuItem;
    private FrameLayout renderContainer;
    private FrameLayout renderContent;

    // Log Area
    private LinearLayout logsContainer;
    private View logsHeader;
    private TextView tvLogsToggle;
    private ScrollView logsScrollView;
    private LinearLayout logsContent;

    // Edit Drawer
    private TabLayout tabLayout;
    private EditText etJsonEditor;
    private Button btnFormat;
    private Button btnValidate;
    private Button btnCancel;
    private Button btnSave;

    // Data
    private String currentComponentsJson = "{}";
    private String currentDataModelJson = "{}";
    private boolean logsExpanded = false;
    private EditorType currentEditorType = EditorType.NONE;

    // Story Related
    private StoryLoader storyLoader;
    private ComponentAdapter componentAdapter;
    private List<ComponentStory> componentStories;

    // A2UI Framework
    private AGenUI aGenUI;

    // Rendering Framework
    private SurfaceManager surfaceManager;
    private String currentSurfaceId = null;

    // Performance Monitor
    private PerformanceMonitor performanceMonitor;
    private View performanceOverlay;
    private TextView tvFps;
    private TextView tvMemory;
    private TextView tvAvgFps;
    private boolean performanceMonitorEnabled = false;

    // Day/Night Mode
    private boolean isDarkMode = false;
    private SharedPreferences themePrefs;
    private static final String PREFS_NAME = "theme_prefs";
    private static final String KEY_DARK_MODE = "dark_mode";

    // QR code scanning related
    private ActivityResultLauncher<ScanOptions> barcodeLauncher;
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 1002;
    private ExecutorService executorService = Executors.newSingleThreadExecutor();
    private Handler mainHandler = new Handler(Looper.getMainLooper());

    private static final String TAG = "A2UIPlayground";

    // Streaming mode configuration
    private static final boolean STREAMING_MODE_ENABLED = true;
    private static final int DEFAULT_STREAMING_CHUNK_SIZE = 100;
    private static final long DEFAULT_STREAMING_DELAY_MS = 100;
    private final Handler streamingHandler = new Handler(Looper.getMainLooper());

    private enum EditorType {
        NONE,
        COMPONENTS,
        DATA_MODEL
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Initialize theme preferences
        themePrefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        isDarkMode = themePrefs.getBoolean(KEY_DARK_MODE, false);

        // Apply saved theme
        applyTheme(isDarkMode);

        setContentView(R.layout.activity_a2ui_playground);

        initViews();
        setupToolbar();
        setupNavigationDrawer();
        setupLogsArea();
        setupDrawer();

        // Initialize Story loader
        initStoryLoader();

        // Initialize QR code scanning
        initBarcodeLauncher();

        // Initialize A2UI Framework
        initAGenUI();

        // Automatically show the performance monitor overlay on startup
        togglePerformanceMonitor();
    }

    /**
     * Initialize views
     */
    private void initViews() {
        // Main layout
        drawerLayout = findViewById(R.id.drawerLayout);
        toolbar = findViewById(R.id.toolbar);
        navigationView = findViewById(R.id.navigationView);
        rvComponentList = navigationView.findViewById(R.id.rvComponentList);
        customComponentMenuItem = navigationView.findViewById(R.id.customComponentMenuItem);
        a2uiShowAllMenuItem = navigationView.findViewById(R.id.a2uiShowAllMenuItem);
        galleryLoadAllMenuItem = navigationView.findViewById(R.id.galleryLoadAllMenuItem);
        renderContainer = findViewById(R.id.renderContainer);
        renderContent = findViewById(R.id.renderContent);

        // Log area
        logsContainer = findViewById(R.id.logsContainer);
        logsHeader = findViewById(R.id.logsHeader);
        tvLogsToggle = findViewById(R.id.tvLogsToggle);
        logsScrollView = findViewById(R.id.logsScrollView);
        logsContent = findViewById(R.id.logsContent);

        // Edit drawer
        tabLayout = findViewById(R.id.tabLayout);
        etJsonEditor = findViewById(R.id.etJsonEditor);
        btnFormat = findViewById(R.id.btnFormat);
        btnValidate = findViewById(R.id.btnValidate);
        btnCancel = findViewById(R.id.btnCancel);
        btnSave = findViewById(R.id.btnSave);

        // Performance overlay
        performanceOverlay = findViewById(R.id.performanceOverlay);
        tvFps = findViewById(R.id.tvFps);
        tvMemory = findViewById(R.id.tvMemory);
        tvAvgFps = findViewById(R.id.tvAvgFps);
    }

    /**
     * Setup toolbar
     */
    private void setupToolbar() {
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setHomeAsUpIndicator(R.drawable.ic_menu);
        }

        // Setup ActionBarDrawerToggle
        drawerToggle = new ActionBarDrawerToggle(
            this,
            drawerLayout,
            toolbar,
            R.string.drawer_nav_title,
            R.string.drawer_close
        );
        drawerLayout.addDrawerListener(drawerToggle);
        drawerToggle.syncState();
    }

    /**
     * Setup left navigation drawer
     */
    private void setupNavigationDrawer() {
        // Setup RecyclerView
        rvComponentList.setLayoutManager(new LinearLayoutManager(this));

        // Create adapter
        componentAdapter = new ComponentAdapter();
        rvComponentList.setAdapter(componentAdapter);

        // Setup click listener
        componentAdapter.setOnItemClickListener(new ComponentAdapter.OnItemClickListener() {
            @Override
            public void onParentClick(ComponentStory story) {
                // Close navigation drawer
                drawerLayout.closeDrawer(GravityCompat.START);

                // Load component Story (compatible with old version without sub-items)
                loadComponentStory(story);
            }

            @Override
            public void onChildClick(SubStory subStory) {
                // Close navigation drawer
                drawerLayout.closeDrawer(GravityCompat.START);

                // Load sub Story
                loadSubStory(subStory);
            }
        });

        // Setup custom component menu item click listener
        customComponentMenuItem.setOnClickListener(v -> {
            // Close left drawer
            drawerLayout.closeDrawer(GravityCompat.START);

            // Set default JSON template
            currentComponentsJson = getDefaultComponentsTemplate();
            currentDataModelJson = "{}";

            // Open right edit drawer
            openEditor(EditorType.COMPONENTS);

            addLog("Open custom component editor");
        });

        // Setup A2UI Show All menu item click listener
        a2uiShowAllMenuItem.setOnClickListener(v -> {
            // Close left drawer
            drawerLayout.closeDrawer(GravityCompat.START);

            // Load all A2UI Show components
            loadAllA2UIShowComponents();
        });

        // Setup Gallery Load All menu item click listener
        galleryLoadAllMenuItem.setOnClickListener(v -> {
            // Close left drawer
            drawerLayout.closeDrawer(GravityCompat.START);

            // Load all Gallery components
            loadAllGalleryComponents();
        });
    }

    /**
     * Initialize Story loader
     */
    private void initStoryLoader() {
        storyLoader = new StoryLoader(this);

        // Load all Stories
        componentStories = storyLoader.loadAllStories();

        // Update adapter
        if (componentAdapter != null) {
            componentAdapter.setStories(componentStories);
        }

        addLog("Loaded " + componentStories.size() + " components");
    }

    /**
     * Load component Story (compatible with old version)
     */
    private void loadComponentStory(ComponentStory story) {
        // Update Components JSON
        currentComponentsJson = story.getComponentsString();

        // Update DataModel JSON
        currentDataModelJson = story.getDataModelString();

        // Update title
        updateToolbarTitle(story.getComponentName());

        // Add log
        addLog("Loaded component: " + story.getComponentName());

        // If editor is open, update editor content
        if (currentEditorType == EditorType.COMPONENTS) {
            etJsonEditor.setText(currentComponentsJson);
        } else if (currentEditorType == EditorType.DATA_MODEL) {
            etJsonEditor.setText(currentDataModelJson);
        }

        // Call A2UI rendering
        renderComponents();
    }

    /**
     * Load sub Story
     */
    private void loadSubStory(SubStory subStory) {
        // Update Components JSON
        currentComponentsJson = subStory.getComponentsString();

        // Update DataModel JSON
        currentDataModelJson = subStory.getDataModelString();

        // Update title (format: "Button / default")
        String title = subStory.getParentName() + " / " + subStory.getDisplayName();
        updateToolbarTitle(title);

        // Add log
        addLog("Loaded sub-example: " + subStory.getParentName() + " / " + subStory.getDisplayName());

        // If editor is open, update editor content
        if (currentEditorType == EditorType.COMPONENTS) {
            etJsonEditor.setText(currentComponentsJson);
        } else if (currentEditorType == EditorType.DATA_MODEL) {
            etJsonEditor.setText(currentDataModelJson);
        }

        // Call A2UI render
        renderComponents();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_playground, menu);

        // Setup theme switch
        MenuItem themeItem = menu.findItem(R.id.action_toggle_theme);
        if (themeItem != null) {
            View actionView = themeItem.getActionView();
            if (actionView != null) {
                androidx.appcompat.widget.SwitchCompat themeSwitch =
                    actionView.findViewById(R.id.themeSwitch);
                if (themeSwitch != null) {
                    // Set initial state (inverted: checked = day mode, unchecked = night mode)
                    themeSwitch.setChecked(!isDarkMode);

                    // Set listener
                    themeSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
                        // Invert logic: checked (sun side) = day mode, unchecked (moon side) = night mode
                        isDarkMode = !isChecked;

                        // Save theme preference
                        themePrefs.edit().putBoolean(KEY_DARK_MODE, isDarkMode).apply();

                        // Update AGenUI theme (renderer handles day/night internally)
                        String mode = isDarkMode ? "dark" : "light";
                        if (aGenUI != null) {
                            aGenUI.setDayNightMode(mode);
                            addLog("Switching theme mode: " + mode);
                        }

                        String message = isDarkMode ? "Switched to night mode" : "Switched to day mode";
                        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
                    });
                }
            }
        }

        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        int id = item.getItemId();

        if (id == R.id.action_edit) {
            // Click "Edit" button, open right edit drawer
            openEditor(EditorType.COMPONENTS);
            return true;
        } else if (id == R.id.action_scan) {
            // Click the "Scan" button to launch QR code scanning
            startQrCodeScan();
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    /**
     * Setup log area
     */
    private void setupLogsArea() {
        logsHeader.setOnClickListener(v -> toggleLogs());
    }

    /**
     * Setup edit drawer
     */
    private void setupDrawer() {
        // Tab switch listener
        tabLayout.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                onTabChanged(tab.getPosition());
            }

            @Override
            public void onTabUnselected(TabLayout.Tab tab) {
                // Save current editing content
                saveCurrentTabContent();
            }

            @Override
            public void onTabReselected(TabLayout.Tab tab) {
                // Do nothing
            }
        });

        // Format button
        btnFormat.setOnClickListener(v -> formatJson());

        // Validate button
        btnValidate.setOnClickListener(v -> validateJson());

        // Cancel button
        btnCancel.setOnClickListener(v -> closeDrawer());

        // Save button
        btnSave.setOnClickListener(v -> saveAndRender());
    }

    /**
     * Open editor
     */
    private void openEditor(EditorType type) {
        // 🔧 Fix: Save current content before switching state
        // This prevents the bug where content gets saved to wrong variable
        // when tabLayout.selectTab() triggers onTabUnselected callback
        saveCurrentTabContent();

        currentEditorType = type;

        // 🔧 Fix: Set editor content BEFORE selecting tab
        // This ensures that when onTabUnselected is triggered by selectTab(),
        // the editor already contains the correct content for the new tab
        switch (type) {
            case COMPONENTS:
                etJsonEditor.setText(currentComponentsJson);  // Set content first
                tabLayout.selectTab(tabLayout.getTabAt(0));   // Then select tab
                break;
            case DATA_MODEL:
                etJsonEditor.setText(currentDataModelJson);
                tabLayout.selectTab(tabLayout.getTabAt(1));
                break;
        }

        // Open right drawer
        View drawerView = findViewById(R.id.drawerJsonEditor);
        if (drawerView != null) {
            drawerLayout.openDrawer(GravityCompat.END);
        }
    }

    /**
     * Callback when Tab switches
     */
    private void onTabChanged(int position) {
        switch (position) {
            case 0: // Components
                currentEditorType = EditorType.COMPONENTS;
                etJsonEditor.setText(currentComponentsJson);
                addLog("Switch to Components editing");
                break;
            case 1: // DataModel
                currentEditorType = EditorType.DATA_MODEL;
                etJsonEditor.setText(currentDataModelJson);
                addLog("Switch to DataModel editing");
                break;
        }
    }

    /**
     * Save current Tab content
     */
    private void saveCurrentTabContent() {
        // 🔧 Fix: Only save when currentEditorType is valid
        // This prevents saving wrong content when editor type is NONE
        // (e.g., after closeDrawer() sets type to NONE but editor still has old content)
        if (currentEditorType == EditorType.NONE) {
            return;
        }

        String json = etJsonEditor.getText().toString().trim();

        switch (currentEditorType) {
            case COMPONENTS:
                currentComponentsJson = json;
                break;
            case DATA_MODEL:
                currentDataModelJson = json;
                break;
        }
    }

    /**
     * Close drawer
     */
    private void closeDrawer() {
        drawerLayout.closeDrawers();
        currentEditorType = EditorType.NONE;
    }

    /**
     * Format JSON
     */
    private void formatJson() {
        String json = etJsonEditor.getText().toString().trim();
        if (json.isEmpty()) {
            Toast.makeText(this, "JSON is empty", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            // Use Gson to format JSON
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            Object jsonObject = JsonParser.parseString(json);
            String formattedJson = gson.toJson(jsonObject);

            // Update editor content
            etJsonEditor.setText(formattedJson);

            Toast.makeText(this, "Format successful", Toast.LENGTH_SHORT).show();
            addLog("JSON format successful");
        } catch (JsonSyntaxException e) {
            Toast.makeText(this, "JSON format error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            addLog("JSON format failed: " + e.getMessage());
        } catch (Exception e) {
            Toast.makeText(this, "Format failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            addLog("Format failed: " + e.getMessage());
        }
    }

    /**
     * Validate JSON
     */
    private void validateJson() {
        String json = etJsonEditor.getText().toString().trim();
        if (json.isEmpty()) {
            Toast.makeText(this, "JSON is empty", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            // Use Gson to validate JSON
            JsonParser.parseString(json);
            Toast.makeText(this, "JSON format is correct", Toast.LENGTH_SHORT).show();
            addLog("JSON validation passed");
        } catch (JsonSyntaxException e) {
            Toast.makeText(this, "JSON format error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            addLog("JSON validation failed: " + e.getMessage());
        } catch (Exception e) {
            Toast.makeText(this, "JSON format error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            addLog("JSON validation failed: " + e.getMessage());
        }
    }

    /**
     * Save and render
     */
    private void saveAndRender() {
        // First save current Tab content
        saveCurrentTabContent();

        // Add log
        switch (currentEditorType) {
            case COMPONENTS:
                addLog("Components updated");
                break;
            case DATA_MODEL:
                addLog("DataModel updated");
                break;
        }

        closeDrawer();

        renderComponents();
    }

    /**
     * Initialize A2UI Framework
     */
    private void initAGenUI() {
        try {
            // 1. Initialize AGenUI engine (idempotent)
            aGenUI = AGenUI.getInstance();
            aGenUI.initialize(getApplicationContext());
            addLog("AGenUI initialized");

            // 2. Create SurfaceManager
            surfaceManager = new SurfaceManager(this);
            addLog("SurfaceManager created: " + surfaceManager);

            // 3. Register Surface listener
            surfaceManager.addListener(new ISurfaceManagerListener() {
                @Override
                public void onCreateSurface(Surface surface) {
                    runOnUiThread(() -> {
                        String surfaceId = surface.getSurfaceId();
                        currentSurfaceId = surfaceId;
                        addLog("✓ Surface created: " + surfaceId);

                        // Clear previous content
                        renderContent.removeAllViews();

                        // Add Surface's internal container to our ViewTree
                        renderContent.addView(surface.getContainer());
                        addLog("✓ Surface container added to ViewTree");
                    });
                }

                @Override
                public void onDeleteSurface(Surface surface) {
                    runOnUiThread(() -> {
                        addLog("Surface deleted: " + surface.getSurfaceId());
                    });
                }
            });

            // 4. Copy UI Templates and set the working directory
            String sandboxDir = UITemplatesCopier.copyUITemplatesToSandbox(this);
            if (!TextUtils.isEmpty(sandboxDir)) {
                //todo
//                aGenUI.setWorkdir(sandboxDir);
            } else {
                addLog("AGenUI init: failed to copy UI Templates");
            }

            // 5. Register Components and Functions
            AGenUI.getInstance().registerFunction(new ToastFunction(this));

            AGenUI.getInstance().registerComponent("Markdown", new MarkdownComponentFactory());
            AGenUI.getInstance().registerComponent("Lottie", new LottieComponentFactory());
            AGenUI.getInstance().registerComponent("Chart", new ChartComponentFactory());

            addLog("A2UI Framework initialized successfully");

        } catch (Exception e) {
            addLog("A2UI Framework initialization failed: " + e.getMessage());
            Log.e(TAG, "Failed to initialize AGenUI", e);
            e.printStackTrace();
        }
    }

    /**
     * Render components
     */
    private void renderComponents() {
        if (aGenUI == null) {
            addLog("Error: A2UI Framework not initialized");
            Toast.makeText(this, "A2UI Framework not initialized", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            addLog("Start rendering...");

            // Cancel any ongoing streaming to avoid conflicts
            streamingHandler.removeCallbacksAndMessages(null);

            // 🔧 Key fix: Generate unique surfaceId
            String newSurfaceId = "surface_" + System.currentTimeMillis();
            addLog("Generated new Surface ID: " + newSurfaceId);

            // 🔧 Key fix: Replace surfaceId in JSON
            String updatedComponentsJson = replaceSurfaceIdInJson(currentComponentsJson, newSurfaceId);
            String updatedDataModelJson = replaceSurfaceIdInJson(currentDataModelJson, newSurfaceId);

            addLog("Surface ID replaced");

            // 1. Send createSurface
            JSONObject createSurfaceJson = new JSONObject();
            createSurfaceJson.put("version", "v0.9");

            JSONObject createSurfaceData = new JSONObject();
            createSurfaceData.put("surfaceId", newSurfaceId);
            createSurfaceData.put("catalogId", "https://a2ui.org/specification/v0_9/standard_catalog.json");

            createSurfaceJson.put("createSurface", createSurfaceData);

            surfaceManager.receiveTextChunk(createSurfaceJson.toString());
            addLog("1/3 Sent createSurface");

            if (STREAMING_MODE_ENABLED) {
                // Streaming mode: send updateComponents and updateDataModel in chunks
                addLog("Streaming mode ON");

                // 2. Stream updateComponents
                addLog("2/3 Streaming updateComponents...");
                surfaceManager.receiveTextChunk(updatedComponentsJson);

                // 3. Stream updateDataModel (if not empty)
                if (!updatedDataModelJson.equals("{}")) {
                    addLog("3/3 Streaming updateDataModel...");
                    sendChunksStreaming(updatedDataModelJson, DEFAULT_STREAMING_CHUNK_SIZE, DEFAULT_STREAMING_DELAY_MS, () -> {
                        addLog("3/3 updateDataModel streaming complete");
                        currentSurfaceId = newSurfaceId;
                        addLog("Rendering complete!");
                        Toast.makeText(this, "Render successful (streaming)", Toast.LENGTH_SHORT).show();
                    });
                } else {
                    addLog("3/3 updateDataModel is empty, skipped");
                    currentSurfaceId = newSurfaceId;
                    addLog("Rendering complete!");
                    Toast.makeText(this, "Render successful (streaming)", Toast.LENGTH_SHORT).show();
                }
            } else {
                // Normal mode: send all at once
                // 2. Send updateComponents
                surfaceManager.receiveTextChunk(updatedComponentsJson);
                addLog("2/3 Sent updateComponents");

                // 3. Send updateDataModel (if not empty)
                if (!updatedDataModelJson.equals("{}")) {
                    surfaceManager.receiveTextChunk(updatedDataModelJson);
                    addLog("3/3 Sent updateDataModel");
                } else {
                    addLog("3/3 updateDataModel is empty, skipped");
                }

                // Update current surfaceId
                currentSurfaceId = newSurfaceId;

                addLog("Rendering complete!");
                Toast.makeText(this, "Render successful", Toast.LENGTH_SHORT).show();
            }

        } catch (JSONException e) {
            addLog("JSON parse error: " + e.getMessage());
            Toast.makeText(this, "JSON format error", Toast.LENGTH_SHORT).show();
            Log.e(TAG, "Failed to parse JSON", e);
        } catch (Exception e) {
            addLog("Render failed: " + e.getMessage());
            Toast.makeText(this, "Render failed", Toast.LENGTH_SHORT).show();
            Log.e(TAG, "Failed to render", e);
        }
    }

    /**
     * Replace surfaceId in JSON
     *
     * @param json         Original JSON string
     * @param newSurfaceId New surfaceId
     * @return Replaced JSON string
     */
    private String replaceSurfaceIdInJson(String json, String newSurfaceId) {
        try {
            JSONObject jsonObj = new JSONObject(json);

            // Check if updateComponents exists
            if (jsonObj.has("updateComponents")) {
                JSONObject updateComponents = jsonObj.getJSONObject("updateComponents");
                updateComponents.put("surfaceId", newSurfaceId);
            }

            // Check if updateDataModel exists
            if (jsonObj.has("updateDataModel")) {
                JSONObject updateDataModel = jsonObj.getJSONObject("updateDataModel");
                updateDataModel.put("surfaceId", newSurfaceId);
            }

            return jsonObj.toString();
        } catch (JSONException e) {
            Log.e(TAG, "Failed to replace surfaceId in JSON", e);
            return json;  // If replacement fails, return original JSON
        }
    }

    /**
     * Send JSON string in chunks to simulate streaming effect.
     * Each chunk is delivered via surfaceManager.receiveTextChunk().
     *
     * @param json       The full JSON string to send
     * @param chunkSize  Number of characters per chunk
     * @param delayMs    Delay in milliseconds between each chunk
     * @param onComplete Callback when all chunks are sent (nullable)
     */
    private void sendChunksStreaming(String json, int chunkSize, long delayMs, Runnable onComplete) {
        int totalLength = json.length();
        int totalChunks = (int) Math.ceil((double) totalLength / chunkSize);
        addLog("Streaming: " + totalChunks + " chunks, " + chunkSize + " chars/chunk, " + delayMs + "ms delay");
        sendChunkAtIndex(json, 0, chunkSize, delayMs, totalChunks, onComplete);
    }

    private void sendChunkAtIndex(String json, int index, int chunkSize, long delayMs, int totalChunks, Runnable onComplete) {
        int start = index * chunkSize;
        if (start >= json.length()) {
            addLog("Streaming complete: " + totalChunks + " chunks sent");
            if (onComplete != null) {
                onComplete.run();
            }
            return;
        }

        int end = Math.min(start + chunkSize, json.length());
        String chunk = json.substring(start, end);

        surfaceManager.receiveTextChunk(chunk);
        addLog("Chunk " + (index + 1) + "/" + totalChunks + " sent (" + chunk.length() + " chars)");

        streamingHandler.postDelayed(() ->
            sendChunkAtIndex(json, index + 1, chunkSize, delayMs, totalChunks, onComplete),
            delayMs
        );
    }

    /**
     * Toggle performance monitor
     */
    private void togglePerformanceMonitor() {
        performanceMonitorEnabled = !performanceMonitorEnabled;

        if (performanceMonitorEnabled) {
            // Initialize and start performance monitor
            if (performanceMonitor == null) {
                performanceMonitor = new PerformanceMonitor(new PerformanceMonitor.PerformanceCallback() {
                    @Override
                    public void onPerformanceUpdate(int fps, float memoryMB, int avgFps) {
                        runOnUiThread(() -> {
                            // Update UI
                            tvFps.setText(String.format("FPS: %d", fps));
                            tvMemory.setText(String.format("MEM: %.1f MB", memoryMB));
                            tvAvgFps.setText(String.format("AVG: %d", avgFps));

                            // Set FPS color based on value
                            if (fps >= 55) {
                                tvFps.setTextColor(0xFF4CAF50); // Green
                            } else if (fps >= 30) {
                                tvFps.setTextColor(0xFFFF9800); // Orange
                            } else {
                                tvFps.setTextColor(0xFFF44336); // Red
                            }
                        });
                    }
                });
            }

            performanceMonitor.start();
            performanceOverlay.setVisibility(View.GONE);
            addLog("Performance monitor enabled");
            Toast.makeText(this, "Performance monitor enabled", Toast.LENGTH_SHORT).show();
        } else {
            // Stop performance monitor
            if (performanceMonitor != null) {
                performanceMonitor.stop();
            }
            performanceOverlay.setVisibility(View.GONE);
            addLog("Performance monitor disabled");
            Toast.makeText(this, "Performance monitor disabled", Toast.LENGTH_SHORT).show();
        }
    }

    /**
     * Initialize barcode scanning
     */
    private void initBarcodeLauncher() {
        barcodeLauncher = registerForActivityResult(new ScanContract(), result -> {
            if (result.getContents() != null) {
                String qrCodeUrl = result.getContents();
                Log.d(TAG, "Scan result: " + qrCodeUrl);
                addLog("Scan result: " + qrCodeUrl);
                // Download and process the file corresponding to the QR code
                downloadAndProcessQrCodeFile(qrCodeUrl);
            } else {
                Toast.makeText(A2UIPlaygroundActivity.this, "Scan cancelled", Toast.LENGTH_SHORT).show();
            }
        });
    }

    /**
     * Launch QR code scanning
     */
    private void startQrCodeScan() {
        // Check camera permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            // Request camera permission
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.CAMERA},
                    CAMERA_PERMISSION_REQUEST_CODE);
        } else {
            // Permission already granted; launch scanner
            launchQrCodeScanner();
        }
    }

    /**
     * Launch the QR code scanner
     */
    private void launchQrCodeScanner() {
        ScanOptions options = new ScanOptions();
        options.setPrompt("Scan QR code");
        options.setBeepEnabled(true);
        options.setBarcodeImageEnabled(true);
        options.setOrientationLocked(true);
        // Use the custom portrait-mode CaptureActivity
        options.setCaptureActivity(PortraitCaptureActivity.class);
        barcodeLauncher.launch(options);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CAMERA_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // Permission granted; launch scanner
                launchQrCodeScanner();
            } else {
                Toast.makeText(this, "Camera permission is required to scan QR codes", Toast.LENGTH_SHORT).show();
            }
        }
    }

    /**
     * Download and process the file corresponding to the QR code
     */
    private void downloadAndProcessQrCodeFile(String fileUrl) {
        executorService.execute(() -> {
            try {
                Log.d(TAG, "Starting file download: " + fileUrl);
                addLog("Starting file download: " + fileUrl);

                URL url = new URL(fileUrl);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);

                int responseCode = connection.getResponseCode();
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    InputStream inputStream = connection.getInputStream();
                    BufferedReader reader = new BufferedReader(
                            new InputStreamReader(inputStream, StandardCharsets.UTF_8));

                    String jsonArrayStr = reader.readLine();

                    reader.close();
                    inputStream.close();
                    connection.disconnect();
                    // Parse as JsonArray
                    try {
                        JsonArray jsonArray = JsonParser.parseString(jsonArrayStr).getAsJsonArray();
                        Gson gson = new GsonBuilder().create();

                        String createSurfaceJson = gson.toJson(jsonArray.get(0));
                        String updateComponentsJson = gson.toJson(jsonArray.get(1));
                        String updateDataModelJson = gson.toJson(jsonArray.get(2));

                        Log.d(TAG, "File download successful");
                        addLog("File download successful");
                        Log.d(TAG, "createSurface: " + createSurfaceJson);
                        Log.d(TAG, "updateComponents: " + updateComponentsJson);
                        Log.d(TAG, "updateDataModel: " + updateDataModelJson);

                        // Process rendering on the main thread
                        mainHandler.post(() -> {
                            processQrCodeJsonData(createSurfaceJson, updateComponentsJson, updateDataModelJson);
                        });
                    } catch (Exception e) {
                        Log.e(TAG, "JSON parse error", e);
                        addLog("JSON parse error: " + e.getMessage());
                        mainHandler.post(() -> {
                            Toast.makeText(this, "Parse failed, invalid format", Toast.LENGTH_SHORT).show();
                        });
                    }
                } else {
                    Log.e(TAG, "Download failed, response code: " + responseCode);
                    addLog("Download failed, response code: " + responseCode);
                    mainHandler.post(() -> {
                        Toast.makeText(this, "Download failed: " + responseCode, Toast.LENGTH_SHORT).show();
                    });
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to download or process file", e);
                addLog("Failed to download or process file: " + e.getMessage());
                mainHandler.post(() -> {
                    Toast.makeText(this, "Processing failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
            }
        });
    }

    /**
     * Process QR code JSON data and render
     */
    private void processQrCodeJsonData(String createSurfaceJson,
                                       String updateComponentsJson,
                                       String updateDataModelJson) {
        try {
            addLog("Starting to process QR code data...");

            surfaceManager.beginTextStream();

            // Process following the same logic as renderComponents
            if (createSurfaceJson != null && !createSurfaceJson.trim().isEmpty()) {
                surfaceManager.receiveTextChunk(createSurfaceJson);

                addLog("1/3 Sent createSurface");
            }

            if (updateComponentsJson != null && !updateComponentsJson.trim().isEmpty()) {
                surfaceManager.receiveTextChunk(updateComponentsJson);
                addLog("2/3 Sent updateComponents");

                // Save to current editor variable
                currentComponentsJson = updateComponentsJson;
            }

            if (updateDataModelJson != null && !updateDataModelJson.trim().isEmpty()) {
                surfaceManager.receiveTextChunk(updateDataModelJson);
                addLog("3/3 Sent updateDataModel");

                // Save to current editor variable
                currentDataModelJson = updateDataModelJson;
            } else {
                addLog("3/3 updateDataModel is empty, skipped");
            }

            surfaceManager.endTextStream();

            Toast.makeText(this, "QR code content rendered successfully", Toast.LENGTH_SHORT).show();
            addLog("✓ QR code content rendering complete");
        } catch (Exception e) {
            Log.e(TAG, "Failed to process QR code JSON data", e);
            addLog("❌ Render failed: " + e.getMessage());
            Toast.makeText(this, "Render failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Shutdown the thread pool
        if (executorService != null) {
            executorService.shutdown();
        }

        // Cancel any ongoing streaming
        streamingHandler.removeCallbacksAndMessages(null);

        // Stop performance monitor
        if (performanceMonitor != null) {
            performanceMonitor.stop();
            performanceMonitor = null;
        }

        // Clean up SurfaceManager resources
        if (surfaceManager != null) {
            try {
                surfaceManager.destroy();
                surfaceManager = null;
                currentSurfaceId = null;
                addLog("SurfaceManager destroyed");
            } catch (Exception e) {
                Log.e(TAG, "Failed to destroy SurfaceManager", e);
            }
        }
    }

    /**
     * Toggle log display
     */
    private void toggleLogs() {
        logsExpanded = !logsExpanded;

        if (logsExpanded) {
            logsScrollView.setVisibility(View.VISIBLE);
            tvLogsToggle.setText("▲");
        } else {
            logsScrollView.setVisibility(View.GONE);
            tvLogsToggle.setText("▼");
        }
    }

    /**
     * Get default Components JSON template
     */
    private String getDefaultComponentsTemplate() {
        return "{\n" +
               "  \"version\": \"v0.9\",\n" +
               "  \"updateComponents\": {\n" +
               "    \"surfaceId\": \"custom_surface\",\n" +
               "    \"components\": [\n" +
               "      {\n" +
               "        \"id\": \"root\",\n" +
               "        \"component\": \"Card\",\n" +
               "        \"child\": \"text1\"\n" +
               "      },\n" +
               "      {\n" +
               "        \"id\": \"text1\",\n" +
               "        \"component\": \"Text\",\n" +
               "        \"text\": \"Hello, A2UI!\",\n" +
               "        \"variant\": \"h2\"\n" +
               "      }\n" +
               "    ]\n" +
               "  }\n" +
               "}";
    }

    /**
     * Load all A2UI Show components and render them in a list
     */
    private void loadAllA2UIShowComponents() {
        if (aGenUI == null || surfaceManager == null) {
            addLog("Error: A2UI Framework not initialized");
            Toast.makeText(this, "A2UI Framework not initialized", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            addLog("Loading all A2UI Show components...");

            // Update title
            updateToolbarTitle("A2UI Show - All Components");

            // Load all A2UI Show stories
            List<SubStory> a2uiStories = storyLoader.loadA2UIShowStories();

            if (a2uiStories.isEmpty()) {
                addLog("No A2UI Show components found");
                Toast.makeText(this, "No components found", Toast.LENGTH_SHORT).show();
                return;
            }

            addLog("Found " + a2uiStories.size() + " components");

            // Clear current content
            renderContent.removeAllViews();

            // Destroy old surface if exists
            if (currentSurfaceId != null) {
                surfaceManager.destroy();
                surfaceManager = new SurfaceManager(this);
                currentSurfaceId = null;
            }

            // Create a scrollable container
            ScrollView scrollView = new ScrollView(this);
            scrollView.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ));

            LinearLayout container = new LinearLayout(this);
            container.setOrientation(LinearLayout.VERTICAL);
            container.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ));
            container.setPadding(16, 16, 16, 16);

            // Render each component
            for (int i = 0; i < a2uiStories.size(); i++) {
                SubStory story = a2uiStories.get(i);

                // Add component title
                TextView titleView = new TextView(this);
                titleView.setText((i + 1) + ". " + story.getDisplayName());
                titleView.setTextSize(18);
                titleView.setTextColor(getResources().getColor(R.color.purple_500, null));
                LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                );
                titleParams.setMargins(0, i == 0 ? 0 : 32, 0, 16);
                titleView.setLayoutParams(titleParams);
                container.addView(titleView);

                // Create container for this component
                FrameLayout componentContainer = new FrameLayout(this);
                LinearLayout.LayoutParams containerParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                );
                componentContainer.setLayoutParams(containerParams);
                componentContainer.setMinimumHeight(200);
                container.addView(componentContainer);

                // Render component in this container
                renderComponentInContainer(story, componentContainer, i);

                // Add divider (except for last item)
                if (i < a2uiStories.size() - 1) {
                    View divider = new View(this);
                    divider.setBackgroundColor(getResources().getColor(R.color.divider));
                    LinearLayout.LayoutParams dividerParams = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        2
                    );
                    dividerParams.setMargins(0, 24, 0, 0);
                    divider.setLayoutParams(dividerParams);
                    container.addView(divider);
                }
            }

            scrollView.addView(container);
            renderContent.addView(scrollView);

            addLog("All components loaded successfully!");
            Toast.makeText(this, "Loaded " + a2uiStories.size() + " components", Toast.LENGTH_SHORT).show();

        } catch (Exception e) {
            addLog("Failed to load A2UI Show components: " + e.getMessage());
            Toast.makeText(this, "Load failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            Log.e(TAG, "Failed to load A2UI Show components", e);
        }
    }

    /**
     * Render a single component in the specified container
     */
    private void renderComponentInContainer(SubStory story, FrameLayout container, int index) {
        try {
            // Generate unique surfaceId for this component
            String surfaceId = "a2ui_show_" + index + "_" + System.currentTimeMillis();

            // Get JSON strings
            String componentsJson = story.getComponentsString();
            String dataModelJson = story.getDataModelString();

            // Replace surfaceId in JSON
            String updatedComponentsJson = replaceSurfaceIdInJson(componentsJson, surfaceId);
            String updatedDataModelJson = replaceSurfaceIdInJson(dataModelJson, surfaceId);

            // Create surface
            JSONObject createSurfaceJson = new JSONObject();
            createSurfaceJson.put("version", "v0.9");

            JSONObject createSurfaceData = new JSONObject();
            createSurfaceData.put("surfaceId", surfaceId);
            createSurfaceData.put("catalogId", "https://a2ui.org/specification/v0_9/standard_catalog.json");

            createSurfaceJson.put("createSurface", createSurfaceData);

            // Send messages
            surfaceManager.receiveTextChunk(createSurfaceJson.toString());
            surfaceManager.receiveTextChunk(updatedComponentsJson);

            if (!updatedDataModelJson.equals("{}")) {
                surfaceManager.receiveTextChunk(updatedDataModelJson);
            }

            // Add Surface's container to the target container
            Surface surface = surfaceManager.getSurface(surfaceId);
            if (surface != null) {
                container.addView(surface.getContainer());
                addLog("Rendered: " + story.getDisplayName());
            } else {
                addLog("Failed to get surface for: " + story.getDisplayName());
            }

        } catch (Exception e) {
            addLog("Failed to render " + story.getDisplayName() + ": " + e.getMessage());
            Log.e(TAG, "Failed to render component", e);
        }
    }

    /**
     * Load all Gallery components and render them in a list
     */
    private void loadAllGalleryComponents() {
        if (aGenUI == null || surfaceManager == null) {
            addLog("Error: A2UI Framework not initialized");
            Toast.makeText(this, "A2UI Framework not initialized", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            addLog("Loading all Gallery components...");

            // Update title
            updateToolbarTitle("Gallery - All Components");

            // Load all Gallery stories
            List<SubStory> galleryStories = storyLoader.loadGalleryStories();

            if (galleryStories.isEmpty()) {
                addLog("No Gallery components found");
                Toast.makeText(this, "No components found", Toast.LENGTH_SHORT).show();
                return;
            }

            addLog("Found " + galleryStories.size() + " components");

            // Clear current content
            renderContent.removeAllViews();

            // Destroy old surface if exists
            if (currentSurfaceId != null) {
                surfaceManager.destroy();
                surfaceManager = new SurfaceManager(this);
                currentSurfaceId = null;
            }

            // Create a scrollable container
            ScrollView scrollView = new ScrollView(this);
            scrollView.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ));

            LinearLayout container = new LinearLayout(this);
            container.setOrientation(LinearLayout.VERTICAL);
            container.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ));
            container.setPadding(16, 16, 16, 16);

            // Render each component
            for (int i = 0; i < galleryStories.size(); i++) {
                SubStory story = galleryStories.get(i);

                // Add component title (using UUID as display name)
                TextView titleView = new TextView(this);
                titleView.setText((i + 1) + ". " + story.getDisplayName());
                titleView.setTextSize(18);
                titleView.setTextColor(getResources().getColor(R.color.purple_500, null));
                LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                );
                titleParams.setMargins(0, i == 0 ? 0 : 32, 0, 16);
                titleView.setLayoutParams(titleParams);
                container.addView(titleView);

                // Create container for this component
                FrameLayout componentContainer = new FrameLayout(this);
                LinearLayout.LayoutParams containerParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                );
                componentContainer.setLayoutParams(containerParams);
                componentContainer.setMinimumHeight(200);
                container.addView(componentContainer);

                // Render component in this container
                renderComponentInContainer(story, componentContainer, i);

                // Add divider (except for last item)
                if (i < galleryStories.size() - 1) {
                    View divider = new View(this);
                    divider.setBackgroundColor(getResources().getColor(R.color.divider));
                    LinearLayout.LayoutParams dividerParams = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        2
                    );
                    dividerParams.setMargins(0, 24, 0, 0);
                    divider.setLayoutParams(dividerParams);
                    container.addView(divider);
                }
            }

            scrollView.addView(container);
            renderContent.addView(scrollView);

            addLog("All Gallery components loaded successfully!");
            Toast.makeText(this, "Loaded " + galleryStories.size() + " components", Toast.LENGTH_SHORT).show();

        } catch (Exception e) {
            addLog("Failed to load Gallery components: " + e.getMessage());
            Toast.makeText(this, "Load failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            Log.e(TAG, "Failed to load Gallery components", e);
        }
    }

    /**
     * Update Toolbar title
     */
    private void updateToolbarTitle(String title) {
        if (getSupportActionBar() != null) {
            getSupportActionBar().setTitle(title);
        }
    }

    /**
     * Apply theme (Day/Night mode)
     */
    private void applyTheme(boolean isDarkMode) {
        if (isDarkMode) {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
        } else {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
        }

        // Update status bar color based on theme
        if (getWindow() != null) {
            int statusBarColor = ContextCompat.getColor(this, R.color.purple_500);
            getWindow().setStatusBarColor(statusBarColor);

            // Set status bar icons color (light icons for dark theme, dark icons for light theme)
            View decorView = getWindow().getDecorView();
            int systemUiVisibility = decorView.getSystemUiVisibility();
            if (isDarkMode) {
                // Dark mode: use light icons
                systemUiVisibility &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            } else {
                // Light mode: use dark icons
                systemUiVisibility |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            }
            decorView.setSystemUiVisibility(systemUiVisibility);
        }
    }

    /**
     * Add log
     */
    private void addLog(String message) {
        // Also output to Android console
        Log.d(TAG, message);

        String timestamp = new java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault())
            .format(new java.util.Date());
        String logEntry = "[" + timestamp + "] " + message;

        TextView logView = new TextView(this);
        logView.setText(logEntry);
        logView.setTextSize(12);
        logView.setTextColor(getResources().getColor(R.color.text_secondary));
        logView.setPadding(8, 8, 8, 8);

        // Remove "No logs yet" hint
        if (logsContent.getChildCount() == 1) {
            TextView firstChild = (TextView) logsContent.getChildAt(0);
            if (firstChild.getText().toString().equals(getString(R.string.hint_no_logs))) {
                logsContent.removeAllViews();
            }
        }

        logsContent.addView(logView, 0);

        // Limit log count to 10
        while (logsContent.getChildCount() > 10) {
            logsContent.removeViewAt(logsContent.getChildCount() - 1);
        }
    }
}

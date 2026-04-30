package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.util.Log;
import android.view.ContextThemeWrapper;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

import com.amap.a2ui_sdk.R;
import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.A2UILayoutComponent;
import com.amap.agenui.render.style.ComponentStyleConfig;
import com.amap.agenui.render.style.StyleHelper;
import com.google.android.material.tabs.TabLayout;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Tabs component implementation
 *
 * Corresponds to the Tabs component in the A2UI protocol
 * Uses TabLayout to implement tab switching
 *
 * Supported properties:
 * - tabs: tab array (List<Map>) - defined by protocol
 *   - title: tab label text (String) - defined by protocol
 *   - child: content component reference (String) - defined by protocol
 *
 */
public class TabsComponent extends A2UILayoutComponent {

    private static final String TAG = "TabsComponent";

    private LinearLayout containerLayout;
    private TabLayout tabLayout;
    private FrameLayout contentContainer;
    private List<A2UIComponent> tabContents;

    public TabsComponent(String id, Map<String, Object> properties) {
        super(id, "Tabs");
        Log.d(TAG, "[TabsComponent] ========== Constructor START ==========");
        Log.d(TAG, "[TabsComponent] Constructor - id: " + id);
        Log.d(TAG, "[TabsComponent] Constructor - properties: " + properties);

        this.tabContents = new ArrayList<>();
        // Save initial properties to base class
        if (properties != null) {
            this.properties.putAll(properties);
            Log.d(TAG, "[TabsComponent] Constructor - properties saved to base class");

            // Log tabs configuration details
            if (properties.containsKey("tabs")) {
                Object tabsObj = properties.get("tabs");
                if (tabsObj instanceof List) {
                    List<?> tabs = (List<?>) tabsObj;
                    Log.d(TAG, "[TabsComponent] Constructor - tabs count: " + tabs.size());
                    for (int i = 0; i < tabs.size(); i++) {
                        Log.d(TAG, "[TabsComponent] Constructor - tab[" + i + "]: " + tabs.get(i));
                    }
                }
            } else {
                Log.w(TAG, "[TabsComponent] Constructor - NO 'tabs' property found!");
            }
        }
        Log.d(TAG, "[TabsComponent] ========== Constructor END ==========");
    }

    @Override
    public View onCreateView(Context context) {
        Log.d(TAG, "[TabsComponent] ========== onCreateView START ==========");
        Log.d(TAG, "[TabsComponent] onCreateView - id: " + getId());

        // 1. Create main container
        containerLayout = createMainContainer(context);

        // 2. Load style configuration
        ComponentStyleConfig.StyleHashMap<String, String> styleConfig = loadStyleConfig(context);

        // 3. Create and configure TabLayout
        Context themedContext = createThemedContext(context);
        tabLayout = createTabLayout(themedContext, context, styleConfig);
        applyIndicatorStyle(tabLayout, context, styleConfig);
        applyTextStyle(tabLayout, styleConfig);

        // 4. Add TabLayout to container
        containerLayout.addView(tabLayout);

        // 5. Create content container
        contentContainer = createContentContainer(context);
        containerLayout.addView(contentContainer);

        // 6. Set up tab selection listener
        setupTabSelectionListener();

        // 7. Parse tabs configuration
        if (properties.containsKey("tabs")) {
            Log.d(TAG, "[TabsComponent] onCreateView - parsing tabs");
            parseTabs();
        }

        Log.d(TAG, "[TabsComponent] ========== onCreateView END ==========");
        return containerLayout;
    }

    /**
     * Create main container
     */
    private LinearLayout createMainContainer(Context context) {
        LinearLayout container = new LinearLayout(context);
        container.setOrientation(LinearLayout.VERTICAL);
        container.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));
        return container;
    }

    /**
     * Load style configuration
     */
    private ComponentStyleConfig.StyleHashMap<String, String> loadStyleConfig(Context context) {
        ComponentStyleConfig.StyleHashMap<String, String> styleConfig = ComponentStyleConfig.getInstance(context).getTabsStyle();
        Log.d(TAG, "[TabsComponent] Loaded style config: " + styleConfig);
        return styleConfig;
    }

    /**
     * Create a themed Context
     * Material Design components require AppCompat theme support
     */
    private Context createThemedContext(Context context) {
        return new ContextThemeWrapper(context, androidx.appcompat.R.style.Theme_AppCompat_Light);
    }

    /**
     * Create and configure TabLayout
     */
    private TabLayout createTabLayout(Context themedContext, Context context, Map<String, String> styleConfig) {
        TabLayout layout = (TabLayout) LayoutInflater.from(themedContext).inflate(R.layout.tab_layout, containerLayout, false);

        // Apply tab-mode configuration
        String tabMode = styleConfig.getOrDefault("tab-mode", "fixed");
        if ("scrollable".equals(tabMode)) {
            layout.setTabMode(TabLayout.MODE_SCROLLABLE);
        } else {
            layout.setTabMode(TabLayout.MODE_FIXED);
        }
        layout.setTabGravity(TabLayout.GRAVITY_FILL);

        // Set layout parameters
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        layout.setMinimumHeight((int) (48 * context.getResources().getDisplayMetrics().density));
        layout.setLayoutParams(params);

        try {
            java.lang.reflect.Field tabTextSizeField = TabLayout.class.getDeclaredField("tabTextSize");
            tabTextSizeField.setAccessible(true);
            java.lang.reflect.Field tabTextMultiLineSizeField = TabLayout.class.getDeclaredField("tabTextMultiLineSize");
            tabTextMultiLineSizeField.setAccessible(true);
            String fontSize = styleConfig.getOrDefault("tab-font-size", "32px");
            tabTextSizeField.set(layout, StyleHelper.parseDimension(fontSize, context));
            tabTextMultiLineSizeField.set(layout, StyleHelper.parseDimension(fontSize, context));

            java.lang.reflect.Field selectedTabTextSizeField = TabLayout.class.getDeclaredField("selectedTabTextSize");
            selectedTabTextSizeField.setAccessible(true);
            String fontSizeSelected = styleConfig.getOrDefault("tab-font-size-selected", "32px");
            selectedTabTextSizeField.set(layout, StyleHelper.parseDimension(fontSizeSelected, context));

            java.lang.reflect.Field tabTextColorsField = TabLayout.class.getDeclaredField("tabTextColors");
            tabTextColorsField.setAccessible(true);
            int fontColor = StyleHelper.parseColor(styleConfig.getOrDefault("tab-font-color", "#2273F7"));
            int fontColorSelected = StyleHelper.parseColor(styleConfig.getOrDefault("tab-font-color-selected", "#000000"));
            ColorStateList stateList = new ColorStateList(
                    new int[][]{
                            new int[]{android.R.attr.state_selected},   // selected state
                            new int[]{-android.R.attr.state_selected}    // unselected state
                    },
                    new int[]{
                            fontColorSelected,  // color when selected
                            fontColor           // color when unselected
                    }
            );
            tabTextColorsField.set(layout, stateList);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            Log.w(TAG, "Failed to apply tab text style via reflection; style may fall back to default", e);
        }

        return layout;
    }

    /**
     * Apply indicator style
     */
    private void applyIndicatorStyle(TabLayout tabLayout, Context context, Map<String, String> styleConfig) {
        // Get configuration
        String indicatorColor = styleConfig.getOrDefault("indicator-color", "#2273F7");
        String indicatorWidth = styleConfig.getOrDefault("indicator-width", "48px");
        String indicatorHeight = styleConfig.getOrDefault("indicator-height", "8px");
        String indicatorRadius = styleConfig.getOrDefault("indicator-radius", "4px");

        // Parse indicator width (supports fixed value and percentage)
        IndicatorWidth width = parseIndicatorWidth(indicatorWidth, context);

        // Parse indicator height and corner radius
        int heightPx = StyleHelper.parseDimension(indicatorHeight, context);
        int radiusPx = StyleHelper.parseDimension(indicatorRadius, context);

        // Create and set custom indicator
        CustomTabIndicator indicator = new CustomTabIndicator(
                StyleHelper.parseColor(indicatorColor),
                width,
                heightPx,
                radiusPx
        );
        tabLayout.setSelectedTabIndicator(indicator);
        tabLayout.setSelectedTabIndicatorHeight(heightPx);
    }

    /**
     * Parse indicator width (supports fixed value and percentage)
     */
    private IndicatorWidth parseIndicatorWidth(String indicatorWidth, Context context) {
        if (indicatorWidth.endsWith("%")) {
            // Percentage mode
            try {
                float percent = Float.parseFloat(indicatorWidth.replace("%", "")) / 100f;
                return new IndicatorWidth(true, percent, 0);
            } catch (NumberFormatException e) {
                Log.w(TAG, "Failed to parse indicator-width percent: " + indicatorWidth);
                return new IndicatorWidth(true, 0.6f, 0);
            }
        } else {
            // Fixed width mode
            int widthPx = StyleHelper.parseDimension(indicatorWidth, context);
            return new IndicatorWidth(false, 0, widthPx);
        }
    }

    /**
     * Indicator width configuration class
     */
    private static class IndicatorWidth {
        boolean isPercent;      // whether it is percentage mode
        float percentValue;     // percentage value (0.0-1.0)
        int fixedWidthPx;       // fixed width (pixels)

        IndicatorWidth(boolean isPercent, float percentValue, int fixedWidthPx) {
            this.isPercent = isPercent;
            this.percentValue = percentValue;
            this.fixedWidthPx = fixedWidthPx;
        }
    }

    /**
     * Apply text color style (new protocol)
     */
    private void applyTextStyle(TabLayout tabLayout, Map<String, String> styleConfig) {
        String tabFontColor = styleConfig.getOrDefault("tab-font-color", "#2273F7");
        String tabFontColorSelected = styleConfig.getOrDefault("tab-font-color-selected", "#000000");
        tabLayout.setTabTextColors(
                StyleHelper.parseColor(tabFontColor),
                StyleHelper.parseColor(tabFontColorSelected)
        );
    }

    /**
     * Create content container
     */
    private FrameLayout createContentContainer(Context context) {
        FrameLayout container = new FrameLayout(context);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        params.topMargin = (int) (8 * context.getResources().getDisplayMetrics().density);
        container.setLayoutParams(params);
        return container;
    }

    /**
     * Set up tab selection listener
     */
    private void setupTabSelectionListener() {
        tabLayout.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                int position = tab.getPosition();
                showTabContent(position);
                updateTabStyle(tab, true);
            }
            
            @Override
            public void onTabUnselected(TabLayout.Tab tab) {
                updateTabStyle(tab, false);
            }
            
            @Override
            public void onTabReselected(TabLayout.Tab tab) {
                // No action needed
            }
        });
    }
    
    /**
     * Parse tab configuration
     * Uses the protocol-defined tabs property
     *
     * Note: this method only creates the TabLayout tabs
     * child component association is handled by Surface via the addChild method
     */
    private void parseTabs() {
        Log.d(TAG, "[TabsComponent] ========== parseTabs START ==========");
        Log.d(TAG, "[TabsComponent] parseTabs - Component ID: " + getId());
        Log.d(TAG, "[TabsComponent] parseTabs - Properties: " + properties);
        Log.d(TAG, "[TabsComponent] parseTabs - tabLayout is null: " + (tabLayout == null));
        
        if (tabLayout == null) {
            Log.e(TAG, "[TabsComponent] parseTabs - tabLayout is NULL! Cannot parse tabs.");
            Log.d(TAG, "[TabsComponent] ========== parseTabs END (ERROR) ==========");
            return;
        }
        
        Object tabsObj = properties.get("tabs");
        Log.d(TAG, "[TabsComponent] parseTabs - tabsObj: " + tabsObj);
        Log.d(TAG, "[TabsComponent] parseTabs - tabsObj type: " + (tabsObj != null ? tabsObj.getClass().getName() : "null"));
        
        if (tabsObj instanceof List) {
            List<Map<String, Object>> tabs = (List<Map<String, Object>>) tabsObj;
            Log.d(TAG, "[TabsComponent] parseTabs - tabs list size: " + tabs.size());
            
            for (int i = 0; i < tabs.size(); i++) {
                Map<String, Object> tab = tabs.get(i);
                String title = (String) tab.get("title");
                String child = (String) tab.get("child");
                
                Log.d(TAG, "[TabsComponent] parseTabs - Tab[" + i + "]: title=" + title + ", child=" + child);
                
                // Add tab
                TabLayout.Tab newTab = tabLayout.newTab();
                newTab.setText(title != null ? title : "Tab");
                tabLayout.addTab(newTab);
                updateTabStyle(newTab, i == 0);
                
                Log.d(TAG, "[TabsComponent] parseTabs - ✓ Tab[" + i + "] added to TabLayout");
            }
            
            Log.d(TAG, "[TabsComponent] parseTabs - Total tabs in TabLayout: " + tabLayout.getTabCount());
        } else {
            Log.w(TAG, "[TabsComponent] parseTabs - tabs property is not a List or is null");
        }
        Log.d(TAG, "[TabsComponent] ========== parseTabs END ==========");
    }
    
    /**
     * Get the list of child component IDs from the tab configuration
     * Used by Surface to establish parent-child relationships
     */
    public List<String> getTabChildIds() {
        List<String> childIds = new ArrayList<>();
        Object tabsObj = properties.get("tabs");
        
        if (tabsObj instanceof List) {
            List<Map<String, Object>> tabs = (List<Map<String, Object>>) tabsObj;
            
            for (Map<String, Object> tab : tabs) {
                String childId = (String) tab.get("child");
                if (childId != null) {
                    childIds.add(childId);
                }
            }
        }
        
        return childIds;
    }

    /**
     * Recursively find the TextView in a Tab View
     *
     * @param view root view to search
     * @return found TextView, or null if not found
     */
    private android.widget.TextView findTabTextView(View view) {
        if (view instanceof android.widget.TextView) {
            return (android.widget.TextView) view;
        }

        if (view instanceof ViewGroup) {
            ViewGroup viewGroup = (ViewGroup) view;
            for (int i = 0; i < viewGroup.getChildCount(); i++) {
                View child = viewGroup.getChildAt(i);
                android.widget.TextView textView = findTabTextView(child);
                if (textView != null) {
                    return textView;
                }
            }
        }

        return null;
    }

    /**
     * Update tab style (new protocol)
     * Includes font size, font weight, and text color
     *
     * @param tab        the tab
     * @param isSelected whether the tab is selected
     */
    private void updateTabStyle(TabLayout.Tab tab, boolean isSelected) {
        if (tab.view != null) {
            // Use recursive lookup to find the TextView instead of relying on Material library internal IDs
            android.widget.TextView textView = findTabTextView(tab.view);
            
            if (textView != null) {
                Context context = tab.view.getContext();
                Map<String, String> styleConfig = ComponentStyleConfig.getInstance(context).getTabsStyle();
                if (isSelected) {
                    // Selected state: read from configuration
                    String fontWeightSelected = styleConfig.getOrDefault("tab-font-weight-selected", "bold");
                    // Apply font weight
                    int typeface = parseTypefaceStyle(fontWeightSelected);
                    textView.setTypeface(null, typeface);
                } else {
                    String fontWeight = styleConfig.getOrDefault("tab-font-weight", "normal");
                    // Apply font weight
                    int typeface = parseTypefaceStyle(fontWeight);
                    textView.setTypeface(null, typeface);
                }
            } else {
                Log.w(TAG, "Could not find TextView in tab view");
            }
        }
    }

    /**
     * Parse font weight style
     *
     * @param fontWeight font weight value (normal, bold, or numeric)
     * @return Typeface style constant
     */
    private int parseTypefaceStyle(String fontWeight) {
        int weight = Typeface.NORMAL;

        if (fontWeight != null && "bold".equals(fontWeight.toLowerCase().trim())) {
            weight = Typeface.BOLD;
        }

        return weight;
    }
    
    /**
     * Show the content for the specified tab
     */
    private void showTabContent(int index) {
        contentContainer.removeAllViews();
        
        if (index >= 0 && index < tabContents.size()) {
            A2UIComponent content = tabContents.get(index);
            if (content != null && content.getView() != null) {
                View view = content.getView();
                
                // Remove view from parent if it already has one
                if (view.getParent() != null) {
                    ((ViewGroup) view.getParent()).removeView(view);
                }
                
                contentContainer.addView(view);
            }
        }
        
        // Select the corresponding tab
        if (index >= 0 && index < tabLayout.getTabCount()) {
            TabLayout.Tab tab = tabLayout.getTabAt(index);
            if (tab != null && !tab.isSelected()) {
                tab.select();
            }
        }
    }
    
    /**
     * Add tab content component
     *
     * Note: child components of the Tabs component should not be added directly to the main container
     * Instead, they are managed by the Tabs component itself and shown in contentContainer when a tab is switched
     */
    @Override
    public void addChild(A2UIComponent child) {
        Log.d(TAG, "========== addChild START ==========");
        Log.d(TAG, "Parent ID: " + getId());
        Log.d(TAG, "Child ID: " + (child != null ? child.getId() : "null"));
        Log.d(TAG, "Current tabContents size: " + tabContents.size());
        
        super.addChild(child);
        if (child != null) {
            tabContents.add(child);
            Log.d(TAG, "✓ Child added to tabContents, new size: " + tabContents.size());
            
            // Important: do not call showTabContent() here
            // because the child component's View has not been created yet
            // Wait for ComponentRegistry to create the View, then be notified via onChildViewCreated()
        }
        Log.d(TAG, "========== addChild END ==========");
    }
    
    /**
     * Called when a child component's View has been created
     * Used to show the first tab after all child component Views are created
     *
     * @param child child component
     */
    public void onChildViewCreated(A2UIComponent child) {
        Log.d(TAG, "========== onChildViewCreated START ==========");
        Log.d(TAG, "Child ID: " + (child != null ? child.getId() : "null"));
        Log.d(TAG, "Child view: " + (child != null && child.getView() != null ? child.getView().getClass().getSimpleName() : "null"));
        
        // Get expected child component count
        // Prefer the tabs array from properties; fall back to tabContents.size()
        int expectedChildCount = 0;
        Object tabsObj = properties.get("tabs");
        if (tabsObj instanceof List) {
            expectedChildCount = ((List<?>) tabsObj).size();
            Log.d(TAG, "Expected child count from properties.tabs: " + expectedChildCount);
        } else {
            expectedChildCount = tabContents.size();
            Log.d(TAG, "Expected child count from tabContents: " + expectedChildCount);
        }
        
        // Check if all child component Views have been created
        int createdViewCount = 0;
        for (A2UIComponent content : tabContents) {
            if (content.getView() != null) {
                createdViewCount++;
            }
        }
        
        Log.d(TAG, "Created views: " + createdViewCount + "/" + expectedChildCount);
        Log.d(TAG, "Current TabLayout tab count: " + (tabLayout != null ? tabLayout.getTabCount() : 0));
        Log.d(TAG, "Current contentContainer child count: " + (contentContainer != null ? contentContainer.getChildCount() : 0));
        
        // Only proceed when all child component Views have been created
        if (createdViewCount == expectedChildCount && createdViewCount > 0 && contentContainer != null) {
            Log.d(TAG, "✓ All tab child views created");
            
            // Check if the TabLayout tab count is correct
            boolean needsRecreate = false;
            if (tabLayout != null) {
                if (tabLayout.getTabCount() == 0) {
                    Log.d(TAG, "TabLayout has no tabs, need to create");
                    needsRecreate = true;
                } else if (tabLayout.getTabCount() != expectedChildCount) {
                    Log.d(TAG, "TabLayout has " + tabLayout.getTabCount() + 
                                     " tabs but expected " + expectedChildCount + ", need to recreate");
                    needsRecreate = true;
                    // Clear existing tabs
                    tabLayout.removeAllTabs();
                } else {
                    Log.d(TAG, "TabLayout already has correct number of tabs (" + 
                                     tabLayout.getTabCount() + "), skipping creation");
                }
            }
            
            // Create or recreate tabs
            if (needsRecreate && tabLayout != null) {
                Log.d(TAG, "Creating tabs now");
                
                // Attempt to get tab titles from properties
                List<String> tabTitles = new ArrayList<>();
                if (tabsObj instanceof List) {
                    List<Map<String, Object>> tabs = (List<Map<String, Object>>) tabsObj;
                    Log.d(TAG, "Found tabs in properties, size: " + tabs.size());
                    for (int i = 0; i < tabs.size(); i++) {
                        Map<String, Object> tab = tabs.get(i);
                        String title = (String) tab.get("title");
                        tabTitles.add(title != null ? title : "Tab");
                        Log.d(TAG, "  Tab[" + i + "] title: " + title);
                    }
                } else {
                    Log.d(TAG, "No tabs in properties, using default titles");
                }
                
                // If no tab info in properties, use default titles
                if (tabTitles.isEmpty()) {
                    for (int i = 0; i < expectedChildCount; i++) {
                        tabTitles.add("Tab " + (i + 1));
                    }
                    Log.d(TAG, "Created " + tabTitles.size() + " default tab titles");
                }
                
                // Create tabs
                for (int i = 0; i < tabTitles.size(); i++) {
                    String title = tabTitles.get(i);
                    TabLayout.Tab newTab = tabLayout.newTab();
                    newTab.setText(title);
                    tabLayout.addTab(newTab);
                    updateTabStyle(newTab, i == 0);
                    
                    Log.d(TAG, "  ✓ Tab[" + i + "] added: " + title);
                }
                
                Log.d(TAG, "Total tabs created: " + tabLayout.getTabCount());
            }
            
            // Key fix: always show the first tab content regardless of whether tabs need to be recreated
            // because even if tabs were already created in onCreateView, the content container is still empty
            Log.d(TAG, "→ Showing first tab content");
            showTabContent(0);
            Log.d(TAG, "✓ First tab content displayed");
            Log.d(TAG, "  contentContainer child count after show: " + contentContainer.getChildCount());
        } else {
            Log.d(TAG, "⏳ Not all child views created yet, waiting...");
            Log.d(TAG, "  createdViewCount=" + createdViewCount + ", expectedChildCount=" + expectedChildCount);
        }
        
        Log.d(TAG, "========== onChildViewCreated END ==========");
    }
    
    /**
     * Remove tab content component
     */
    @Override
    public void removeChild(A2UIComponent child) {
        super.removeChild(child);
        tabContents.remove(child);
    }
    
    /**
     * Get all tab contents
     */
    public List<A2UIComponent> getTabContents() {
        return new ArrayList<>(tabContents);
    }
    
    /**
     * TabsComponent manages child component Views itself
     * Child Views should not be automatically added to the parent container
     *
     * @return false indicating TabsComponent manages child Views itself
     */
    @Override
    public boolean shouldAutoAddChildView() {
        return false;
    }


    @Override
    public void onUpdateProperties(Map<String, Object> properties) {
        Log.d(TAG, "========== onUpdateProperties START ==========");
        Log.d(TAG, "Component ID: " + getId());
        Log.d(TAG, "tabLayout is null: " + (tabLayout == null));
        Log.d(TAG, "properties contains 'tabs': " + properties.containsKey("tabs"));
        Log.d(TAG, "properties: " + properties);
        
        if (tabLayout != null && properties.containsKey("tabs")) {
            Log.d(TAG, "→ Clearing existing tabs and re-parsing");
            // Clear existing tabs
            tabLayout.removeAllTabs();

            // Re-parse and create tabs
            parseTabs();

            // Show the first tab
            if (tabLayout.getTabCount() > 0) {
                Log.d(TAG, "→ Showing first tab content");
                showTabContent(0);
            }
        } else {
            if (tabLayout == null) {
                Log.w(TAG, "⚠ tabLayout is null, cannot parse tabs yet");
            }
            if (!properties.containsKey("tabs")) {
                Log.w(TAG, "⚠ properties does not contain 'tabs'");
            }
        }
        Log.d(TAG, "========== onUpdateProperties END ==========");
    }

    /**
     * Custom Tab indicator
     * <p>
     * Supports both fixed-width and percentage-width modes, supports rounded corners, and centers automatically
     */
    private static class CustomTabIndicator extends Drawable {
        private Paint paint;
        private IndicatorWidth width;  // indicator width configuration
        private int height;            // indicator height (pixels)
        private int radius;            // corner radius (pixels)

        /**
         * Constructor
         *
         * @param color  indicator color
         * @param width  indicator width configuration (supports percentage and fixed value)
         * @param height indicator height (pixels)
         * @param radius corner radius (pixels)
         */
        CustomTabIndicator(int color, IndicatorWidth width, int height, int radius) {
            this.paint = new Paint();
            this.paint.setColor(color);
            this.paint.setAntiAlias(true);
            this.width = width;
            this.height = height;
            this.radius = radius;
        }

        @Override
        public void draw(Canvas canvas) {
            Rect bounds = getBounds();

            // Calculate the actual indicator width
            int indicatorWidth;
            if (width.isPercent) {
                // Percentage mode: calculate based on tab width
                indicatorWidth = (int) (bounds.width() * width.percentValue);
            } else {
                // Fixed-width mode: use the fixed value directly
                indicatorWidth = width.fixedWidthPx;
            }

            // Calculate left/right margin to center the indicator
            int margin = (bounds.width() - indicatorWidth) / 2;

            // Draw the centered indicator (with optional rounded corners)
            if (radius > 0) {
                // Use RectF and drawRoundRect to draw a rounded rectangle
                RectF rectF = new RectF(
                        bounds.left + margin,
                        bounds.top,
                        bounds.right - margin,
                        bounds.bottom
                );
                canvas.drawRoundRect(rectF, radius, radius, paint);
            } else {
                // No corner radius, use a plain rectangle
                canvas.drawRect(
                        bounds.left + margin,
                        bounds.top,
                        bounds.right - margin,
                        bounds.bottom,
                        paint
                );
            }
        }

        @Override
        public void setAlpha(int alpha) {
            paint.setAlpha(alpha);
        }

        @Override
        public void setColorFilter(ColorFilter colorFilter) {
            paint.setColorFilter(colorFilter);
        }

        @Override
        public int getOpacity() {
            return PixelFormat.TRANSLUCENT;
        }

        @Override
        public int getIntrinsicHeight() {
            return height;
        }
    }
}

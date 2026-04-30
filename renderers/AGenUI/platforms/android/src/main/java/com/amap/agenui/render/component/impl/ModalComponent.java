package com.amap.agenui.render.component.impl;

import android.app.Activity;
import android.app.Dialog;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Outline;
import android.graphics.drawable.ColorDrawable;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewOutlineProvider;
import android.view.Window;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;

import com.amap.a2ui_sdk.R;
import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.A2UILayoutComponent;
import com.amap.agenui.render.style.ComponentStyleConfig;
import com.amap.agenui.render.style.StyleHelper;

import java.util.Map;

/**
 * Modal component implementation
 *
 * Corresponds to the Modal component in the A2UI protocol.
 * Implements a modal dialog using a custom Dialog.
 *
 * Supported properties:
 * - trigger: trigger button component ID (String) - protocol definition
 * - content: dialog content component ID (String) - protocol definition
 *
 * Supported style configurations (read from component_styles.json):
 * - show-close-button: whether to show the close button (default true)
 * - close-button-margin: margin between the close button and the bottom of the dialog (default 16px)
 * - close-button-size: close button size (default 72px)
 * - overlay-color: overlay color (default rgba(0,0,0,0.5))
 *
 * Note: child components are added via addChild(); the first child acts as the trigger button,
 *       and the second child acts as the dialog content.
 *
 */
public class ModalComponent extends A2UILayoutComponent {

    private static final String TAG = "ModalComponent";

    private FrameLayout containerLayout;
    private A2UIComponent triggerComponent;
    private A2UIComponent contentComponent;
    private Dialog dialog;
    private Context cachedContext;

    // Style configuration
    private boolean showCloseButton = true;
    private int closeButtonMargin = 0;
    private int closeButtonSize = 0;
    private int overlayColor = Color.parseColor("#80000000"); // default semi-transparent black

    public ModalComponent(String id, Map<String, Object> properties) {
        super(id, "Modal");
    }

    @Override
    public View onCreateView(Context context) {
        // Cache the context
        this.cachedContext = context;

        // Load style configuration
        loadStyleConfig(context);

        // Create container to hold the trigger button
        containerLayout = new FrameLayout(context) {
            @Override
            public void onViewRemoved(View child) {
                super.onViewRemoved(child);
            }
        };
        containerLayout.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        // If there is a trigger component, add it to the container and set up the click event
        if (triggerComponent != null) {
            View triggerView = triggerComponent.getView();
            if (triggerView != null) {
                // If the view already has a parent, remove it first
                if (triggerView.getParent() != null) {
                    ((ViewGroup) triggerView.getParent()).removeView(triggerView);
                }

                containerLayout.addView(triggerView);

                // Set click event to show the dialog
                triggerView.setOnClickListener(v -> showDialog(context));
            }
        }

        return containerLayout;
    }

    /**
     * Load style configuration
     */
    private void loadStyleConfig(Context context) {
        try {
            // Get Modal style configuration
            Map<String, String> modalStyle = ComponentStyleConfig.getInstance(context).getModalStyle();

            // Parse style properties
            showCloseButton = parseBoolean(modalStyle.get("show-close-button"), true);
            closeButtonMargin = StyleHelper.parseDimension(modalStyle.get("close-button-margin"), context);
            closeButtonSize = StyleHelper.parseDimension(modalStyle.get("close-button-size"), context);
            overlayColor = StyleHelper.parseColor(modalStyle.get("overlay-color"));

            // If parsing fails, use default values
            if (overlayColor == Color.TRANSPARENT) {
                overlayColor = Color.parseColor("#80000000");
            }

            Log.d(TAG, "Style config loaded: showCloseButton=" + showCloseButton +
                    ", closeButtonMargin=" + closeButtonMargin +
                    ", closeButtonSize=" + closeButtonSize +
                    ", overlayColor=#" + Integer.toHexString(overlayColor));
        } catch (Exception e) {
            Log.e(TAG, "Failed to load style config, using defaults", e);
        }
    }

    /**
     * Parse boolean value
     */
    private boolean parseBoolean(String value, boolean defaultValue) {
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        return "true".equalsIgnoreCase(value.trim());
    }

    /**
     * Show the dialog
     */
    private void showDialog(Context context) {
        if (dialog != null && dialog.isShowing()) {
            return;
        }

        // Create a custom Dialog
        dialog = new Dialog(context);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);

        // Create root layout - FrameLayout for overall centering
        FrameLayout rootLayout = new FrameLayout(context);
        rootLayout.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // Create a container that holds the white content area and the close button
        LinearLayout modalContainer = new LinearLayout(context);
        modalContainer.setOrientation(LinearLayout.VERTICAL);

        // Center the container
        FrameLayout.LayoutParams modalContainerParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        modalContainerParams.gravity = Gravity.CENTER;
        modalContainer.setLayoutParams(modalContainerParams);

        // Create the content container with a white background
        LinearLayout contentContainer = new LinearLayout(context);
        contentContainer.setOrientation(LinearLayout.VERTICAL);
        contentContainer.setBackgroundColor(Color.WHITE);
        int paddingPx = StyleHelper.parseDimension(40, modalContainer.getContext());
        int radiusPx = StyleHelper.parseDimension(20, modalContainer.getContext());
        contentContainer.setPadding(paddingPx, paddingPx, paddingPx, paddingPx);
        contentContainer.setOutlineProvider(new ViewOutlineProvider() {
            @Override
            public void getOutline(View v, Outline outline) {
                outline.setRoundRect(0, 0, v.getWidth(), v.getHeight(), radiusPx);
            }
        });
        contentContainer.setClipToOutline(true);


        // Add content to the white container
        if (contentComponent != null && contentComponent.getView() != null) {
            View contentView = contentComponent.getView();

            // If the view already has a parent, remove it first
            if (contentView.getParent() != null) {
                ((ViewGroup) contentView.getParent()).removeView(contentView);
            }

            // Add content to the white container
            LinearLayout.LayoutParams contentParams = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
            );
            contentContainer.addView(contentView, contentParams);
        }

        // Add the white container to the modal container
        modalContainer.addView(contentContainer, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT)
        );

        // Add close button below the white container
        if (showCloseButton) {
            ImageView closeButton = new ImageView(context);
            closeButton.setImageResource(R.drawable.ic_modal_close);

            // Set close button size and position
            LinearLayout.LayoutParams closeParams = new LinearLayout.LayoutParams(
                    closeButtonSize > 0 ? closeButtonSize : ViewGroup.LayoutParams.WRAP_CONTENT,
                    closeButtonSize > 0 ? closeButtonSize : ViewGroup.LayoutParams.WRAP_CONTENT
            );
            closeParams.gravity = Gravity.CENTER_HORIZONTAL;

            // Set the distance between the close button and the content
            if (closeButtonMargin > 0) {
                closeParams.topMargin = closeButtonMargin;
            }

            closeButton.setLayoutParams(closeParams);
            closeButton.setOnClickListener(v -> dialog.dismiss());

            // Add the close button to the modal container (below the white container)
            modalContainer.addView(closeButton);

            Log.d(TAG, "Close button added below content: size=" + closeButtonSize + ", margin=" + closeButtonMargin);
        }

        // Set a click listener on rootLayout to close the dialog when the overlay is tapped
        rootLayout.setOnClickListener(v -> dialog.dismiss());

        // Intercept click events on modalContainer to prevent taps on the content area from closing the dialog
        modalContainer.setOnClickListener(v -> {
            // Consume the click event without doing anything
            // This prevents the click from propagating to rootLayout's click listener
        });

        // Add the modal container to the root layout
        rootLayout.addView(modalContainer);

        // Set the dialog content
        dialog.setContentView(rootLayout);

        // Configure dialog window properties
        Window window = dialog.getWindow();
        if (window != null) {
            // Set overlay color
            window.setBackgroundDrawable(new ColorDrawable(overlayColor));

            // Set the dialog size to full screen so the close button can float at any position
            window.setLayout(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
            );

            Log.d(TAG, "Dialog window configured with overlay color: #" + Integer.toHexString(overlayColor));
        }

        // Default cancelable (allow back key to close)
        dialog.setCancelable(true);

        // Check if the Activity can still show the dialog
        if (context instanceof Activity) {
            Activity activity = (Activity) context;
            if (activity.isFinishing() || activity.isDestroyed()) {
                Log.w(TAG, "showDialog: Activity is finishing or destroyed, skipping");
                return;
            }
        }

        // Show the dialog
        dialog.show();

        Log.d(TAG, "Dialog shown with floating close button");
    }

    /**
     * Dismiss the dialog
     */
    public void dismissDialog() {
        if (dialog != null && dialog.isShowing()) {
            dialog.dismiss();
        }
    }

    /**
     * Add a child component.
     * The first child acts as the trigger button; the second child acts as the dialog content.
     */
    @Override
    public void addChild(A2UIComponent child) {
        super.addChild(child);
        if (child != null) {
            // Reset LayoutParams to FrameLayout.LayoutParams
            // to avoid ClassCastException when they are later set to FlexboxLayout.LayoutParams
            if (child.getView() != null) {
                ViewGroup.LayoutParams params = child.getView().getLayoutParams();
                if (params != null && !(params instanceof FrameLayout.LayoutParams)) {
                    FrameLayout.LayoutParams frameParams = new FrameLayout.LayoutParams(
                            params.width,
                            params.height
                    );
                    // If the original LayoutParams is MarginLayoutParams, preserve margin information
                    if (params instanceof ViewGroup.MarginLayoutParams) {
                        ViewGroup.MarginLayoutParams marginParams = (ViewGroup.MarginLayoutParams) params;
                        frameParams.setMargins(
                                marginParams.leftMargin,
                                marginParams.topMargin,
                                marginParams.rightMargin,
                                marginParams.bottomMargin
                        );
                    }
                    child.getView().setLayoutParams(frameParams);
                    Log.d(TAG, "Reset LayoutParams to FrameLayout.LayoutParams for child: " + child.getId());
                }
            }

            if (triggerComponent == null) {
                // First child acts as the trigger button
                triggerComponent = child;
            } else if (contentComponent == null && child != triggerComponent) {
                // Second child acts as the dialog content
                contentComponent = child;
            }
        }
    }

    /**
     * Called when a child component's View has been created.
     * Invoked by ComponentRegistry after the child View is created.
     *
     * @param child the child component
     */
    public void onChildViewCreated(A2UIComponent child) {
        Log.d(TAG, "========== onChildViewCreated ==========");
        Log.d(TAG, "child=" + child.getId() + ", type=" + child.getComponentType());

        if (child == triggerComponent) {
            // The trigger button's View has been created; add it to the container and set up the click event
            Log.d(TAG, "→ Trigger component view created");

            if (containerLayout != null && child.getView() != null) {
                View triggerView = child.getView();

                // If the view already has a parent, remove it first
                if (triggerView.getParent() != null) {
                    Log.d(TAG, "  Removing trigger view from old parent");
                    ((ViewGroup) triggerView.getParent()).removeView(triggerView);
                }

                Log.d(TAG, "  Adding trigger view to container");
                containerLayout.addView(triggerView);
                Log.d(TAG, "  ✓ Trigger view added, container child count=" + containerLayout.getChildCount());

                // Set click event
                triggerView.setOnClickListener(v -> {
                    Log.d(TAG, "Trigger button clicked, showing dialog");
                    if (cachedContext != null) {
                        showDialog(cachedContext);
                    } else {
                        Log.e(TAG, "❌ Context is null, cannot show dialog");
                    }
                });
                Log.d(TAG, "  ✓ Click listener set");
            } else {
                Log.w(TAG, "  ⚠ Cannot add trigger view: containerLayout=" +
                      (containerLayout != null) + ", triggerView=" + (child.getView() != null));
            }
        } else if (child == contentComponent) {
            // The content component's View has been created
            Log.d(TAG, "→ Content component view created");
            Log.d(TAG, "  Content will be shown in dialog when triggered");
        }

        Log.d(TAG, "========== onChildViewCreated END ==========");
    }

    /**
     * Remove a child component
     */
    @Override
    public void removeChild(A2UIComponent child) {
        super.removeChild(child);
        if (child == triggerComponent) {
            triggerComponent = null;
        } else if (child == contentComponent) {
            contentComponent = null;
        }
    }

    /**
     * Get the trigger component
     */
    public A2UIComponent getTriggerComponent() {
        return triggerComponent;
    }

    /**
     * Get the content component
     */
    public A2UIComponent getContentComponent() {
        return contentComponent;
    }

    @Override
    public void onUpdateProperties(Map<String, Object> properties) {
        super.onUpdateProperties(properties);
        // Property update logic for Modal component
        // The association of trigger and content is handled in Surface.linkModalComponents()
    }

    /**
     * ModalComponent manages child component Views itself.
     * Child Views should not be automatically added to the parent container.
     *
     * @return false indicating that ModalComponent manages child Views on its own
     */
    @Override
    public boolean shouldAutoAddChildView() {
        return false;
    }
}

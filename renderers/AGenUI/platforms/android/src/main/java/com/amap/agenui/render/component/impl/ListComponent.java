package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.A2UILayoutComponent;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * List component implementation - compliant with A2UI v0.9 protocol
 *
 * Supported properties:
 * - direction: layout direction (vertical | horizontal)
 * - align: cross-axis alignment (start | center | end | stretch)
 * - children: list of child components
 */
public class ListComponent extends A2UILayoutComponent {

    private static final String TAG = "ListComponent";

    private LinearLayout verticalContainer;

    private HorizontalScrollView horizontalScrollView;
    private LinearLayout horizontalContainer;

    private String direction = "vertical";
    private String align = "start";
    private final List<A2UIComponent> childComponents;

    public ListComponent(String id, Map<String, Object> properties) {
        super(id, "List");
        this.childComponents = new ArrayList<>();
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    public View onCreateView(Context context) {
        if (properties.containsKey("direction")) {
            Object directionObj = properties.get("direction");
            if (directionObj instanceof String) {
                direction = (String) directionObj;
            }
        }

        if (properties.containsKey("align")) {
            Object alignObj = properties.get("align");
            if (alignObj instanceof String) {
                align = (String) alignObj;
            }
        }

        Log.d(TAG, "onCreateView"
                + ", id=" + getId()
                + ", direction=" + direction
                + ", align=" + align
                + ", childCount=" + childComponents.size());

        if ("vertical".equals(direction)) {
            return createVerticalContainer(context);
        } else {
            return createHorizontalContainer(context);
        }
    }

    @Override
    public View createView(Context context, ViewGroup parent) {
        View createdView = super.createView(context, parent);

        if (parent != null) {
            parent.setClipChildren(false);
            parent.setClipToPadding(false);
        }

        return createdView;
    }

    private View createVerticalContainer(Context context) {

        verticalContainer = new LinearLayout(context);
        verticalContainer.setOrientation(LinearLayout.VERTICAL);

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        verticalContainer.setLayoutParams(params);

        verticalContainer.setClipChildren(false);
        verticalContainer.setClipToPadding(false);

        applyAlignToVerticalContainer();

        for (A2UIComponent child : childComponents) {
            addChildToVerticalContainer(child);
        }

        return verticalContainer;
    }

    private View createHorizontalContainer(Context context) {
        if (horizontalScrollView != null || horizontalContainer != null) {
            Log.w(TAG, "createHorizontalContainer called again, id=" + getId()
                    + ", oldScrollView=" + horizontalScrollView
                    + ", oldContainer=" + horizontalContainer);
        }

        horizontalScrollView = new HorizontalScrollView(context);
        horizontalScrollView.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));
        horizontalScrollView.setHorizontalScrollBarEnabled(false);
        horizontalScrollView.setFillViewport(false);
        horizontalScrollView.setClipChildren(false);
        horizontalScrollView.setClipToPadding(false);
        horizontalScrollView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        horizontalContainer = new LinearLayout(context);
        horizontalContainer.setOrientation(LinearLayout.HORIZONTAL);
        horizontalContainer.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        horizontalContainer.setClipChildren(false);
        horizontalContainer.setClipToPadding(false);

        applyAlignToHorizontalContainer();

        for (A2UIComponent child : childComponents) {
            addChildToHorizontalContainer(child);
        }

        if (horizontalContainer.getParent() != null) {
            ViewParent oldParent = horizontalContainer.getParent();
            if (oldParent instanceof ViewGroup) {
                ((ViewGroup) oldParent).removeView(horizontalContainer);
            }
        }

        if (horizontalScrollView.getChildCount() == 0) {
            horizontalScrollView.addView(horizontalContainer);
        } else if (horizontalScrollView.getChildAt(0) != horizontalContainer) {
            Log.w(TAG, "HorizontalScrollView already has another child, replacing it. id=" + getId());
            horizontalScrollView.removeAllViews();
            horizontalScrollView.addView(horizontalContainer);
        }

        return horizontalScrollView;
    }

    private void applyAlignToVerticalContainer() {
        if (verticalContainer == null) {
            return;
        }

        int gravity;
        switch (align) {
            case "center":
                gravity = Gravity.CENTER_HORIZONTAL | Gravity.TOP;
                break;
            case "end":
                gravity = Gravity.END | Gravity.TOP;
                break;
            case "stretch":
                gravity = Gravity.FILL_HORIZONTAL | Gravity.TOP;
                break;
            case "start":
            default:
                gravity = Gravity.START | Gravity.TOP;
                break;
        }

        verticalContainer.setGravity(gravity);
    }

    private void applyAlignToHorizontalContainer() {
        if (horizontalContainer == null) {
            return;
        }

        int gravity;
        switch (align) {
            case "center":
                gravity = Gravity.CENTER_VERTICAL | Gravity.START;
                break;
            case "end":
                gravity = Gravity.BOTTOM | Gravity.START;
                break;
            case "stretch":
                gravity = Gravity.FILL_VERTICAL | Gravity.START;
                break;
            case "start":
            default:
                gravity = Gravity.TOP | Gravity.START;
                break;
        }

        horizontalContainer.setGravity(gravity);
    }

    private void addChildToVerticalContainer(A2UIComponent child) {
        if (verticalContainer == null || child == null) {
            return;
        }

        View childView = child.getView();
        if (childView == null) {
            return;
        }

        if (childView.getParent() != null) {
            ((ViewGroup) childView.getParent()).removeView(childView);
        }

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                "stretch".equals(align) ? ViewGroup.LayoutParams.MATCH_PARENT : ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );

        if (!"stretch".equals(align)) {
            int margin = (int) (8 * childView.getContext().getResources().getDisplayMetrics().density);
            params.setMargins(margin, 0, margin, 0);
        }

        verticalContainer.addView(childView, params);
    }

    private void addChildToHorizontalContainer(A2UIComponent child) {
        if (horizontalContainer == null || child == null) {
            return;
        }

        View childView = child.getView();
        if (childView == null) {
            return;
        }

        if (childView.getParent() != null) {
            ((ViewGroup) childView.getParent()).removeView(childView);
        }

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                "stretch".equals(align) ? ViewGroup.LayoutParams.MATCH_PARENT : ViewGroup.LayoutParams.WRAP_CONTENT
        );

        int margin = (int) (8 * childView.getContext().getResources().getDisplayMetrics().density);
        params.setMargins(0, 0, margin, 0);

        horizontalContainer.addView(childView, params);
    }

    @Override
    public void addChild(A2UIComponent child) {
        if (child == null) {
            return;
        }

        childComponents.add(child);

        if ("vertical".equals(direction) && verticalContainer != null) {
            addChildToVerticalContainer(child);
        } else if ("horizontal".equals(direction) && horizontalContainer != null) {
            addChildToHorizontalContainer(child);
        }
    }

    @Override
    public void removeChild(A2UIComponent child) {
        int index = childComponents.indexOf(child);
        if (index < 0) {
            return;
        }

        childComponents.remove(index);

        if ("vertical".equals(direction) && verticalContainer != null) {
            if (index < verticalContainer.getChildCount()) {
                verticalContainer.removeViewAt(index);
            }
        } else if ("horizontal".equals(direction) && horizontalContainer != null) {
            if (index < horizontalContainer.getChildCount()) {
                horizontalContainer.removeViewAt(index);
            }
        }
    }

    public void clearChildren() {
        childComponents.clear();

        if ("vertical".equals(direction) && verticalContainer != null) {
            verticalContainer.removeAllViews();
        } else if ("horizontal".equals(direction) && horizontalContainer != null) {
            horizontalContainer.removeAllViews();
        }
    }

    public void addChildren(List<A2UIComponent> children) {
        if (children == null || children.isEmpty()) {
            return;
        }

        childComponents.addAll(children);

        if ("vertical".equals(direction) && verticalContainer != null) {
            for (A2UIComponent child : children) {
                addChildToVerticalContainer(child);
            }
        } else if ("horizontal".equals(direction) && horizontalContainer != null) {
            for (A2UIComponent child : children) {
                addChildToHorizontalContainer(child);
            }
        }
    }

    @Override
    public List<A2UIComponent> getChildren() {
        return new ArrayList<>(childComponents);
    }

    /**
     * Returns the actual root View.
     * In horizontal mode, must return HorizontalScrollView, not the inner LinearLayout.
     */
    @Override
    public View getView() {
        return view;
    }

    /**
     * Returns the container that actually holds child components.
     * In horizontal mode, this is the inner horizontalContainer, not the HorizontalScrollView.
     */
    @Override
    public ViewGroup getChildContainer() {
        if ("horizontal".equals(direction)) {
            return horizontalContainer;
        }
        return verticalContainer;
    }

    @Override
    public void onUpdateProperties(Map<String, Object> properties) {
        super.onUpdateProperties(properties);

        boolean needRecreate = false;

        if (properties.containsKey("direction")) {
            Object directionObj = properties.get("direction");
            if (directionObj instanceof String) {
                String newDirection = (String) directionObj;
                if (!newDirection.equals(direction)) {
                    direction = newDirection;
                    needRecreate = true;
                }
            }
        }

        if (properties.containsKey("align")) {
            Object alignObj = properties.get("align");
            if (alignObj instanceof String) {
                String newAlign = (String) alignObj;
                if (!newAlign.equals(align)) {
                    align = newAlign;

                    if (!needRecreate) {
                        if ("vertical".equals(direction) && verticalContainer != null) {
                            applyAlignToVerticalContainer();
                            for (int i = 0; i < verticalContainer.getChildCount(); i++) {
                                View child = verticalContainer.getChildAt(i);
                                LinearLayout.LayoutParams params =
                                        (LinearLayout.LayoutParams) child.getLayoutParams();
                                params.width = "stretch".equals(align)
                                        ? ViewGroup.LayoutParams.MATCH_PARENT
                                        : ViewGroup.LayoutParams.WRAP_CONTENT;
                                child.setLayoutParams(params);
                            }
                        } else if ("horizontal".equals(direction) && horizontalContainer != null) {
                            applyAlignToHorizontalContainer();
                            for (int i = 0; i < horizontalContainer.getChildCount(); i++) {
                                View child = horizontalContainer.getChildAt(i);
                                LinearLayout.LayoutParams params =
                                        (LinearLayout.LayoutParams) child.getLayoutParams();
                                params.height = "stretch".equals(align)
                                        ? ViewGroup.LayoutParams.MATCH_PARENT
                                        : ViewGroup.LayoutParams.WRAP_CONTENT;
                                child.setLayoutParams(params);
                            }
                        }
                    }
                }
            }
        }

        if (needRecreate && view != null) {
            Context context = view.getContext();
            View oldRootView = view;
            ViewGroup parent = (ViewGroup) oldRootView.getParent();

            View newView = onCreateView(context);
            view = newView;

            if (parent != null) {
                int index = parent.indexOfChild(oldRootView);
                parent.removeViewAt(index);
                parent.addView(newView, index);
            }
        }
    }
}

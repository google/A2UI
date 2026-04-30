package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;

import androidx.cardview.widget.CardView;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.A2UILayoutComponent;

import java.util.Map;

/**
 * Card component implementation
 *
 * Corresponds to the Card component in the A2UI protocol.
 * Provides a card container with shadow and rounded corner support.
 *
 * Supported properties:
 * - child: child component reference (String)
 * - elevation: shadow elevation (Number, default 4dp)
 * - radius: corner radius (Number, default 8dp)
 *
 */
public class CardComponent extends A2UILayoutComponent {

    private CardView cardView;
    private A2UIComponent childComponent;

    public CardComponent(String id, Map<String, Object> properties) {
        super(id, "Card");
        // 🔧 Key fix: save properties to the parent class's properties field
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    protected View onCreateView(Context context) {
        cardView = new CardView(context) {
            @Override
            public void setPadding(int left, int top, int right, int bottom) {
                setContentPadding(left, top, right, bottom);
            }
        };

        // Set default layout params
        ViewGroup.MarginLayoutParams params = new ViewGroup.MarginLayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        cardView.setLayoutParams(params);

        // Apply properties
        applyProperties(context);

        return cardView;
    }

    @Override
    public void onUpdateProperties(Map<String, Object> properties) {
        super.onUpdateProperties(properties);
        if (cardView != null) {
            applyProperties(cardView.getContext());
        }
    }

    /**
     * Apply component properties
     */
    private void applyProperties(Context context) {
        // Set corner radius
        if (properties.containsKey("radius")) {
            Object radius = properties.get("radius");
            if (radius instanceof Number) {
                float radiusDp = ((Number) radius).floatValue();
                cardView.setRadius(dpToPx(context, radiusDp));
            }
        } else {
            // Default corner radius 8dp
            cardView.setRadius(dpToPx(context, 8));
        }

        // Set card background color to white
        cardView.setCardBackgroundColor(0xFFFFFFFF);

        // Set clickable
        cardView.setClickable(true);
        cardView.setFocusable(true);
    }

    /**
     * Add a child component
     */
    @Override
    public void addChild(A2UIComponent child) {
        if (childComponent != null) {
            cardView.removeView(childComponent.getView());
        }

        childComponent = child;
        if (child != null && child.getView() != null) {
            View childView = child.getView();

            // 🔧 Fix: set child component's LayoutParams to WRAP_CONTENT
            // to prevent it from filling the entire Card, which would affect
            // Row/Column spaceBetween and other alignment modes
            ViewGroup.LayoutParams params = new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            childView.setLayoutParams(params);

            cardView.addView(childView);
        }
    }

    /**
     * Remove a child component
     */
    @Override
    public void removeChild(A2UIComponent child) {
        if (childComponent == child) {
            if (child != null && child.getView() != null) {
                cardView.removeView(child.getView());
            }
            childComponent = null;
        }
    }

    /**
     * Get the child component
     */
    public A2UIComponent getChild() {
        return childComponent;
    }

    /**
     * dp to px conversion
     */
    private float dpToPx(Context context, float dp) {
        return dp * context.getResources().getDisplayMetrics().density;
    }
}

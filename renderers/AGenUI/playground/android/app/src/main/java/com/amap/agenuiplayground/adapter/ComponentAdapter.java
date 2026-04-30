package com.amap.agenuiplayground.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.amap.agenuiplayground.R;
import com.amap.agenuiplayground.story.ComponentStory;
import com.amap.agenuiplayground.story.SubStory;

import java.util.ArrayList;
import java.util.List;

/**
 * Component List Adapter - Supports two-level menu
 * 
 */
public class ComponentAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {
    
    private static final int TYPE_PARENT = 0;  // Parent item (component name)
    private static final int TYPE_CHILD = 1;   // Child item (example name)
    
    private List<ComponentStory> stories;
    private List<Object> displayItems;  // Flattened list for display
    private OnItemClickListener listener;
    
    public ComponentAdapter() {
        this.stories = new ArrayList<>();
        this.displayItems = new ArrayList<>();
    }
    
    public void setStories(List<ComponentStory> stories) {
        this.stories = stories;
        rebuildDisplayItems();
        notifyDataSetChanged();
    }
    
    public void setOnItemClickListener(OnItemClickListener listener) {
        this.listener = listener;
    }
    
    /**
     * Rebuild display item list (flatten tree structure)
     */
    private void rebuildDisplayItems() {
        displayItems.clear();
        
        for (ComponentStory story : stories) {
            // Add parent item
            displayItems.add(story);
            
            // If expanded and has children, add child items
            if (story.isExpanded() && story.hasSubStories()) {
                displayItems.addAll(story.getSubStories());
            }
        }
    }
    
    @Override
    public int getItemViewType(int position) {
        Object item = displayItems.get(position);
        if (item instanceof ComponentStory) {
            return TYPE_PARENT;
        } else {
            return TYPE_CHILD;
        }
    }
    
    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        if (viewType == TYPE_PARENT) {
            View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_component_parent, parent, false);
            return new ParentViewHolder(view);
        } else {
            View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_component_child, parent, false);
            return new ChildViewHolder(view);
        }
    }
    
    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        Object item = displayItems.get(position);
        
        if (holder instanceof ParentViewHolder) {
            ComponentStory story = (ComponentStory) item;
            ParentViewHolder parentHolder = (ParentViewHolder) holder;
            
            // Display component name
            parentHolder.tvComponentName.setText(story.getComponentName());
            
            // Set expand icon
            if (story.hasSubStories()) {
                parentHolder.tvExpandIcon.setVisibility(View.VISIBLE);
                parentHolder.tvExpandIcon.setText(story.isExpanded() ? "▼" : "▶");
            } else {
                parentHolder.tvExpandIcon.setVisibility(View.GONE);
            }
            
            // Click event
            parentHolder.itemView.setOnClickListener(v -> {
                if (story.hasSubStories()) {
                    // Has children, toggle expand/collapse
                    story.toggleExpanded();
                    rebuildDisplayItems();
                    notifyDataSetChanged();
                } else {
                    // No children, load directly (legacy compatibility)
                    if (listener != null) {
                        listener.onParentClick(story);
                    }
                }
            });
            
        } else if (holder instanceof ChildViewHolder) {
            SubStory subStory = (SubStory) item;
            ChildViewHolder childHolder = (ChildViewHolder) holder;
            
            // Display sub-example name
            childHolder.tvSubStoryName.setText(subStory.getDisplayName());
            
            // Click event
            childHolder.itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onChildClick(subStory);
                }
            });
        }
    }
    
    @Override
    public int getItemCount() {
        return displayItems.size();
    }
    
    /**
     * Parent ViewHolder
     */
    static class ParentViewHolder extends RecyclerView.ViewHolder {
        TextView tvComponentName;
        TextView tvExpandIcon;
        
        ParentViewHolder(View itemView) {
            super(itemView);
            tvComponentName = itemView.findViewById(R.id.tvComponentName);
            tvExpandIcon = itemView.findViewById(R.id.tvExpandIcon);
        }
    }
    
    /**
     * Child ViewHolder
     */
    static class ChildViewHolder extends RecyclerView.ViewHolder {
        TextView tvSubStoryName;
        
        ChildViewHolder(View itemView) {
            super(itemView);
            tvSubStoryName = itemView.findViewById(R.id.tvSubStoryName);
        }
    }
    
    /**
     * Click listener interface
     */
    public interface OnItemClickListener {
        /**
         * Parent item click (component without children)
         */
        void onParentClick(ComponentStory story);
        
        /**
         * Child item click
         */
        void onChildClick(SubStory subStory);
    }
}
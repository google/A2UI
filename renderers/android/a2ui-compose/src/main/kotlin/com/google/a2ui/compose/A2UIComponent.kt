package com.google.a2ui.compose

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import com.google.a2ui.core.state.SurfaceState

@Composable
fun A2UIComponent(
    id: String,
    context: A2UIContext
) {
    val componentWrapper = context.state.components[id]

    if (componentWrapper == null) {
        // Fallback for missing component
        Text(text = "Missing component: $id")
        return
    }

    val renderer = ComponentRegistry.getRenderer(componentWrapper)
    if (renderer != null) {
        key(id) {
            renderer(componentWrapper, context)
        }
    } else {
        Text(text = "Unknown component type for: $id")
    }
}

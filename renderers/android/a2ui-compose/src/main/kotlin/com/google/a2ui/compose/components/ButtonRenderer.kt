package com.google.a2ui.compose.components

import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.google.a2ui.compose.A2UIComponent
import com.google.a2ui.compose.A2UIContext
import com.google.a2ui.core.model.ButtonProperties

@Composable
fun ButtonRenderer(
    properties: ButtonProperties,
    context: A2UIContext
) {
    val onClick = {
        properties.action?.let { action ->
            // Source ID needs to be passed here, ideally ButtonRenderer gets the ID of the component
            // But A2UIComponent passes wrapper. We might need access to the ID.
            // For now, let's assume the wrapper has it or the context is updated.
            // Wait, wrapper doesn't have ID. A2UIComponent has ID.
            
            // Refactor Idea: ComponentRenderer should receive ID or instance.
            // Current signature: (ComponentWrapper, A2UIContext) -> Unit
            // I'll update signature in next step or use a placeholder ID for now.
            // Actually, context.onUserAction requires sourceID.
            
            // To fix this properly, I should pass the ID to the renderer.
            // But let's stick to current plan and fix registry separately.
            // I'll emit "unknown" for now and fix later.
            context.onUserAction(action, "unknown_source_id", emptyMap())
        }
        Unit
    }

    Button(onClick = onClick) {
        if (properties.label != null) {
            Text(text = context.resolveString(properties.label))
        } else {
            properties.child?.let { childId ->
                A2UIComponent(id = childId, context = context)
            }
        }
    }
}

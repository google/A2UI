package com.google.a2ui.compose

import androidx.compose.runtime.Composable
import com.google.a2ui.compose.components.ButtonRenderer
import com.google.a2ui.compose.components.ColumnRenderer
import com.google.a2ui.compose.components.ImageRenderer
import com.google.a2ui.compose.components.RowRenderer
import com.google.a2ui.compose.components.TextFieldRenderer
import com.google.a2ui.compose.components.TextRenderer
import com.google.a2ui.core.model.ComponentWrapper

typealias ComponentRenderer = @Composable (ComponentWrapper, A2UIContext) -> Unit

object ComponentRegistry {
    private val renderers = mutableMapOf<String, ComponentRenderer>()

    init {
        // Register default components
        register("Text") { wrapper, ctx -> TextRenderer(wrapper.Text!!, ctx) }
        register("Button") { wrapper, ctx -> ButtonRenderer(wrapper.Button!!, ctx) }
        register("Column") { wrapper, ctx -> ColumnRenderer(wrapper.Column!!, ctx) }
        register("Row") { wrapper, ctx -> RowRenderer(wrapper.Row!!, ctx) }
        register("Image") { wrapper, ctx -> ImageRenderer(wrapper.Image!!, ctx) }
        register("TextField") { wrapper, ctx -> TextFieldRenderer(wrapper.TextField!!, ctx) }
    }

    fun register(type: String, renderer: ComponentRenderer) {
        renderers[type] = renderer
    }

    fun getRenderer(wrapper: ComponentWrapper): ComponentRenderer? {
        val type = getType(wrapper)
        return type?.let { renderers[it] }
    }

    private fun getType(wrapper: ComponentWrapper): String? {
        // Find which property is not null. 
        // In a real implementation this might be optimized or explicit type name passed.
        // A2UI protocol dictates single key.
        return when {
            wrapper.Text != null -> "Text"
            wrapper.Button != null -> "Button"
            wrapper.Column != null -> "Column"
            wrapper.Row != null -> "Row"
            wrapper.Box != null -> "Box"
            wrapper.Image != null -> "Image"
            wrapper.TextField != null -> "TextField"
            else -> null
        }
    }
}

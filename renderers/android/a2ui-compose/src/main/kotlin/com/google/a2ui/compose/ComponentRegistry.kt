package com.google.a2ui.compose

import androidx.compose.runtime.Composable
import com.google.a2ui.compose.components.ButtonRenderer
import com.google.a2ui.compose.components.CardRenderer
import com.google.a2ui.compose.components.CheckboxRenderer
import com.google.a2ui.compose.components.ColumnRenderer
import com.google.a2ui.compose.components.DateTimeRenderer
import com.google.a2ui.compose.components.ImageRenderer
import com.google.a2ui.compose.components.ModalRenderer
import com.google.a2ui.compose.components.RowRenderer
import com.google.a2ui.compose.components.SliderRenderer
import com.google.a2ui.compose.components.TabsRenderer
import com.google.a2ui.compose.components.TextFieldRenderer
import com.google.a2ui.compose.components.TextRenderer
import com.google.a2ui.compose.components.VideoRenderer
import com.google.a2ui.compose.components.IconRenderer
import com.google.a2ui.compose.components.DividerRenderer
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
        
        // Register new components
        register("Checkbox") { wrapper, ctx -> CheckboxRenderer(wrapper.Checkbox!!, ctx) }
        register("Slider") { wrapper, ctx -> SliderRenderer(wrapper.Slider!!, ctx) }
        register("Card") { wrapper, ctx -> CardRenderer(wrapper.Card!!, ctx) }
        register("Tabs") { wrapper, ctx -> TabsRenderer(wrapper.Tabs!!, ctx) }
        register("Modal") { wrapper, ctx -> ModalRenderer(wrapper.Modal!!, ctx) }
        register("DateTimeInput") { wrapper, ctx -> DateTimeRenderer(wrapper.DateTimeInput!!, ctx) }
        register("Video") { wrapper, ctx -> VideoRenderer(wrapper.Video!!, ctx) }
        register("Icon") { wrapper, ctx -> IconRenderer.Render(wrapper, ctx) }
        register("Divider") { wrapper, ctx -> DividerRenderer(wrapper.Divider!!, ctx) }
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
            wrapper.Checkbox != null -> "Checkbox"
            wrapper.Slider != null -> "Slider"
            wrapper.Card != null -> "Card"
            wrapper.Tabs != null -> "Tabs"
            wrapper.Modal != null -> "Modal"
            wrapper.DateTimeInput != null -> "DateTimeInput"
            wrapper.Video != null -> "Video"
            wrapper.Audio != null -> "Audio"
            wrapper.Icon != null -> "Icon"
            wrapper.Divider != null -> "Divider"
            else -> null
        }
    }
}

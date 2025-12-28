package com.google.a2ui.compose.components

import androidx.compose.material3.Slider
import androidx.compose.runtime.Composable
import com.google.a2ui.compose.A2UIContext
import com.google.a2ui.core.model.SliderProperties

@Composable
fun SliderRenderer(
    props: SliderProperties,
    context: A2UIContext
) {
    val value = props.value?.let { context.resolveNumber(it) }?.toFloat() ?: 0f
    val min = props.min?.toFloat() ?: 0f
    val max = props.max?.toFloat() ?: 1f

    Slider(
        value = value,
        onValueChange = { newValue ->
            // Debouncing usually handled by state management, here we fire action
            props.onValueChange?.let { action ->
                 context.onUserAction(action, mapOf("value" to newValue.toDouble()))
            }
        },
        valueRange = min..max
    )
}

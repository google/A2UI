package com.google.a2ui.compose.components

import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.google.a2ui.compose.A2UIContext
import com.google.a2ui.core.model.DividerProperties

@Composable
fun DividerRenderer(
    properties: DividerProperties,
    context: A2UIContext
) {
    // Default thickness 1.dp if not specified
    val thickness = properties.thickness?.let { it.dp } ?: 1.dp
    
    // Parse color if present (skipping for this simple MVP, defaulting to onSurfaceVariant)
    
    HorizontalDivider(
        thickness = thickness,
        modifier = Modifier,
        color = Color.Unspecified // Uses Material theme default
    )
}

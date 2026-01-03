package com.google.a2ui.compose.components

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.google.a2ui.compose.A2UIComponent
import com.google.a2ui.compose.A2UIContext
import com.google.a2ui.core.model.CardProperties

@Composable
fun CardRenderer(
    props: CardProperties,
    context: A2UIContext
) {
    Card(
        modifier = Modifier.padding(8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        props.child?.let { childId ->
            A2UIComponent(childId, context)
        }
    }
}

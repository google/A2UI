package com.google.a2ui.compose

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import com.google.a2ui.core.model.Action
import com.google.a2ui.core.state.SurfaceState
import kotlinx.serialization.json.JsonElement

val LocalA2UIContext = staticCompositionLocalOf<A2UIContext> {
    error("No A2UIContext provided")
}

@Composable
fun A2UISurface(
    surfaceId: String,
    state: SurfaceState,
    onUserAction: (Action, String, Map<String, JsonElement>) -> Unit
) {
    val context = A2UIContext(
        state = state,
        onUserAction = onUserAction
    )

    CompositionLocalProvider(LocalA2UIContext provides context) {
        if (state.rootId != null) {
            A2UIComponent(id = state.rootId!!, context = context)
        }
    }
}

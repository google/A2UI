package com.google.a2ui.compose

import com.google.a2ui.core.model.Action
import com.google.a2ui.core.model.BoundValue
import com.google.a2ui.core.state.SurfaceState

data class A2UIContext(
    val state: SurfaceState,
    val onUserAction: (Action, String) -> Unit // action, sourceId
) {
    fun resolve(boundValue: BoundValue?): Any? {
        return state.resolve(boundValue)
    }

    fun resolveString(boundValue: BoundValue?): String {
        return resolve(boundValue)?.toString() ?: ""
    }
    
    fun resolveBoolean(boundValue: BoundValue?): Boolean {
        return resolve(boundValue) as? Boolean ?: false
    }
}

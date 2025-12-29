package com.google.a2ui.compose

import com.google.a2ui.core.model.Action
import com.google.a2ui.core.model.BoundValue
import com.google.a2ui.core.state.SurfaceState
import kotlinx.serialization.json.JsonElement

data class A2UIContext(
    val state: SurfaceState,
    val onUserAction: (Action, String, Map<String, JsonElement>) -> Unit // action, sourceId, context
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

    fun resolveNumber(boundValue: BoundValue?): Double {
        return (resolve(boundValue) as? Number)?.toDouble() ?: 0.0
    }
}

package com.google.a2ui.core.state

import com.google.a2ui.core.model.BoundValue
import com.google.a2ui.core.model.ComponentInstance
import com.google.a2ui.core.model.ComponentWrapper
import com.google.a2ui.core.model.DataEntry
import com.google.a2ui.core.model.ServerMessage
import kotlinx.serialization.json.JsonElement

class SurfaceState {
    private val _components = mutableMapOf<String, ComponentWrapper>()
    val components: Map<String, ComponentWrapper> get() = _components

    private val _dataModel = mutableMapOf<String, Any?>()
    val dataModel: Map<String, Any?> get() = _dataModel

    var rootId: String? = null
        private set

    fun applyUpdate(message: ServerMessage) {
        when (message) {
            is ServerMessage.SurfaceUpdate -> {
                message.components.forEach { instance ->
                    _components[instance.id] = instance.component
                }
            }
            is ServerMessage.DataModelUpdate -> {
                applyDataUpdate(message.path, message.contents)
            }
            is ServerMessage.BeginRendering -> {
                rootId = message.root
                // Styles would be handled here
            }
            is ServerMessage.DeleteSurface -> {
                _components.clear()
                _dataModel.clear()
                rootId = null
            }
        }
    }

    private fun applyDataUpdate(path: String?, contents: List<DataEntry>) {
        val targetMap = if (path.isNullOrEmpty() || path == "/") {
            _dataModel
        } else {
            // Traverse to path - simplifed for now, robust implementation needs path parsing
            // For MVP assuming flat or simple paths for update root
            // Making this a recursive update or pointer retrieval is needed for deep updates
            // For now, let's just support root updates or shallow updates for MVP simplicity
            // TODO: Implement deep path traversal
            _dataModel
        }

        contents.forEach { entry ->
            val value = resolveDataEntry(entry)
            targetMap[entry.key] = value
        }
    }

    private fun resolveDataEntry(entry: DataEntry): Any? {
        return when {
            entry.valueString != null -> entry.valueString
            entry.valueNumber != null -> entry.valueNumber
            entry.valueBoolean != null -> entry.valueBoolean
            entry.valueMap != null -> {
                val map = mutableMapOf<String, Any?>()
                entry.valueMap.forEach { childEntry ->
                    map[childEntry.key] = resolveDataEntry(childEntry)
                }
                map
            }
            else -> null
        }
    }

    fun resolve(boundValue: BoundValue?): Any? {
        if (boundValue == null) return null
        
        // Priority: Literal > Path
        if (boundValue.literalString != null) return boundValue.literalString
        if (boundValue.literalNumber != null) return boundValue.literalNumber
        if (boundValue.literalBoolean != null) return boundValue.literalBoolean
        
        if (boundValue.path != null) {
            return resolvePath(boundValue.path)
        }
        
        return null
    }

    private fun resolvePath(path: String): Any? {
        // Basic path resolution: /user/name -> dataModel["user"]["name"]
        val parts = path.split('/').filter { it.isNotEmpty() }
        var current: Any? = _dataModel
        
        for (part in parts) {
            if (current is Map<*, *>) {
                current = current[part]
            } else {
                return null
            }
        }
        return current
    }
}

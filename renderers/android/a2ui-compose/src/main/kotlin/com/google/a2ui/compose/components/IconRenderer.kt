package com.google.a2ui.compose.components

import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Warning
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import com.google.a2ui.compose.A2UIContext
import com.google.a2ui.core.model.ComponentWrapper
import com.google.a2ui.core.model.IconProperties
import kotlin.reflect.KProperty1
import java.util.Locale

object IconRenderer {
    private val iconCache = mutableMapOf<String, ImageVector>()

    @Composable
    fun Render(
        wrapper: ComponentWrapper,
        context: A2UIContext,
        modifier: Modifier = Modifier
    ) {
        val props = wrapper.Icon ?: return
        val rawName = context.resolveString(props.name) ?: "warning"
        
        // Normalize name: snake_case to CamelCase if needed, matching Material naming
        // e.g. "calendar_today" -> "CalendarToday"
        // The agent sends "calendarToday" (camelCase).
        // Material properties are "CalendarToday" (PascalCase).
        
        val iconName = rawName.replaceFirstChar { it.uppercase() }

        val iconVector = iconCache.getOrPut(iconName) {
            findIconByName(iconName) ?: Icons.Default.Warning
        }

        Icon(
            imageVector = iconVector,
            contentDescription = null,
            tint = LocalContentColor.current,
            modifier = modifier
        )
    }

    private fun findIconByName(name: String): ImageVector? {
        // Aliases for common mismatches
        val normalizedName = when (name.lowercase(Locale.ROOT)) {
            "mail" -> "Email"
            "calendar" -> "DateRange"
            "calendartoday" -> "CalendarToday" // Explicitly ensure Extended naming
            else -> name.replaceFirstChar { it.uppercase() }
        }

        // 1. Try accessing as member of Icons.Filled (Core icons)
        try {
            val kClass = Icons.Filled::class
            val property = kClass.members.firstOrNull { it.name.equals(normalizedName, ignoreCase = true) }
            if (property != null) {
                @Suppress("UNCHECKED_CAST")
                return (property as? KProperty1<Any, *>)?.get(Icons.Filled) as? ImageVector
            }
        } catch (e: Exception) {
            // Ignore, try next method
        }

        // 2. Try accessing as Extension Property (Extended icons)
        // These are compiled into classes named after the icon, e.g. androidx.compose.material.icons.filled.AccountBoxKt
        // The accessor method is usually "getAccountBox(Icons.Filled)"
        try {
            // Construct class name: androidx.compose.material.icons.filled.NameKt
            // Note: Case sensitivity matters for class loading. We try strict matching first.
            val className = "androidx.compose.material.icons.filled.${normalizedName}Kt"
            val clazz = Class.forName(className)
            val method = clazz.getMethod("get$normalizedName", androidx.compose.material.icons.Icons.Filled::class.java)
            return method.invoke(null, androidx.compose.material.icons.Icons.Filled) as? ImageVector
        } catch (e: Exception) {
            android.util.Log.w("IconRenderer", "Failed to find icon $normalizedName via reflection: ${e.message}")
        }

        return null
    }
}

package com.google.a2ui.compose.components

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.google.a2ui.compose.A2UIComponent
import com.google.a2ui.compose.A2UIContext
import com.google.a2ui.core.model.TabsProperties
import kotlinx.serialization.json.JsonPrimitive

@Composable
fun TabsRenderer(
    props: TabsProperties,
    context: A2UIContext
) {
    val selectedIndex = props.selectedIndex?.let { context.resolveNumber(it).toInt() } ?: 0
    val tabs = props.tabs ?: emptyList()

    Column {
        TabRow(selectedTabIndex = selectedIndex) {
            tabs.forEachIndexed { index, tabItem ->
                val title = context.resolveString(tabItem.title) ?: ""
                Tab(
                    selected = index == selectedIndex,
                    onClick = {
                        props.onTabSelected?.let { action ->
                             context.onUserAction(action, "unknown_source_id", mapOf("index" to JsonPrimitive(index.toDouble())))
                        }
                    },
                    text = { Text(title) }
                )
            }
        }
        
        // Render content of selected tab
        if (selectedIndex in tabs.indices) {
             tabs[selectedIndex].child?.let { childId ->
                 A2UIComponent(childId, context)
             }
        }
    }
}

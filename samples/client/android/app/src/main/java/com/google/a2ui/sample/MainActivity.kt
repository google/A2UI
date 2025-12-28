package com.google.a2ui.sample

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.google.a2ui.compose.A2UISurface
import com.google.a2ui.core.model.ComponentInstance
import com.google.a2ui.core.model.ComponentWrapper
import com.google.a2ui.core.model.ServerMessage
import com.google.a2ui.core.model.TextProperties
import com.google.a2ui.core.model.BoundValue
import com.google.a2ui.core.model.ContainerProperties
import com.google.a2ui.core.model.Children
import com.google.a2ui.core.state.SurfaceState
import kotlinx.serialization.json.Json

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    Surface(modifier = Modifier.padding(innerPadding)) {
                        SampleA2UIScreen()
                    }
                }
            }
        }
    }
}

@Composable
fun SampleA2UIScreen() {
    // Manual state management for demo
    // In real app, use ViewModel and observe StateFlow
    val surfaceState = remember { SurfaceState() }
    var refreshTrigger by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        // Simulate loading data
        val messages = listOf(
            ServerMessage.SurfaceUpdate(
                surfaceId = "main",
                components = listOf(
                    ComponentInstance(
                        id = "root",
                        component = ComponentWrapper(
                            Column = ContainerProperties(
                                children = Children(explicitList = listOf("header", "content"))
                            )
                        )
                    ),
                    ComponentInstance(
                        id = "header",
                        component = ComponentWrapper(
                            Text = TextProperties(
                                text = BoundValue(literalString = "Welcome to A2UI Android"),
                                usageHint = "headlineLarge"
                            )
                        )
                    ),
                    ComponentInstance(
                        id = "content",
                        component = ComponentWrapper(
                            Text = TextProperties(
                                text = BoundValue(literalString = "This is rendered natively with Jetpack Compose!")
                            )
                        )
                    )
                )
            ),
            ServerMessage.BeginRendering(surfaceId = "main", root = "root")
        )

        messages.forEach { msg ->
            surfaceState.applyUpdate(msg)
        }
        refreshTrigger++
    }

    // Force recomposition when trigger changes
    key(refreshTrigger) {
        A2UISurface(
            surfaceId = "main",
            state = surfaceState,
            onUserAction = { action, src -> 
                println("Action: ${action.name} from $src")
            }
        )
    }
}

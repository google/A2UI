package com.google.a2ui.sample

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.ui.unit.dp
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.google.a2ui.compose.A2UISurface
import com.google.a2ui.core.model.ServerMessage
import com.google.a2ui.core.state.SurfaceState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

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
    val surfaceState = remember { SurfaceState() }
    var isLoading by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var query by remember { mutableStateOf("Find contact info for Alex Jordan") }
    
    // Initialize our native A2A Client
    val a2aClient = remember { A2AClient() }
    val scope = rememberCoroutineScope()

    androidx.compose.foundation.layout.Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Input Area
        androidx.compose.foundation.layout.Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            androidx.compose.material3.TextField(
                value = query,
                onValueChange = { query = it },
                modifier = Modifier.weight(1f),
                label = { Text("Ask Agent") }
            )
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.width(8.dp))
            androidx.compose.material3.Button(
                onClick = {
                    isLoading = true
                    errorMsg = null
                    scope.launch(Dispatchers.IO) {
                        try {
                            val messages = a2aClient.sendMessage(query)
                            withContext(Dispatchers.Main) {
                                messages.forEach { surfaceState.applyUpdate(it) }
                                isLoading = false
                            }
                        } catch (e: Exception) {
                            e.printStackTrace()
                            withContext(Dispatchers.Main) {
                                errorMsg = "Error: ${e.message}"
                                isLoading = false
                            }
                        }
                    }
                },
                enabled = !isLoading
            ) {
                Text("Send")
            }
        }

        // Content Area
        Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else if (errorMsg != null) {
                Text(
                    text = errorMsg!!,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.align(Alignment.Center).padding(16.dp)
                )
            } else {
                A2UISurface(
                    surfaceId = "contact-card",
                    state = surfaceState,
                    onUserAction = { action, src, contextMap ->
                        Log.d("A2UI", "Action: ${action.name} from $src")
                        
                        val actionData = kotlinx.serialization.json.JsonObject(contextMap)
                        
                        scope.launch(Dispatchers.IO) {
                            try {
                                val updates = a2aClient.sendEvent(actionData)
                                withContext(Dispatchers.Main) {
                                    updates.forEach { surfaceState.applyUpdate(it) }
                                }
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                    }
                )
            }
        }
    }
}

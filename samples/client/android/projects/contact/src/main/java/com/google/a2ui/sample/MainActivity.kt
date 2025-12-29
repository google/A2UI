package com.google.a2ui.sample

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
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
    var isLoading by remember { mutableStateOf(true) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    
    // Initialize our native A2A Client
    val a2aClient = remember { A2AClient() }

    LaunchedEffect(Unit) {
        withContext(Dispatchers.IO) {
            try {
                // Send an initial query to start the conversation
                val messages = a2aClient.sendMessage("Find contact info for Alex Jordan")
                
                withContext(Dispatchers.Main) {
                    android.util.Log.d("MainActivity", "Applying ${messages.size} updates to surface.")
                    messages.forEach { 
                        android.util.Log.d("MainActivity", "Applying update: $it")
                        surfaceState.applyUpdate(it) 
                    }
                    isLoading = false
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    errorMsg = "Error: ${e.message}. \nMake sure 'uv run .' is running in 'contact_lookup'!"
                    isLoading = false
                }
            }
        }
    }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    } else if (errorMsg != null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(text = errorMsg!!)
        }
    } else {
        A2UISurface(
            surfaceId = "contact-card", // Matches server's "contact-card" surface ID
            state = surfaceState,
            onUserAction = { action, src, contextMap ->
                Log.d("A2UI", "Action: ${action.name} from $src with $contextMap")
                Log.d("A2UI", "Action: ${action.name} from $src with $contextMap")
                
                // Construct the JSON object for the user action context
                val actionData = kotlinx.serialization.json.JsonObject(contextMap)
                
                // Launch a coroutine to send the event to the server
                // Note: ideally this should be handled by a ViewModel to avoid leak
                kotlinx.coroutines.CoroutineScope(Dispatchers.IO).launch {
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

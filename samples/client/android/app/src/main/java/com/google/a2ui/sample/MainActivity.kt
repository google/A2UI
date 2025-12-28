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
                val messages = a2aClient.sendMessage("Find contact info for Sarah Lee")
                
                withContext(Dispatchers.Main) {
                    messages.forEach { surfaceState.applyUpdate(it) }
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
            surfaceId = "main", // Ensure this matches what the agent returns in BeginRendering
            state = surfaceState,
            onUserAction = { action, src ->
                Log.d("A2UI", "Action: ${action.name} from $src")
                // TODO: Handle user actions by calling a2aClient.sendEvent(action.parameters)
            }
        )
    }
}

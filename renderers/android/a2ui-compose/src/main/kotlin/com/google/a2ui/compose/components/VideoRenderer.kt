package com.google.a2ui.compose.components

import android.widget.VideoView
import android.widget.MediaController
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.viewinterop.AndroidView
import com.google.a2ui.compose.A2UIContext
import com.google.a2ui.core.model.VideoProperties

@Composable
fun VideoRenderer(
    props: VideoProperties,
    context: A2UIContext
) {
    val url = props.url?.let { context.resolveString(it) }
    
    if (url != null) {
        AndroidView(factory = { ctx ->
            VideoView(ctx).apply {
                setVideoURI(Uri.parse(url))
                val mediaController = MediaController(ctx)
                mediaController.setAnchorView(this)
                setMediaController(mediaController)
                
                if (props.autoPlay == true) {
                    start()
                }
            }
        })
    }
}

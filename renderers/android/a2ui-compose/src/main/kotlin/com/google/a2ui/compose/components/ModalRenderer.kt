package com.google.a2ui.compose.components

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.google.a2ui.compose.A2UIComponent
import com.google.a2ui.compose.A2UIContext
import com.google.a2ui.core.model.ModalProperties

@Composable
fun ModalRenderer(
    props: ModalProperties,
    context: A2UIContext
) {
    val isOpen = props.isOpen?.let { context.resolveBoolean(it) } ?: false

    if (isOpen) {
        val title = props.title?.let { context.resolveString(it) }

        AlertDialog(
            onDismissRequest = {
                props.onDismiss?.let { action ->
                    context.onUserAction(action, emptyMap())
                }
            },
            title = {
                if (title != null) {
                    Text(title)
                }
            },
            text = {
                props.content?.let { contentId ->
                    A2UIComponent(contentId, context)
                }
            },
            confirmButton = {
                // A2UI spec might have generic actions list. 
                // For MVP, if actions exist, we just render close button or custom actions if implemented.
                Button(
                    onClick = {
                        props.onDismiss?.let { action ->
                            context.onUserAction(action, emptyMap())
                        }
                    }
                ) {
                    Text("Close")
                }
            }
        )
    }
}

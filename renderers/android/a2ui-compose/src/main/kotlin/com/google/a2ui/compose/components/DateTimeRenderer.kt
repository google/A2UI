package com.google.a2ui.compose.components

import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import com.google.a2ui.compose.A2UIContext
import com.google.a2ui.core.model.DateTimeInputProperties
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DateTimeRenderer(
    props: DateTimeInputProperties,
    context: A2UIContext
) {
    val dateStr = props.value?.let { context.resolveString(it) } ?: ""
    val label = props.label?.let { context.resolveString(it) } ?: "Select Date"
    
    var showDatePicker by remember { mutableStateOf(false) }
    
    // Convert ISO string to millis for DatePicker if needed, skipping complex parsing for MVP
    // Assuming dateStr is displayable or we use simple parser
    
    OutlinedTextField(
        value = dateStr,
        onValueChange = { }, // Read-only, set via picker
        label = { Text(label) },
        readOnly = true,
        modifier = Modifier.onFocusChanged { focusState ->
            if (focusState.isFocused) {
                showDatePicker = true
            }
        }
    )

    if (showDatePicker) {
        val datePickerState = rememberDatePickerState()
        
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDatePicker = false
                        datePickerState.selectedDateMillis?.let { millis ->
                            val s = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(millis))
                            props.onValueChange?.let { action ->
                                context.onUserAction(action, mapOf("value" to s))
                            }
                        }
                    }
                ) {
                    Text("OK")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Cancel")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }
}

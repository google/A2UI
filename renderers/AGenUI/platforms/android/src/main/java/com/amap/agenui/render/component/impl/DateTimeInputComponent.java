package com.amap.agenui.render.component.impl;

import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.Context;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.style.ComponentStyleConfig;
import com.amap.agenui.render.style.StyleHelper;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.Map;

/**
 * DateTimeInput component implementation
 *
 * Corresponds to the DateTimeInput component in the A2UI protocol
 * Supports date and time selection
 *
 * Supported properties:
 * - enableDate: whether to enable date selection (Boolean, default true)
 * - enableTime: whether to enable time selection (Boolean, default false)
 * - label: label text (String)
 * - value: current value (String, ISO 8601 format)
 * - min: minimum value (String, ISO 8601 format)
 * - max: maximum value (String, ISO 8601 format)
 * - dataBinding: data binding path (String)
 *
 */
public class DateTimeInputComponent extends A2UIComponent {

    private static final String TAG = "DateTimeInputComponent";

    private LinearLayout containerLayout;
    private TextView textView;             // text display (placeholder or date)
    private ImageView calendarIconView;    // calendar icon

    private boolean enableDate = true;
    private boolean enableTime = false;
    private Calendar calendar;
    private boolean hasSelectedDate = false;  // whether a date has been selected

    private SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
    private SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm", Locale.getDefault());
    private SimpleDateFormat dateTimeFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault());

    // Compact style configuration
    private CompactStyleConfig compactStyle;

    public DateTimeInputComponent(String id, Map<String, Object> properties) {
        super(id, "DateTimeInput");
        if (properties != null) {
            this.properties.putAll(properties);  // copy incoming properties into the base class properties map
        }
        this.calendar = Calendar.getInstance();
    }

    @Override
    public View onCreateView(Context context) {
        // Parse properties
        parseProperties();

        // Load style configuration
        ComponentStyleConfig.StyleHashMap<String, String> styleConfig = loadStyleConfig(context);

        // Parse compact style
        compactStyle = loadCompactStyle(styleConfig, context);

        // Create main container - single button container
        containerLayout = new LinearLayout(context);
        containerLayout.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams containerParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                compactStyle.height
        );
        containerLayout.setLayoutParams(containerParams);
        containerLayout.setGravity(Gravity.CENTER);
        containerLayout.setPadding(
                compactStyle.paddingHorizontal,
                compactStyle.paddingVertical,
                compactStyle.paddingHorizontal,
                compactStyle.paddingVertical
        );

        // Set click listener - choose picker based on enableDate and enableTime
        containerLayout.setOnClickListener(v -> {
            if (enableDate && enableTime) {
                showDateTimePicker(context);  // both enabled: select date first, then time
            } else if (enableDate) {
                showDatePicker(context);      // date only
            } else if (enableTime) {
                showTimePicker(context);      // time only
            }
        });

        // Create text view
        textView = new TextView(context);
        textView.setTextSize(TypedValue.COMPLEX_UNIT_PX, compactStyle.fontSize);
        LinearLayout.LayoutParams textParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        textView.setLayoutParams(textParams);
        containerLayout.addView(textView);

        // Create calendar icon
        calendarIconView = new ImageView(context);
        LinearLayout.LayoutParams iconParams = new LinearLayout.LayoutParams(
                compactStyle.iconSize,
                compactStyle.iconSize
        );
        iconParams.leftMargin = compactStyle.iconSpacing;
        calendarIconView.setLayoutParams(iconParams);
        calendarIconView.setScaleType(ImageView.ScaleType.CENTER_INSIDE);

        // Load icon using StyleHelper
        int iconResId = StyleHelper.getIconResourceId(compactStyle.iconName);
        if (iconResId != 0) {
            calendarIconView.setImageResource(iconResId);
        } else {
            Log.w(TAG, "Icon not found: " + compactStyle.iconName);
        }

        containerLayout.addView(calendarIconView);

        // Initialize display
        updateDisplay();

        return containerLayout;
    }

    /**
     * Parse component properties
     */
    private void parseProperties() {
        if (properties.containsKey("enableDate")) {
            Object value = properties.get("enableDate");
            if (value instanceof Boolean) {
                enableDate = (Boolean) value;
            }
        }

        if (properties.containsKey("enableTime")) {
            Object value = properties.get("enableTime");
            if (value instanceof Boolean) {
                enableTime = (Boolean) value;
            }
        }

        // Parse initial value - use different formats based on enableDate and enableTime
        if (properties.containsKey("value")) {
            String valueStr = (String) properties.get("value");
            if (valueStr != null && !valueStr.isEmpty()) {
                try {
                    Date date = null;

                    // Choose the appropriate format based on enabled features
                    if (enableDate && enableTime) {
                        // Attempt to parse full date-time format
                        date = dateTimeFormat.parse(valueStr);
                    } else if (enableDate) {
                        // Parse date part only
                        date = dateFormat.parse(valueStr);
                    } else if (enableTime) {
                        // Parse time part only
                        date = timeFormat.parse(valueStr);
                    }

                    if (date != null) {
                        calendar.setTime(date);
                        hasSelectedDate = true;
                        Log.d(TAG, "Parsed initial value: " + valueStr + " -> " + date);
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Failed to parse initial value: " + valueStr, e);
                    // Keep default state on parse failure
                    hasSelectedDate = false;
                }
            }
        }
    }

    /**
     * Show date picker
     */
    private void showDatePicker(Context context) {
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog dialog = new DatePickerDialog(context,
                (view, selectedYear, selectedMonth, selectedDay) -> {
                    calendar.set(Calendar.YEAR, selectedYear);
                    calendar.set(Calendar.MONTH, selectedMonth);
                    calendar.set(Calendar.DAY_OF_MONTH, selectedDay);
                    updateValue();
                }, year, month, day);

        // Set minimum value
        if (properties.containsKey("min")) {
            try {
                String minStr = (String) properties.get("min");
                Date minDate = dateTimeFormat.parse(minStr);
                if (minDate != null) {
                    dialog.getDatePicker().setMinDate(minDate.getTime());
                }
            } catch (Exception e) {
                // ignore
            }
        }

        // Set maximum value
        if (properties.containsKey("max")) {
            try {
                String maxStr = (String) properties.get("max");
                Date maxDate = dateTimeFormat.parse(maxStr);
                if (maxDate != null) {
                    dialog.getDatePicker().setMaxDate(maxDate.getTime());
                }
            } catch (Exception e) {
                // ignore
            }
        }

        dialog.show();
    }

    /**
     * Show time picker
     */
    private void showTimePicker(Context context) {
        int hour = calendar.get(Calendar.HOUR_OF_DAY);
        int minute = calendar.get(Calendar.MINUTE);

        try {
            // Use default style, consistent with DatePickerDialog
            TimePickerDialog dialog = new TimePickerDialog(context,
                    (view, selectedHour, selectedMinute) -> {
                        calendar.set(Calendar.HOUR_OF_DAY, selectedHour);
                        calendar.set(Calendar.MINUTE, selectedMinute);
                        updateValue();
                    }, hour, minute, true);

            dialog.show();
        } catch (Exception e) {
            // Catch internal exceptions from Android system TimePickerDialog (system bug on some devices)
            Log.e(TAG, "Error showing time picker", e);
        }
    }

    /**
     * Show date-time picker (sequential selection)
     * Select date first, then automatically show time picker
     */
    private void showDateTimePicker(Context context) {
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);

        // Step 1: Show date picker
        DatePickerDialog dateDialog = new DatePickerDialog(context,
                (view, selectedYear, selectedMonth, selectedDay) -> {
                    // Save selected date
                    calendar.set(Calendar.YEAR, selectedYear);
                    calendar.set(Calendar.MONTH, selectedMonth);
                    calendar.set(Calendar.DAY_OF_MONTH, selectedDay);

                    // Step 2: Automatically show time picker
                    int hour = calendar.get(Calendar.HOUR_OF_DAY);
                    int minute = calendar.get(Calendar.MINUTE);

                    try {
                        // Use default style, consistent with DatePickerDialog
                        TimePickerDialog timeDialog = new TimePickerDialog(context,
                                (timeView, selectedHour, selectedMinute) -> {
                                    // Save selected time
                                    calendar.set(Calendar.HOUR_OF_DAY, selectedHour);
                                    calendar.set(Calendar.MINUTE, selectedMinute);
                                    // Update final value
                                    updateValue();
                                }, hour, minute, true);

                        timeDialog.show();
                    } catch (Exception e) {
                        // Catch internal exceptions from Android system TimePickerDialog (system bug on some devices)
                        Log.e(TAG, "Error showing time picker in date-time mode", e);
                        // Update date part even if the time picker fails
                        updateValue();
                    }
                }, year, month, day);

        // Set minimum value
        if (properties.containsKey("min")) {
            try {
                String minStr = (String) properties.get("min");
                Date minDate = dateTimeFormat.parse(minStr);
                if (minDate != null) {
                    dateDialog.getDatePicker().setMinDate(minDate.getTime());
                }
            } catch (Exception e) {
                // ignore
            }
        }

        // Set maximum value
        if (properties.containsKey("max")) {
            try {
                String maxStr = (String) properties.get("max");
                Date maxDate = dateTimeFormat.parse(maxStr);
                if (maxDate != null) {
                    dateDialog.getDatePicker().setMaxDate(maxDate.getTime());
                }
            } catch (Exception e) {
                // ignore
            }
        }

        dateDialog.show();
    }

    /**
     * Update value
     */
    private void updateValue() {
        String newValue;
        if (enableDate && enableTime) {
            newValue = dateTimeFormat.format(calendar.getTime());
        } else if (enableDate) {
            newValue = dateFormat.format(calendar.getTime());
        } else {
            newValue = timeFormat.format(calendar.getTime());
        }

        properties.put("value", newValue);
        hasSelectedDate = true;
        updateDisplay();

        // Send data change to native
        sendDataChangeToNative(newValue);
    }

    /**
     * Update display
     */
    private void updateDisplay() {
        if (textView == null || calendarIconView == null || compactStyle == null) {
            return;
        }

        // Create rounded corner background
        GradientDrawable background = new GradientDrawable();
        background.setCornerRadius(compactStyle.cornerRadius);

        if (hasSelectedDate) {
            // Date selected state
            String displayValue;
            if (enableDate && enableTime) {
                displayValue = dateTimeFormat.format(calendar.getTime());
            } else if (enableDate) {
                displayValue = dateFormat.format(calendar.getTime());
            } else {
                displayValue = timeFormat.format(calendar.getTime());
            }

            textView.setText(displayValue);
            textView.setTextColor(compactStyle.selectedTextColor);

            // Set text to bold
            textView.setTypeface(null, Typeface.BOLD);

            // Set selected state background color
            background.setColor(compactStyle.selectedBackgroundColor);

            // Hide icon
            calendarIconView.setVisibility(View.GONE);
        } else {
            // No date selected state
            textView.setText(compactStyle.placeholderText);
            textView.setTextColor(compactStyle.unselectedTextColor);

            // Set text to normal (non-bold)
            textView.setTypeface(null, Typeface.NORMAL);

            // Set unselected state background color (light gray)
            background.setColor(0xFFF5F5F5);  // #F5F5F5

            // Show icon
            calendarIconView.setVisibility(View.VISIBLE);
        }

        // Apply background to the entire container
        containerLayout.setBackground(background);
    }

    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        // Update properties
        if (properties != null) {
            this.properties.putAll(properties);
        }
        
        // Re-parse properties
        parseProperties();

        // Update display
        updateDisplay();
    }

    /**
     * Send data change to native
     */
    private void sendDataChangeToNative(String value) {
        syncState("{\"value\": \"" + value + "\"}");
    }

    /**
     * Load style configuration
     */
    private ComponentStyleConfig.StyleHashMap<String, String> loadStyleConfig(Context context) {
        ComponentStyleConfig.StyleHashMap<String, String> styleConfig = ComponentStyleConfig.getInstance(context).getDateTimeInputStyle();
        Log.d(TAG, "Loaded style config: " + styleConfig);
        return styleConfig;
    }

    /**
     * Parse compact style configuration
     *
     * @param styleConfig style configuration map
     * @param context     Android Context
     * @return CompactStyleConfig instance
     */
    private CompactStyleConfig loadCompactStyle(ComponentStyleConfig.StyleHashMap<String, String> styleConfig, Context context) {
        CompactStyleConfig config = new CompactStyleConfig();

        // Parse height
        String height = styleConfig.getOrDefault("compact.height", "56px");
        config.height = StyleHelper.parseDimension(height, context);
        Log.d(TAG, "Parsed compact.height: " + height + " -> " + config.height + "px");

        // Parse font size
        String fontSize = styleConfig.getOrDefault("compact.font-size", "24px");
        config.fontSize = StyleHelper.parseDimension(fontSize, context);
        Log.d(TAG, "Parsed compact.font-size: " + fontSize + " -> " + config.fontSize + "px");

        // Parse selected background color
        String selectedBgColor = styleConfig.getOrDefault("compact.selected-background-color", "#2273F714");
        config.selectedBackgroundColor = StyleHelper.parseColor(selectedBgColor);
        Log.d(TAG, "Parsed compact.selected-background-color: " + selectedBgColor + " -> " + config.selectedBackgroundColor);

        // Parse selected text color
        String selectedTextColor = styleConfig.getOrDefault("compact.selected-text-color", "#2273F7");
        config.selectedTextColor = StyleHelper.parseColor(selectedTextColor);
        Log.d(TAG, "Parsed compact.selected-text-color: " + selectedTextColor + " -> " + config.selectedTextColor);

        // Parse unselected text color
        String unselectedTextColor = styleConfig.getOrDefault("compact.unselected-text-color", "#000000");
        config.unselectedTextColor = StyleHelper.parseColor(unselectedTextColor);
        Log.d(TAG, "Parsed compact.unselected-text-color: " + unselectedTextColor + " -> " + config.unselectedTextColor);

        // Parse placeholder text
        config.placeholderText = styleConfig.getOrDefault("compact.placeholder-text", "Select date");
        Log.d(TAG, "Parsed compact.placeholder-text: " + config.placeholderText);

        // Parse vertical padding
        String paddingVertical = styleConfig.getOrDefault("compact.padding-vertical", "12px");
        config.paddingVertical = StyleHelper.parseDimension(paddingVertical, context);
        Log.d(TAG, "Parsed compact.padding-vertical: " + paddingVertical + " -> " + config.paddingVertical + "px");

        // Parse horizontal padding
        String paddingHorizontal = styleConfig.getOrDefault("compact.padding-horizontal", "24px");
        config.paddingHorizontal = StyleHelper.parseDimension(paddingHorizontal, context);
        Log.d(TAG, "Parsed compact.padding-horizontal: " + paddingHorizontal + " -> " + config.paddingHorizontal + "px");

        // Parse corner radius
        String cornerRadius = styleConfig.getOrDefault("compact.corner-radius", "8px");
        config.cornerRadius = StyleHelper.parseDimension(cornerRadius, context);
        Log.d(TAG, "Parsed compact.corner-radius: " + cornerRadius + " -> " + config.cornerRadius + "px");

        // Parse popup mask color
        String popupMaskColor = styleConfig.getOrDefault("compact.popup-mask-color", "#66000000");
        config.popupMaskColor = StyleHelper.parseColor(popupMaskColor);
        Log.d(TAG, "Parsed compact.popup-mask-color: " + popupMaskColor + " -> " + config.popupMaskColor);

        // Parse popup corner radius
        String popupCornerRadius = styleConfig.getOrDefault("compact.popup-corner-radius", "12px");
        config.popupCornerRadius = StyleHelper.parseDimension(popupCornerRadius, context);
        Log.d(TAG, "Parsed compact.popup-corner-radius: " + popupCornerRadius + " -> " + config.popupCornerRadius + "px");

        // Parse icon name
        config.iconName = styleConfig.getOrDefault("compact.icon-name", "event");
        Log.d(TAG, "Parsed compact.icon-name: " + config.iconName);

        // Parse icon size
        String iconSize = styleConfig.getOrDefault("compact.icon-size", "24px");
        config.iconSize = StyleHelper.parseDimension(iconSize, context);
        Log.d(TAG, "Parsed compact.icon-size: " + iconSize + " -> " + config.iconSize + "px");

        // Parse icon spacing
        String iconSpacing = styleConfig.getOrDefault("compact.icon-spacing", "6px");
        config.iconSpacing = StyleHelper.parseDimension(iconSpacing, context);
        Log.d(TAG, "Parsed compact.icon-spacing: " + iconSpacing + " -> " + config.iconSpacing + "px");

        return config;
    }


    /**
     * Compact style configuration class
     */
    private static class CompactStyleConfig {
        int height;                      // height (pixels)
        int fontSize;                    // font size (pixels)
        int selectedBackgroundColor;     // selected background color
        int selectedTextColor;           // selected text color
        int unselectedTextColor;         // unselected text color
        String placeholderText;          // placeholder text
        int paddingVertical;             // vertical padding (pixels)
        int paddingHorizontal;           // horizontal padding (pixels)
        int cornerRadius;                // corner radius (pixels)
        int popupMaskColor;              // popup mask color
        int popupCornerRadius;           // popup corner radius (pixels)
        String iconName;                 // icon name
        int iconSize;                    // icon size (pixels)
        int iconSpacing;                 // icon spacing (pixels)
    }
}

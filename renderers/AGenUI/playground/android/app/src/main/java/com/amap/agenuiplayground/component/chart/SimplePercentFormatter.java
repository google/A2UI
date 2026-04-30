package com.amap.agenuiplayground.component.chart;

import com.github.mikephil.charting.data.PieEntry;
import com.github.mikephil.charting.formatter.ValueFormatter;

/**
 * Displays the value directly with a "%" suffix. Omits the decimal part when the value is an integer.
 */
public class SimplePercentFormatter extends ValueFormatter {

    private String format(float value) {
        if (value == (int) value) {
            return (int) value + "%";
        } else {
            return value + "%";
        }
    }

    @Override
    public String getPieLabel(float value, PieEntry pieEntry) {
        return format(value);
    }

    @Override
    public String getFormattedValue(float value) {
        return format(value);
    }
}

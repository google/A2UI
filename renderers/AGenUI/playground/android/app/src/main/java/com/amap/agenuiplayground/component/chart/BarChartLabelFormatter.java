package com.amap.agenuiplayground.component.chart;

import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.formatter.ValueFormatter;

/**
 * Bar chart label formatter — displays the label field from entry data instead of the numeric value.
 */
public class BarChartLabelFormatter extends ValueFormatter {

    @Override
    public String getBarLabel(BarEntry barEntry) {
        if (barEntry.getData() instanceof String) {
            return (String) barEntry.getData();
        }
        return "";
    }
}

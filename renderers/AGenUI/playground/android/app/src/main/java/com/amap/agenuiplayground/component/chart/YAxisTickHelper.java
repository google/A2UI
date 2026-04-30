package com.amap.agenuiplayground.component.chart;

import com.github.mikephil.charting.components.AxisBase;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.formatter.ValueFormatter;

import java.util.List;

/**
 * Applies non-uniformly distributed Y-axis ticks by directly setting mEntries on the axis.
 */
public class YAxisTickHelper {

    public static void applyYAxisWithTicks(YAxis yAxis, List<String> labels, List<Float> tickValues,
                                           float dataYMin, float dataYMax) {
        if (yAxis == null || labels == null || tickValues == null) return;
        if (labels.isEmpty() || tickValues.isEmpty()) return;
        if (labels.size() != tickValues.size()) return;

        final String[] labelArray = labels.toArray(new String[0]);
        final float[] tickArray = new float[tickValues.size()];
        for (int i = 0; i < tickValues.size(); i++) {
            tickArray[i] = tickValues.get(i);
        }

        float yMin = dataYMin;
        float yMax = dataYMax;
        if (tickArray.length > 0) {
            yMin = Math.min(yMin, tickArray[0]);
            yMax = Math.max(yMax, tickArray[tickArray.length - 1]);
        }

        float range = yMax - yMin;
        float adjustedYMax = yMax + range * 0.1f;

        yAxis.setAxisMinimum(yMin);
        yAxis.setAxisMaximum(adjustedYMax);
        yAxis.setValueFormatter(new ValueFormatter() {
            @Override
            public String getAxisLabel(float value, AxisBase axis) {
                if (labelArray.length == 0 || tickArray.length == 0) return "";

                int closestIndex = -1;
                float minDiff = Float.MAX_VALUE;
                for (int i = 0; i < tickArray.length; i++) {
                    float diff = Math.abs(value - tickArray[i]);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIndex = i;
                    }
                }

                float tolerance = 0.01f;
                if (tickArray.length > 1) {
                    float minSpacing = Float.MAX_VALUE;
                    for (int i = 1; i < tickArray.length; i++) {
                        float spacing = tickArray[i] - tickArray[i - 1];
                        if (spacing > 0) minSpacing = Math.min(minSpacing, spacing);
                    }
                    if (minSpacing < Float.MAX_VALUE) {
                        tolerance = Math.max(0.01f, minSpacing * 0.1f);
                    }
                }

                if (closestIndex >= 0 && minDiff <= tolerance && closestIndex < labelArray.length) {
                    return labelArray[closestIndex];
                }
                return "";
            }
        });
        yAxis.setLabelCount(tickArray.length, true);

        // Directly set mEntries to control grid line positions
        yAxis.mEntries = tickArray;
        yAxis.mEntryCount = tickArray.length;
    }
}

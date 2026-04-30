package com.amap.agenuiplayground.component.chart;

import com.github.mikephil.charting.components.AxisBase;
import com.github.mikephil.charting.formatter.ValueFormatter;

import java.util.Collection;

/**
 * Maps actual Y-axis values to custom labels distributed uniformly along the axis range.
 */
public class YAxisLabelFormatter extends ValueFormatter {
    private String[] mLabels = new String[]{};
    private int mLabelCount = 0;
    private float mYMin = 0f;
    private float mYMax = 0f;

    public YAxisLabelFormatter() {
    }

    public YAxisLabelFormatter(String[] labels, float yMin, float yMax) {
        if (labels != null) {
            setLabels(labels, yMin, yMax);
        }
    }

    public YAxisLabelFormatter(Collection<String> labels, float yMin, float yMax) {
        if (labels != null) {
            setLabels(labels.toArray(new String[labels.size()]), yMin, yMax);
        }
    }

    @Override
    public String getAxisLabel(float value, AxisBase axis) {
        if (mLabelCount == 0 || mYMax == mYMin) {
            return "";
        }
        float normalizedValue = (value - mYMin) / (mYMax - mYMin);
        int index = Math.round(normalizedValue * (mLabelCount - 1));
        if (index < 0 || index >= mLabelCount) {
            return "";
        }
        return mLabels[index];
    }

    public String[] getLabels() {
        return mLabels;
    }

    public void setLabels(String[] labels, float yMin, float yMax) {
        if (labels == null) {
            labels = new String[]{};
        }
        this.mLabels = labels;
        this.mLabelCount = labels.length;
        this.mYMin = yMin;
        this.mYMax = yMax;
    }
}

package com.amap.agenuiplayground.component.impl;

import android.content.Context;
import android.graphics.Color;
import android.util.Log;
import android.view.View;
import android.widget.FrameLayout;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenuiplayground.component.chart.BarChartLabelFormatter;
import com.amap.agenuiplayground.component.chart.RoundedBarChartRenderer;
import com.amap.agenuiplayground.component.chart.SimplePercentFormatter;
import com.amap.agenuiplayground.component.chart.YAxisLabelFormatter;
import com.amap.agenuiplayground.component.chart.YAxisTickHelper;
import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.charts.PieChart;
import com.github.mikephil.charting.components.Legend;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.github.mikephil.charting.data.PieData;
import com.github.mikephil.charting.data.PieDataSet;
import com.github.mikephil.charting.data.PieEntry;
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Chart component implementation - conforms to the A2UI v0.9 protocol
 * <p>
 * Supported chart types:
 * - donut: Donut chart
 * - line:  Line chart
 * - bar:   Bar chart (grouped and ungrouped)
 * <p>
 * Supported properties:
 * - chartType: Chart type (DynamicString or String)
 * - data:      Chart data (DynamicObject)
 * - styles.chartConfig.colors: Color configuration array
 */
public class ChartComponent extends A2UIComponent {

    private static final String TAG = "ChartComponent";

    private Context context;
    private FrameLayout chartContainer;
    private Object currentChart;

    private static final int[] DEFAULT_COLORS = {
            Color.parseColor("#FF6B6B"),
            Color.parseColor("#4ECDC4"),
            Color.parseColor("#45B7D1"),
            Color.parseColor("#FFA07A"),
            Color.parseColor("#98D8C8")
    };

    public ChartComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "Chart");
        Log.d(TAG, "Constructor - id: " + id);

        this.context = context;
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    protected View onCreateView(Context context) {
        Log.d(TAG, "onCreateView - id: " + getId());

        chartContainer = new FrameLayout(context);
        chartContainer.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));
        chartContainer.setClipChildren(false);
        chartContainer.setClipToPadding(false);

        if (!properties.isEmpty()) {
            onUpdateProperties(properties);
        }

        return chartContainer;
    }

    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        Log.d(TAG, "onUpdateProperties - properties: " + properties);

        if (chartContainer == null) {
            Log.w(TAG, "chartContainer is null, skipping update");
            return;
        }

        String chartType = extractChartType(properties);
        Log.d(TAG, "chartType: " + chartType);

        Map<String, Object> chartData = extractChartData(properties);
        Log.d(TAG, "chartData: " + chartData);

        List<Integer> colors = extractColors(properties);
        Log.d(TAG, "colors count: " + colors.size());

        if (chartType != null && chartData != null) {
            switch (chartType.toLowerCase()) {
                case "donut":
                    updateDonutChart(chartData, colors);
                    break;
                case "line":
                    updateLineChart(chartData, colors);
                    break;
                case "bar":
                    updateBarChart(chartData, colors);
                    break;
                default:
                    Log.w(TAG, "Unknown chart type: " + chartType);
            }
        }
    }

    private String extractChartType(Map<String, Object> properties) {
        Object chartTypeObj = properties.get("chartType");
        if (chartTypeObj == null) return null;
        if (chartTypeObj instanceof Map) {
            Map<String, Object> dynamicString = (Map<String, Object>) chartTypeObj;
            if (dynamicString.containsKey("literalString")) {
                return String.valueOf(dynamicString.get("literalString"));
            }
        }
        return String.valueOf(chartTypeObj);
    }

    private Map<String, Object> extractChartData(Map<String, Object> properties) {
        Object dataObj = properties.get("data");
        if (dataObj == null) return null;
        if (dataObj instanceof Map) {
            Map<String, Object> dynamicObj = (Map<String, Object>) dataObj;
            if (dynamicObj.containsKey("literalObject")) {
                return (Map<String, Object>) dynamicObj.get("literalObject");
            }
            return dynamicObj;
        }
        return null;
    }

    private List<Integer> extractColors(Map<String, Object> properties) {
        List<Integer> colors = new ArrayList<>();
        if (properties.containsKey("styles")) {
            Map<String, Object> styles = (Map<String, Object>) properties.get("styles");
            if (styles != null && styles.containsKey("chartConfig")) {
                Map<String, Object> chartConfig = (Map<String, Object>) styles.get("chartConfig");
                if (chartConfig != null && chartConfig.containsKey("colors")) {
                    List<String> colorStrings = (List<String>) chartConfig.get("colors");
                    if (colorStrings != null) {
                        for (String colorStr : colorStrings) {
                            try {
                                colors.add(Color.parseColor(colorStr));
                            } catch (Exception e) {
                                Log.w(TAG, "Invalid color: " + colorStr, e);
                            }
                        }
                    }
                }
            }
        }
        if (colors.isEmpty()) {
            for (int color : DEFAULT_COLORS) {
                colors.add(color);
            }
        }
        return colors;
    }

    private void updateDonutChart(Map<String, Object> chartData, List<Integer> colors) {
        Log.d(TAG, "updateDonutChart");

        PieChart pieChart;
        if (currentChart instanceof PieChart) {
            pieChart = (PieChart) currentChart;
        } else {
            chartContainer.removeAllViews();
            pieChart = new PieChart(context);
            chartContainer.addView(pieChart);
            currentChart = pieChart;

            pieChart.setDrawHoleEnabled(true);
            pieChart.setHoleRadius(50f);
            pieChart.setTransparentCircleRadius(55f);
            pieChart.setDrawCenterText(false);
            pieChart.setDrawEntryLabels(false);
            pieChart.getDescription().setEnabled(false);
            pieChart.getLegend().setEnabled(true);
            pieChart.getLegend().setVerticalAlignment(Legend.LegendVerticalAlignment.TOP);
            pieChart.getLegend().setHorizontalAlignment(Legend.LegendHorizontalAlignment.RIGHT);
            pieChart.getLegend().setOrientation(Legend.LegendOrientation.HORIZONTAL);
        }

        List<Map<String, Object>> seriesList = (List<Map<String, Object>>) chartData.get("series");
        if (seriesList == null || seriesList.isEmpty()) {
            Log.w(TAG, "No series found in chartData");
            return;
        }

        Map<String, Object> series = seriesList.get(0);
        List<Map<String, Object>> dataList = (List<Map<String, Object>>) series.get("data");
        if (dataList == null || dataList.isEmpty()) {
            Log.w(TAG, "No data items found in series");
            return;
        }

        List<PieEntry> entries = new ArrayList<>();
        for (Map<String, Object> item : dataList) {
            String label = String.valueOf(item.get("label"));
            float value = getFloatValue(item.get("value"));
            entries.add(new PieEntry(value, label));
        }

        PieDataSet dataSet = new PieDataSet(entries, "");

        List<Integer> dataSetColors = new ArrayList<>();
        for (int i = 0; i < entries.size(); i++) {
            int colorIndex = i % colors.size();
            if (i == entries.size() - 1 && i % colors.size() == 0) {
                colorIndex = (i + 1) % colors.size();
            }
            dataSetColors.add(colors.get(colorIndex));
        }
        dataSet.setColors(dataSetColors);

        dataSet.setValueTextSize(12f);
        dataSet.setValueTextColor(Color.BLACK);
        dataSet.setValueLinePart1OffsetPercentage(80f);
        dataSet.setValueLinePart1Length(0.5f);
        dataSet.setValueLinePart2Length(0.6f);
        dataSet.setValueLineColor(Color.GRAY);
        dataSet.setYValuePosition(PieDataSet.ValuePosition.OUTSIDE_SLICE);
        dataSet.setXValuePosition(PieDataSet.ValuePosition.OUTSIDE_SLICE);

        PieData pieData = new PieData(dataSet);
        pieData.setValueFormatter(new SimplePercentFormatter());
        pieChart.setData(pieData);
        pieChart.invalidate();

        Log.d(TAG, "Donut chart updated with " + entries.size() + " entries");
    }

    private void updateLineChart(Map<String, Object> chartData, List<Integer> colors) {
        Log.d(TAG, "updateLineChart");

        LineChart lineChart;
        if (currentChart instanceof LineChart) {
            lineChart = (LineChart) currentChart;
        } else {
            chartContainer.removeAllViews();
            lineChart = new LineChart(context);
            chartContainer.addView(lineChart);
            currentChart = lineChart;

            lineChart.getDescription().setEnabled(false);
            lineChart.setDrawGridBackground(false);
            lineChart.getLegend().setVerticalAlignment(Legend.LegendVerticalAlignment.TOP);
            lineChart.getLegend().setHorizontalAlignment(Legend.LegendHorizontalAlignment.RIGHT);
            lineChart.getXAxis().setSpaceMin(0.5f);
            lineChart.getXAxis().setSpaceMax(0.5f);
        }

        List<String> xAxisLabels = (List<String>) chartData.get("xAxis");
        List<String> yAxisLabels = (List<String>) chartData.get("yAxis");
        List<Map<String, Object>> seriesList = (List<Map<String, Object>>) chartData.get("series");

        if (seriesList == null || seriesList.isEmpty()) {
            Log.w(TAG, "No series found in chartData");
            return;
        }

        List<LineDataSet> dataSets = new ArrayList<>();
        for (int i = 0; i < seriesList.size(); i++) {
            Map<String, Object> series = seriesList.get(i);
            String seriesName = String.valueOf(series.get("name"));
            List<Map<String, Object>> dataList = (List<Map<String, Object>>) series.get("data");
            if (dataList == null || dataList.isEmpty()) continue;

            List<Entry> entries = new ArrayList<>();
            for (int j = 0; j < dataList.size(); j++) {
                Map<String, Object> item = dataList.get(j);
                float value = getFloatValue(item.get("value"));
                entries.add(new Entry(j, value));
            }

            LineDataSet dataSet = new LineDataSet(entries, seriesName);
            int color = colors.get(i % colors.size());
            dataSet.setColor(color);
            dataSet.setCircleColor(color);
            dataSet.setLineWidth(2f);
            dataSet.setCircleRadius(4f);
            dataSet.setDrawCircleHole(false);
            dataSet.setValueTextSize(10f);
            dataSet.setDrawValues(false);
            dataSets.add(dataSet);
        }

        XAxis xAxis = lineChart.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        if (xAxisLabels != null && !xAxisLabels.isEmpty()) {
            xAxis.setValueFormatter(new IndexAxisValueFormatter(xAxisLabels));
            xAxis.setGranularity(1f);
            xAxis.setLabelCount(xAxisLabels.size());
        }

        YAxis leftAxis = lineChart.getAxisLeft();
        leftAxis.setDrawGridLines(true);

        float dataYMin = Float.MAX_VALUE;
        float dataYMax = Float.MIN_VALUE;
        for (LineDataSet dataSet : dataSets) {
            dataYMin = Math.min(dataYMin, dataSet.getYMin());
            dataYMax = Math.max(dataYMax, dataSet.getYMax());
        }

        List<Float> yAxisTicks = yAxisLabels != null ? extractYAxisTicks(chartData) : new ArrayList<>();
        if (yAxisLabels != null && !yAxisLabels.isEmpty()) {
            if (!yAxisTicks.isEmpty() && yAxisTicks.size() == yAxisLabels.size()) {
                configureYAxisWithCustomTicks(leftAxis, yAxisLabels, yAxisTicks, dataYMin, dataYMax);
            } else {
                configureYAxisUniform(leftAxis, yAxisLabels, dataYMin, dataYMax);
            }
        }

        lineChart.getAxisRight().setEnabled(false);

        LineData lineData = new LineData(dataSets.toArray(new LineDataSet[0]));
        lineChart.setData(lineData);
        lineChart.getLegend().setEnabled(dataSets.size() > 1);
        lineChart.invalidate();

        Log.d(TAG, "Line chart updated with " + dataSets.size() + " series");
    }

    private void updateBarChart(Map<String, Object> chartData, List<Integer> colors) {
        Log.d(TAG, "updateBarChart");

        BarChart barChart;
        if (currentChart instanceof BarChart) {
            barChart = (BarChart) currentChart;
        } else {
            chartContainer.removeAllViews();
            barChart = new BarChart(context);
            chartContainer.addView(barChart);
            currentChart = barChart;

            barChart.setRenderer(new RoundedBarChartRenderer(
                    barChart, barChart.getAnimator(), barChart.getViewPortHandler()));

            barChart.getDescription().setEnabled(false);
            barChart.setDrawGridBackground(false);
            barChart.getLegend().setVerticalAlignment(Legend.LegendVerticalAlignment.TOP);
            barChart.getLegend().setHorizontalAlignment(Legend.LegendHorizontalAlignment.RIGHT);
            barChart.getXAxis().setSpaceMin(0.5f);
            barChart.getXAxis().setSpaceMax(0.5f);
        }

        List<String> xAxisLabels = (List<String>) chartData.get("xAxis");
        List<String> yAxisLabels = (List<String>) chartData.get("yAxis");
        List<Map<String, Object>> seriesList = (List<Map<String, Object>>) chartData.get("series");

        if (seriesList == null || seriesList.isEmpty()) {
            Log.w(TAG, "No series found in chartData");
            return;
        }

        boolean isGrouped = seriesList.size() > 1;

        List<BarDataSet> dataSets = new ArrayList<>();
        for (int i = 0; i < seriesList.size(); i++) {
            Map<String, Object> series = seriesList.get(i);
            String seriesName = String.valueOf(series.get("name"));
            List<Map<String, Object>> dataList = (List<Map<String, Object>>) series.get("data");
            if (dataList == null || dataList.isEmpty()) continue;

            List<BarEntry> entries = new ArrayList<>();
            for (int j = 0; j < dataList.size(); j++) {
                Map<String, Object> item = dataList.get(j);
                float value = getFloatValue(item.get("value"));
                String label = item.containsKey("label") ? String.valueOf(item.get("label")) : null;
                BarEntry entry = new BarEntry(j, value);
                if (label != null) entry.setData(label);
                entries.add(entry);
            }

            BarDataSet dataSet = new BarDataSet(entries, seriesName);

            if (isGrouped) {
                // One solid color per series
                dataSet.setColor(colors.get(i % colors.size()));
            } else {
                // Cycle through colors per bar
                List<Integer> barColors = new ArrayList<>();
                for (int j = 0; j < entries.size(); j++) {
                    barColors.add(colors.get(j % colors.size()));
                }
                dataSet.setColors(barColors);
            }

            dataSet.setValueTextSize(10f);

            boolean hasLabels = false;
            for (BarEntry entry : entries) {
                if (entry.getData() != null) {
                    hasLabels = true;
                    break;
                }
            }

            if (hasLabels) {
                dataSet.setDrawValues(true);
                dataSet.setValueFormatter(new BarChartLabelFormatter());
            } else {
                dataSet.setDrawValues(false);
            }
            dataSet.setHighlightEnabled(false);
            dataSets.add(dataSet);
        }

        barChart.getLegend().setEnabled(dataSets.size() > 1);

        XAxis xAxis = barChart.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        if (xAxisLabels != null && !xAxisLabels.isEmpty()) {
            xAxis.setValueFormatter(new IndexAxisValueFormatter(xAxisLabels));
            xAxis.setGranularity(1f);
            xAxis.setLabelCount(xAxisLabels.size());
        }

        YAxis leftAxis = barChart.getAxisLeft();
        leftAxis.setDrawGridLines(true);

        float dataYMin = Float.MAX_VALUE;
        float dataYMax = Float.MIN_VALUE;
        for (BarDataSet dataSet : dataSets) {
            dataYMin = Math.min(dataYMin, dataSet.getYMin());
            dataYMax = Math.max(dataYMax, dataSet.getYMax());
        }

        dataYMin = dataYMin - 0.8f * (dataYMax - dataYMin);
        dataYMax = dataYMax + 0.2f * (dataYMax - dataYMin);
        if (dataYMin < 0) dataYMin = 0;

        List<Float> yAxisTicks = yAxisLabels != null ? extractYAxisTicks(chartData) : new ArrayList<>();
        if (yAxisLabels != null && !yAxisLabels.isEmpty()) {
            if (!yAxisTicks.isEmpty() && yAxisTicks.size() == yAxisLabels.size()) {
                configureYAxisWithCustomTicks(leftAxis, yAxisLabels, yAxisTicks, dataYMin, dataYMax);
            } else {
                configureYAxisUniform(leftAxis, yAxisLabels, dataYMin, dataYMax);
            }
        }

        barChart.getAxisRight().setEnabled(false);

        BarData barData = new BarData(dataSets.toArray(new BarDataSet[0]));
        if (isGrouped) {
            float groupSpace = 0.3f;
            float barSpace = 0.05f;
            float barWidth = (1f - groupSpace) / seriesList.size() - barSpace;
            barData.setBarWidth(barWidth);
            barChart.setData(barData);
            barChart.groupBars(-0.5f, groupSpace, barSpace);
        } else {
            barData.setBarWidth(0.3f);
            barChart.setData(barData);
        }

        barChart.invalidate();

        Log.d(TAG, "Bar chart updated with " + dataSets.size() + " series (grouped: " + isGrouped + ")");
    }

    private float getFloatValue(Object value) {
        if (value instanceof Number) return ((Number) value).floatValue();
        try {
            return Float.parseFloat(String.valueOf(value));
        } catch (Exception e) {
            return 0f;
        }
    }

    private List<Float> extractYAxisTicks(Map<String, Object> chartData) {
        List<Float> ticks = new ArrayList<>();
        Object ticksObj = chartData.get("yAxisValues");
        if (ticksObj instanceof List) {
            for (Object tick : (List<?>) ticksObj) {
                try {
                    ticks.add(getFloatValue(tick));
                } catch (Exception e) {
                    Log.w(TAG, "Invalid tick value: " + tick, e);
                }
            }
        }
        return ticks;
    }

    private void configureYAxisWithCustomTicks(YAxis yAxis, List<String> labels, List<Float> tickValues,
                                               float dataYMin, float dataYMax) {
        float tickMin = Float.MAX_VALUE;
        float tickMax = Float.MIN_VALUE;
        for (float tick : tickValues) {
            tickMin = Math.min(tickMin, tick);
            tickMax = Math.max(tickMax, tick);
        }
        float axisMin = Math.min(dataYMin, tickMin);
        float axisMax = Math.max(dataYMax, tickMax);
        YAxisTickHelper.applyYAxisWithTicks(yAxis, labels, tickValues, axisMin, axisMax);
    }

    private void configureYAxisUniform(YAxis yAxis, List<String> labels, float dataYMin, float dataYMax) {
        float range = dataYMax - dataYMin;
        float axisMin = dataYMin - 0.8f * range;
        float axisMax = dataYMax + 0.2f * range;
        if (axisMin < 0) axisMin = 0;

        List<String> adjustedLabels = new ArrayList<>();
        adjustedLabels.add("");
        adjustedLabels.addAll(labels);

        YAxisLabelFormatter yAxisFormatter = new YAxisLabelFormatter(
                adjustedLabels.toArray(new String[0]),
                axisMin,
                axisMax
        );
        yAxis.setValueFormatter(yAxisFormatter);
        yAxis.setLabelCount(adjustedLabels.size(), true);
        yAxis.setAxisMinimum(axisMin);
        yAxis.setAxisMaximum(axisMax);
    }
}

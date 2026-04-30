package com.amap.agenuiplayground.component.chart;

import android.graphics.Canvas;
import android.graphics.Path;
import android.graphics.RectF;

import com.github.mikephil.charting.animation.ChartAnimator;
import com.github.mikephil.charting.buffer.BarBuffer;
import com.github.mikephil.charting.interfaces.dataprovider.BarDataProvider;
import com.github.mikephil.charting.interfaces.datasets.IBarDataSet;
import com.github.mikephil.charting.renderer.BarChartRenderer;
import com.github.mikephil.charting.utils.Transformer;
import com.github.mikephil.charting.utils.ViewPortHandler;

/**
 * Bar chart renderer that draws bars with rounded top corners.
 * Top radius = half the bar width (semicircle); bottom radius = 10% of bar width.
 */
public class RoundedBarChartRenderer extends BarChartRenderer {

    public RoundedBarChartRenderer(BarDataProvider chart, ChartAnimator animator,
                                   ViewPortHandler viewPortHandler) {
        super(chart, animator, viewPortHandler);
    }

    @Override
    public void drawDataSet(Canvas c, IBarDataSet dataSet, int index) {
        Transformer trans = mChart.getTransformer(dataSet.getAxisDependency());

        float phaseX = mAnimator.getPhaseX();
        float phaseY = mAnimator.getPhaseY();

        BarBuffer buffer = mBarBuffers[index];
        buffer.setPhases(phaseX, phaseY);
        buffer.setDataSet(index);
        buffer.setBarWidth(mChart.getBarData().getBarWidth());
        buffer.setInverted(mChart.isInverted(dataSet.getAxisDependency()));
        buffer.feed(dataSet);

        trans.pointValuesToPixel(buffer.buffer);

        boolean isSingleColor = dataSet.getColors().size() == 1;
        if (isSingleColor) {
            mRenderPaint.setColor(dataSet.getColor());
        }

        for (int j = 0, size = buffer.size(); j < size; j += 4) {
            if (!mViewPortHandler.isInBoundsLeft(buffer.buffer[j + 2])) continue;
            if (!mViewPortHandler.isInBoundsRight(buffer.buffer[j])) break;

            if (!isSingleColor) {
                mRenderPaint.setColor(dataSet.getColor(j / 4));
            }

            float left = buffer.buffer[j];
            float top = buffer.buffer[j + 1];
            float right = buffer.buffer[j + 2];
            float bottom = buffer.buffer[j + 3];

            float barWidth = right - left;
            float topRadius = barWidth / 2f;
            float bottomRadius = barWidth * 0.1f;

            Path path = new Path();
            path.addRoundRect(
                    new RectF(left, top, right, bottom),
                    new float[]{topRadius, topRadius, topRadius, topRadius,
                            bottomRadius, bottomRadius, bottomRadius, bottomRadius},
                    Path.Direction.CW);
            c.drawPath(path, mRenderPaint);
        }
    }
}

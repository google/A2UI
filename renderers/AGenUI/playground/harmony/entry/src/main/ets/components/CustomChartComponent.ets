/*
 * CustomChartComponent
 * Custom chart rendering component
 * Implemented with @ohos/mpchart 3.0.26.
 * Supports donut, line, and bar charts.
 *
 * Protocol notes (v2):
 * - Colors come from styles.chartConfig.colors and are injected into the chart data by the component.
 * - Grouped and ungrouped bar charts are distinguished by series.length > 1.
 * - yAxis is provided directly as string[].
 */

import { A2UIComponent, A2UIComponentProps, CustomView } from '@agenui/agenui';
import { UIContext } from '@kit.ArkUI';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { AnimatorResult } from '@ohos.animator';
import {
  PieChart,
  PieData,
  PieDataSet,
  PieEntry,
  PieChartModel,
  LineChart,
  LineData,
  LineDataSet,
  EntryOhos,
  LineChartModel,
  BarChart,
  BarData,
  BarDataSet,
  BarEntry,
  BarChartModel,
  JArrayList,
  Description,
  Legend,
  LegendForm,
  LegendHorizontalAlignment,
  LegendVerticalAlignment,
  LegendOrientation,
  XAxis,
  XAxisPosition,
  YAxis,
  AxisBase,
  Mode,
  ValuePosition,
  ViewPortHandler,
  LimitLine,
} from '@ohos/mpchart';

// ─────────────────────────────────────────────
// Default values
// ─────────────────────────────────────────────

namespace ChartDefaults {
  export const COLORS: string[] = ['#5B9EFF', '#FF8FA3', '#FFA366', '#90D47F', '#F01366', '#FFD700'];

  export const DONUT_SHOW_LEGEND: boolean = true;
  export const DONUT_LEGEND_POSITION: string = 'right';
  export const DONUT_INNER_RADIUS: string = '50%';
  export const DONUT_SLICE_SPACE: number = 0;
  export const DONUT_VALUE_LINE_PART1: number = 0.5;
  export const DONUT_VALUE_LINE_PART2: number = 0.8;
  export const DONUT_LABEL_TEXT_SIZE: number = 12;
  export const DONUT_EXTRA_OFFSET: number = 3;

  export const LINE_LINE_WIDTH: number = 2;
  export const LINE_SHOW_POINTS: boolean = true;
  export const LINE_POINT_SIZE: number = 8;
  export const LINE_SMOOTH: boolean = false;
  export const LINE_SHOW_GRID: boolean = true;
  export const LINE_SHOW_LEGEND: boolean = true;
  export const LINE_LABEL_TEXT_SIZE: number = 10;
  export const LINE_LIMIT_LINE_COLOR: number = 0xFFAAAAAA;
  export const LINE_LIMIT_LINE_WIDTH: number = 1;
  export const LINE_LIMIT_DASH_LENGTH: number = 6;
  export const LINE_LIMIT_DASH_SPACE: number = 4;

  export const BAR_GROUPED_BAR_WIDTH: number = 18;
  export const BAR_GROUPED_BAR_GAP: number = 3;
  export const BAR_GROUPED_GROUP_GAP: number = 30;
  export const BAR_GROUPED_SHOW_LEGEND: boolean = true;
  export const BAR_GROUPED_LEGEND_POSITION: string = 'top';
  export const BAR_GROUPED_TOP_RADIUS: number = 12;
  export const BAR_GROUPED_GRADIENT_BLEND: number = 0.6;

  export const BAR_SINGLE_BAR_WIDTH: number = 35;
  export const BAR_SINGLE_SHOW_LABEL: boolean = true;
  export const BAR_SINGLE_LABEL_POSITION: string = 'top';
  export const BAR_SINGLE_TOP_RADIUS: number = 12;
  export const BAR_SINGLE_LABEL_TEXT_SIZE: number = 10;
  export const BAR_SINGLE_SIDE_OFFSET: number = 30;
  export const BAR_SINGLE_TOP_OFFSET: number = 50;
}

// ─────────────────────────────────────────────
// Data structures
// ─────────────────────────────────────────────

interface ChartDataPoint {
  value: number;
  label: string;
  color: string;
}

interface ChartSeriesItem {
  name: string;
  data: ChartDataPoint[];
  color: string;
}

interface NewDonutData {
  series: ChartSeriesItem[];
}

interface NewLineData {
  xAxis: string[];
  series: ChartSeriesItem[];
  yAxis?: string[];
}

interface NewBarData {
  xAxis: string[];
  series: ChartSeriesItem[];
  yAxis?: string[];
}

interface NewChartPayload {
  type: string;
  data: NewDonutData | NewLineData | NewBarData;
}

interface ChartPayloadData {
  series: ChartSeriesItem[];
  xAxis?: string[];
  yAxis?: string[];
}

// Parsed styles contract
interface StylesChartConfig {
  colors?: string[];
}

interface StylesObject {
  chartConfig?: StylesChartConfig;
}

// Raw data contract before color injection
interface RawDataPoint {
  value: number;
  label: string;
  color: string;
}

interface RawSeriesItem {
  name: string;
  data: RawDataPoint[];
  color: string;
}

interface RawChartData {
  series: RawSeriesItem[];
  xAxis?: string[];
  yAxis?: string[];
}

interface EnrichedChartPayload {
  type: string;
  data: RawChartData;
}

function clampChartAnimationProgress(progress: number): number {
  if (progress < 0) {
    return 0;
  }
  if (progress > 1) {
    return 1;
  }
  return progress;
}

function cloneChartPoint(point: ChartDataPoint): ChartDataPoint {
  return {
    value: point.value,
    label: point.label,
    color: point.color
  };
}

function cloneChartSeries(seriesItem: ChartSeriesItem): ChartSeriesItem {
  return {
    name: seriesItem.name,
    color: seriesItem.color,
    data: seriesItem.data.map((point: ChartDataPoint) => cloneChartPoint(point))
  };
}

function cloneChartPayload(payload: NewChartPayload): NewChartPayload {
  const payloadData: ChartPayloadData = payload.data as ChartPayloadData;
  return {
    type: payload.type,
    data: {
      xAxis: payloadData.xAxis ? [...payloadData.xAxis] : undefined,
      yAxis: payloadData.yAxis ? [...payloadData.yAxis] : undefined,
      series: payloadData.series.map((seriesItem: ChartSeriesItem) => cloneChartSeries(seriesItem))
    }
  };
}

function interpolateChartValue(startValue: number, endValue: number, progress: number): number {
  return startValue + (endValue - startValue) * progress;
}

function getSeriesStartValue(chartType: string, previousSeries: ChartSeriesItem | undefined, pointIndex: number): number {
  if (previousSeries === undefined || previousSeries.data.length === 0) {
    return 0;
  }

  if (chartType === 'line') {
    if (pointIndex < previousSeries.data.length) {
      return previousSeries.data[pointIndex].value;
    }
    return previousSeries.data[previousSeries.data.length - 1].value;
  }

  if (pointIndex < previousSeries.data.length) {
    return previousSeries.data[pointIndex].value;
  }

  return 0;
}

function hasAnimatedValueChanges(previousPayload: NewChartPayload | null, targetPayload: NewChartPayload): boolean {
  if (previousPayload === null || previousPayload.type !== targetPayload.type) {
    return false;
  }

  const previousData: ChartPayloadData = previousPayload.data as ChartPayloadData;
  const targetData: ChartPayloadData = targetPayload.data as ChartPayloadData;

  if (previousData.series.length !== targetData.series.length) {
    return true;
  }

  for (let seriesIndex = 0; seriesIndex < targetData.series.length; seriesIndex++) {
    const previousSeries: ChartSeriesItem | undefined =
      seriesIndex < previousData.series.length ? previousData.series[seriesIndex] : undefined;
    const targetSeries: ChartSeriesItem = targetData.series[seriesIndex];

    if (previousSeries === undefined || previousSeries.data.length !== targetSeries.data.length) {
      return true;
    }

    for (let pointIndex = 0; pointIndex < targetSeries.data.length; pointIndex++) {
      if (previousSeries.data[pointIndex].value !== targetSeries.data[pointIndex].value) {
        return true;
      }
    }
  }

  return false;
}

function createAnimatedChartPayload(previousPayload: NewChartPayload | null, targetPayload: NewChartPayload,
  progress: number): NewChartPayload {
  if (previousPayload === null || previousPayload.type !== targetPayload.type) {
    return cloneChartPayload(targetPayload);
  }

  const safeProgress: number = clampChartAnimationProgress(progress);
  const animatedPayload: NewChartPayload = cloneChartPayload(targetPayload);
  const animatedData: ChartPayloadData = animatedPayload.data as ChartPayloadData;
  const previousData: ChartPayloadData = previousPayload.data as ChartPayloadData;

  animatedData.series = animatedData.series.map((targetSeries: ChartSeriesItem, seriesIndex: number) => {
    const previousSeries: ChartSeriesItem | undefined =
      seriesIndex < previousData.series.length ? previousData.series[seriesIndex] : undefined;

    const interpolatedPoints: ChartDataPoint[] = targetSeries.data.map((targetPoint: ChartDataPoint, pointIndex: number) => {
      const startValue: number = getSeriesStartValue(targetPayload.type, previousSeries, pointIndex);
      const point: ChartDataPoint = {
        value: interpolateChartValue(startValue, targetPoint.value, safeProgress),
        label: targetPoint.label,
        color: targetPoint.color
      };
      return point;
    });

    const seriesItem: ChartSeriesItem = {
      name: targetSeries.name,
      color: targetSeries.color,
      data: interpolatedPoints
    };
    return seriesItem;
  });

  return animatedPayload;
}

// ─────────────────────────────────────────────
// Builder
// ─────────────────────────────────────────────

@Builder
function buildCustomChart(view: CustomView): void {
  Column() {
    if ((view as CustomChartComponent).chartType === 'donut') {
      PieChart({
        model: (view as CustomChartComponent).pieModel
      })
    } else if ((view as CustomChartComponent).chartType === 'line') {
      LineChart({
        model: (view as CustomChartComponent).lineModel
      })
    } else if ((view as CustomChartComponent).chartType === 'bar') {
      BarChart({
        model: (view as CustomChartComponent).barModel
      })
    }
  }
}

// ─────────────────────────────────────────────
// CustomChartComponent
// ─────────────────────────────────────────────

export class CustomChartComponent extends A2UIComponent {
  private static readonly INITIAL_RENDER_ANIMATION_MS: number = 450;
  private static readonly STREAM_RENDER_ANIMATION_MS: number = 280;
  private static readonly CHART_ANIMATION_EASING: string = 'linear';
  private static readonly LINE_INITIAL_RENDER_ANIMATION_MS: number = 640;
  private static readonly LINE_STREAM_RENDER_ANIMATION_MS: number = 420;
  private static readonly LINE_CHART_ANIMATION_EASING: string = 'friction';

  chartType: string = '';
  pieModel: PieChartModel = new PieChartModel();
  lineModel: LineChartModel = new LineChartModel();
  barModel: BarChartModel = new BarChartModel();
  private displayedPayload: NewChartPayload | null = null;
  private targetPayload: NewChartPayload | null = null;
  private payloadAnimator: AnimatorResult | null = null;

  // Cache the three independently delivered fields.
  private cachedChartType: string = '';
  private cachedData: string = '';
  private cachedColors: string[] = [];

  // Debounce rendering.
  private renderTimerId: number = -1;
  private static readonly RENDER_DEBOUNCE_MS: number = 150;

  constructor(surfaceId: string, nodeId: string, componentType: string, viewStatePtr: bigint) {
    super(surfaceId, nodeId, componentType, viewStatePtr, wrapBuilder<[CustomView]>(buildCustomChart));
  }

  onUpdateViewFinished(): void {
    this.updateArkUI();
  }

  protected onUpdateProperties(properties: A2UIComponentProps): void {
    const chartType = properties['chartType'];
    if (chartType !== undefined) {
      this.cachedChartType = typeof chartType === 'string' ? chartType : String(chartType);
    }

    const data = properties['data'];
    if (data !== undefined) {
      this.cachedData = typeof data === 'string' ? data : JSON.stringify(data);
    }

    const styles = properties['styles'];
    if (styles !== undefined) {
      try {
        const stylesStr = typeof styles === 'string' ? styles : JSON.stringify(styles);
        const stylesObj: StylesObject = JSON.parse(stylesStr) as StylesObject;
        if (stylesObj.chartConfig !== undefined &&
          stylesObj.chartConfig.colors !== undefined &&
          stylesObj.chartConfig.colors.length > 0) {
          this.cachedColors = stylesObj.chartConfig.colors;
        }
      } catch (_e) {
        // ignore parse error
      }
    }

    if (this.cachedChartType && this.cachedData && this.isDataReady(this.cachedData)) {
      this.scheduleRender();
    }
  }

  private isDataReady(value: string): boolean {
    if (!value) {
      return false;
    }
    try {
      const dataObj: RawChartData = JSON.parse(value) as RawChartData;
      return dataObj.series !== undefined && dataObj.series !== null && dataObj.series.length > 0;
    } catch (_e) {
      return false;
    }
  }

  private scheduleRender(): void {
    if (this.renderTimerId !== -1) {
      clearTimeout(this.renderTimerId);
      this.renderTimerId = -1;
    }
    this.renderTimerId = setTimeout(() => {
      this.renderTimerId = -1;
      this.tryRenderChart();
    }, CustomChartComponent.RENDER_DEBOUNCE_MS);
  }

  private getColor(index: number): string {
    const palette: string[] = this.cachedColors.length > 0
      ? this.cachedColors
      : ChartDefaults.COLORS;
    return palette[index % palette.length];
  }

  private injectColors(dataObj: RawChartData): void {
    const series: RawSeriesItem[] = dataObj.series;
    if (!series || series.length === 0) {
      return;
    }
    if (series.length === 1) {
      series[0].data.forEach((point: RawDataPoint, i: number) => {
        point.color = this.getColor(i);
      });
      series[0].color = '';
    } else {
      series.forEach((s: RawSeriesItem, i: number) => {
        s.color = this.getColor(i);
        s.data.forEach((point: RawDataPoint) => {
          point.color = '';
        });
      });
    }
  }

  private tryRenderChart(): void {
    if (!this.cachedChartType || !this.cachedData) {
      return;
    }
    try {
      const dataObj: RawChartData = JSON.parse(this.cachedData) as RawChartData;
      this.injectColors(dataObj);
      const payload: EnrichedChartPayload = {
        type: this.cachedChartType,
        data: dataObj
      };
      this.loadChartData(JSON.stringify(payload));
    } catch (e) {
      hilog.error(0, 'CustomChart', 'tryRenderChart error: %{public}s', e.message);
    }
  }

  public loadChartData(content: string): void {
    try {
      const payload: NewChartPayload = JSON.parse(content) as NewChartPayload;
      const nextPayload: NewChartPayload = cloneChartPayload(payload);
      const previousPayload: NewChartPayload | null =
        this.displayedPayload === null ? null : cloneChartPayload(this.displayedPayload);

      if (this.targetPayload !== null && JSON.stringify(this.targetPayload) === JSON.stringify(nextPayload)) {
        return;
      }

      this.stopPayloadAnimation();
      this.targetPayload = cloneChartPayload(nextPayload);

      if (previousPayload === null || previousPayload.type !== nextPayload.type) {
        this.renderPayload(nextPayload);
        this.displayedPayload = cloneChartPayload(nextPayload);
        this.playInitialRenderAnimation(nextPayload.type);
        return;
      }

      if (!hasAnimatedValueChanges(previousPayload, nextPayload)) {
        this.renderPayload(nextPayload);
        this.displayedPayload = cloneChartPayload(nextPayload);
        return;
      }

      this.playStreamRenderAnimation(previousPayload, nextPayload);
    } catch (e) {
      hilog.error(0, 'CustomChart', 'loadChartData error: %{public}s', e.message);
    }
  }

  private renderPayload(payload: NewChartPayload): void {
    switch (payload.type) {
      case 'donut':
        this.buildDonutChart(payload.data as NewDonutData);
        break;
      case 'line':
        this.buildLineChart(payload.data as NewLineData);
        break;
      case 'bar':
        this.buildBarChart(payload.data as NewBarData);
        break;
      default:
        hilog.warn(0, 'CustomChart', 'renderPayload: unknown type=%{public}s', payload.type);
        return;
    }

    this.chartType = payload.type;
    this.updateArkUI();
  }

  private playInitialRenderAnimation(chartType: string): void {
    switch (chartType) {
      case 'donut':
        this.pieModel.animateY(CustomChartComponent.INITIAL_RENDER_ANIMATION_MS,
          CustomChartComponent.CHART_ANIMATION_EASING);
        break;
      case 'line':
        this.lineModel.animateX(CustomChartComponent.LINE_INITIAL_RENDER_ANIMATION_MS,
          CustomChartComponent.LINE_CHART_ANIMATION_EASING);
        break;
      case 'bar':
        this.barModel.animateY(CustomChartComponent.INITIAL_RENDER_ANIMATION_MS,
          CustomChartComponent.CHART_ANIMATION_EASING);
        break;
      default:
        break;
    }
  }

  private playStreamRenderAnimation(previousPayload: NewChartPayload, nextPayload: NewChartPayload): void {
    const uiContext: UIContext | undefined = this.getUIContext();
    if (uiContext === undefined) {
      this.renderPayload(nextPayload);
      this.displayedPayload = cloneChartPayload(nextPayload);
      return;
    }

    const isLineChart: boolean = nextPayload.type === 'line';
    const animationDuration: number = isLineChart
      ? CustomChartComponent.LINE_STREAM_RENDER_ANIMATION_MS
      : CustomChartComponent.STREAM_RENDER_ANIMATION_MS;
    const animationEasing: string = isLineChart
      ? CustomChartComponent.LINE_CHART_ANIMATION_EASING
      : CustomChartComponent.CHART_ANIMATION_EASING;

    const animatorResult: AnimatorResult = uiContext.createAnimator({
      duration: animationDuration,
      easing: animationEasing,
      delay: 0,
      fill: 'forwards',
      direction: 'normal',
      iterations: 1,
      begin: 0,
      end: 1
    });

    const finishAnimation = (): void => {
      this.renderPayload(nextPayload);
      this.displayedPayload = cloneChartPayload(nextPayload);
      this.payloadAnimator = null;
    };

    animatorResult.onFrame = (value: number) => {
      const animatedPayload: NewChartPayload = createAnimatedChartPayload(previousPayload, nextPayload, value);
      this.renderPayload(animatedPayload);
      this.displayedPayload = cloneChartPayload(animatedPayload);
    };
    animatorResult.onFinish = finishAnimation;
    animatorResult.onCancel = finishAnimation;

    this.payloadAnimator = animatorResult;
    animatorResult.play();
  }

  private stopPayloadAnimation(): void {
    if (this.payloadAnimator !== null) {
      this.payloadAnimator.onFinish = (): void => {
      };
      this.payloadAnimator.onCancel = (): void => {
      };
      this.payloadAnimator.cancel();
      this.payloadAnimator = null;
    }
  }

  // ─────────────────────────────────────────────
  // Donut chart
  // ─────────────────────────────────────────────

  private buildDonutChart(data: NewDonutData): void {
    const model: PieChartModel = new PieChartModel();

    const description: Description = new Description();
    description.setEnabled(false);
    model.setDescription(description);

    const legend: Legend | null = model.getLegend();
    if (legend !== null) {
      if (ChartDefaults.DONUT_SHOW_LEGEND) {
        legend.setEnabled(true);
        legend.setForm(LegendForm.CIRCLE);
        if (ChartDefaults.DONUT_LEGEND_POSITION === 'right') {
          legend.setHorizontalAlignment(LegendHorizontalAlignment.RIGHT);
          legend.setVerticalAlignment(LegendVerticalAlignment.TOP);
          legend.setOrientation(LegendOrientation.HORIZONTAL);
        } else {
          legend.setHorizontalAlignment(LegendHorizontalAlignment.CENTER);
          legend.setVerticalAlignment(LegendVerticalAlignment.BOTTOM);
          legend.setOrientation(LegendOrientation.HORIZONTAL);
        }
      } else {
        legend.setEnabled(false);
      }
    }

    const innerRadiusStr: string = ChartDefaults.DONUT_INNER_RADIUS;
    const innerRadiusPercent: number = parseFloat(innerRadiusStr.replace('%', '')) / 100;
    model.setHoleRadius(innerRadiusPercent * 100);
    model.setTransparentCircleRadius(innerRadiusPercent * 100 + 3);

    const seriesData: ChartDataPoint[] = data.series.length > 0 ? data.series[0].data : [];
    let total: number = 0;
    seriesData.forEach((item: ChartDataPoint) => { total += item.value; });
    const totalValue: number = total;

    const entries: JArrayList<PieEntry> = new JArrayList<PieEntry>();
    const colors: JArrayList<number> = new JArrayList<number>();

    seriesData.forEach((item: ChartDataPoint) => {
      const entry: PieEntry = new PieEntry(item.value, item.label);
      entries.add(entry);
      colors.add(this.parseColor(item.color));
    });

    const dataSet: PieDataSet = new PieDataSet(entries, '');
    dataSet.setColorsByList(colors);
    dataSet.setSliceSpace(ChartDefaults.DONUT_SLICE_SPACE);
    dataSet.setYValuePosition(ValuePosition.OUTSIDE_SLICE);
    dataSet.setValueLinePart1Length(ChartDefaults.DONUT_VALUE_LINE_PART1);
    dataSet.setValueLinePart2Length(ChartDefaults.DONUT_VALUE_LINE_PART2);
    dataSet.setUsingSliceColorAsValueLineColor(true);
    dataSet.setValueTextSize(ChartDefaults.DONUT_LABEL_TEXT_SIZE);
    dataSet.setDrawValues(true);
    dataSet.setValueFormatter({
      getFormattedValue(value: number, _entry: EntryOhos, _dataSetIndex: number, _viewPortHandler: ViewPortHandler): string {
        const pct: number = totalValue > 0 ? Math.round(value / totalValue * 100) : 0;
        return pct.toString() + '%';
      }
    });

    model.setDrawEntryLabels(false);

    const legendAtTop: boolean =
      ChartDefaults.DONUT_LEGEND_POSITION === 'right' &&
      ChartDefaults.DONUT_SHOW_LEGEND;
    model.setExtraOffsets(
      ChartDefaults.DONUT_EXTRA_OFFSET,
      legendAtTop ? 0 : ChartDefaults.DONUT_EXTRA_OFFSET,
      ChartDefaults.DONUT_EXTRA_OFFSET,
      ChartDefaults.DONUT_EXTRA_OFFSET
    );

    const pieData: PieData = new PieData(dataSet);
    model.setData(pieData);
    model.setDrawHoleEnabled(true);
    model.setRotationEnabled(true);

    this.pieModel = model;
  }

  // ─────────────────────────────────────────────
  // Line chart
  // ─────────────────────────────────────────────

  private buildLineChart(data: NewLineData): void {
    const model: LineChartModel = new LineChartModel();

    const description: Description = new Description();
    description.setEnabled(false);
    model.setDescription(description);

    const xAxis: XAxis | null = model.getXAxis();
    if (xAxis !== null) {
      xAxis.setPosition(XAxisPosition.BOTTOM);
      xAxis.setDrawGridLines(ChartDefaults.LINE_SHOW_GRID);
      xAxis.setGranularity(1);
      xAxis.setValueFormatter({
        getFormattedValue(value: number, _axis: AxisBase): string {
          const index: number = Math.round(value);
          if (index >= 0 && index < data.xAxis.length) {
            return data.xAxis[index];
          }
          return '';
        }
      });
    }

    let dataMin: number = Infinity;
    let dataMax: number = -Infinity;
    data.series.forEach((seriesItem: ChartSeriesItem) => {
      seriesItem.data.forEach((point: ChartDataPoint) => {
        if (point.value < dataMin) { dataMin = point.value; }
        if (point.value > dataMax) { dataMax = point.value; }
      });
    });
    if (!isFinite(dataMin)) { dataMin = 0; }
    if (!isFinite(dataMax)) { dataMax = 1; }

    const leftAxis: YAxis | null = model.getAxisLeft();
    if (leftAxis !== null) {
      leftAxis.setDrawGridLines(ChartDefaults.LINE_SHOW_GRID);
      const yLabels: string[] = data.yAxis ?? [];
      if (yLabels.length > 0) {
        const yAxisMin: number = dataMin;
        const yAxisMax: number = dataMax;
        const yCount: number = yLabels.length;
        leftAxis.setAxisMinimum(yAxisMin);
        leftAxis.setAxisMaximum(yAxisMax);
        leftAxis.setLabelCount(yCount, true);
        leftAxis.setValueFormatter({
          getFormattedValue(value: number, _axis: AxisBase): string {
            const span: number = yAxisMax - yAxisMin;
            const normalizedIndex: number = span > 0
              ? Math.round((value - yAxisMin) / span * (yCount - 1))
              : 0;
            if (normalizedIndex >= 0 && normalizedIndex < yLabels.length) {
              return yLabels[normalizedIndex];
            }
            return '';
          }
        });
      }
    }
    const rightAxis: YAxis | null = model.getAxisRight();
    if (rightAxis !== null) {
      rightAxis.setEnabled(false);
    }

    const legend: Legend | null = model.getLegend();
    if (legend !== null) {
      legend.setEnabled(ChartDefaults.LINE_SHOW_LEGEND);
      legend.setForm(LegendForm.CIRCLE);
      legend.setHorizontalAlignment(LegendHorizontalAlignment.RIGHT);
      legend.setVerticalAlignment(LegendVerticalAlignment.TOP);
      legend.setOrientation(LegendOrientation.HORIZONTAL);
    }

    const seriesCount: number = data.series.length;
    const isMultiSeries: boolean = seriesCount > 1;
    const dataSets: JArrayList<LineDataSet> = new JArrayList<LineDataSet>();
    const labelIndices: number[] = [];

    data.series.forEach((seriesItem: ChartSeriesItem) => {
      const entries: JArrayList<EntryOhos> = new JArrayList<EntryOhos>();
      const pointColors: JArrayList<number> = new JArrayList<number>();
      const labels: string[] = [];

      seriesItem.data.forEach((point: ChartDataPoint, index: number) => {
        const entry: EntryOhos = new EntryOhos(index, point.value);
        entries.add(entry);
        labels.push(point.label);
        if (!isMultiSeries) {
          pointColors.add(this.parseColor(point.color));
        }
        if (point.label !== '' && !labelIndices.includes(index)) {
          labelIndices.push(index);
        }
      });

      const dataSet: LineDataSet = new LineDataSet(entries, seriesItem.name);
      dataSet.setLineWidth(ChartDefaults.LINE_LINE_WIDTH);

      if (isMultiSeries) {
        dataSet.setColorsByVariable([this.parseColor(seriesItem.color)]);
        if (ChartDefaults.LINE_SHOW_POINTS) {
          dataSet.setCircleColor(this.parseColor(seriesItem.color));
        }
      } else {
        dataSet.setColorsByList(pointColors);
        if (ChartDefaults.LINE_SHOW_POINTS) {
          const firstColor: number = pointColors.size() > 0
            ? pointColors.get(0)
            : this.parseColor(ChartDefaults.COLORS[0]);
          dataSet.setCircleColor(firstColor);
        }
      }

      if (ChartDefaults.LINE_SHOW_POINTS) {
        dataSet.setDrawCircles(true);
        dataSet.setCircleRadius(ChartDefaults.LINE_POINT_SIZE / 2);
        dataSet.setDrawCircleHole(false);
      } else {
        dataSet.setDrawCircles(false);
      }

      dataSet.setMode(ChartDefaults.LINE_SMOOTH ? Mode.CUBIC_BEZIER : Mode.LINEAR);

      const seriesLabels: string[] = labels;
      dataSet.setDrawValues(true);
      dataSet.setValueTextSize(ChartDefaults.LINE_LABEL_TEXT_SIZE);
      dataSet.setValueTextColor(
        isMultiSeries ? this.parseColor(seriesItem.color) : 0xFF333333
      );
      dataSet.setValueFormatter({
        getFormattedValue(_value: number, entry: EntryOhos, _dataSetIndex: number,
          _viewPortHandler: ViewPortHandler): string {
          const idx: number = Math.round(entry.getX());
          if (idx >= 0 && idx < seriesLabels.length) {
            return seriesLabels[idx];
          }
          return '';
        }
      });

      dataSet.setDrawFilled(false);
      dataSets.add(dataSet);
    });

    const lineData: LineData = new LineData(dataSets);
    model.setData(lineData);

    if (xAxis !== null && labelIndices.length > 0) {
      labelIndices.forEach((idx: number) => {
        const limitLine: LimitLine = new LimitLine(idx, '');
        limitLine.setLineColor(ChartDefaults.LINE_LIMIT_LINE_COLOR);
        limitLine.setLineWidth(ChartDefaults.LINE_LIMIT_LINE_WIDTH);
        limitLine.enableDashedLine(
          ChartDefaults.LINE_LIMIT_DASH_LENGTH,
          ChartDefaults.LINE_LIMIT_DASH_SPACE,
          0
        );
        xAxis.addLimitLine(limitLine);
      });
      xAxis.setDrawLimitLinesBehindData(false);
    }

    this.lineModel = model;
  }

  // ─────────────────────────────────────────────
  // Bar chart
  // ─────────────────────────────────────────────

  private buildBarChart(data: NewBarData): void {
    const model: BarChartModel = new BarChartModel();

    const description: Description = new Description();
    description.setEnabled(false);
    model.setDescription(description);

    const seriesCount: number = data.series.length;
    const groupCount: number = data.xAxis.length;
    const isGrouped: boolean = seriesCount > 1;

    const xAxis: XAxis | null = model.getXAxis();
    if (xAxis !== null) {
      xAxis.setPosition(XAxisPosition.BOTTOM);
      xAxis.setDrawGridLines(false);
    }

    let barDataMin: number = Infinity;
    let barDataMax: number = -Infinity;
    data.series.forEach((seriesItem: ChartSeriesItem) => {
      seriesItem.data.forEach((point: ChartDataPoint) => {
        if (point.value < barDataMin) { barDataMin = point.value; }
        if (point.value > barDataMax) { barDataMax = point.value; }
      });
    });
    if (!isFinite(barDataMin)) { barDataMin = 0; }
    if (!isFinite(barDataMax)) { barDataMax = 1; }

    const leftAxis: YAxis | null = model.getAxisLeft();
    if (leftAxis !== null) {
      leftAxis.setDrawGridLines(true);
      const yLabels: string[] = data.yAxis ?? [];
      if (yLabels.length > 0) {
        const yAxisMin: number = 0;
        const yAxisMax: number = barDataMax;
        const yCount: number = yLabels.length;
        leftAxis.setAxisMinimum(yAxisMin);
        leftAxis.setAxisMaximum(yAxisMax);
        leftAxis.setLabelCount(yCount, true);
        leftAxis.setValueFormatter({
          getFormattedValue(value: number, _axis: AxisBase): string {
            const normalizedIndex: number = yAxisMax > 0
              ? Math.round(value / yAxisMax * (yCount - 1))
              : 0;
            if (normalizedIndex >= 0 && normalizedIndex < yLabels.length) {
              return yLabels[normalizedIndex];
            }
            return '';
          }
        });
      } else {
        leftAxis.setAxisMinimum(0);
      }
    }
    const rightAxis: YAxis | null = model.getAxisRight();
    if (rightAxis !== null) {
      rightAxis.setEnabled(false);
    }

    const legend: Legend | null = model.getLegend();
    if (legend !== null) {
      if (isGrouped && ChartDefaults.BAR_GROUPED_SHOW_LEGEND) {
        legend.setEnabled(true);
        legend.setForm(LegendForm.CIRCLE);
        legend.setHorizontalAlignment(LegendHorizontalAlignment.RIGHT);
        legend.setVerticalAlignment(LegendVerticalAlignment.TOP);
        legend.setOrientation(LegendOrientation.HORIZONTAL);
      } else {
        legend.setEnabled(false);
      }
    }

    const dataSets: JArrayList<BarDataSet> = new JArrayList<BarDataSet>();

    if (isGrouped) {
      data.series.forEach((seriesItem: ChartSeriesItem) => {
        const entries: JArrayList<BarEntry> = new JArrayList<BarEntry>();
        seriesItem.data.forEach((point: ChartDataPoint, index: number) => {
          const entry: BarEntry = new BarEntry(index, point.value);
          entries.add(entry);
        });

        const dataSet: BarDataSet = new BarDataSet(entries, seriesItem.name);
        dataSet.setColorsByVariable([this.parseColor(seriesItem.color)]);
        dataSet.setDrawValues(false);
        dataSets.add(dataSet);
      });

      const barData: BarData = new BarData(dataSets);
      barData.setTopRadius(ChartDefaults.BAR_GROUPED_TOP_RADIUS);

      const barWidth: number = ChartDefaults.BAR_GROUPED_BAR_WIDTH / 100;
      const barGap: number = ChartDefaults.BAR_GROUPED_BAR_GAP / 100;
      const groupGap: number = ChartDefaults.BAR_GROUPED_GROUP_GAP / 100;

      barData.setBarWidth(barWidth);
      barData.groupBars(0, groupGap, barGap);

      const oneGroupWidth: number = seriesCount * (barWidth + barGap) + groupGap;
      const axisMax: number = groupCount * oneGroupWidth;

      if (xAxis !== null) {
        xAxis.setAxisMinimum(0);
        xAxis.setAxisMaximum(axisMax);
        xAxis.setCenterAxisLabels(true);
        xAxis.setGranularity(oneGroupWidth);
        xAxis.setLabelCount(groupCount, true);
        const gw: number = oneGroupWidth;
        const xLabels: string[] = data.xAxis;
        xAxis.setValueFormatter({
          getFormattedValue(value: number, _axis: AxisBase): string {
            const index: number = Math.round(value / gw);
            if (index >= 0 && index < xLabels.length) {
              return xLabels[index];
            }
            return '';
          }
        });
      }

      model.setData(barData);
    } else {
      const entries: JArrayList<BarEntry> = new JArrayList<BarEntry>();
      const colors: JArrayList<number> = new JArrayList<number>();
      const singleLabels: string[] = [];

      const seriesItem: ChartSeriesItem = data.series[0];
      seriesItem.data.forEach((point: ChartDataPoint, index: number) => {
        const entry: BarEntry = new BarEntry(index, point.value);
        entries.add(entry);
        colors.add(this.parseColor(point.color));
        singleLabels.push(point.label);
      });

      const dataSet: BarDataSet = new BarDataSet(entries, seriesItem.name);
      dataSet.setColorsByList(colors);

      if (ChartDefaults.BAR_SINGLE_SHOW_LABEL) {
        dataSet.setValueTextColors(colors);
        dataSet.setValueTextSize(ChartDefaults.BAR_SINGLE_LABEL_TEXT_SIZE);
        dataSet.setDrawValues(true);
        const barLabels: string[] = singleLabels;
        dataSet.setValueFormatter({
          getFormattedValue(_value: number, entry: EntryOhos, _dataSetIndex: number,
            _viewPortHandler: ViewPortHandler): string {
            const idx: number = Math.round(entry.getX());
            if (idx >= 0 && idx < barLabels.length) {
              return barLabels[idx];
            }
            return '';
          }
        });
        model.setDrawValueAboveBar(true);
      } else {
        dataSet.setDrawValues(false);
      }

      dataSets.add(dataSet);
      const barData: BarData = new BarData(dataSets);
      barData.setTopRadius(ChartDefaults.BAR_SINGLE_TOP_RADIUS);

      const barWidth: number = ChartDefaults.BAR_SINGLE_BAR_WIDTH / 100;
      barData.setBarWidth(barWidth);

      if (xAxis !== null) {
        xAxis.setAxisMinimum(-0.5);
        xAxis.setAxisMaximum(groupCount - 0.5);
        xAxis.setCenterAxisLabels(false);
        xAxis.setGranularity(1);
        xAxis.setValueFormatter({
          getFormattedValue(value: number, _axis: AxisBase): string {
            const index: number = Math.round(value);
            if (index >= 0 && index < data.xAxis.length) {
              return data.xAxis[index];
            }
            return '';
          }
        });
      }

      model.setExtraOffsets(
        ChartDefaults.BAR_SINGLE_SIDE_OFFSET,
        ChartDefaults.BAR_SINGLE_TOP_OFFSET,
        ChartDefaults.BAR_SINGLE_SIDE_OFFSET,
        0
      );

      model.setData(barData);
    }

    model.setDrawBarShadow(false);
    model.setFitBars(isGrouped);

    this.barModel = model;
  }

  // ─────────────────────────────────────────────
  // Helper methods
  // ─────────────────────────────────────────────

  private parseColor(hexColor: string): number {
    try {
      const cleaned: string = hexColor.replace('#', '');
      if (cleaned.length === 6) {
        return parseInt('FF' + cleaned, 16);
      } else if (cleaned.length === 8) {
        return parseInt(cleaned, 16);
      }
    } catch (_e) {
      // fallback
    }
    return 0xFF000000;
  }

  onDestroy(): void {
    if (this.renderTimerId !== -1) {
      clearTimeout(this.renderTimerId);
      this.renderTimerId = -1;
    }
    this.stopPayloadAnimation();
  }
}

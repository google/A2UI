/**
 * A2UI Custom Chart Component — Lit implementation of the RIZZcharts Chart
 * contract.
 *
 * Follows the same data resolution pattern as the OrgChart Lit sample:
 * properties may be plain values or { path: string } references resolved
 * via processor.getData().
 *
 * Supports chart types: pie, doughnut, bar.
 * Supports one-level drill-down: click a wedge/bar or legend label to view
 * sub-data, then click the back button to return to the root view.
 */

import {Root} from '@a2ui/lit/ui';
import {html, css, nothing} from 'lit';
import {property} from 'lit/decorators.js';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  BarController,
  PieController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  type ChartConfiguration,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type {Context as DatalabelsContext} from 'chartjs-plugin-datalabels';

// Register the Chart.js components we need (controllers + elements + plugins)
ChartJS.register(
  PieController,
  DoughnutController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  ChartDataLabels
);

// Palette CSS custom property names and their default values.
// Override via --chart-color-0 … --chart-color-9 on a parent element.
const PALETTE_DEFAULTS = [
  '#4285F4', // blue
  '#EA4335', // red
  '#FBBC04', // yellow
  '#34A853', // green
  '#FF6D01', // orange
  '#46BDC6', // teal
  '#7B61FF', // purple
  '#F538A0', // pink
  '#00ACC1', // cyan
  '#8D6E63', // brown
];

interface ChartDataItem {
  label: string;
  value: number;
  drillDown?: ChartDataItem[];
}

/** Pre-computed labels + values for a single chart view. */
interface ChartView {
  labels: string[];
  values: number[];
}

export class ChartComponent extends Root {
  // Properties set by renderCustomComponent via el[prop] = val.
  @property({attribute: false}) accessor chartType: string = 'pie';
  @property({attribute: false}) accessor chartTitle: string = '';
  @property({attribute: false}) accessor chartData: unknown = null;

  private chartInstance: ChartJS | null = null;
  private selectedCategory: string = 'root';

  private get isDrillDown(): boolean {
    return this.selectedCategory !== 'root';
  }

  static styles = [
    ...Root.styles,
    css`
      :host {
        display: block;
        flex: var(--weight);
        padding: 16px;
      }

      .chart-box {
        background: light-dark(var(--n-98, #fafafa), var(--n-10, #1a1a1a));
        border: 1px solid
          light-dark(var(--n-90, #e0e0e0), var(--n-25, #3a3a3a));
        border-radius: 12px;
        padding: 24px;
        max-width: 700px;
        margin: 0 auto;
      }

      .chart-header {
        margin: 0 0 16px 0;
      }

      .chart-heading {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        color: light-dark(var(--n-10, #1a1a1a), var(--n-90, #e0e0e0));
      }

      .chart-subtitle {
        font-size: 16px;
        font-weight: 500;
        margin: 4px 0 0 0;
        color: light-dark(var(--n-30, #555), var(--n-70, #b0b0b0));
      }

      .back-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: none;
        border: 1px solid light-dark(var(--n-80, #ccc), var(--n-30, #444));
        border-radius: 6px;
        padding: 4px 12px;
        margin-bottom: 12px;
        cursor: pointer;
        font-size: 13px;
        color: light-dark(var(--n-20, #333), var(--n-80, #ccc));
      }

      .back-btn:hover {
        background: light-dark(var(--n-95, #f0f0f0), var(--n-15, #252525));
      }

      .chart-canvas-wrapper {
        position: relative;
        width: 100%;
        max-height: 400px;
      }

      canvas {
        width: 100% !important;
        max-height: 400px;
      }

      .no-data {
        text-align: center;
        padding: 40px;
        color: light-dark(var(--n-40, #888), var(--n-60, #999));
        font-style: italic;
      }
    `,
  ];

  disconnectedCallback() {
    super.disconnectedCallback();
    this.destroyChart();
  }

  updated() {
    this.buildChart();
  }

  // ---------------------------------------------------------------------------
  // Data resolution
  // ---------------------------------------------------------------------------

  private resolveStringProp(val: unknown): string {
    if (!val) return '';
    if (typeof val === 'string') return val;
    const obj = val as Record<string, unknown>;
    if (obj.literalString) return String(obj.literalString);
    if (obj.path && this.processor) {
      const resolved = this.processor.getData(
        this.component,
        String(obj.path),
        this.surfaceId ?? 'default'
      );
      return typeof resolved === 'string' ? resolved : '';
    }
    return '';
  }

  /** Resolves a path reference via the data model processor. */
  private resolveDataFromPath(raw: unknown): unknown {
    if (
      raw &&
      typeof raw === 'object' &&
      'path' in (raw as Record<string, unknown>)
    ) {
      const pathObj = raw as {path: string};
      if (this.processor) {
        return this.processor.getData(
          this.component,
          pathObj.path,
          this.surfaceId ?? 'default'
        );
      }
    }
    return raw;
  }

  /** Converts a Map (from the model processor) to a sorted Array. */
  private normalizeMapToArray(raw: unknown): unknown {
    if (raw instanceof Map) {
      const entries = Array.from(
        raw.entries() as IterableIterator<[string, unknown]>
      );
      entries.sort(
        (a, b) => parseInt(a[0], 10) - parseInt(b[0], 10)
      );
      return entries.map((e) => e[1]);
    }
    return raw;
  }

  /** Reads a named field from an item (Map or plain object). */
  private static fieldFrom(
    item: unknown,
    key: string
  ): unknown {
    if (item instanceof Map) return item.get(key);
    return (item as Record<string, unknown>)?.[key];
  }

  /** Transforms a raw array into typed ChartDataItems. */
  private transformDataItems(
    items: unknown[]
  ): ChartDataItem[] {
    return items.map((item) => {
      let rawDrill = ChartComponent.fieldFrom(item, 'drillDown');
      rawDrill = this.normalizeMapToArray(rawDrill);

      let drillDown: ChartDataItem[] | undefined;
      if (Array.isArray(rawDrill) && rawDrill.length > 0) {
        drillDown = (rawDrill as unknown[]).map((sub) => ({
          label: String(
            ChartComponent.fieldFrom(sub, 'label') ?? ''
          ),
          value: Number(
            ChartComponent.fieldFrom(sub, 'value') ?? 0
          ),
        }));
      }

      return {
        label: String(
          ChartComponent.fieldFrom(item, 'label') ?? ''
        ),
        value: Number(
          ChartComponent.fieldFrom(item, 'value') ?? 0
        ),
        ...(drillDown ? {drillDown} : {}),
      };
    });
  }

  private resolveChartData(): ChartDataItem[] {
    let raw: unknown = this.resolveDataFromPath(this.chartData);
    raw = this.normalizeMapToArray(raw);
    if (!Array.isArray(raw)) return [];
    return this.transformDataItems(raw as unknown[]);
  }

  // ---------------------------------------------------------------------------
  // Drill-down map
  // ---------------------------------------------------------------------------

  /**
   * Build a Map of chart views keyed by category label.
   * "root" -> root-level data; each label with drillDown -> sub-data.
   */
  private buildDrillDownMap(
    items: ChartDataItem[]
  ): Map<string, ChartView> {
    const viewMap = new Map<string, ChartView>();

    viewMap.set('root', {
      labels: items.map((d) => d.label),
      values: items.map((d) => d.value),
    });

    for (const item of items) {
      if (item.drillDown && item.drillDown.length > 0) {
        viewMap.set(item.label, {
          labels: item.drillDown.map((d) => d.label),
          values: item.drillDown.map((d) => d.value),
        });
      }
    }

    return viewMap;
  }

  // ---------------------------------------------------------------------------
  // Chart lifecycle
  // ---------------------------------------------------------------------------

  /** Resolves palette colors from CSS custom properties with fallbacks. */
  private resolvePalette(): string[] {
    const styles = getComputedStyle(this);
    return PALETTE_DEFAULTS.map((fallback, i) => {
      const v = styles.getPropertyValue(`--chart-color-${i}`);
      return v.trim() || fallback;
    });
  }

  private destroyChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  private restoreRoot() {
    this.selectedCategory = 'root';
    this.requestUpdate();
  }

  private buildChart() {
    const canvas = this.renderRoot?.querySelector('canvas') as
      | HTMLCanvasElement
      | undefined;
    if (!canvas) return;

    const items = this.resolveChartData();
    if (items.length === 0) return;

    const drillDownMap = this.buildDrillDownMap(items);
    const view = drillDownMap.get(this.selectedCategory);
    if (!view) return;

    const {labels, values} = view;
    const palette = this.resolvePalette();
    const colors = labels.map(
      (_, i) => palette[i % palette.length]
    );

    this.destroyChart();

    const ct =
      (this.chartType || 'pie') as 'pie' | 'doughnut' | 'bar';
    const isPieType = ct === 'pie' || ct === 'doughnut';

    const config: ChartConfiguration = {
      type: isPieType ? ct : 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderColor: isPieType
              ? colors.map(() => 'rgba(255,255,255,0.8)')
              : colors,
            borderWidth: isPieType ? 2 : 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        // Wedge / bar click -> drill down
        onClick: (_event, elements) => {
          if (!elements.length || this.isDrillDown) return;
          const index = elements[0].index;
          const label = labels[index];
          if (label && drillDownMap.has(label)) {
            this.selectedCategory = label;
            this.requestUpdate();
          }
        },
        plugins: {
          legend: {
            display: isPieType,
            position: 'right',
            labels: {font: {size: 13}},
            // Legend click -> drill down (pie/doughnut only)
            onClick: (_e, legendItem) => {
              if (this.isDrillDown) return;
              const label = legendItem.text;
              if (label && drillDownMap.has(label)) {
                this.selectedCategory = label;
                this.requestUpdate();
              }
            },
          },
          title: {display: false},
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed;
                const num =
                  typeof val === 'number'
                    ? val
                    : (typeof val === 'object' && val !== null &&
                          'y' in val
                        ? (val as Record<string, number>).y
                        : (val as number));
                if (isPieType) {
                  const total = (
                    ctx.dataset.data as number[]
                  ).reduce((a, b) => a + (b as number), 0);
                  const pct = (
                    ((num as number) / total) *
                    100
                  ).toFixed(1);
                  return `${ctx.label}: ${(num as number).toLocaleString()} (${pct}%)`;
                }
                return `${ctx.label}: ${(num as number).toLocaleString()}`;
              },
            },
          },
          // On-wedge percentage labels (pie/doughnut only)
          datalabels: isPieType
            ? {
                formatter: (value: number, ctx: DatalabelsContext) => {
                  const total = (
                    ctx.chart.data.datasets[0].data as number[]
                  ).reduce((a, b) => a + b, 0);
                  return `${((value / total) * 100).toFixed(1)}%`;
                },
                color: 'white',
                font: {size: 14},
              }
            : {display: false},
        },
        ...(isPieType
          ? {}
          : {
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {font: {size: 12}},
                },
                x: {
                  ticks: {font: {size: 12}, maxRotation: 45},
                },
              },
            }),
      },
    };

    this.chartInstance = new ChartJS(canvas, config);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  render() {
    const heading = this.resolveStringProp(this.chartTitle);
    const items = this.resolveChartData();

    if (items.length === 0) {
      return html`<div class="chart-box">
        <div class="no-data">No chart data available</div>
      </div>`;
    }

    return html`
      <div class="chart-box">
        <div class="chart-header">
          ${heading
            ? html`<h2 class="chart-heading">${heading}</h2>`
            : nothing}
          ${this.isDrillDown
            ? html`<h3 class="chart-subtitle">
                ${this.selectedCategory}
              </h3>`
            : nothing}
        </div>
        ${this.isDrillDown
          ? html`<button
              class="back-btn"
              @click=${this.restoreRoot}
            >
              \u2190 Back
            </button>`
          : nothing}
        <div class="chart-canvas-wrapper">
          <canvas></canvas>
        </div>
      </div>
    `;
  }
}

/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { useState, useMemo, useCallback } from "react";
import { Types, Primitives, useDataBinding } from "@a2ui/react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Pie, Doughnut, Bar } from "react-chartjs-2";
import "./Chart.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  ChartDataLabels,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// Chart.js default color palette
const CHART_COLORS = [
  "rgba(255, 99, 132, 0.8)",   // Red
  "rgba(54, 162, 235, 0.8)",   // Blue
  "rgba(255, 206, 86, 0.8)",   // Yellow
  "rgba(75, 192, 192, 0.8)",   // Teal
  "rgba(153, 102, 255, 0.8)",  // Purple
  "rgba(255, 159, 64, 0.8)",   // Orange
  "rgba(199, 199, 199, 0.8)",  // Grey
  "rgba(83, 102, 255, 0.8)",   // Indigo
  "rgba(255, 99, 255, 0.8)",   // Pink
  "rgba(99, 255, 132, 0.8)",   // Green
];

const CHART_BORDER_COLORS = [
  "rgba(255, 99, 132, 1)",
  "rgba(54, 162, 235, 1)",
  "rgba(255, 206, 86, 1)",
  "rgba(75, 192, 192, 1)",
  "rgba(153, 102, 255, 1)",
  "rgba(255, 159, 64, 1)",
  "rgba(199, 199, 199, 1)",
  "rgba(83, 102, 255, 1)",
  "rgba(255, 99, 255, 1)",
  "rgba(99, 255, 132, 1)",
];

interface ChartProperties {
  type?: Primitives.StringValue;
  title?: Primitives.StringValue;
  chartData?: Primitives.StringValue;
}

interface ChartProps {
  node: Types.AnyComponentNode & { properties: ChartProperties };
  surfaceId: string;
}

export function Chart({ node, surfaceId }: ChartProps) {
  const { resolveString, getValue } = useDataBinding(node, surfaceId);
  const [selectedCategory, setSelectedCategory] = useState<string>("root");

  const properties = node.properties;
  const chartType = resolveString(properties.type ?? null) ?? "pie";
  const title = resolveString(properties.title ?? null);
  const chartDataPath = properties.chartData?.path;

  const chartDataMap = useMemo(() => {
    if (!chartDataPath) return null;

    const dataMap = new Map<string, ChartData<"pie" | "bar", number[], string>>();
    const labels: string[] = [];
    const values: number[] = [];

    for (let index = 0; index < 500; index++) {
      const itemPrefix = `${chartDataPath}[${index}]`;
      const label = getValue(`${itemPrefix}.label`);
      const value = getValue(`${itemPrefix}.value`);

      if (label === null || value === null) break;

      labels.push(String(label));
      values.push(Number(value));

      const drilldownLabels: string[] = [];
      const drilldownValues: number[] = [];
      const drilldownPathPrefix = `${itemPrefix}.drillDown`;

      for (let jIndex = 0; jIndex < 500; jIndex++) {
        const drilldownItemPrefix = `${drilldownPathPrefix}[${jIndex}]`;
        const drilldownLabel = getValue(`${drilldownItemPrefix}.label`);
        const drilldownValue = getValue(`${drilldownItemPrefix}.value`);

        if (drilldownLabel === null || drilldownValue === null) break;

        drilldownLabels.push(String(drilldownLabel));
        drilldownValues.push(Number(drilldownValue));
      }

      if (drilldownLabels.length > 0) {
        dataMap.set(String(label), {
          labels: drilldownLabels,
          datasets: [{
            data: drilldownValues,
            backgroundColor: CHART_COLORS.slice(0, drilldownValues.length),
            borderColor: CHART_BORDER_COLORS.slice(0, drilldownValues.length),
            borderWidth: 2,
          }],
        });
      }
    }

    dataMap.set("root", {
      labels,
      datasets: [{
        data: values,
        backgroundColor: CHART_COLORS.slice(0, values.length),
        borderColor: CHART_BORDER_COLORS.slice(0, values.length),
        borderWidth: 2,
      }],
    });

    return dataMap;
  }, [chartDataPath, getValue]);

  const currentData = useMemo(() => {
    if (!chartDataMap) return null;
    return chartDataMap.get(selectedCategory) ?? null;
  }, [chartDataMap, selectedCategory]);

  const isDrillDown = selectedCategory !== "root";

  const handleChartClick = useCallback(
    (_: unknown, elements: Array<{ index: number }>) => {
      if (!elements.length || isDrillDown) return;

      const clickedIndex = elements[0].index;
      const clickedLabel = currentData?.labels?.[clickedIndex];

      if (clickedLabel && chartDataMap?.has(String(clickedLabel))) {
        setSelectedCategory(String(clickedLabel));
      }
    },
    [currentData, chartDataMap, isDrillDown]
  );

  const handleRestoreOriginal = useCallback(() => {
    setSelectedCategory("root");
  }, []);

  const isPieOrDoughnut = chartType === "pie" || chartType === "doughnut";

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: isPieOrDoughnut ? "right" as const : "top" as const,
          labels: {
            color: "#94a3b8",
            font: { size: 14 },
          },
          onClick: isPieOrDoughnut
            ? (_: unknown, legendItem: { text: string }) => {
                if (!isDrillDown && chartDataMap?.has(legendItem.text)) {
                  setSelectedCategory(legendItem.text);
                }
              }
            : undefined,
        },
        datalabels: isPieOrDoughnut
          ? {
              formatter: (value: number, ctx: any) => {
                const dataset = ctx.chart.data.datasets[0];
                const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${percentage}%`;
              },
              color: "white",
              font: { size: 14, weight: "bold" as const },
            }
          : {
              display: false,
            },
      },
      scales: isPieOrDoughnut
        ? undefined
        : {
            x: {
              grid: { color: "rgba(255, 255, 255, 0.1)" },
              ticks: { color: "#94a3b8" },
            },
            y: {
              grid: { color: "rgba(255, 255, 255, 0.1)" },
              ticks: { color: "#94a3b8" },
              beginAtZero: true,
            },
          },
      onClick: isPieOrDoughnut ? handleChartClick : undefined,
    }),
    [handleChartClick, isDrillDown, chartDataMap, isPieOrDoughnut]
  );

  if (!currentData) {
    return (
      <div className="chart-box-container">
        <div className="chart-header">
          <h2>{title ?? "Chart"}</h2>
        </div>
        <div className="chart-container">
          <p>No chart data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-box-container">
      <div className="chart-header">
        <div>
          <h2>{title ?? "Chart"}</h2>
          {isDrillDown && <h3>{selectedCategory}</h3>}
        </div>
        <div className="chart-actions">
          <button className="icon-button" title="Download">
            <DownloadIcon />
          </button>
          <button className="icon-button" title="Share">
            <ShareIcon />
          </button>
        </div>
      </div>
      <div className="chart-container">
        {isDrillDown && (
          <button className="back-button" onClick={handleRestoreOriginal}>
            <BackIcon />
          </button>
        )}
        {chartType === "bar" ? (
          <Bar data={currentData as any} options={chartOptions as any} />
        ) : chartType === "doughnut" ? (
          <Doughnut data={currentData as any} options={chartOptions as any} />
        ) : (
          <Pie data={currentData as any} options={chartOptions as any} />
        )}
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  );
}

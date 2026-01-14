/**
 * LineChart Component
 * ApexCharts wrapper for line/time series charts
 * Uses dynamic import to avoid SSR issues with ApexCharts
 */

"use client";

import React, { useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";

// Inner chart component that actually uses ApexCharts
function LineChartInner({
  series,
  categories = [],
  title,
  height = 350,
  colors = ["#0ea5e9"],
  className = "",
}: LineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  // Dynamically import ApexCharts only on client side
  useEffect(() => {
    let ApexCharts: any;

    const initChart = async () => {
      if (!chartRef.current) return;

      // Dynamic import only on client
      const apexModule = await import("apexcharts");
      ApexCharts = apexModule.default;

      const options: any = {
        series,
        chart: {
          type: "area",
          height,
          toolbar: { show: false },
          background: "transparent",
          fontFamily: "inherit",
          responsive: [
            {
              breakpoint: 768,
              options: {
                chart: {
                  height: Math.max(height - 100, 200),
                },
                xaxis: {
                  labels: {
                    style: { fontSize: "10px" },
                  },
                },
                yaxis: {
                  labels: {
                    style: { fontSize: "10px" },
                  },
                },
              },
            },
          ],
        },
        colors,
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 2 },
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.4,
            opacityTo: 0.1,
            stops: [0, 90, 100],
          },
        },
        xaxis: {
          categories,
          labels: {
            style: { colors: "#94a3b8" },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            style: { colors: "#94a3b8" },
          },
        },
        grid: {
          borderColor: "#e2e8f0",
          strokeDashArray: 4,
        },
        theme: { mode: "light" },
        tooltip: {
          theme: "light",
          style: { fontSize: "12px" },
        },
      };

      // Detect dark mode
      const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
      if (isDark) {
        options.chart.background = "transparent";
        options.xaxis.labels.style.colors = "#64748b";
        options.yaxis.labels.style.colors = "#64748b";
        options.grid.borderColor = "#334155";
        options.tooltip.theme = "dark";
      }

      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      chartInstanceRef.current = new ApexCharts(chartRef.current, options);
      chartInstanceRef.current.render();
    };

    initChart();

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [series, categories, colors, height]);

  // Update theme on dark mode change
  useEffect(() => {
    const handleThemeChange = () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.updateOptions({
          theme: { mode: document.documentElement.classList.contains("dark") ? "dark" : "light" },
        });
      }
    };

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>}
      <div ref={chartRef} className="w-full" style={{ minHeight: `${height}px` }} />
    </div>
  );
}

interface LineChartProps {
  series: {
    name: string;
    data: number[] | { x: string | number; y: number }[];
  }[];
  categories?: string[];
  title?: string;
  height?: number;
  colors?: string[];
  className?: string;
}

// Export with dynamic loading and SSR disabled
export const LineChart = dynamic(
  () => Promise.resolve(LineChartInner),
  { ssr: false }
);

// Also export a wrapper with loading state
export function LineChartWithLoader(props: LineChartProps) {
  return (
    <Suspense fallback={<div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg" style={{ height: props.height || 350 }} />}>
      <LineChart {...props} />
    </Suspense>
  );
}
